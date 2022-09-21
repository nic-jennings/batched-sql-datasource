var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import DataLoader from "dataloader";
import knex from "knex";
import { CacheKnexDataSource } from "./CacheKnexDataSource";
let hasBatch = false;
class BatchDataSource extends CacheKnexDataSource {
    constructor(readKnexConfig, writeKnexConfig) {
        super(readKnexConfig, writeKnexConfig);
        this._batchKnex();
    }
    _batchKnex() {
        const knexQueryBuilder = knex.QueryBuilder;
        if (!this.readKnex.batch && !hasBatch) {
            knexQueryBuilder.extend("batch", function (whereIn, callback) {
                return new DataLoader((keys) => __awaiter(this, void 0, void 0, function* () {
                    const result = (yield this.whereIn(whereIn, keys));
                    return callback(keys, result);
                }));
            });
            hasBatch = true;
        }
    }
}
export { BatchDataSource };
