import { BatchDataSource } from "./lib/BatchKnexDataSource";
class SQLDataSource extends BatchDataSource {
    constructor(readKnexConfig, writeKnexConfig) {
        super(readKnexConfig, writeKnexConfig);
    }
}
export { SQLDataSource };
