import { Knex } from "knex";
import { event_attribute } from "../data";

export async function seed(knex: Knex): Promise<void> {
  // Inserts seed entries
  await knex("event_attribute").insert(event_attribute);
}
