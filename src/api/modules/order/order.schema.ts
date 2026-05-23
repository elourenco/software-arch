import { z } from "zod";

export const orderStatusSchema = z.enum(["em_andamento", "concluido", "cancelado"]);
export const adminOrderStatusSchema = z.enum(["em_andamento", "concluido"]);

export const publicOrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  skuSnapshot: z.string(),
  productNameSnapshot: z.string(),
  quantity: z.number().int().min(1),
  createdAt: z.string(),
});

export const publicOrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: orderStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  }).optional(),
  items: z.array(publicOrderItemSchema),
});

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: adminOrderStatusSchema,
});

export const orderIdParamsSchema = z.object({ id: z.string().min(1) });

export const adminDashboardSchema = z.object({
  usersCount: z.number().int().min(0),
  ordersCount: z.number().int().min(0),
  productsCount: z.number().int().min(0),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
