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
const activeValueTracker = require("./active-value-tracker");
const kubectlUtils_1 = require("../../kubectlUtils");
const ACTIVE_CONTEXT_POLL_INTERVAL_MS = 60000; // Hopefully people in the extension will mostly change contexts through the extension, and if not they may have to make do with a delay
function create(kubectl) {
    return activeValueTracker.create(() => getActiveContextName(kubectl), ACTIVE_CONTEXT_POLL_INTERVAL_MS);
}
exports.create = create;
function getActiveContextName(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentContext = yield kubectlUtils_1.getCurrentContext(kubectl, { silent: true });
        if (!currentContext) {
            return null;
        }
        return currentContext.contextName;
    });
}
//# sourceMappingURL=active-context-tracker.js.map