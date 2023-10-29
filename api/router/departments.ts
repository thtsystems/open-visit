import {Hono} from "hono"
import {validator} from "hono/validator";
import {z, ZodError} from "zod";

import {department as departmentsTable} from "@open-visit/database/schema"
import {createInsertSchema} from "drizzle-zod";

import {auth as authFunction, hono as honoMiddleware} from "../auth";

type Bindings = {
    DATABASE_URL: string;
};

const departmentsSchema = createInsertSchema(departmentsTable, {
    id: z.string().uuid(),
    companyId: z.string().uuid()
})

/* Initialize the router tree for the `/departments` route */
export const departments = new Hono<{ Bindings: Bindings }>();

/** Build the auth client that returns the `auth` constructor from Lucia
 * We pass the database connection string and the middleware as parameters. */
async function buildAuthClient(env: Bindings) {
    const connectionString = env.DATABASE_URL;
    return authFunction(connectionString, honoMiddleware());
}

/* POST - Create new department */
departments.post("/",
    validator("json", (value, context) => {
        try{
            return departmentsSchema
                .omit({
                    id: true
                })
                .parse(value)
        }catch (error){
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
    async context => {
        // TODO - end post request, depends on company API.
        return context.json({message: "Validado?"})
    }
)