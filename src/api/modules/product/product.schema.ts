import { z } from "zod";

export const publicProductSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  quantity: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  quantity: z.number().int().min(0),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(2).optional(),
  quantity: z.number().int().min(0).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const productIdParamsSchema = z.object({ id: z.string().min(1) });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
