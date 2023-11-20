import {Hono} from "hono";
import {validator} from "hono/validator";
import {z, ZodError} from "zod";
import {createInsertSchema} from "drizzle-zod";

import {Client, DatabaseError} from "pg";
import {database, eq} from "@open-visit/database";
import {employee as employeeTable, user as userTable} from "@open-visit/database/schema";

import {auth as authFunction, hono as honoMiddleware} from "../auth";

const validate = require("uuid-validate")

type Bindings = {
    DATABASE_URL: string;
};

const employeeSchema = createInsertSchema(employeeTable, {
    phoneNumber: z.string().length(13),
});

const userSchema = createInsertSchema(userTable, {
    email: z.string().email(),
})
    .extend({password: z.string()})
    .omit({id: true, userType: true});

/* Initialize the router tree for the `/condominium` route */
export const employee = new Hono<{ Bindings: Bindings }>();

/** Build the auth client that returns the `auth` constructor from Lucia
 * We pass the database connection string and the middleware as parameters. */
async function buildAuthClient(env: Bindings) {
    const connectionString = env.DATABASE_URL;
    return authFunction(connectionString, honoMiddleware());
}

/* POST - /
 * Create a new employee
 */
employee.post(
    "/",
    validator("json", (value, context) => {
        try {
            const employeePayload = userSchema
                .extend({employeeData: employeeSchema.omit({userId: true})})
                .parse(value);
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
            const {email, password, employeeData} = context.req.valid("json");
            const client = new Client({connectionString: context.env.DATABASE_URL});

            console.log(email)

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

            return context.json({message: "Created employee successfully"}, 200);
        } catch (error) {
            if (error instanceof DatabaseError) {
                if (error.code === "23505")
                    return context.json({errorMessage: "Employee already exists"}, 400);
            } else {
                return context.text("Internal server error", 500);
            }
        }
    },
);

/* GET - /:employee_id
 * Retrieve a employee by id
 */
employee.get("/:employee_id",
    validator('param', (value, context) => {
        const {employee_id} = value

        if (!validate(employee_id))
            return context.text("you need to use a UUID as param", 400)

        return {
            employee_id
        }
    }),
    async context => {
        try {
            const {employee_id} = context.req.valid("param")

            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const employee = await database(client).query.employee.findFirst({
                where: (employee, {eq}) => eq(employee.id, employee_id)
            })
            await client.end()

            if (typeof employee === "undefined")
                return context.json({message: "Employee not found"}, 404);

            return context.json(employee, 200)
        } catch (error) {
            console.error(error);
            return context.text("Internal server error", 500);
        }
    }
)

/* PUT - /:employee_id
 * Update a employee
 */
employee.put("/:employee_id",
    validator("param", (value, context) => {
        const {employee_id} = value

        if (!validate(employee_id))
            return context.text("you need to use a UUID as param", 400)

        return {
            employee_id
        }
    }),
    validator("json", (value, context) => {
        try {
            return employeeSchema
                .omit({
                    userId: true,
                    departmentId: true,
                    companyId: true,
                    id: true
                })
                .parse(value);
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
    async context => {
        try {
            const {employee_id} = context.req.valid("param")
            const {email, name, phoneNumber} = context.req.valid("json")

            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const employee = await database(client)
                .update(employeeTable)
                .set({
                    email: email,
                    name: name,
                    phoneNumber: phoneNumber

                })
                .where(eq(employeeTable.id, employee_id))
                .returning({
                    updatedId: employeeTable.id,
                    name: employeeTable.name,
                    email: employeeTable.email,
                    phoneNumber: employeeTable.phoneNumber
                })

            await client.end()

            if (Object.keys(employee).length <= 0 || typeof employee === "undefined")
                return context.json({message: "Employee not found"}, 404);

            return context.json(employee, 200)
        } catch (error) {
            console.error(error);
            return context.text("Internal server error", 500);
        }
    }
)

/* DELETE - /:employee_id
 * remove a employee
 */
employee.delete("/:employee_id",
    validator("param", (value, context) => {
        const {employee_id} = value

        if (!validate(employee_id))
            return context.text("you need to use a UUID as param", 400)

        return {
            employee_id
        }
    }),
    async context => {
        try{
            const {employee_id} = context.req.valid("param")

            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const deletedId: {deletedId: string}[] = await database(client).update(employeeTable)
                .set({
                    deletedAt: new Date()
                })
                .where(eq(employeeTable.id, employee_id))
                .returning({
                    deletedId: employeeTable.id,
                })

            await client.end()

            if(Object.keys(deletedId).length <= 0 || typeof deletedId === "undefined")
                return context.json({message: "Employee not found"}, 404);

            return context.json(deletedId[0], 200)
        }catch(error){
            console.error(error);
            return context.text("Internal server error", 500);
        }
    }
)