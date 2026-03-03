'use client';
import Image from 'next/image';
import { type Dictionary } from '@/get-dictionary';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff, Trash2, Pencil, Save } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthService } from '@/lib/requests';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UpdateUserSchema, type UpdateUserInput } from '@/types/RequestSchemas';
import type { TwoFASetupResponse } from '@/types/ResponseInterfaces';
import { toast } from 'sonner';
import { clearAuthCookies } from '@/actions/cookies';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatDateLong,
  getCalendarLocale,
  getCalendarDirection,
  dateToISOString,
  isoToDate,
} from '@/lib/date-utils';
import { type Locale } from '@/i18n-config';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export type Channel = 'inApp' | 'email' | 'sms';

type Pref = {
  event: string;
  label: string;
  channels: Record<Channel, boolean>;
};
type InboxItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  type: 'security' | 'system' | 'billing' | 'product';
  read: boolean;
};
type ActivityItem = {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'success';
};

const INITIAL_PREFS: Pref[] = [
  {
    event: 'new_login',
    label: 'New login detected',
    channels: { inApp: true, email: true, sms: false },
  },
  {
    event: 'password_changed',
    label: 'Password changed',
    channels: { inApp: true, email: true, sms: true },
  },
  {
    event: 'newsletter',
    label: 'Product newsletter',
    channels: { inApp: false, email: true, sms: false },
  },
  {
    event: 'billing_updates',
    label: 'Billing and invoices',
    channels: { inApp: true, email: true, sms: false },
  },
];

const INITIAL_INBOX: InboxItem[] = Array.from({ length: 19 }).map((_, idx) => ({
  id: `notif-${idx + 1}`,
  title:
    idx % 3 === 0
      ? 'Security alert'
      : idx % 3 === 1
        ? 'System update'
        : 'Billing receipt',
  body: `Notification message #${idx + 1}`,
  createdAt: new Date(Date.now() - idx * 3_600_000 * 5).toISOString(),
  type: idx % 3 === 0 ? 'security' : idx % 3 === 1 ? 'system' : 'billing',
  read: idx % 2 === 0,
}));

const INITIAL_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    action: 'Logged in',
    details: 'Signed in from Chrome on macOS',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    severity: 'success',
  },
  {
    id: 'a2',
    action: 'Updated profile',
    details: 'Changed phone number',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    severity: 'info',
  },
  {
    id: 'a3',
    action: '2FA enabled',
    details: 'Authenticator app configured',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    severity: 'success',
  },
  {
    id: 'a4',
    action: 'Failed login attempt',
    details: 'Unsuccessful login from unknown IP',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    severity: 'warning',
  },
];

