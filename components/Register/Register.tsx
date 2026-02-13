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

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.email().min(1, 'Email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function Register({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (_data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push(`/${lang}`);
    }, 1000);
  };

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {dictionary.pages.register.title}
          </CardTitle>
          <CardDescription>
            {dictionary.pages.register.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.pages.register.nameLabel}</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      type="text"
                      placeholder={dictionary.pages.register.namePlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.pages.register.emailLabel}</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder={dictionary.pages.register.emailPlaceholder}
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
                  <FormLabel>
                    {dictionary.pages.register.passwordLabel}
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      placeholder={
                        dictionary.pages.register.passwordPlaceholder
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dictionary.pages.register.confirmPasswordLabel}
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={
                        dictionary.pages.register.confirmPasswordPlaceholder
                      }
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
                ? dictionary.pages.register.creatingAccountButton
                : dictionary.pages.register.registerButton}
            </Button>
          </Form>

          <Separator className="my-6" />

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {dictionary.pages.register.hasAccount}{' '}
              <Link
                href={`/${lang}/login`}
                className="text-primary hover:underline"
              >
                {dictionary.pages.register.signIn}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
