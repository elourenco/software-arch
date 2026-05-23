export type OrderStatus = "em_andamento" | "concluido" | "cancelado";
export type AdminOrderStatus = Exclude<OrderStatus, "cancelado">;

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  quantity: number;
  createdAt: string;
}

export interface OrderUser {
  id: string;
  name: string;
  email: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  user?: OrderUser;
  items: OrderItem[];
}

export type PublicOrder = Order;

export type CreateOrderData = {
  id: string;
  userId: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: Array<{ productId: string; quantity: number }>;
};

export type AdminDashboard = {
  usersCount: number;
  ordersCount: number;
  productsCount: number;
};
