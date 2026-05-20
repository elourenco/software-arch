import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: userRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
  role: userRoleSchema.default("user"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  role: userRoleSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const userIdParamsSchema = z.object({ id: z.string().min(1) });
export const searchUserQuerySchema = z.object({ name: z.string().min(1) });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
