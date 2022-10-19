import gql from "graphql-tag";

export const typeDefs = gql`
  type Event {
    id: Int
    title: String
    attributes: [EventAttribute]
  }

  type EventBatched {
    id: Int
    title: String
    attributes: [EventAttribute]
  }

  type EventAttribute {
    id: Int
    key: String
    value: String
    event_id: Int
  }

  type Query {
    events: [Event]
    eventsBatched: [EventBatched]
  }
`;
