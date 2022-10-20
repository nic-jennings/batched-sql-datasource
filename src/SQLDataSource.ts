import { createHash } from "crypto";
import DataLoader from "dataloader";
import knex, { Knex } from "knex";
import knexTinyLogger from "knex-tiny-logger";
import { Knex as KnexOriginal } from "knex";
import { InMemoryLRUCache, KeyValueCache } from "@apollo/utils.keyvaluecache";

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
      batch(callback: BatchCallback): BatchedLoader;
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

export interface BatchedLoader<T = unknown, K = unknown>
  extends DataLoader<T, K> {}

interface NewQueryBuilder {
  extend(
    methodName: string,
    fn: <TRecord extends {} = any, TResult = unknown[]>(
      this: Knex.QueryBuilder<TRecord, TResult>,
      ...args: any[]
    ) => Knex.QueryBuilder<TRecord, TResult> | BatchedLoader
  ): void;
}
export type BatchedSQLDataSourceProps<Context = any> = {
  knexConfig: Knex.KnexConfig | DataSourceKnex;
  writeKnexConfig?: Knex.KnexConfig | DataSourceKnex;
  cache?: KeyValueCache;
  context?: Context;
};
export class BatchedSQLDataSource {
  cache: BatchedSQLDataSourceProps["cache"];
  context: BatchedSQLDataSourceProps["context"];
  db: {
    query: DataSourceKnex;
    write: DataSourceKnex;
  };

  constructor(config: BatchedSQLDataSourceProps) {
    this.cache = config.cache ? config.cache : new InMemoryLRUCache();
    this.context = config.context;

    const { queryConnection, writeConnection } =
      this._connectToDatabase(config);

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
        return _this._cacheQuery(this, ttl);
      });
      hasCache = true;
    }

    if (!this.db.query.batch && !hasBatch) {
      knexQueryBuilder.extend("batch", function (callback: Knex.BatchCallback) {
        const query: Knex.QueryBuilder = this.clone();
        return _this._batchQuery(query, callback);
      });
      hasBatch = true;
    }
  }

  private _connectToDatabase(config: BatchedSQLDataSourceProps) {
    let seperateInstances = true;
    const queryConnection =
      typeof config.knexConfig === "function"
        ? config.knexConfig
        : knex(config.knexConfig);

    if (!config.writeKnexConfig) {
      seperateInstances = false;
      config.writeKnexConfig = queryConnection;
    }

    const writeConnection =
      typeof config.writeKnexConfig === "function"
        ? config.writeKnexConfig
        : knex(config.writeKnexConfig);

    if (DEBUG && !hasLogger) {
      hasLogger = true; // Prevent duplicate loggers
      knexTinyLogger(queryConnection); // Add a logging utility for debugging
      if (seperateInstances) knexTinyLogger(writeConnection); // Add a logging utility for debugging
    }

    return { queryConnection, writeConnection };
  }

  private _batchQuery(
    query: Knex.QueryBuilder,
    callback: Knex.BatchCallback
  ): BatchedLoader {
    return new DataLoader((keys) => callback(query, keys));
  }

  private _cacheQuery(query: Promise<any>, ttl = 5): Knex.QueryBuilder {
    const cacheKey = createHash("sha1")
      .update(query.toString())
      .digest("base64");

    return this.cache?.get(cacheKey).then((entry: string | undefined) => {
      if (entry) return Promise.resolve(JSON.parse(entry));

      return query.then((rows) => {
        if (rows) this.cache?.set(cacheKey, JSON.stringify(rows), { ttl });

        return Promise.resolve(rows);
      });
    }) as Knex.QueryBuilder;
  }
}
