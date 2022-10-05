import { createHash } from "crypto";
import { DataSource } from "apollo-datasource";
import { InMemoryLRUCache } from "apollo-server-caching";
import DataLoader from "dataloader";
import knex, { Knex } from "knex";
import knexTinyLogger from "knex-tiny-logger";
import { Knex as KnexOriginal } from "knex";

declare module "knex" {
  namespace Knex {
    type KnexConfig = { client: string; connection: string | undefined };

    type BatchCallback = (
      query: Knex.QueryBuilder,
      keys: readonly any[]
    ) => Promise<any[]>;
    interface QueryBuilder {
      cache<TRecord extends {}, TResult>(
        value: number
      ): KnexOriginal.QueryBuilder<TRecord, TResult>;
      batch(callback: BatchCallback): BatchedLoader<unknown, any[]>;
    }
  }
}

const { DEBUG } = process.env;
let hasCache = false;
let hasLogger = false;
let hasBatch = false;

export interface DataSourceKnex extends Knex {
  cache?: Knex.QueryBuilder["cache"];
  batch?: Knex.QueryBuilder["batch"];
}

export interface BatchedLoader<T, K> extends DataLoader<T, K> {}

interface NewQueryBuilder {
  extend(
    methodName: string,
    fn: <TRecord extends {} = any, TResult = unknown[]>(
      this: Knex.QueryBuilder<TRecord, TResult>,
      ...args: any[]
    ) => Knex.QueryBuilder<TRecord, TResult> | BatchedLoader<unknown, any[]>
  ): void;
}

export class BatchedSQLDataSource extends DataSource {
  cache: any;
  context: any;
  db: {
    query: DataSourceKnex;
    write: DataSourceKnex;
  };
  seperateInstances: boolean;

  constructor(
    readKnexConfig: Knex.KnexConfig | DataSourceKnex,
    writeKnexConfig?: Knex.KnexConfig | DataSourceKnex
  ) {
    super();
    this.seperateInstances = true;
    const queryConnection =
      typeof readKnexConfig === "function"
        ? readKnexConfig
        : knex(readKnexConfig);

    if (!writeKnexConfig) {
      this.seperateInstances = false;
      writeKnexConfig = queryConnection;
    }

    const writeConnection =
      typeof writeKnexConfig === "function"
        ? writeKnexConfig
        : knex(writeKnexConfig);

    this.db = {
      query: queryConnection,
      write: writeConnection,
    };

    this._extendKnex();
  }

  private _extendKnex() {
    const _this = this;
    const knexQueryBuilder = knex.QueryBuilder as NewQueryBuilder;
    if (!this.db.query.cache && !hasCache) {
      knexQueryBuilder.extend("cache", function (ttl) {
        return _this.cacheQuery(this, ttl);
      });
      hasCache = true;
    }

    if (!this.db.query.batch && !hasBatch) {
      knexQueryBuilder.extend("batch", function (callback: Knex.BatchCallback) {
        const query: Knex.QueryBuilder = this.clone();
        return _this.batchQuery(query, callback);
      });
      hasBatch = true;
    }
  }

  batchQuery(
    query: Knex.QueryBuilder,
    callback: Knex.BatchCallback
  ): BatchedLoader<unknown, any[]> {
    return new DataLoader((keys) => callback(query, keys));
  }

  initialize(config: { context: any; cache: InMemoryLRUCache<string> }) {
    this.context = config.context;
    this.cache = config.cache || new InMemoryLRUCache();

    if (DEBUG && !hasLogger) {
      hasLogger = true; // Prevent duplicate loggers
      knexTinyLogger(this.db.query); // Add a logging utility for debugging
      if (this.seperateInstances) knexTinyLogger(this.db.write); // Add a logging utility for debugging
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
