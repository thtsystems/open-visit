import { lucia, Middleware } from "lucia";
import { hono, web } from "lucia/middleware";
import { pg } from "@lucia-auth/adapter-postgresql";
import { Pool } from "pg";

export function auth<T>(connectionString: string, middleware: Middleware<[T]>) {
  return lucia({
    adapter: pg(new Pool({ connectionString }), {
      key: "user_key",
      session: "user_session",
      user: "user",
    }),
    env: "DEV",
    middleware: middleware,
    getUserAttributes: (userData) => {
      return {};
    },
    csrfProtection: false,
  });
}

// export type AuthFunction = typeof auth;
// export type Auth = ReturnType<AuthFunction>;
export { LuciaError } from "lucia";

export { hono, web };
