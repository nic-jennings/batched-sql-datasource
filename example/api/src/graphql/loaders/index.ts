import {
  BatchedLoader,
  BatchedSQLDataSource,
} from "@nic-jennings/batched-sql-datasource";
import { Knex } from "knex";
import { EventAttribute, Event } from "../../types";

export class EventsLoader extends BatchedSQLDataSource {
  getEventsAttributesBatched: BatchedLoader<string, EventAttribute[]>;

  constructor(read: Knex | Knex.KnexConfig, write?: Knex | Knex.KnexConfig) {
    super(read, write);

    this.getEventsAttributesBatched = this.db.query
      .select("*")
      .from({ ea: "event_attribute" })
      .batch(async (query, keys) => {
        const result = await query.whereIn("ea.event_id", keys);
        return keys.map((x) => result?.filter((y) => y.event_id === x));
      });
  }

  getEvents(): Promise<Event[]> {
    return this.db.query.select("*").from("event");
  }

  getEventAttributes(id: string): Promise<EventAttribute[]> {
    return this.db.query
      .select("*")
      .from({ ea: "event_attribute" })
      .where("event_id", id);
  }
}
