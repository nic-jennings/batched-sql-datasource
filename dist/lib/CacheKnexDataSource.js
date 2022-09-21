import { createHash } from "crypto";
import { InMemoryLRUCache } from "apollo-server-caching";
import knex from "knex";
import knexTinyLogger from "knex-tiny-logger";
import { KnexDataSource } from "./KnexDataSource";
const { DEBUG } = process.env;
let hasCache = false;
let hasLogger = false;
class CacheKnexDataSource extends KnexDataSource {
    constructor(readKnexConfig, writeKnexConfig) {
        super(readKnexConfig, writeKnexConfig);
        this._extendKnex();
    }
    _extendKnex() {
        const _this = this;
        const knexQueryBuilder = knex.QueryBuilder;
        if (!this.readKnex.cache && !hasCache) {
            knexQueryBuilder.extend("cache", function (ttl) {
                return _this.cacheQuery(this, ttl);
            });
            hasCache = true;
        }
    }
    initialize(config) {
        this.context = config.context;
        this.cache = config.cache || new InMemoryLRUCache();
        if (DEBUG && !hasLogger) {
            hasLogger = true; // Prevent duplicate loggers
            knexTinyLogger(this.readKnex); // Add a logging utility for debugging
            knexTinyLogger(this.writeKnex); // Add a logging utility for debugging
        }
    }
    cacheQuery(query, ttl = 5) {
        const cacheKey = createHash("sha1")
            .update(query.toString())
            .digest("base64");
        return this.cache.get(cacheKey).then((entry) => {
            if (entry)
                return Promise.resolve(JSON.parse(entry));
            return query.then((rows) => {
                if (rows)
                    this.cache.set(cacheKey, JSON.stringify(rows), { ttl });
                return Promise.resolve(rows);
            });
        });
    }
}
export { CacheKnexDataSource };