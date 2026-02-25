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
import { useEffect, useState } from 'react';
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
import { deleteCookie } from 'cookies-next';
import { z } from 'zod';

export default function Profile({ dictionary }: { dictionary: Dictionary }) {
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

  const accountForm = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {},
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const securitySchema = z
    .object({
      password: z
        .string()
        .min(8, dictionary.pages.register.errors.passwordTooShort),
      confirmPassword: z
        .string()
        .min(1, dictionary.pages.register.errors.confirmPasswordRequired),
    })
    .refine((v) => v.password === v.confirmPassword, {
      path: ['confirmPassword'],
      message: dictionary.pages.register.errors.passwordsNotMatch,
    });

  const securityForm = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(securitySchema),
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
    if (userData) {
      accountForm.reset({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        birthdate: userData.birthdate,
        phoneNumber: userData.phoneNumber,
        profilePicture: userData.profilePicture,
      });
    }
  }, [userData, accountForm]);

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
    onError: () => {
      toast.error(dictionary.pages.profile.updateError);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await AuthService.deleteUser();
    },
    onSuccess: () => {
      deleteCookie('token');
      deleteCookie('user');
      globalThis.location.reload();
    },
    onError: () => {
      toast.error(dictionary.pages.profile.deleteError);
    },
  });

  const onSubmitAccount = (data: UpdateUserInput) => {
    if (!accountEditMode) return;
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
                {userData?.firstName || userData?.username}
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
                      {userData?.birthdate
                        ? new Date(userData.birthdate).toLocaleDateString()
                        : dictionary.common.na}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {dictionary.pages.profile.phoneNumber}
                    </span>
                    <span className="font-medium">
                      {userData?.phoneNumber ?? dictionary.common.na}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {dictionary.pages.profile.dateJoined}
                    </span>
                    <span className="font-medium">
                      {userData?.dateJoined
                        ? new Date(userData.dateJoined).toLocaleDateString()
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
                              <Input
                                type="date"
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
                              ? new Date(
                                  userData.dateJoined
                                ).toLocaleDateString()
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
                                username: userData.username,
                                email: userData.email,
                                firstName: userData.firstName,
                                lastName: userData.lastName,
                                birthdate: userData.birthdate,
                                phoneNumber: userData.phoneNumber,
                                profilePicture: userData.profilePicture,
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
                            accountForm.clearErrors();
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
                            securityForm.reset({
                              password: '',
                              confirmPassword: '',
                            });
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
