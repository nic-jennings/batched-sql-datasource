import { BatchDataSource } from "./lib/BatchKnexDataSource";
import { DataSourceKnex, knexConfig } from "./typings";

class SQLDataSource extends BatchDataSource {
  constructor(
    readKnexConfig: knexConfig | DataSourceKnex,
    writeKnexConfig: knexConfig | DataSourceKnex
  ) {
    super(readKnexConfig, writeKnexConfig);
  }
}

export { SQLDataSource };
