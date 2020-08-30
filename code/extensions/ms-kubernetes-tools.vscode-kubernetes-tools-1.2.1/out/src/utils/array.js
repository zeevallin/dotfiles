"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function flatten(...arrays) {
    return Array.of().concat(...arrays);
}
exports.flatten = flatten;
function definedOf(...items) {
    return items.filter((i) => i !== undefined).map((i) => i);
}
exports.definedOf = definedOf;
function choose(fn) {
    return this.map(fn).filter((u) => u !== undefined).map((u) => u);
}
if (!Array.prototype.choose) {
    Object.defineProperty(Array.prototype, 'choose', {
        enumerable: false,
        value: choose
    });
}
//# sourceMappingURL=array.js.map