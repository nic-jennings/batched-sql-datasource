import { Knex } from "knex";
import { event } from "../data";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("event_attribute").del();
  await knex("event").delete();

  // Inserts seed entries
  await knex("event").insert(event);
}
