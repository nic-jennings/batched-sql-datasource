import { BatchDataSource } from "./lib/BatchKnexDataSource";
import { DataSourceKnex, knexConfig } from "./typings";
import DataLoader from "dataloader";
import { Knex as KnexOriginal } from "knex";

declare module "knex" {
  namespace Knex {
    interface QueryBuilder {
      cache<TRecord extends {} = any, TResult = any>(
        value: number
      ): KnexOriginal.QueryBuilder<TRecord, TResult>;
      batch<key = string | number, type = unknown>(
        key: string,
        callback: (key: string[], results: type) => {}
      ): DataLoader<key, type>;
    }
  }
}

declare class SQLDataSource extends BatchDataSource {
  constructor(
    readKnexConfig: knexConfig | DataSourceKnex,
    writeKnexConfig: knexConfig | DataSourceKnex
  );
}
export { SQLDataSource };
