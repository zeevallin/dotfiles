'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const constants_1 = require("./constants");
class Global {
    static get Configuration() {
        return vscode.workspace.getConfiguration(constants_1.Constants.ExtensionId);
    }
}
Global.keytar = getCoreNodeModule('keytar');
Global.context = null;
Global.ResultManager = null;
exports.Global = Global;
function getCoreNodeModule(moduleName) {
    try {
        return require(`${vscode.env.appRoot}/node_modules.asar/${moduleName}`);
    }
    catch (err) { }
    try {
        return require(`${vscode.env.appRoot}/node_modules/${moduleName}`);
    }
    catch (err) { }
    return null;
}
//# sourceMappingURL=global.js.map