import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

const client = (connectionString: string) => new Client({ connectionString });

export const database = (connectionString: string) => drizzle(client(connectionString));

export { eq, ne, gt, gte, lt, lte, ilike, and, or, placeholder, asc, desc } from "drizzle-orm";
