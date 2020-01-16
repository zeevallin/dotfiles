"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
let EXTENSION_CONTEXT = null;
function setAssetContext(context) {
    EXTENSION_CONTEXT = context;
}
exports.setAssetContext = setAssetContext;
function assetPath(relativePath) {
    if (EXTENSION_CONTEXT) { // which it always should be
        return EXTENSION_CONTEXT.asAbsolutePath(relativePath);
    }
    const absolutePath = path.join(__dirname, '..', relativePath);
    return absolutePath;
}
exports.assetPath = assetPath;
function assetUri(relativePath) {
    return vscode_1.Uri.file(assetPath(relativePath));
}
exports.assetUri = assetUri;
//# sourceMappingURL=assets.js.map