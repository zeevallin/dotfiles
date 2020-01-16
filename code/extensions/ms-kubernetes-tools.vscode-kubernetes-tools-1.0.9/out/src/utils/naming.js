"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
function timestampText() {
    return moment().format('YYYYMMDD-HHmmss'); // Not caring much about UTC vs local for naming purposes
}
exports.timestampText = timestampText;
//# sourceMappingURL=naming.js.map