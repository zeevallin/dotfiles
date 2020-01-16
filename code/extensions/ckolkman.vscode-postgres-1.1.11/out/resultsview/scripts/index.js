"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = require("./settings");
const vscode = acquireVsCodeApi();
// Set VS Code state
const state = settings_1.getData('data-state');
vscode.setState(state);
//# sourceMappingURL=index.js.map