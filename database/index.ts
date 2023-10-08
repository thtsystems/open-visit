import { drizzle } from "drizzle-orm/node-postgres";
import { type Client } from "pg";
import * as schema from "./schema";

export const database = (databaseClient: Client) =>
  drizzle(databaseClient, {
    schema: schema,
    logger: true,
  });

export { eq, ne, gt, gte, lt, lte, ilike, and, or, placeholder, asc, desc } from "drizzle-orm";
export { schema };
