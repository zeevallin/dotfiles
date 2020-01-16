'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class BaseCommand {
    constructor(context) {
        let commandName = this.constructor.name.replace(/Command$/, '');
        let disposable = vscode.commands.registerCommand('vscode-postgres.' + commandName, this.run, this);
        context.subscriptions.push(disposable);
    }
}
exports.default = BaseCommand;
//# sourceMappingURL=baseCommand.js.map