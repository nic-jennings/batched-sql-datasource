import {
  BatchedLoader,
  BatchedSQLDataSource,
  knexConfig,
} from "@nic-jennings/batched-sql-datasource";
import { Knex } from "knex";
import { EventAttribute, Event } from "../../types";

export class EventsLoader extends BatchedSQLDataSource {
  getEventsAttributesBatched: BatchedLoader<string, EventAttribute[]>;

  constructor(read: Knex | knexConfig, write?: Knex | knexConfig) {
    super(read, write);

    this.getEventsAttributesBatched = this.db.query
      .select("*")
      .from({ ea: "event_attribute" })
      .batch("ea.event_id", (keys, result) =>
        keys.map((x) => result?.filter((y) => y.event_id === x))
      );
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
