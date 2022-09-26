import { EventsLoader } from "../graphql/loaders";

declare global {
  namespace GraphQL {
    type Context = {
      dataSources: {
        events: EventsLoader;
      };
    };
  }
}
