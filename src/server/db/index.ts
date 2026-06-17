import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const connectionUrl = env.DATABASE_URL.includes("?") 
  ? `${env.DATABASE_URL}&options=-c%20search_path=public` 
  : `${env.DATABASE_URL}?options=-c%20search_path=public`;

export const conn = globalForDb.conn ?? postgres(connectionUrl);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
