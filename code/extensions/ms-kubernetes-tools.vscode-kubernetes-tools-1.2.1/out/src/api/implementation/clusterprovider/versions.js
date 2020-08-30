"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const v1 = require("./v1");
const apiutils_1 = require("../apiutils");
function apiVersion(registry, version) {
    switch (version) {
        case "v1": return apiutils_1.available(v1.impl(registry));
        default: return apiutils_1.versionUnknown;
    }
}
exports.apiVersion = apiVersion;
//# sourceMappingURL=versions.js.map