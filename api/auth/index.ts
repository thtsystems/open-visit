import { lucia, Middleware } from "lucia";
import { hono, web } from "lucia/middleware";
import { pg } from "@lucia-auth/adapter-postgresql";
import { Pool } from "pg";

/**
 * Generic function wrapper around Lucia's `auth` constructor
 * The wrapper allows us to reuse the same auth configuration but
 * pass different middlewares when necessary by building the auth
 * client closer to business logic.
 *
 * @see: https://lucia-auth.com/basics/configuration/
 */
export function auth<T>(connectionString: string, middleware: Middleware<[T]>) {
  return lucia({
    adapter: pg(new Pool({ connectionString }), {
      /* Maps to the name of the database tables */
      key: "user_key",
      session: "user_session",
      user: "user",
    }),
    env: "DEV",
    middleware: middleware,
    /* Data that is returned when we query for session information.
    The properties here need to be properly declared in `app.d.ts` */
    getUserAttributes: (userData) => {
      return {
        id: userData.id,
        email: userData.email,
        user_type: userData.user_type,
      };
    },
    csrfProtection: false,
  });
}

/* Export type infered from the `auth` constructor. This type
should be passed down to `app.d.ts` declaration file in the workspace root */
export type AuthFunction = typeof auth;
export type Auth = ReturnType<AuthFunction>;
export { LuciaError } from "lucia";

export { hono, web };
