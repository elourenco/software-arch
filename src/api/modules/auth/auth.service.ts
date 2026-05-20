import { AppError } from "../../shared/errors/app-error";
import { signJwt, verifyJwt } from "../../shared/security/jwt";
import { verifyPassword } from "../../shared/security/password";
import type { PublicUser } from "../user/user.model";
import type { UserService } from "../user/user.service";
import { invalidCredentials } from "./auth.errors";
import type { LoginInput, RegisterInput } from "./auth.schema";

/** Coordinates registration, credential checks, and JWT sessions. */
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwtSecret: string,
  ) {}

  async register(input: RegisterInput): Promise<{ user: PublicUser; accessToken: string; tokenType: "Bearer" }> {
    const user = await this.users.createUser({ ...input, role: "user" });
    return { user, accessToken: await signJwt(user.id, this.jwtSecret), tokenType: "Bearer" };
  }

  async login(input: LoginInput): Promise<{ user: PublicUser; accessToken: string; tokenType: "Bearer" }> {
    const user = this.users.findUserByEmailWithPassword(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw invalidCredentials();
    return {
      user: await this.users.findUserById(user.id),
      accessToken: await signJwt(user.id, this.jwtSecret),
      tokenType: "Bearer",
    };
  }

  async me(token: string): Promise<PublicUser> {
    try {
      const payload = await verifyJwt(token, this.jwtSecret);
      return this.users.findUserById(payload.sub);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("UNAUTHORIZED", "Invalid or expired token", 401);
    }
  }
}
