"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function succeeded(e) {
    return e.succeeded;
}
exports.succeeded = succeeded;
function failed(e) {
    return !e.succeeded;
}
exports.failed = failed;
var Errorable;
(function (Errorable) {
    function succeeded(e) {
        return e.succeeded;
    }
    Errorable.succeeded = succeeded;
    function failed(e) {
        return !e.succeeded;
    }
    Errorable.failed = failed;
})(Errorable = exports.Errorable || (exports.Errorable = {}));
//# sourceMappingURL=errorable.js.map