export default function Profile({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const [accountEditMode, setAccountEditMode] = useState(false);
  const [securityEditMode, setSecurityEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tab, setTab] = useState('overview');
  const [twoFASetup, setTwoFASetup] = useState<
    TwoFASetupResponse | undefined
  >();
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFADialogOpen, setTwoFADialogOpen] = useState(false);
  const router = useRouter();
  const [justEnteredEditMode, setJustEnteredEditMode] = useState(false);
  // Inbox state
  const [items, setItems] = useState(INITIAL_INBOX);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [type, setType] = useState<'all' | InboxItem['type']>('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(
    () =>
      items.filter((n) => {
        const matchesQuery =
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.body.toLowerCase().includes(query.toLowerCase());
        const matchesStatus =
          status === 'all' || (status === 'read' ? n.read : !n.read);
        const matchesType = type === 'all' || n.type === type;
        return matchesQuery && matchesStatus && matchesType;
      }),
    [items, query, status, type]
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const toggleRead = (id: string) =>
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  // Preferences state
  const [prefs, setPrefs] = useState(INITIAL_PREFS);
  const togglePref = (event: string, channel: Channel) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.event === event
          ? {
              ...p,
              channels: { ...p.channels, [channel]: !p.channels[channel] },
            }
          : p
      )
    );
  };
  const accountForm = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {},
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const securityForm = useForm<{ password: string; confirmPassword: string }>({
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const {
    data: userData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await AuthService.fetchUser();
      return res.user;
    },
  });

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      return await AuthService.setupTwoFactor();
    },
    onSuccess: (data) => {
      setTwoFASetup(data);
      setTwoFACode('');
      setTwoFADialogOpen(true);
      toast.success(dictionary.pages.profile.twoFactor.setupSuccess);
    },
    onError: () => {
      toast.error(dictionary.pages.profile.twoFactor.setupError);
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (code: string) => {
      return await AuthService.verifyTwoFactor({ code });
    },
    onSuccess: (data) => {
      if (data.enabled) {
        toast.success(dictionary.pages.profile.twoFactor.enableSuccess);
        setTwoFASetup(undefined);
        setTwoFACode('');
        setTwoFADialogOpen(false);
      } else {
        toast.error(dictionary.pages.profile.twoFactor.invalidCode);
      }
    },
    onError: () => {
      toast.error(dictionary.pages.profile.twoFactor.verifyError);
    },
  });

  useEffect(() => {
    if (userData && accountEditMode) {
      accountForm.reset(
        {
          username: userData.username || userData.user_name,
          email: userData.email || userData.email_address,
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          birthdate: userData.birthdate || userData.birth_date || '',
          phoneNumber: userData.phoneNumber || userData.phone_number || '',
          profilePicture:
            userData.profilePicture || userData.profile_picture || '',
        },
        { keepDefaultValues: true }
      );
    }
  }, [userData, accountEditMode, accountForm]);

  const mutation = useMutation({
    mutationFn: async (data: UpdateUserInput) => {
      return await AuthService.updateUser(data);
    },
    onSuccess: () => {
      refetch();
      setAccountEditMode(false);
      setSecurityEditMode(false);
      securityForm.reset({ password: '', confirmPassword: '' });
      accountForm.clearErrors();
      securityForm.clearErrors();
      toast.success(dictionary.pages.profile.updateSuccess);
    },
    onError: (_error) => {
      toast.error(dictionary.pages.profile.updateError);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await AuthService.deleteUser();
    },
    onSuccess: async () => {
      await clearAuthCookies();
      router.refresh();
    },
    onError: () => {
      toast.error(dictionary.pages.profile.deleteError);
    },
  });

  const onSubmitAccount = (data: UpdateUserInput) => {
    if (!accountEditMode || justEnteredEditMode) {
      return;
    }

    if (
      userData &&
      data.username === userData.username &&
      data.email === userData.email &&
      data.firstName === userData.firstName &&
      data.lastName === userData.lastName &&
      data.birthdate === userData.birthdate &&
      data.phoneNumber === (userData.phoneNumber || '') &&
      data.profilePicture === (userData.profilePicture || '')
    ) {
      return;
    }

    mutation.mutate(data);
  };

  const onSubmitSecurity = (data: {
    password: string;
    confirmPassword: string;
  }) => {
    if (!securityEditMode) return;
    mutation.mutate({ password: data.password });
  };

  if (isLoading)
    return (
      <main className="from-muted/60 to-background min-h-[90vh] bg-gradient-to-br py-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="dark:bg-card/90 rounded-2xl border-0 bg-white/90 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-6 pb-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-10 w-28" />
              </div>
            </CardHeader>
          </Card>

          <div className="w-full">
            <div className="mb-4">
              <Skeleton className="h-10 w-80" />
            </div>

            <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-64" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-5 w-44" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-5 w-52" />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Skeleton className="h-10 w-40" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );

  if (isError || !userData)
    return (
      <main className="from-muted/60 to-background min-h-[90vh] bg-gradient-to-br py-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="dark:bg-card/90 rounded-2xl border-0 bg-white/90 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-6 pb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl font-semibold">
                  ?
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <CardTitle>{dictionary.pages.profile.title}</CardTitle>
                <CardDescription className="text-destructive font-semibold">
                  {dictionary.pages.profile.notFound}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    );

  return (
    <main className="from-muted/60 to-background min-h-[90vh] bg-gradient-to-br py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Profile Header */}
        <Card className="dark:bg-card/90 rounded-2xl border-0 bg-white/90 shadow-xl">
          <CardHeader className="flex flex-row items-center gap-6 pb-4">
            <Avatar className="h-24 w-24">
              {userData?.profilePicture ? (
                <AvatarImage src={userData.profilePicture} alt="Profile" />
              ) : (
                <AvatarFallback className="text-3xl font-semibold">
                  {userData?.firstName?.[0] || userData?.username?.[0] || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-2xl font-bold">
                {userData?.firstName ??
                  userData?.first_name ??
                  userData?.username}
              </CardTitle>
              <CardDescription className="text-muted-foreground truncate">
                {userData?.email}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
        {/* Tabs Section */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-muted/60 mb-4">
            <TabsTrigger value="overview">
              {dictionary.pages.profile.tabs.overview}
            </TabsTrigger>
            <TabsTrigger value="account">
              {dictionary.pages.profile.tabs.account}
            </TabsTrigger>
            <TabsTrigger value="security">
              {dictionary.pages.profile.tabs.security}
            </TabsTrigger>
            <TabsTrigger value="preferences">Notifications</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          </TabsList>
          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
              <CardHeader>
                <CardTitle>{dictionary.pages.profile.tabs.overview}</CardTitle>
                <CardDescription>
                  {dictionary.pages.profile.personalInfoSection}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {dictionary.pages.profile.username}
                    </span>
                    <span className="font-medium">
                      {userData?.username ?? dictionary.common.na}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {dictionary.pages.profile.email}
                    </span>
                    <span className="font-medium">
                      {userData?.email ?? dictionary.common.na}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {dictionary.pages.profile.firstName}
                    </span>
                    <span className="font-medium">
                      {userData?.firstName ?? dictionary.common.na}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {dictionary.pages.profile.lastName}
                    </span>
                    <span className="font-medium">
                      {userData?.lastName ?? dictionary.common.na}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {dictionary.pages.profile.birthdate}
                    </span>
                    <span className="font-medium">
                      {(userData?.birthdate ?? userData?.birth_date)
                        ? formatDateLong(
                            (userData?.birthdate ?? userData?.birth_date)!
                          )
                        : dictionary.common.na}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {dictionary.pages.profile.phoneNumber}
                    </span>
                    <span className="font-medium">
                      {userData?.phoneNumber ??
                        userData?.phone_number ??
                        dictionary.common.na}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {dictionary.pages.profile.dateJoined}
                    </span>
                    <span className="font-medium">
                      {userData?.dateJoined
                        ? formatDateLong(userData.dateJoined)
                        : dictionary.common.na}
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-end gap-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleteMutation.isPending}
                    size="lg"
                    className="px-8"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {dictionary.pages.profile.deleteButton}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Account Tab */}
          <TabsContent value="account">
            <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
              <CardHeader>
                <CardTitle>{dictionary.pages.profile.tabs.account}</CardTitle>
                <CardDescription>
                  {dictionary.pages.profile.accountSection}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Form {...accountForm}>
                  <form
                    onSubmit={accountForm.handleSubmit(onSubmitAccount)}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={accountForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {dictionary.pages.profile.username}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!accountEditMode} />
                            </FormControl>
                            <FormMessage className="min-h-5" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={accountForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {dictionary.pages.profile.email}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                disabled={!accountEditMode}
                              />
                            </FormControl>
                            <FormMessage className="min-h-5" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={accountForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {dictionary.pages.profile.firstName}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!accountEditMode} />
                            </FormControl>
                            <FormMessage className="min-h-5" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={accountForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {dictionary.pages.profile.lastName}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!accountEditMode} />
                            </FormControl>
                            <FormMessage className="min-h-5" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={accountForm.control}
                        name="birthdate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {dictionary.pages.profile.birthdate}
                            </FormLabel>
                            <FormControl>
                              {accountEditMode ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        'w-full pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      {field.value ? (
                                        formatDateLong(field.value)
                                      ) : (
                                        <span>Select date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={
                                        field.value
                                          ? isoToDate(field.value)
                                          : undefined
                                      }
                                      onSelect={(date) => {
                                        // Only update if the date actually changed
                                        const newValue = date
                                          ? dateToISOString(date)
                                          : '';
                                        if (newValue !== field.value) {
                                          field.onChange(newValue);
                                        }
                                      }}
                                      disabled={(date) =>
                                        date > new Date() ||
                                        date < new Date('1900-01-01')
                                      }
                                      captionLayout="dropdown"
                                      locale={getCalendarLocale(lang)}
                                      dir={getCalendarDirection(lang)}
                                    />
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <Input
                                  value={
                                    field.value
                                      ? formatDateLong(field.value)
                                      : 'Not set'
                                  }
                                  disabled
                                  readOnly
                                />
                              )}
                            </FormControl>
                            <FormMessage className="min-h-5" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={accountForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {dictionary.pages.profile.phoneNumber}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!accountEditMode} />
                            </FormControl>
                            <FormMessage className="min-h-5" />
                          </FormItem>
                        )}
                      />
                      <div className="md:col-span-2">
                        <FormLabel>
                          {dictionary.pages.profile.dateJoined}
                        </FormLabel>
                        <Input
                          value={
                            userData.dateJoined
                              ? formatDateLong(userData.dateJoined)
                              : dictionary.common.na
                          }
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap justify-end gap-4">
                      {accountEditMode ? (
                        <>
                          <Button
                            type="submit"
                            disabled={mutation.isPending}
                            size="lg"
                            className="px-8"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {dictionary.pages.profile.saveButton}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setAccountEditMode(false);
                              accountForm.reset({
                                username:
                                  userData.username || userData.user_name,
                                email: userData.email || userData.email_address,
                                firstName:
                                  userData.firstName ||
                                  userData.first_name ||
                                  '',
                                lastName:
                                  userData.lastName || userData.last_name || '',
                                birthdate:
                                  userData.birthdate ||
                                  userData.birth_date ||
                                  '',
                                phoneNumber:
                                  userData.phoneNumber ||
                                  userData.phone_number ||
                                  '',
                                profilePicture:
                                  userData.profilePicture ||
                                  userData.profile_picture ||
                                  '',
                              });
                            }}
                            disabled={mutation.isPending}
                            size="lg"
                            className="px-8"
                          >
                            {dictionary.pages.profile.cancelButton}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => {
                            setAccountEditMode(true);
                            setJustEnteredEditMode(true);
                            accountForm.clearErrors();
                            setTimeout(
                              () => setJustEnteredEditMode(false),
                              500
                            );
                          }}
                          size="lg"
                          className="px-8"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          {dictionary.pages.profile.editButton}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
              <CardHeader>
                <CardTitle>{dictionary.pages.profile.tabs.security}</CardTitle>
                <CardDescription>
                  {dictionary.pages.profile.securitySection}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Form {...securityForm}>
                  <form
                    onSubmit={securityForm.handleSubmit(onSubmitSecurity)}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={securityForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {dictionary.pages.register.passwordLabel}
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? 'text' : 'password'}
                                  {...field}
                                  autoComplete="new-password"
                                  disabled={!securityEditMode}
                                />
                                <button
                                  type="button"
                                  className="absolute top-2 right-2"
                                  onClick={() => setShowPassword((v) => !v)}
                                  aria-label={
                                    showPassword
                                      ? dictionary.common.hidePassword
                                      : dictionary.common.showPassword
                                  }
                                  aria-pressed={showPassword}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {dictionary.pages.register.confirmPasswordLabel}
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={
                                    showConfirmPassword ? 'text' : 'password'
                                  }
                                  {...field}
                                  autoComplete="new-password"
                                  disabled={!securityEditMode}
                                />
                                <button
                                  type="button"
                                  className="absolute top-2 right-2"
                                  onClick={() =>
                                    setShowConfirmPassword((v) => !v)
                                  }
                                  aria-label={
                                    showConfirmPassword
                                      ? dictionary.common.hidePassword
                                      : dictionary.common.showPassword
                                  }
                                  aria-pressed={showConfirmPassword}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="mt-6 flex flex-wrap justify-end gap-4">
                      {securityEditMode ? (
                        <>
                          <Button
                            type="submit"
                            disabled={mutation.isPending}
                            size="lg"
                            className="px-8"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {dictionary.pages.profile.saveButton}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setSecurityEditMode(false);
                              securityForm.reset({
                                password: '',
                                confirmPassword: '',
                              });
                              securityForm.clearErrors();
                            }}
                            disabled={mutation.isPending}
                            size="lg"
                            className="px-8"
                          >
                            {dictionary.pages.profile.cancelButton}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => {
                            setSecurityEditMode(true);
                            securityForm.reset(
                              {
                                password: '',
                                confirmPassword: '',
                              },
                              { keepDefaultValues: true }
                            );
                            securityForm.clearErrors();
                          }}
                          size="lg"
                          className="px-8"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          {dictionary.pages.profile.editButton}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>

                <Separator className="my-8" />

                <div className="space-y-4">
                  <div>
                    <div className="text-base font-semibold">
                      {dictionary.pages.profile.twoFactor.title}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {dictionary.pages.profile.twoFactor.description}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (twoFASetup) setTwoFADialogOpen(true);
                        else setup2FAMutation.mutate();
                      }}
                      disabled={
                        setup2FAMutation.isPending ||
                        verify2FAMutation.isPending
                      }
                    >
                      {setup2FAMutation.isPending
                        ? dictionary.pages.profile.twoFactor.settingUp
                        : dictionary.pages.profile.twoFactor.setupButton}
                    </Button>
                  </div>
                </div>

                <Dialog
                  open={twoFADialogOpen}
                  onOpenChange={(open) => {
                    setTwoFADialogOpen(open);
                    if (!open) {
                      setTwoFACode('');
                    }
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {dictionary.pages.profile.twoFactor.title}
                      </DialogTitle>
                      <DialogDescription>
                        {dictionary.pages.profile.twoFactor.description}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {twoFASetup ? (
                        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <div className="text-sm font-medium">
                              {dictionary.pages.profile.twoFactor.scanQr}
                            </div>
                            <div className="bg-background w-fit rounded-lg border p-4">
                              <Image
                                src={twoFASetup.qrCode}
                                alt={dictionary.pages.profile.twoFactor.qrAlt}
                                width={176}
                                height={176}
                                className="h-44 w-44"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="text-sm font-medium">
                                {dictionary.pages.profile.twoFactor.manualKey}
                              </div>
                              <div className="bg-muted/40 rounded-md border px-3 py-2 font-mono text-xs break-all">
                                {twoFASetup.secret}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-medium">
                                {dictionary.pages.profile.twoFactor.enterCode}
                              </div>

                              <InputOTP
                                maxLength={6}
                                value={twoFACode}
                                onChange={(v) => setTwoFACode(v)}
                                disabled={verify2FAMutation.isPending}
                              >
                                <InputOTPGroup>
                                  <InputOTPSlot index={0} />
                                  <InputOTPSlot index={1} />
                                  <InputOTPSlot index={2} />
                                  <InputOTPSlot index={3} />
                                  <InputOTPSlot index={4} />
                                  <InputOTPSlot index={5} />
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setup2FAMutation.mutate()}
                            disabled={setup2FAMutation.isPending}
                          >
                            {setup2FAMutation.isPending
                              ? dictionary.pages.profile.twoFactor.settingUp
                              : dictionary.pages.profile.twoFactor.setupButton}
                          </Button>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setTwoFADialogOpen(false);
                          setTwoFACode('');
                        }}
                        disabled={
                          verify2FAMutation.isPending ||
                          setup2FAMutation.isPending
                        }
                      >
                        {dictionary.pages.profile.cancelButton}
                      </Button>

                      <Button
                        type="button"
                        onClick={() =>
                          verify2FAMutation.mutate(twoFACode.trim())
                        }
                        disabled={
                          verify2FAMutation.isPending ||
                          setup2FAMutation.isPending ||
                          !twoFASetup ||
                          twoFACode.trim().length !== 6
                        }
                      >
                        {verify2FAMutation.isPending
                          ? dictionary.pages.profile.twoFactor.verifying
                          : dictionary.pages.profile.twoFactor.enableButton}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
              <CardHeader>
                <CardTitle>User Activity Timeline</CardTitle>
                <CardDescription>
                  Self audit log of your account events.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {INITIAL_ACTIVITY.map((item) => (
                    <div key={item.id} className="relative border-l pl-4">
                      <span className="bg-primary absolute top-1 -left-[5px] h-2.5 w-2.5 rounded-full" />
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{item.action}</p>
                        <Badge
                          variant={
                            item.severity === 'warning'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {item.severity}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {item.details}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inbox">
            <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
              <CardHeader>
                <CardTitle>In-app Notification Inbox</CardTitle>
                <CardDescription>
                  Read/unread management with filtering and pagination.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 pt-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    placeholder="Search notifications..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                  <select
                    className="bg-background h-10 rounded-md border px-3"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as 'all' | 'read' | 'unread');
                      setPage(1);
                    }}
                  >
                    <option value="all">All</option>
                    <option value="read">Read</option>
                    <option value="unread">Unread</option>
                  </select>
                  <select
                    className="bg-background h-10 rounded-md border px-3"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as 'all' | InboxItem['type']);
                      setPage(1);
                    }}
                  >
                    <option value="all">All types</option>
                    <option value="security">Security</option>
                    <option value="system">System</option>
                    <option value="billing">Billing</option>
                    <option value="product">Product</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {paginated.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="font-medium">{n.title}</div>
                        <Badge variant={n.read ? 'secondary' : 'default'}>
                          {n.read ? 'Read' : 'Unread'}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {n.body}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRead(n.id)}
                        >
                          {n.read ? 'Mark unread' : 'Mark read'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {paginated.length === 0 && (
                    <div className="text-muted-foreground text-sm">
                      No notifications found.
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="dark:bg-card/90 rounded-xl border-0 bg-white/90 shadow">
              <CardHeader>
                <CardTitle>Notification Preferences Center</CardTitle>
                <CardDescription>
                  Control which events notify you on each channel.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 pt-6">
                {prefs.map((pref) => (
                  <div
                    key={pref.event}
                    className="grid grid-cols-1 items-center gap-3 rounded-lg border p-3 md:grid-cols-4"
                  >
                    <div className="font-medium md:col-span-1">
                      {pref.label}
                    </div>
                    {(['inApp', 'email', 'sms'] as Channel[]).map((ch) => (
                      <div key={ch} className="flex items-center gap-2">
                        <Checkbox
                          checked={pref.channels[ch]}
                          onCheckedChange={() => togglePref(pref.event, ch)}
                          id={`${pref.event}-${ch}`}
                        />
                        <label
                          htmlFor={`${pref.event}-${ch}`}
                          className="text-sm capitalize"
                        >
                          {ch === 'inApp' ? 'In-app' : ch}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dictionary.pages.profile.deleteTitle}</DialogTitle>
              <DialogDescription>
                {dictionary.pages.profile.deleteDescription}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteMutation.mutate();
                  setShowDeleteDialog(false);
                }}
                disabled={deleteMutation.isPending}
              >
                {dictionary.pages.profile.deleteConfirmButton}
              </Button>
              <DialogClose asChild>
                <Button variant="secondary">
                  {dictionary.pages.profile.cancelButton}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
