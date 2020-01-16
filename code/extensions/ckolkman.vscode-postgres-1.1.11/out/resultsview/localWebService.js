"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const global_1 = require("../common/global");
class LocalWebService {
    constructor() {
        this.app = express();
        this.server = http.createServer();
        this._htmlContentLocation = 'out/resultsview/content';
        this._staticContentPath = path.join(global_1.Global.context.extensionPath, this._htmlContentLocation);
        this.app.use(cors());
        this.app.use(express.static(this._staticContentPath));
        this.server.on('request', this.app);
    }
    get serviceUrl() {
        return `http://localhost:${this._servicePort}`;
    }
    start() {
        this._servicePort = this.server.listen(0).address().port;
    }
    stop() {
        this.server.close();
    }
}
exports.default = LocalWebService;
//# sourceMappingURL=localWebService.js.map