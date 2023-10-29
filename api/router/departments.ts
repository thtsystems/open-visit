import { Hono } from "hono"

import { department } from "@open-visit/database/schema"

type Bindings = {
    DATABASE_URL: string;
};

/* Initialize the router tree for the `/departments` route */
export const departments = new Hono<{ Bindings: Bindings }>();

