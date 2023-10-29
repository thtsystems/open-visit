import { Hono } from "hono"

import { department as departmentsTable } from "@open-visit/database/schema"
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

type Bindings = {
    DATABASE_URL: string;
};

const departmentsSchema = createInsertSchema(departmentsTable, {
    id: z.string().uuid(),
    companyId: z.string().uuid()
})

/* Initialize the router tree for the `/departments` route */
export const departments = new Hono<{ Bindings: Bindings }>();

