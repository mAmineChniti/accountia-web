import { z } from 'zod';

const RoleEnumSchema = z.enum(['PLATFORM_OWNER', 'PLATFORM_ADMIN', 'CLIENT']);

const DateSchema = z.iso.date({ error: 'Invalid ISO date' });

const OptionalDateSchema = z.optional(
  z.iso.date({ error: 'Invalid ISO date' })
);

const TwoFACodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Invalid authentication code');

export const RegisterSchema = z.object({
  username: z.string().min(5).max(20),
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  birthdate: DateSchema,
  phoneNumber: z.string().optional(),
  acceptTerms: z
    .boolean()
    .refine((value) => value === true, { message: 'Terms must be accepted' }),
  profilePicture: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({ email: z.email() });

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export const ResendConfirmationSchema = z.object({ email: z.email() });

export const FetchUserByIdSchema = z.object({ userId: z.string().min(1) });

export const GoogleOAuthExchangeSchema = z.object({
  oauthCode: z.string().min(1, 'OAuth code is required'),
});

export const TwoFAVerifySchema = z.object({ code: TwoFACodeSchema });
export const TwoFADisableSchema = z.object({ code: TwoFACodeSchema });

export const ChangeRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newRole: RoleEnumSchema,
});

export const TwoFALoginSchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: TwoFACodeSchema,
});

export const UpdateUserSchema = z.object({
  username: z.string().min(5).max(20).optional(),
  email: z.email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  birthdate: OptionalDateSchema,
  phoneNumber: z.string().optional(),
  profilePicture: z.string().optional(),
});

export const BanUserSchema = z.object({
  reason: z.string().min(1, 'Ban reason is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ResendConfirmationInput = z.infer<typeof ResendConfirmationSchema>;
export type FetchUserByIdInput = z.infer<typeof FetchUserByIdSchema>;
export type GoogleOAuthExchangeInput = z.infer<
  typeof GoogleOAuthExchangeSchema
>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type TwoFAVerifyInput = z.infer<typeof TwoFAVerifySchema>;
export type TwoFADisableInput = z.infer<typeof TwoFADisableSchema>;
export type TwoFALoginInput = z.infer<typeof TwoFALoginSchema>;
export type ChangeRoleInput = z.infer<typeof ChangeRoleSchema>;
export type BanUserInput = z.infer<typeof BanUserSchema>;

export { DateSchema, OptionalDateSchema, TwoFACodeSchema };
