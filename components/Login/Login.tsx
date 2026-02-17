'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';

const loginSchema = z.object({
  email: z.email('Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (_data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push(`/${lang}`);
    }, 1000);
  };

  return (
    <div className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {dictionary.pages.login.title}
          </CardTitle>
          <CardDescription>
            {dictionary.pages.login.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.pages.login.emailLabel}</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder={dictionary.pages.login.emailPlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.pages.login.passwordLabel}</FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      placeholder={dictionary.pages.login.passwordPlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isLoading
                ? dictionary.pages.login.signingInButton
                : dictionary.pages.login.signInButton}
            </Button>
          </Form>

          <Separator className="my-6" />

          <div className="space-y-4 text-center">
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-sm underline-offset-4 hover:underline"
            >
              {dictionary.pages.login.forgotPassword}
            </Link>

            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                {dictionary.pages.login.noAccount}{' '}
                <Link
                  href={`/${lang}/register`}
                  className="text-primary hover:underline"
                >
                  {dictionary.pages.login.signUp}
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
