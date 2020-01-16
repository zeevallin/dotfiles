"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorable_1 = require("./errorable");
errorable_1.Succeeded.prototype.map = function (fn) {
    return { succeeded: true, result: fn(this.result) };
};
//# sourceMappingURL=errorable-util.js.map