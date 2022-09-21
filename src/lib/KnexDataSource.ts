import { DataSource } from "apollo-datasource";
import knex from "knex";
import { DataSourceKnex, knexConfig } from "../typings";

class KnexDataSource extends DataSource {
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
  }
}

export { KnexDataSource };
