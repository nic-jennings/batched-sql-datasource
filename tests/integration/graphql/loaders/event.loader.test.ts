import { EventsLoader } from "./event.loader";
import { knexDb } from "../../globalSetup";
import { event } from "../../data";

describe("Events Loader", () => {
  const loader = new EventsLoader({ knexConfig: knexDb });
  test("Gets All Events", async () => {
    const result = await loader.getEvents();
    expect(result.length).toBe(event.length);
  });
  test("Gets All Event Attributes", async () => {
    // Batched Response
    const result = await loader.getEventsAttributesBatched.load(1);
    expect(result[0].key).toBe("nulla");
    // Standard response
    const result2 = await loader.getEventAttributes("1");
    expect(result2[0].key).toBe("nulla");
  });
  test("Caching works as expected", async () => {
    // Get Response
    const result = await loader.getEventCached(1);
    expect(result[0].title).toBe("ipsum aliquam non mauris morbi non lectus");
    // Update Response
    await loader.updateEvent(1, { title: "foobar" });
    // Should get the cached result
    const result2 = await loader.getEventCached(1);
    expect(result2[0].title).toBe("ipsum aliquam non mauris morbi non lectus");
    // Database Has updated
    const result3 = await loader.getEvent(1);
    expect(result3[0].title).toBe("foobar");
  });
});
