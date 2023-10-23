import { Hono } from "hono";
import { validator } from "hono/validator";
import { z, ZodError } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { Client, DatabaseError } from "pg";
import { database } from "@open-visit/database";
import { user as userTable } from "@open-visit/database/schema";
import { condominium as condominiumTable } from "@open-visit/database/schema";

import { auth as authFunction, hono as honoMiddleware } from "../auth";

type Bindings = {
  DATABASE_URL: string;
};

const condominiumSchema = createInsertSchema(condominiumTable, {
  id: z.string().uuid(),
  cnpj: z.string().length(14),
  uf: z.string().length(2),
  cep: z.string().length(8),
});

const userSchema = createInsertSchema(userTable, {
  email: z.string().email(),
})
  .extend({ password: z.string() })
  .omit({ id: true, userType: true });

/* Initialize the router tree for the `/condominium` route */
export const condominium = new Hono<{ Bindings: Bindings }>();

/** Build the auth client that returns the `auth` constructor from Lucia
 * We pass the database connection string and the middleware as parameters. */
async function buildAuthClient(env: Bindings) {
  const connectionString = env.DATABASE_URL;
  const auth = authFunction(connectionString, honoMiddleware());
  return auth;
}

/** `GET /condominium`: Retrieves all condominium entries from the system
 * @todo: Apply filtering parameters.
 */
condominium.get("/", async (context) => {
  try {
    const client = new Client({ connectionString: context.env.DATABASE_URL });
    await client.connect();
    const condominiums = await database(client).query.condominium.findMany();
    await client.end();
    return context.json(condominiums, 200);
  } catch (error) {
    return context.text("Internal server error", 500);
  }
});

/** `GET /condominium/:id`: Retrieves a new condominium entry */
condominium.get("/:id", async (context) => {
  try {
    const id = context.req.param("id");
    const client = new Client({ connectionString: context.env.DATABASE_URL });
    await client.connect();
    const condominium = await database(client).query.condominium.findFirst({
      where: (condominium, { eq }) => eq(condominium.id, id),
    });
    await client.end();

    if (typeof condominium === "undefined")
      return context.json({ message: "Condominium not found" }, 404);

    return context.json(condominium, 200);
  } catch (error) {
    console.error(error);
    return context.text("Internal server error", 500);
  }
});

condominium.post(
  "/",
  validator("json", (value, context) => {
    try {
      const condominiumPayload = userSchema
        .extend({ condominiumData: condominiumSchema.omit({ userId: true }) })
        .parse(value);

      return condominiumPayload;
    } catch (error) {
      if (error instanceof ZodError) {
        return context.json(
          {
            errorMessage: "Bad payload",
            error: error.issues,
          },
          400,
        );
      }

      return context.text("Internal server error", 500);
    }
  }),
  async (context) => {
    const auth = await buildAuthClient(context.env);
    try {
      const { email, password, condominiumData } = context.req.valid("json");
      const client = new Client({ connectionString: context.env.DATABASE_URL });

      const user = await auth.createUser({
        userId: crypto.randomUUID(),
        key: {
          providerId: "email",
          providerUserId: email.toLowerCase(),
          password,
        },
        attributes: {
          email,
          user_type: "CONDOMINIUM",
        },
      });

      await client.connect();
      await database(client).insert(condominiumTable).values({
        userId: user.userId,
        name: condominiumData.name,
        address: condominiumData.address,
        cep: condominiumData.cep,
        city: condominiumData.city,
        cnpj: condominiumData.cnpj,
        uf: condominiumData.uf,
      });

      return context.json({ message: "Created condominium successfully" }, 200);
    } catch (error) {
      if (error instanceof DatabaseError) {
        if (error.code === "23505")
          return context.json({ errorMessage: "Condominium already exists" }, 400);
      } else {
        console.error(error);
        return context.text("Internal server error", 500);
      }
    }
  },
);
