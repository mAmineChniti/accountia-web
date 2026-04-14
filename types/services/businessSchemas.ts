import { z } from 'zod';

const OptionalWebsiteSchema = z
  .union([z.literal(''), z.url()])
  .optional()
  .transform((value) => (value === '' ? undefined : value));

export const CreateBusinessApplicationSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  description: z.string().min(1, 'Description is required'),
  website: OptionalWebsiteSchema,
  businessEmail: z.email('Business email is required'),
  phone: z.string().min(1, 'Phone is required'),
});

export const ReviewBusinessApplicationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comments: z.string().optional(),
  reviewNotes: z.string().optional(),
});

export const UpdateBusinessSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  website: OptionalWebsiteSchema,
  businessEmail: z
    .preprocess((v) => (v === '' ? undefined : v), z.email())
    .optional(),
  phone: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const BusinessRoleSchema = z.enum(['ADMIN', 'MEMBER', 'CLIENT']);
export type BusinessRole = z.infer<typeof BusinessRoleSchema>;

// POST /business/invites — canonical shape per API docs
export const InviteBusinessUserSchema = z.object({
  invitedEmail: z.email(),
  businessRole: BusinessRoleSchema,
});

// POST /business/invites/resend
export const ResendInviteSchema = z.object({
  businessId: z.string().min(1),
  inviteId: z.string().min(1),
});

// DELETE /business/invites/:inviteId
export const RevokeInviteSchema = z.object({
  businessId: z.string().min(1),
  inviteId: z.string().min(1),
});

export const AssignBusinessUserSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
});

const ChangeClientRoleOpenApiSchema = z.object({
  role: z.string().min(1),
});

const ChangeClientRoleLegacySchema = z.object({
  newRole: z.string().min(1),
});

export const ChangeClientRoleSchema = z.union([
  ChangeClientRoleOpenApiSchema,
  ChangeClientRoleLegacySchema,
]);

export type CreateBusinessApplicationInput = z.infer<
  typeof CreateBusinessApplicationSchema
>;
export type CreateBusinessApplicationFormInput = z.input<
  typeof CreateBusinessApplicationSchema
>;
export type ReviewBusinessApplicationInput = z.infer<
  typeof ReviewBusinessApplicationSchema
>;
export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>;
export type InviteBusinessUserInput = z.infer<typeof InviteBusinessUserSchema>;
export type ResendInviteInput = z.infer<typeof ResendInviteSchema>;
export type RevokeInviteInput = z.infer<typeof RevokeInviteSchema>;
export type AssignBusinessUserInput = z.infer<typeof AssignBusinessUserSchema>;
export type ChangeClientRoleInput = z.infer<typeof ChangeClientRoleSchema>;

// DTO input aliases (for OpenAPI-aligned usage)
export type InviteBusinessUserDtoInput = z.infer<
  typeof InviteBusinessUserSchema
>;
export type ChangeClientRoleDtoInput = z.infer<
  typeof ChangeClientRoleOpenApiSchema
>;

export const inviteFormSchema = z.object({
  invitedEmail: z.email('Please enter a valid email address'),
  businessRole: z.string().min(1, 'Please choose a role'),
});

export type InviteFormValues = z.infer<typeof inviteFormSchema>;

// Named exports are provided by the `export const` declarations above.
