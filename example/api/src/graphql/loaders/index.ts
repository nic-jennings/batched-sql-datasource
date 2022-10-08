import {
  BatchedLoader,
  BatchedSQLDataSource,
  BatchedSQLDataSourceProps,
} from "@nic-jennings/batched-sql-datasource";
import { EventAttribute, Event } from "../../types";

export class EventsLoader extends BatchedSQLDataSource {
  getEventsAttributesBatched: BatchedLoader<string, EventAttribute[]>;

  constructor(config: BatchedSQLDataSourceProps) {
    super(config);

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
