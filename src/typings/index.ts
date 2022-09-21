import DataLoader from "dataloader";
import { Knex } from "knex";

export interface DataSourceKnex extends Knex {
  cache?: (ttl: number) => Knex.QueryBuilder;
  batch?: (key: readonly string[], result: unknown) => typeof DataLoader;
}

export type knexConfig = { client: string; connection: string | undefined };

export interface NewQueryBuilder {
  extend(
    methodName: string,
    fn: <TRecord extends {} = any, TResult = unknown[]>(
      this: Knex.QueryBuilder<TRecord, TResult>,
      ...args: any[]
    ) => Knex.QueryBuilder<TRecord, TResult> | DataLoader<string, unknown>
  ): void;
}
