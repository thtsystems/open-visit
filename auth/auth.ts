import { lucia, Middleware } from "lucia";
import { hono, web } from "lucia/middleware";

// export function auth<T>(connectionString: string, middleware: Middleware<[T]>) {
//   return lucia({
//     env: "DEV",
//     middleware: middleware,
//     getUserAttributes: (userData) => {
//       return {};
//     },
//     csrfProtection: false,
//   });
// }

// export type AuthFunction = typeof auth;
// export type Auth = ReturnType<AuthFunction>;
export { LuciaError } from "lucia";

export { hono, web };
