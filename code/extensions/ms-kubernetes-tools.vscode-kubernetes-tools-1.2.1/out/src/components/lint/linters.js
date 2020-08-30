"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const linter_impl_1 = require("./linter.impl");
const resourcelimits_1 = require("./resourcelimits");
exports.linters = [
    new resourcelimits_1.ResourceLimitsLinter()
].map(linter_impl_1.expose);
//# sourceMappingURL=linters.js.map