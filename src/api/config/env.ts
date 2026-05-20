import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("data/software-arch.db"),
  JWT_SECRET: z.string().min(12).default("development-secret-change-me"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type AppEnv = z.infer<typeof envSchema>;

/** Parses process env once so runtime config fails fast. */
export function parseEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(input);
}

export const env = parseEnv();
