import type { RequestUser } from "../../shared/http/request-user";
import type { OrderService } from "./order.service";
import type { CreateOrderInput, UpdateOrderStatusInput } from "./order.schema";

type StatusSetter = { status?: number | string };

/** HTTP boundary for user and admin order workflows. */
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  list(currentUser: RequestUser) {
    return this.orders.listOrders(currentUser);
  }

  find(currentUser: RequestUser, id: string) {
    return this.orders.findOrder(currentUser, id);
  }

  async create(currentUser: RequestUser, body: CreateOrderInput, set: StatusSetter) {
    set.status = 201;
    return this.orders.createOrder(currentUser, body);
  }

  cancel(currentUser: RequestUser, id: string) {
    return this.orders.cancelOrder(currentUser, id);
  }

  adminList(currentUser: RequestUser) {
    return this.orders.listAdminOrders(currentUser);
  }

  async adminCount(currentUser: RequestUser) {
    return { count: await this.orders.countAdminOrders(currentUser) };
  }

  adminFind(currentUser: RequestUser, id: string) {
    return this.orders.findAdminOrder(currentUser, id);
  }

  adminUpdateStatus(currentUser: RequestUser, id: string, body: UpdateOrderStatusInput) {
    return this.orders.updateAdminOrderStatus(currentUser, id, body);
  }

  adminDashboard(currentUser: RequestUser) {
    return this.orders.getAdminDashboard(currentUser);
  }
}
