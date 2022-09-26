import { resolvers } from "./graphql/resolvers";
import { typeDefs } from "./graphql/schema";
import { ApolloServer } from "apollo-server";
import { EventsLoader } from "./graphql/loaders";

const KnexConfig = {
  client: "pg",
  connection:
    "postgresql://postgres:postgres@host.docker.internal:5432/postgres",
};

const dataSources = {
  events: new EventsLoader(KnexConfig),
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return dataSources;
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
