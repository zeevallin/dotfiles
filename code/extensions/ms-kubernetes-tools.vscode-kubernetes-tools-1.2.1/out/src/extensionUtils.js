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
const path = require("path");
const vscode = require("vscode");
const shell_1 = require("./shell");
/**
 * Install a vscode extension programmatically.
 *
 * @param extensionId the extension id.
 */
function installVscodeExtension(extensionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const vscodeCliPath = path.join(path.dirname(process.argv0), "bin", "code");
        const shellResult = yield shell_1.shell.exec(`"${vscodeCliPath}" --install-extension ${extensionId}`);
        if (shellResult && shellResult.code === 0) {
            const answer = yield vscode.window.showInformationMessage(`Extension '${extensionId}' was successfully installed. Reload to enable it.`, "Reload Now");
            if (answer === "Reload Now") {
                yield vscode.commands.executeCommand("workbench.action.reloadWindow");
                return true;
            }
        }
        return false;
    });
}
exports.installVscodeExtension = installVscodeExtension;
function isNonEmptyArray(value) {
    if (value && value.length) {
        return true;
    }
    return false;
}
exports.isNonEmptyArray = isNonEmptyArray;
//# sourceMappingURL=extensionUtils.js.map