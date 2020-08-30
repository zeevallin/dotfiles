"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
let _copy;
switch (process.platform) {
    case "darwin":
        _copy = { command: 'pbcopy', args: [] };
        break;
    case "win32":
        _copy = { command: 'clip', args: [] };
        break;
    case "linux":
        _copy = { command: 'xclip', args: ["-selection", "clipboard"] };
        break;
    default:
        throw new Error("Unknown platform: '" + process.platform + "'.");
}
exports.copy = function (text, callback) {
    const child = child_process_1.spawn(_copy.command, _copy.args);
    child.stdin.end(text);
    callback();
};
//# sourceMappingURL=clipboard.js.map