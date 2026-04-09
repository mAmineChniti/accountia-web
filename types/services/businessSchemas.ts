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

const InviteBusinessUserOpenApiSchema = z.object({
  invitedEmail: z.email(),
  businessRole: z.string().min(1),
});

const InviteBusinessUserLegacySchema = z.object({
  email: z.email(),
  role: z.string().min(1),
});

export const InviteBusinessUserSchema = z.union([
  InviteBusinessUserOpenApiSchema,
  InviteBusinessUserLegacySchema,
]);

export const ResendInviteSchema = z.object({
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
export type AssignBusinessUserInput = z.infer<typeof AssignBusinessUserSchema>;
export type ChangeClientRoleInput = z.infer<typeof ChangeClientRoleSchema>;

export type InviteBusinessUserDtoInput = z.infer<
  typeof InviteBusinessUserOpenApiSchema
>;
export type ChangeClientRoleDtoInput = z.infer<
  typeof ChangeClientRoleOpenApiSchema
>;

// Named exports are provided by the `export const` declarations above.
