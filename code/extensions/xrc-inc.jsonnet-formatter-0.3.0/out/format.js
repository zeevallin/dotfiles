'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const buffer_1 = require("buffer");
const diffUtils_1 = require("./diffUtils");
class Formatter {
    format(data) {
        return new Promise((resolve, reject) => {
            const bin = 'jsonnetfmt';
            // This uses the Google internal config per https://github.com/google/jsonnet/issues/359.
            const args = ['--indent', '2', '--max-blank-lines', '2', '--sort-imports', '--string-style', 's', '--comment-style', 's', '-'];
            let p = cp.spawn(bin, args);
            let stdout_ = [];
            let stderr_ = [];
            p.stdout.on('data', chunk => stdout_.push(chunk));
            p.stderr.on('data', chunk => stderr_.push(chunk));
            p.on('close', (code, signal) => {
                if (code != 0) {
                    reject(new Error(`Non-zero exit value ${code}: ${buffer_1.Buffer.concat(stderr_).toString()}`));
                    return;
                }
                resolve(buffer_1.Buffer.concat(stdout_).toString());
            });
            p.on('error', reject);
            p.stdin.end(data);
        });
    }
    getFormatEdits(document) {
        return __awaiter(this, void 0, void 0, function* () {
            let oldCode = document.getText();
            let newCode = yield this.format(oldCode);
            let filePatch = diffUtils_1.getEdits(document.fileName, oldCode, newCode);
            return filePatch.edits.map(edit => edit.apply());
        });
    }
}
exports.Formatter = Formatter;
class JsonnetDocumentFormattingEditProvider {
    constructor() {
        this.formatter = new Formatter();
    }
    provideDocumentFormattingEdits(document, options, token) {
        return this.formatter.getFormatEdits(document);
    }
}
exports.JsonnetDocumentFormattingEditProvider = JsonnetDocumentFormattingEditProvider;
//# sourceMappingURL=format.js.map