"use strict";
/* eslint-disable camelcase */
Object.defineProperty(exports, "__esModule", { value: true });
const v1 = require("./v1");
const v1_1 = require("./v1_1");
const apiutils_1 = require("../apiutils");
function apiVersion(explorer, version) {
    switch (version) {
        case "v1": return apiutils_1.available(v1.impl(explorer));
        case "v1_1": return apiutils_1.available(v1_1.impl(explorer));
        default: return apiutils_1.versionUnknown;
    }
}
exports.apiVersion = apiVersion;
//# sourceMappingURL=versions.js.map