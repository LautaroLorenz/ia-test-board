"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.initDatabase = initDatabase;
const fs = require("fs");
const path = require("path");
const knex_1 = require("knex");
const knexConfig = require('./knexfile');
let dbInstance = null;
function ensureDataDirectory() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}
function getDb() {
    if (!dbInstance) {
        ensureDataDirectory();
        dbInstance = (0, knex_1.default)(knexConfig);
    }
    return dbInstance;
}
function initDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = getDb();
        yield db.migrate.latest();
    });
}
//# sourceMappingURL=connection.js.map