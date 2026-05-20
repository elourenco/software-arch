import type { Database } from "bun:sqlite";
import { emailAlreadyExists } from "./user.errors";
import { mapUserRow, type UserRow } from "./user.mapper";
import type { User, UpdateUserData } from "./user.model";

/** Persists users through Bun SQLite prepared statements. */
export class UserRepository {
  constructor(private readonly db: Database) {}

  create(user: User): User {
    try {
      this.db.query(`
        INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt, user.updatedAt);
      return user;
    } catch (error) {
      if (String(error).includes("UNIQUE constraint failed: users.email")) throw emailAlreadyExists();
      throw error;
    }
  }

  findAll(): User[] {
    return this.rows("SELECT * FROM users ORDER BY created_at DESC");
  }

  count(): number {
    return Number((this.db.query("SELECT COUNT(*) as count FROM users").get() as { count: number }).count);
  }

  findById(id: string): User | null {
    return this.row("SELECT * FROM users WHERE id = ?", id);
  }

  findByEmail(email: string): User | null {
    return this.row("SELECT * FROM users WHERE email = ?", email.toLowerCase());
  }

  findByName(name: string): User[] {
    return this.rows("SELECT * FROM users WHERE lower(name) LIKE lower(?) ORDER BY name", `%${name}%`);
  }

  update(id: string, data: UpdateUserData & { updatedAt: string }): User | null {
    const current = this.findById(id);
    if (!current) return null;
    return this.createReplacement({
      ...current,
      name: data.name ?? current.name,
      email: data.email ?? current.email,
      passwordHash: data.passwordHash ?? current.passwordHash,
      role: data.role ?? current.role,
      updatedAt: data.updatedAt,
    });
  }

  delete(id: string): boolean {
    return this.db.query("DELETE FROM users WHERE id = ?").run(id).changes > 0;
  }

  private createReplacement(user: User): User {
    try {
      this.db.query("UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, updated_at = ? WHERE id = ?")
        .run(user.name, user.email, user.passwordHash, user.role, user.updatedAt, user.id);
      return user;
    } catch (error) {
      if (String(error).includes("UNIQUE constraint failed: users.email")) throw emailAlreadyExists();
      throw error;
    }
  }

  private row(sql: string, ...params: string[]): User | null {
    const row = this.db.query(sql).get(...params) as UserRow | null;
    return row ? mapUserRow(row) : null;
  }

  private rows(sql: string, ...params: string[]): User[] {
    return (this.db.query(sql).all(...params) as UserRow[]).map(mapUserRow);
  }
}
