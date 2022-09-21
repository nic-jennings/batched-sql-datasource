import { createHash } from "crypto";
import { DataSource } from "apollo-datasource";
import { InMemoryLRUCache } from "apollo-server-caching";
import DataLoader from "dataloader";
import knex, { Knex } from "knex";
import knexTinyLogger from "knex-tiny-logger";
import { Knex as KnexOriginal } from "knex";

declare module "knex" {
  namespace Knex {
    interface QueryBuilder {
      cache<TRecord extends {}, TResult>(
        value: number
      ): KnexOriginal.QueryBuilder<TRecord, TResult>;
      batch<key = string | number, type = unknown>(
        key: string,
        callback: (key: string[], results: type) => {}
      ): DataLoader<key, type>;
    }
  }
}

const { DEBUG } = process.env;
let hasCache = false;
let hasLogger = false;
let hasBatch = false;

interface DataSourceKnex extends Knex {
  cache?: (ttl: number) => Knex.QueryBuilder;
  batch?: (key: readonly string[], result: unknown) => typeof DataLoader;
}

interface NewQueryBuilder {
  extend(
    methodName: string,
    fn: <TRecord extends {} = any, TResult = unknown[]>(
      this: Knex.QueryBuilder<TRecord, TResult>,
      ...args: any[]
    ) => Knex.QueryBuilder<TRecord, TResult> | DataLoader<string, unknown>
  ): void;
}

export type knexConfig = { client: string; connection: string | undefined };
export class BatchedSQLDataSource extends DataSource {
  cache: any;
  context: any;
  readKnex: DataSourceKnex;
  writeKnex: DataSourceKnex;

  constructor(
    readKnexConfig: knexConfig | DataSourceKnex,
    writeKnexConfig: knexConfig | DataSourceKnex
  ) {
    super();

    if (typeof readKnexConfig === "function") {
      this.readKnex = readKnexConfig;
    } else {
      this.readKnex = knex(readKnexConfig);
    }
    if (typeof writeKnexConfig === "function") {
      this.writeKnex = writeKnexConfig;
    } else {
      this.writeKnex = knex(writeKnexConfig);
    }

    this._extendKnex();
  }

  private _extendKnex() {
    const _this = this;
    const knexQueryBuilder = knex.QueryBuilder as NewQueryBuilder;
    if (!this.readKnex.cache && !hasCache) {
      knexQueryBuilder.extend("cache", function (ttl) {
        return _this.cacheQuery(this, ttl);
      });
      hasCache = true;
    }

    if (!this.readKnex.batch && !hasBatch) {
      knexQueryBuilder.extend(
        "batch",
        function (
          whereIn: string,
          callback: (keys: readonly string[], result: unknown) => unknown[]
        ) {
          return new DataLoader(async (keys: readonly string[]) => {
            const result: unknown = await this.whereIn(whereIn, keys);
            return callback(keys, result);
          });
        }
      );
      hasBatch = true;
    }
  }

  initialize(config: { context: any; cache: InMemoryLRUCache<string> }) {
    this.context = config.context;
    this.cache = config.cache || new InMemoryLRUCache();

    if (DEBUG && !hasLogger) {
      hasLogger = true; // Prevent duplicate loggers
      knexTinyLogger(this.readKnex); // Add a logging utility for debugging
      knexTinyLogger(this.writeKnex); // Add a logging utility for debugging
    }
  }

  cacheQuery(query: Promise<any>, ttl = 5) {
    const cacheKey = createHash("sha1")
      .update(query.toString())
      .digest("base64");

    return this.cache.get(cacheKey).then((entry: string) => {
      if (entry) return Promise.resolve(JSON.parse(entry));

      return query.then((rows) => {
        if (rows) this.cache.set(cacheKey, JSON.stringify(rows), { ttl });

        return Promise.resolve(rows);
      });
    });
  }
}
