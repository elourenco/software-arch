import { getBearerToken } from "../../shared/http/auth-guard";
import type { AuthService } from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.schema";

type StatusSetter = { status?: number | string };

/** HTTP boundary for authentication operations. */
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  async register(body: RegisterInput, set: StatusSetter) {
    set.status = 201;
    return this.auth.register(body);
  }

  login(body: LoginInput) {
    return this.auth.login(body);
  }

  me(request: Request) {
    return this.auth.me(getBearerToken(request.headers));
  }
}
