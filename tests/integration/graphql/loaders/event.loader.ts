import {
  BatchedLoader,
  BatchedSQLDataSource,
  BatchedSQLDataSourceProps,
} from "../../../../src/SQLDataSource";

export type Event = {
  id: string;
  title: string;
  events?: EventAttribute[];
};

export type EventAttribute = {
  id: string;
  key: string;
  value: string;
  event_id: string;
};

export class EventsLoader extends BatchedSQLDataSource {
  getEventsAttributesBatched: BatchedLoader<number, EventAttribute[]>;

  constructor(config: BatchedSQLDataSourceProps) {
    super(config);

    this.getEventsAttributesBatched = this.db.query
      .select("*")
      .from({ ea: "event_attribute" })
      .batch(async (query, keys) => {
        const result = await query.whereIn("ea.event_id", keys);
        return keys.map((x) =>
          result?.filter((y: EventAttribute) => y.event_id === x)
        );
      });
  }

  getEvents(): Promise<Event[]> {
    return this.db.query.select("*").from("event");
  }

  getEvent(id: number): Promise<Event[]> {
    return this.db.query.select("*").where({ id }).from("event");
  }

  getEventCached(id: number): Promise<Event[]> {
    return this.db.query.select("*").from("event").where({ id }).cache(1);
  }

  getEventAttributes(id: string): Promise<EventAttribute[]> {
    return this.db.query
      .select("*")
      .from({ ea: "event_attribute" })
      .where("event_id", id);
  }

  updateEvent(id: number, update: Partial<Event>) {
    return this.db
      .write("event")
      .where("id", "=", id)
      .update(update)
      .returning("*");
  }
}
