export const resolvers = {
  Query: {
    events(_: any, __: any, { dataSources }: GraphQL.Context) {
      return dataSources.events.getEvents();
    },
    eventsBatched(_: any, __: any, { dataSources }: GraphQL.Context) {
      return dataSources.events.getEvents();
    },
  },
  Event: {
    attributes({ id }: any, _: any, { dataSources }: GraphQL.Context) {
      return dataSources.events.getEventAttributes(id);
    },
  },
  EventBatched: {
    attributes({ id }: any, _: any, { dataSources }: GraphQL.Context) {
      return dataSources.events.getEventsAttributesBatched.load(id);
    },
  },
};
