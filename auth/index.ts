import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

import {
  auth as authFunction,
  hono as honoMiddleware,
  LuciaError,
} from "./auth.ts";

type Bindings = {
  DATABASE_URL: string;
};

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/** Build the auth client that returns the `auth` constructor from Lucia
 * We pass the database connection string and the middleware as parameters. */
async function buildAuthClient(env: Bindings) {
  const connectionString = env.DATABASE_URL;
  const auth = authFunction(connectionString, honoMiddleware());
  return auth;
}

/** Initialize the app instance from Hono.
 * @see: https://hono.dev/api/hono
 */
const app = new Hono<{ Bindings: Bindings }>();

/** Setup Cross-Origin Resource Sharing (CORS) headers.
 *
 * @see: https://hono.dev/middleware/builtin/cors
 *
 * @todo: This should not be so permissive in prodution environemnts,
 * specially if we're handling sensitive data. It will remain like this
 * while we develop locally.
 */
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["*"],
  })
);

/**From here on, we start the service routing logic
 * @see: https://hono.dev/api/routing
 */

app.post("/login", async (context) => {
  const auth = await buildAuthClient(context.env);
  const requestBody = await context.req.json();
  const creds = signupSchema.safeParse(requestBody);

  try {
    if (!creds.success) return context.text("BAD_PAYLOAD", 400);

    if (creds.success) {
      const { email, password } = creds.data;
      const user = await auth.useKey("email", email.toLowerCase(), password);

      const session = await auth.createSession({
        userId: user.userId,
        attributes: {},
      });

      return context.json(session, 200);
    }
  } catch (error) {
    if (error instanceof LuciaError)
      return context.json({ error: error.message }, 403);
    else {
      console.error(error);
      return context.json({ error: "UNKNOWN_ERROR" }, 500);
    }
  }
});

app.post("/create", async (context) => {
  const auth = await buildAuthClient(context.env);
  const requestBody = await context.req.json();
  const creds = signupSchema.safeParse(requestBody);

  if (!creds.success) return context.text("BAD_PAYLOAD", 400);

  if (creds.success) {
    try {
      const { email, password } = creds.data;

      const user = await auth.createUser({
        key: {
          providerId: "email",
          providerUserId: email.toLowerCase(),
          password,
        },
        attributes: {
          email,
        },
      });

      const session = await auth.createSession({
        userId: user.userId,
        attributes: {},
      });

      return context.json(session, 200);
    } catch (error) {
      if (error instanceof LuciaError)
        return context.json({ error: error.message }, 403);
      else {
        console.error(error);
        return context.json({ error: "UNKNOWN_ERROR" }, 500);
      }
    }
  }
});

export default {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    /* Handles pre-flight request from cross-origin domains */
    if (request.method === "OPTIONS") {
      const response = new Response(null, {
        status: 204,
      });
      return response;
    }

    return app.fetch(request, env, ctx);
  },
};
