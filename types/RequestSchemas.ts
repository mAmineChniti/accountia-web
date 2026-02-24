import { z } from 'zod';

const DateSchema = z.iso.date();

export const RegisterSchema = z.object({
  username: z.string().min(5).max(20),
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  birthdate: DateSchema,
  phoneNumber: z.string().optional(),
  acceptTerms: z.boolean().refine((value) => value === true, {
    message: 'Terms must be accepted',
  }),
  profilePicture: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const ForgotPasswordSchema = z.object({
  email: z.email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

export const ResendConfirmationSchema = z.object({
  email: z.email(),
});

export const FetchUserByIdSchema = z.object({
  userId: z.string(),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(5).max(20).optional(),
  email: z.email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  birthdate: DateSchema.optional(),
  phoneNumber: z.string().optional(),
  profilePicture: z.string().optional(),
});

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.email(),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const PublicUserSchema = z.object({
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  birthdate: DateSchema,
  dateJoined: DateSchema,
  profilePicture: z.string().optional(),
  emailConfirmed: z.boolean(),
});

export const UserResponseSchema = z.object({
  message: z.string(),
  user: PublicUserSchema,
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
  }),
});

export const HealthResponseSchema = z.object({
  status: z.string(),
  details: z.record(z.string(), z.any()).optional(),
});

export const MessageResponseSchema = z.object({
  message: z.string(),
});

export const ApiErrorSchema = z.object({
  message: z.string(),
  status: z.number().optional(),
  code: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ResendConfirmationInput = z.infer<typeof ResendConfirmationSchema>;
export type FetchUserByIdInput = z.infer<typeof FetchUserByIdSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type AuthResponseZod = z.infer<typeof AuthResponseSchema>;
export type HealthResponseZod = z.infer<typeof HealthResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
export type ApiErrorZod = z.infer<typeof ApiErrorSchema>;
