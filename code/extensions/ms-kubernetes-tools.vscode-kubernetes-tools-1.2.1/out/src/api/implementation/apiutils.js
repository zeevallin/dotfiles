"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function available(api) {
    return { available: true, api: api };
}
exports.available = available;
exports.versionUnknown = { available: false, reason: "version-unknown" };
exports.versionRemoved = { available: false, reason: "version-removed" };
//# sourceMappingURL=apiutils.js.map