# Batched SQL (Knex) Datasource

SQL DataSource combines the power of `Knex` with `Apollo DataSources` along with the benefit of having batching functionality from the `DataLoader` package.

---

### THIS PACKAGE IS FOR APOLLO SERVER 4 [@apollo/server](https://www.npmjs.com/package/@apollo/server)

For Apollo Server < 4 please use:
[@nic-jennings/batched-sql-datasource](https://www.npmjs.com/package/@nic-jennings/batched-sql-datasource)

---

## Getting Started

### Installation

```js
npm i @nic-jennings/sql-datasource
```

or

```js
yarn add @nic-jennings/sql-datasource
```

### Usage

Create DataLoader:

```js
// MyDataSource.js

import { BatchedSQLDataSource } from "@nic-jennings/sql-datasource"

export class MyDataSource extends BatchedSQLDataSource {
  getBar;

  constructor(config) {
    super(config);

    // batching
    this.getBar = this.db.query
        .select("*")
        .from({b: "bar"})
        .batch(async (query, keys) => {
          const result = query.whereIn("b.id", keys);
          return keys.map((x) => result?.filter((y) => y.id === x)
        });
  }

  // Standard
  getFoo() {
    return this.db.query
      .select("*")
      .from("foo")
      .where({ id: 1 });
  }

  // caching
  getFooCached() {
    return this.db.query
      .select("*")
      .from("foo")
      .where({ id: 1 })
      .cache(10);
  }

}
```

Use it with Apollo Server:

```js
// index.js

import { MyDataSource } from "./MyDataSource";

const readKnexConfig = {
  client: "pg",
  connection: {
    /* CONNECTION INFO */
  },
};

// Optional - if you have different read write instances
const writeKnexConfig = {
  client: "pg",
  connection: {
    /* CONNECTION INFO */
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  context: async () => {
    const { cache } = server;
    return {
      dataSources: {
        db: new MyDataSource({ knexConfig, cache, writeKnexConfig }),
      },
    };
  },
}).then(({ url }) => console.log(`🚀 Server ready at ${url}`));
```

### Batching (.batch( key, callback ))

As GraphQL only requests the data we require from the database when it is part of the query, it can lead to what is know as the n+1 problem. This is solved by using DataLoaders.

DataLoaders can help you by collecting all of your queries and combining them in a single one. And what's wonderful about this strategy is that it doesn't matter if your data exists in different DB; you can fetch your data from different sources. The only downside to this strategy is that we have to define a data loader for each model which makes it a bit cumbersome to use.

By making it part of the fluid interface that Knex provides it makes using it much cleaner.

```
   this.getBar = this.db.query
        .select("*")
        .from({b: "bar"})
        .batch(async (query, keys) => {
          const result = query.whereIn("b.id", keys);
          return keys.map((x) => result?.filter((y) => y.id === x)
        });
```

Now in our resolver we simple have:

```
 bar({id}, _, { dataSources }) {
      return dataSources.db.getBar.load(id);
 },
```

### Caching ( .cache( ttl ) )

If you were to make the same query over the course of multiple requests to your server you could also be making needless requests to your server - especially for expensive queries.

SQLDataSource leverages Apollo's caching strategy to save results between requests and makes that available via `.cache()`.

This method accepts one OPTIONAL parameter, `ttl` that is the number of seconds to retain the data in the cache.

The default value for cache is `5 seconds`.

Unless [configured](https://www.apollographql.com/docs/apollo-server/data/data-sources/#using-memcachedredis-as-a-cache-storage-backend), SQLDataSource uses an InMemoryLRUCache like the `RESTDataSource`.

---

## BatchedSQLDataSource Properties

BatchedSQLDataSource is a Typescript Class that extends Apollo's base DataSource Class and can be extended to make a new DataSource

BatchedSQLDataSource has an initialize method that Apollo will call when a new request is routed.

If no cache is provided in your Apollo server configuration, SQLDataSource falls back to the same InMemoryLRUCache.

### Context

If you pass a context property into the constuctor's config then it will be available in the class as`this.context`.

### Knex

The knex instance is made available as `this.db.query` and `this.db.write`.

As the names suggest one should be a read instance and the other should be a write instance. If you do not have seperate instances just pass the same configuration twice.

---

## Debugging

To enable more enhanced logging via [knex-tiny-logger], set `DEBUG` to a truthy value in your environment variables.

---

## Credit

This libraries caching functionality was heavily inspired by https://github.com/cvburgess/SQLDataSource
