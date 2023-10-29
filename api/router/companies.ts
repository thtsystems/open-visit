import {Hono} from "hono"

import {auth as authFunction, hono as honoMiddleware} from "../auth";

type Bindings = {
    DATABASE_URL: string
};

/* Initialize the router tree for the `/companies` route */
export const companies = new Hono<{ Bindings: Bindings }>();


/** Build the auth client that returns the `auth` constructor from Lucia
 * We pass the database connection string and the middleware as parameters. */
async function buildAuthClient(env: Bindings) {
    const connectionString = env.DATABASE_URL;
    return authFunction(connectionString, honoMiddleware());
}