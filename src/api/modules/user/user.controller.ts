import type { UserService } from "./user.service";
import type { CreateUserInput, UpdateUserInput } from "./user.schema";

type StatusSetter = { status?: number | string };

/** HTTP boundary for user CRUD operations. */
export class UserController {
  constructor(private readonly users: UserService) {}

  async create(body: CreateUserInput, set: StatusSetter) {
    set.status = 201;
    return this.users.createUser(body);
  }

  list() {
    return this.users.listUsers();
  }

  async count() {
    return { count: await this.users.countUsers() };
  }

  findById(id: string) {
    return this.users.findUserById(id);
  }

  search(name: string) {
    return this.users.searchUsersByName(name);
  }

  update(id: string, body: UpdateUserInput) {
    return this.users.updateUser(id, body);
  }

  async delete(id: string) {
    await this.users.deleteUser(id);
    return new Response(null, { status: 204 });
  }
}
