const PASSWORD_ALGORITHM = "bcrypt";

/** Hashes a plain password before persistence. */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: PASSWORD_ALGORITHM,
    cost: 10,
  });
}

/** Verifies a plain password against a stored Bun password hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
