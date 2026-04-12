import "dotenv/config";
import pgPromise from "pg-promise";

const pgp = pgPromise();

export const databaseConfig = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "app",
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
};

export const createDatabase = () => pgp(databaseConfig);

export const db = createDatabase();
