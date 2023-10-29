import {Hono} from "hono"
import {validator} from "hono/validator";

import {company} from "@open-visit/database/schema";

import {auth as authFunction, hono as honoMiddleware} from "../auth";
import {createInsertSchema} from "drizzle-zod";
import {z, ZodError} from "zod";

type Bindings = {
    DATABASE_URL: string
};

const companySchema = createInsertSchema(company, {
    id: z.string().uuid(),
    condominiumId: z.string().uuid(),
    cnpj: z.string().length(14),
    cpf: z.string().length(11),
    active: z.boolean().optional()
})

/* Initialize the router tree for the `/companies` route */
export const companies = new Hono<{ Bindings: Bindings }>();

/** Build the auth client that returns the `auth` constructor from Lucia
 * We pass the database connection string and the middleware as parameters. */
async function buildAuthClient(env: Bindings) {
    const connectionString = env.DATABASE_URL;
    return authFunction(connectionString, honoMiddleware());
}

companies.post("/",
    validator("json", (value, context) => {
        try {
            return companySchema
                .omit({
                    id: true,
                })
                .parse(value)
        } catch (error) {
            if (error instanceof ZodError)
                return context.json(
                    {
                        errorMessage: "Bad payload",
                        error: error.issues,
                    },
                    400,
                )

            return context.text("Internal server error", 500);
        }
    }),
    async context => {
        // TODO - Insert into company schema
    }
)