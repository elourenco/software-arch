import type { ProductRepository } from "../product/product.repository";
import type { UserRepository } from "../user/user.repository";
import type { RequestUser } from "../../shared/http/request-user";
import {
  adminRequired,
  orderAccessDenied,
  orderEmptyItems,
  orderInvalidStatusTransition,
  orderNotFound,
} from "./order.errors";
import type { AdminDashboard, PublicOrder } from "./order.model";
import type { OrderRepository } from "./order.repository";
import type { CreateOrderInput, UpdateOrderStatusInput } from "./order.schema";

/** Owns order business rules, access control, and status transitions. */
export class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly users: UserRepository,
    private readonly products: ProductRepository,
  ) {}

  async createOrder(currentUser: RequestUser, input: CreateOrderInput): Promise<PublicOrder> {
    const items = consolidateItems(input.items);
    if (items.length === 0) throw orderEmptyItems();
    const now = new Date().toISOString();
    return this.orders.createOrder({
      id: crypto.randomUUID(),
      userId: currentUser.id,
      status: "em_andamento",
      createdAt: now,
      updatedAt: now,
      items,
    });
  }

  async listOrders(currentUser: RequestUser): Promise<PublicOrder[]> {
    return this.orders.findAllByUser(currentUser.id);
  }

  async findOrder(currentUser: RequestUser, id: string): Promise<PublicOrder> {
    return this.findOwnedOrder(currentUser, id);
  }

  async cancelOrder(currentUser: RequestUser, id: string): Promise<PublicOrder> {
    const order = this.findOwnedOrder(currentUser, id);
    if (order.status !== "em_andamento") throw orderInvalidStatusTransition();
    const cancelled = this.orders.cancelOrder(id, new Date().toISOString());
    if (!cancelled) throw orderNotFound();
    return cancelled;
  }

  async listAdminOrders(currentUser: RequestUser): Promise<PublicOrder[]> {
    assertAdmin(currentUser);
    return this.orders.findAllAdmin();
  }

  async countAdminOrders(currentUser: RequestUser): Promise<number> {
    assertAdmin(currentUser);
    return this.orders.countAll();
  }

  async findAdminOrder(currentUser: RequestUser, id: string): Promise<PublicOrder> {
    assertAdmin(currentUser);
    const order = this.orders.findById(id);
    if (!order) throw orderNotFound();
    return order;
  }

  async updateAdminOrderStatus(
    currentUser: RequestUser,
    id: string,
    input: UpdateOrderStatusInput,
  ): Promise<PublicOrder> {
    assertAdmin(currentUser);
    const order = this.orders.findById(id);
    if (!order) throw orderNotFound();
    if (order.status === "cancelado") throw orderInvalidStatusTransition();
    const updated = this.orders.updateStatus(id, input.status, new Date().toISOString());
    if (!updated) throw orderNotFound();
    return updated;
  }

  async getAdminDashboard(currentUser: RequestUser): Promise<AdminDashboard> {
    assertAdmin(currentUser);
    return {
      usersCount: this.users.count(),
      ordersCount: this.orders.countAll(),
      productsCount: this.products.count(),
    };
  }

  private findOwnedOrder(currentUser: RequestUser, id: string): PublicOrder {
    const order = this.orders.findById(id);
    if (!order) throw orderNotFound();
    if (order.userId !== currentUser.id) throw orderAccessDenied();
    return order;
  }
}

function consolidateItems(items: CreateOrderInput["items"]) {
  const consolidated = new Map<string, number>();

  for (const item of items) {
    if (item.quantity < 1) continue;
    consolidated.set(item.productId, (consolidated.get(item.productId) ?? 0) + item.quantity);
  }

  return Array.from(consolidated.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

function assertAdmin(user: Pick<RequestUser, "role">): void {
  if (user.role !== "admin") throw adminRequired();
}
