"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isObservable(s) {
    return !!(s.subscribe);
}
exports.isObservable = isObservable;
function isThenable(s) {
    return !!(s.then);
}
exports.isThenable = isThenable;
//# sourceMappingURL=observable.js.map