"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const vscode = require("vscode");
class Reporter extends vscode.Disposable {
    constructor(ctx) {
        super(() => { if (exports.reporter) {
            exports.reporter.dispose();
        } });
        const packageInfo = getPackageInfo(ctx);
        exports.reporter = packageInfo && new vscode_extension_telemetry_1.default(packageInfo.name, packageInfo.version, packageInfo.aiKey);
    }
}
exports.Reporter = Reporter;
function getPackageInfo(context) {
    const extensionPackage = require(context.asAbsolutePath('./package.json'));
    if (extensionPackage) {
        return {
            name: extensionPackage.name,
            version: extensionPackage.version,
            aiKey: extensionPackage.aiKey
        };
    }
    return undefined;
}
//# sourceMappingURL=telemetry.js.map