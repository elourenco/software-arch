import { hashPassword } from "../../shared/security/password";
import { emailAlreadyExists, userNotFound } from "./user.errors";
import { toPublicUser } from "./user.mapper";
import type { PublicUser, UserRole } from "./user.model";
import type { UserRepository } from "./user.repository";
import type { CreateUserInput, UpdateUserInput } from "./user.schema";

/** Owns user business rules and public data projection. */
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    if (this.users.findByEmail(input.email)) throw emailAlreadyExists();
    const now = new Date().toISOString();
    const user = this.users.create({
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      role: input.role,
      createdAt: now,
      updatedAt: now,
    });
    return toPublicUser(user);
  }

  async listUsers(currentUserId: string): Promise<PublicUser[]> {
    return this.users.findAll(currentUserId).map(toPublicUser);
  }

  async countUsers(currentUserId: string): Promise<number> {
    return this.users.count(currentUserId);
  }

  async findUserById(id: string): Promise<PublicUser> {
    const user = this.users.findById(id);
    if (!user) throw userNotFound();
    return toPublicUser(user);
  }

  async searchUsersByName(name: string, currentUserId: string): Promise<PublicUser[]> {
    return this.users.findByName(name, currentUserId).map(toPublicUser);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const passwordHash = input.password ? await hashPassword(input.password) : undefined;
    const updated = this.users.update(id, {
      name: input.name,
      email: input.email?.toLowerCase(),
      passwordHash,
      role: input.role as UserRole | undefined,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw userNotFound();
    return toPublicUser(updated);
  }

  async deleteUser(id: string): Promise<void> {
    if (!this.users.delete(id)) throw userNotFound();
  }

  /** Returns sensitive credentials only for the auth module. */
  findUserByEmailWithPassword(email: string) {
    return this.users.findByEmail(email);
  }
}
