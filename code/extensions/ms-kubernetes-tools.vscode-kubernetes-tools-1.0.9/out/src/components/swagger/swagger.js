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
const download = require("../../components/download/download");
const errorable_1 = require("../../errorable");
const proxy_1 = require("../kubectl/proxy");
const fs_1 = require("../../fs");
function getClusterSwagger(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const proxyResult = yield proxy_1.proxy(kubectl, 'random');
        if (errorable_1.failed(proxyResult)) {
            return proxyResult;
        }
        const proxySession = proxyResult.result;
        try {
            const uri = `http://localhost:${proxySession.port}/openapi/v2`; // TODO: /swagger.json for server version <1.10
            const swaggerDownload = yield download.toTempFile(uri);
            if (errorable_1.failed(swaggerDownload)) {
                return swaggerDownload;
            }
            const swaggerTempFile = swaggerDownload.result;
            try {
                const swaggerText = yield fs_1.fs.readTextFile(swaggerTempFile);
                const swagger = JSON.parse(swaggerText);
                return { succeeded: true, result: swagger };
            }
            finally {
                yield fs_1.fs.unlinkAsync(swaggerTempFile);
            }
        }
        finally {
            proxySession.dispose();
        }
    });
}
exports.getClusterSwagger = getClusterSwagger;
//# sourceMappingURL=swagger.js.map