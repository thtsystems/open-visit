import {Hono} from "hono"
import {validator} from "hono/validator";

import {company as companyTable} from "@open-visit/database/schema";

import {auth as authFunction, hono as honoMiddleware} from "../auth";
import {createInsertSchema} from "drizzle-zod";
import {z, ZodError} from "zod";
import {Client, DatabaseError} from "pg";
import {database} from "@open-visit/database";

type Bindings = {
    DATABASE_URL: string
};

const companySchema = createInsertSchema(companyTable, {
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
        try{
            const companyPayload = context.req.valid("json")
            const client = new Client({ connectionString: context.env.DATABASE_URL })

            await client.connect();

            await database(client).insert(companyTable).values({
                name: companyPayload.name,
                cpf: companyPayload.cpf,
                cnpj: companyPayload.cnpj,
                active: companyPayload.active,
                condominiumId: companyPayload.condominiumId,
                condominiumAddress: companyPayload.condominiumAddress
            })

            await client.end()

            return context.json({message: "Company created successfully"}, 200)
        }catch (error){
            if (error instanceof DatabaseError)
                if (error.code === "23505")
                    return context.json({ errorMessage: "Condominium already exists"}, 400)
                else{
                    console.error(error)
                    return context.text("Internal server error", 500);
                }
        }
    }
)