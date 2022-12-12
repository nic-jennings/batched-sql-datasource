import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("event", function (table) {
    table.increments().primary();
    table.string("title").notNullable();
    table.timestamps(false, true);

    table.index(["title"]);
  });

  await knex.schema.createTable("event_attribute", function (table) {
    table.increments().primary();
    table.string("key").notNullable();
    table.string("value").notNullable();
    table.integer("event_id").references("event.id");
    table.integer("parent_id").references("event_attribute.id").nullable();

    table.timestamps(false, true);
    table.index(["key", "value"]);
  });
}

export async function down(knex: Knex): Promise<void> {}
