import { resolvers } from "./graphql/resolvers";
import { typeDefs } from "./graphql/schema";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { EventsLoader } from "./graphql/loaders";
const { HOST } = process.env;

const knexConfig = {
  client: "pg",
  connection: `postgresql://postgres:postgres@${
    HOST ? HOST : "host.docker.internal"
  }:5432/postgres`,
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  context: async () => {
    const { cache } = server; // highlight-line
    return {
      dataSources: {
        events: new EventsLoader({ knexConfig, cache }),
      },
    };
  },
}).then(({ url }) => console.log(`🚀 Server ready at ${url}`));
