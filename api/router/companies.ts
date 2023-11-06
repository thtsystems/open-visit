import {Hono} from "hono"
import {validator} from "hono/validator";

import {company as companyTable} from "@open-visit/database/schema";

import {auth as authFunction, hono as honoMiddleware} from "../auth";
import {createInsertSchema} from "drizzle-zod";
import {z, ZodError} from "zod";
import {Client, DatabaseError} from "pg";
import {database, eq} from "@open-visit/database";

const validate = require("uuid-validate")

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

/* POST - /company
* Creates a new company
*/
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
        try {
            const companyPayload = context.req.valid("json")
            const client = new Client({connectionString: context.env.DATABASE_URL})

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
        } catch (error) {
            if (error instanceof DatabaseError)
                if (error.code === "23505")
                    return context.json({errorMessage: "Condominium already exists"}, 400)
                else {
                    console.error(error)
                    return context.text("Internal server error", 500);
                }
        }
    }
)

/* GET - /:company_id
* returns the information about company
*/
companies.get("/:company_id",
    validator("param", (value, context) => {
        const {company_id} = value

        if (!validate(company_id))
            return context.text("you need to use a UUID as param", 400)

        return {
            company_id
        }
    }),
    async context => {
        try {
            const {company_id} = context.req.valid("param")

            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const company = await database(client).query.company.findFirst({
                where: (company, {and, eq}) => and(eq(company.id, company_id), eq(company.active, true))
            })

            await client.end()

            if (typeof company === "undefined")
                return context.json({message: "Company not found"}, 404)

            return context.json(company, 200)
        } catch (error) {
            console.log(error)
            return context.text("Internal server error", 500)
        }
    }
)

/* GET - /:company_id/employees
* Returns all the employees of a company
*/
companies.get("/:company_id/employees",
    validator("param", (value, context) => {
        const {company_id} = value

        if (!validate(company_id))
            return context.text("you need to use a UUID as param", 400)

        return {
            company_id
        }
    }),
    async context => {
        try {
            const {company_id} = context.req.valid("param")

            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const employees = await database(client).query.employee.findMany({
                where: (employee, {eq}) => eq(employee.companyId, company_id)
            })

            await client.end()

            if (typeof employees === "undefined")
                return context.json({message: "Company does not has employees"}, 404)

            return context.json(employees, 200)
        } catch (error) {
            console.log(error)
            return context.text("Internal server error", 500)
        }
    }
)

/* GET - /:company_id/schedulings
* Returns all company schedules
*/
companies.get("/:company_id/schedulings",
    validator("param", (value, context) => {
        const {company_id} = value

        if (!validate(company_id))
            return context.text("you need to use a UUID as param", 400)

        return {
            company_id
        }
    }),
    async context => {
        try {
            const {company_id} = context.req.valid("param")

            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const schedules = await database(client).query.scheduling.findMany({
                where: (schedule, {eq, and}) => eq(schedule.companyId, company_id)
            })

            await client.end()

            if (typeof schedules === "undefined")
                return context.json({message: "Company does not has employees"}, 404)

            return context.json(schedules, 200)
        } catch (error) {
            console.log(error)
            return context.text("Internal server error", 500)
        }
    }
)

/* PUT - /:company_id
 * Update a company
 */
companies.put("/:company_id",
    validator("param", (value, context) => {
        const {company_id} = value

        if (!validate(company_id))
            return context.text("you need to use a UUID as param", 400)

        return {
            company_id
        }
    }),
    validator("json", (value, context) => {
        try {
            return companySchema
                .omit({
                    id: true,
                    condominiumId: true,
                    active: true
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
            const { company_id } = context.req.valid("param")
            const { name, cpf, cnpj, condominiumAddress } = context.req.valid("json")

            const client  = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const updatedId: {updatedId: string}[] = await database(client).update(companyTable)
                .set({
                    name: name,
                    cpf: cpf,
                    cnpj: cnpj,
                    condominiumAddress: condominiumAddress
                })
                .where(eq(companyTable.id, company_id))
                //.where(and(eq(companyTable.id, company_id), eq(companyTable.active, true))) in case if want to filter only actives to update
                .returning({ updatedId: companyTable.id })

            await client.end()

            if(typeof updatedId === "undefined")
                return context.text("Not updated: company not found", 404)

            return context.json( updatedId[0], 200)
        }catch(error){
            console.log(error)
            return context.text("Internal server error", 500)
        }
    }
)

/* DELETE - /:company_id
 * remove a company
 */
companies.delete("/:company_id",
    validator("param", (value, context) => {
        const {company_id} = value

        if (!validate(company_id))
            return context.text("you need to use a UUID as param", 400)

        return {
            company_id
        }
    }),
    async context => {
        try{
            const { company_id } = context.req.valid("param")

            const client = new Client(context.env.DATABASE_URL)
            await client.connect()

            const removedId: {removedId: string}[] = await database(client).update(companyTable)
                .set({
                    active: false
                })
                .where(eq(companyTable.id, company_id))
                .returning({removedId: companyTable.id})

            await client.end()

            if(typeof removedId === "undefined")
                return context.text("Company not removed: not found", 404)

            return context.json(removedId[0], 200)
        } catch (error){
            console.log(error)
            return context.text("Internal server error", 500)
        }
    }
)