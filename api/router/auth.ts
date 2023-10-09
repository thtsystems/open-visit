import { Hono } from "hono";
import { validator } from "hono/validator";
import { z, ZodError } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { Client, DatabaseError } from "pg";
import { database } from "@open-visit/database";
import { user as userTable } from "@open-visit/database/schema";
import { condominium as condominiumTable } from "@open-visit/database/schema";
import { employee as employeeTable } from "@open-visit/database/schema";

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

const employeeSchema = createInsertSchema(employeeTable, {
  phoneNumber: z.string().length(13),
});

const userSchema = createInsertSchema(userTable, {
  email: z.string().email(),
})
  .extend({ password: z.string() })
  .omit({ id: true, userType: true });

export const auth = new Hono<{ Bindings: Bindings }>();

/** Build the auth client that returns the `auth` constructor from Lucia
 * We pass the database connection string and the middleware as parameters. */
async function buildAuthClient(env: Bindings) {
  const connectionString = env.DATABASE_URL;
  const auth = authFunction(connectionString, honoMiddleware());
  return auth;
}

auth.post(
  "create/employee",
  validator("json", (value, context) => {
    try {
      const employeePayload = userSchema.extend({ employeeData: employeeSchema }).parse(value);
      return employeePayload;
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
      const { email, password, employeeData } = context.req.valid("json");
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
          user_type: "EMPLOYEE",
        },
      });

      await client.connect();
      await database(client).insert(employeeTable).values({
        userId: user.userId,
        name: employeeData.name,
        email: employeeData.email,
        phoneNumber: employeeData.phoneNumber,
        companyId: employeeData.companyId,
        departmentId: employeeData.departmentId,
      });

      return context.json({ message: "Created employee successfully" }, 200);
    } catch (error) {
      if (error instanceof DatabaseError) {
        if (error.code === "23505")
          return context.json({ errorMessage: "Employee already exists" }, 400);
      } else {
        return context.text("Internal server error", 500);
      }
    }
  },
);
