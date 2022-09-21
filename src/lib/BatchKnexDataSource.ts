import DataLoader from "dataloader";
import knex from "knex";
import { DataSourceKnex, knexConfig, NewQueryBuilder } from "../typings";
import { CacheKnexDataSource } from "./CacheKnexDataSource";

let hasBatch = false;

class BatchDataSource extends CacheKnexDataSource {
  constructor(
    readKnexConfig: knexConfig | DataSourceKnex,
    writeKnexConfig: knexConfig | DataSourceKnex
  ) {
    super(readKnexConfig, writeKnexConfig);

    this._batchKnex();
  }

  private _batchKnex() {
    const knexQueryBuilder = knex.QueryBuilder as NewQueryBuilder;

    if (!this.readKnex.batch && !hasBatch) {
      knexQueryBuilder.extend(
        "batch",
        function (
          whereIn: string,
          callback: (keys: readonly string[], result: unknown) => unknown[]
        ) {
          return new DataLoader(async (keys: readonly string[]) => {
            const result = (await this.whereIn(whereIn, keys)) as unknown;
            return callback(keys, result);
          });
        }
      );
      hasBatch = true;
    }
  }
}

export { BatchDataSource };
