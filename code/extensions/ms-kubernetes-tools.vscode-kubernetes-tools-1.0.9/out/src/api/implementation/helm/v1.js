"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helm_exec_1 = require("../../../helm.exec");
function impl() {
    return new HelmV1Impl();
}
exports.impl = impl;
class HelmV1Impl {
    invokeCommand(command) {
        return helm_exec_1.helmExecAsync(command);
    }
}
//# sourceMappingURL=v1.js.map