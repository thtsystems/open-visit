import {Hono} from "hono"
import {validator} from "hono/validator";
import {z, ZodError} from "zod";

import {department as departmentsTable} from "@open-visit/database/schema"
import {createInsertSchema} from "drizzle-zod";

import {Client} from "pg";
import {database, eq} from "@open-visit/database";

type Bindings = {
    DATABASE_URL: string;
};

const validate = require("uuid-validate")

const departmentsSchema = createInsertSchema(departmentsTable, {
    id: z.string().uuid(),
    name: z.string().trim(),
    companyId: z.string().uuid()
})

/* Initialize the router tree for the `/departments` route */
export const departments = new Hono<{ Bindings: Bindings }>();

/* POST - /
* Create a new department
*/
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
        try {
            const {name, companyId} = context.req.valid("json")

            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            await database(client).insert(departmentsTable).values({
                name: name,
                companyId: companyId
            })

            await client.end()

            return context.json("Department created successfully", 200)
        } catch (error) {
            return context.text("Internal server error", 500);
        }
    }
)

/* GET - /:department_id
* Retrieve the information about a department
*/
departments.get("/:department_id",
    validator("param", (value, context)=> {
        const {department_id} = value

        if (!validate(department_id))
            return context.text("you need to use a UUID as param", 400)

        return {
            department_id
        }
    }),
    async context => {
        try{
            const {department_id} = context.req.valid("param")

            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const department = await database(client).query.department.findFirst({
                where: (department, {eq}) => eq(department.id, department_id)
            })

            await client.end()

            if(typeof department === "undefined")
                return context.json({message: "Department not found"}, 404)

            return context.json(department, 200)
        }catch (error) {
            console.log(error)
            return context.text("Internal server error", 500)
        }
    }
)

/* GET - /:department_id/employees
* Retrieve all employees of a department
*/
departments.get("/:department_id/employees",
    validator("param", (value, context) => {
        const {department_id} = value

        if(!validate(department_id))
            return context.text("You need to use a valid UUID", 400)

        return {
            department_id
        }
    }),
    async context => {
        try{
            const {department_id} = context.req.valid("param")
            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const employees = await database(client).query.employee.findMany({
                where: (employee, {eq}) => eq(employee.departmentId, department_id)
            })

            if(typeof employees === "undefined")
                return context.json({message: "Cannot find any employee in the department"}, 404)

            return context.json(employees, 200)
        } catch (error) {
            console.log(error)
            return context.text("Internal server error", 500)
        }
    }
)

/* PUT - /:department_id
* Update a department with
*/
departments.put("/:department_id",
    validator("param", (value, context) => {
        const {department_id} = value

        if(!validate(department_id))
            return context.json({message: "You need to use a UUID as a parameter"}, 400)

        return {
            department_id
        }
    }),
    validator("json", (value, context) => {
        try{
            return departmentsSchema
                .omit({
                    id: true,
                    companyId: true
                }).parse(value)
        } catch(error) {
            if(error instanceof ZodError)
                return context.json(
                    {
                        errorMessage: "Bad payload",
                        error: error.issues,
                    },
                    400);
            
            return context.text("Internal sever error", 500)
        }
    }),
    async context => {
        try {
            const { department_id } = context.req.valid("param")
            const { name } = context.req.valid("json")

            const client = new Client({connectionString: context.env.DATABASE_URL})
            await client.connect()

            const updatedId: {updatedId: string}[] = await database(client).update(departmentsTable)
                .set({
                    name: name
                })
                .where(eq(departmentsTable.id, department_id))
                .returning({ updatedId: departmentsTable.id })

            await client.end()

            if(typeof updatedId === "undefined")
                return context.text("Not updated: department not found", 404)

            return context.json(updatedId[0], 200)
        }catch (error) {
            console.log(error)
            return context.text("Internal server error", 500)
        }
    }
)