import { z } from 'zod';

const DateSchema = z.string().refine(
  (date) => {
    const parsedDate = new Date(date);
    return !Number.isNaN(parsedDate.getTime());
  },
  {
    message: 'Invalid ISO date',
  }
);

const OptionalDateSchema = z
  .string()
  .optional()
  .refine(
    (date) => {
      if (!date || date === '') return true; // Allow empty strings
      const parsedDate = new Date(date);
      return !Number.isNaN(parsedDate.getTime());
    },
    {
      message: 'Invalid ISO date',
    }
  );

const TwoFACodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Invalid authentication code')
  .length(6);

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

export const GoogleOAuthExchangeSchema = z.object({
  oauthCode: z.string().min(1, 'OAuth code is required'),
});

export const TwoFAVerifySchema = z.object({
  code: TwoFACodeSchema,
});

export const TwoFADisableSchema = z.object({
  code: TwoFACodeSchema,
});

export const ChangeRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newRole: z.string().min(1, 'New role is required'),
});

export const BusinessApplicationSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  website: z
    .url({ message: 'Must be a valid URL' })
    .optional()
    .or(z.literal('')),
  phone: z.string().min(6, 'Phone number is required'),
});

export const ReviewApplicationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().min(1, 'Review notes are required'),
});

export const UpdateBusinessSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  website: z.url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
});

export const AssignUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.string().min(1, 'Role is required'),
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

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
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
export type BusinessApplicationInput = z.infer<
  typeof BusinessApplicationSchema
>;
export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;
export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>;
export type AssignUserInput = z.infer<typeof AssignUserSchema>;
