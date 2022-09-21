import { DataSource } from "apollo-datasource";
import knex from "knex";
class KnexDataSource extends DataSource {
    constructor(readKnexConfig, writeKnexConfig) {
        super();
        if (typeof readKnexConfig === "function") {
            this.readKnex = readKnexConfig;
        }
        else {
            this.readKnex = knex(readKnexConfig);
        }
        if (typeof writeKnexConfig === "function") {
            this.writeKnex = writeKnexConfig;
        }
        else {
            this.writeKnex = knex(writeKnexConfig);
        }
    }
}
export { KnexDataSource };
