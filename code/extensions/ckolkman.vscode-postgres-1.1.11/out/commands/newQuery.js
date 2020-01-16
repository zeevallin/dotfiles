"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const baseCommand_1 = require("../common/baseCommand");
const vscode = require("vscode");
const editorState_1 = require("../common/editorState");
'use strict';
class newQueryCommand extends baseCommand_1.default {
    run(treeNode) {
        return __awaiter(this, void 0, void 0, function* () {
            // should have a connection object on it
            const textDocument = yield vscode.workspace.openTextDocument({ content: '', language: 'postgres' });
            yield vscode.window.showTextDocument(textDocument);
            if (treeNode && treeNode.connection)
                editorState_1.EditorState.connection = treeNode.connection;
        });
    }
}
exports.newQueryCommand = newQueryCommand;
//# sourceMappingURL=newQuery.js.map