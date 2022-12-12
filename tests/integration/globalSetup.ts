import { knex } from "knex";

export const knexConnectionString = {
  client: "pg",
  connection: "postgres://postgres:password@localhost:32123/postgres",
};

export const knexDb = knex(knexConnectionString);

const main = async () => {
  await knexDb.migrate.latest({ directory: "./tests/integration/migrations" });
  await knexDb.seed.run({ directory: "./tests/integration/seeds" });
};

export default main;
