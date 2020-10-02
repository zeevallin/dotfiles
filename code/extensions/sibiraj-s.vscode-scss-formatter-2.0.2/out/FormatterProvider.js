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
const prettier_1 = require("prettier");
const vscode_1 = require("vscode");
const utils_1 = require("./utils");
class SCSSFormatter {
    constructor(loggingService, statusbarService) {
        this.loggingService = loggingService;
        this.statusbarService = statusbarService;
    }
    // add filepath to the output message
    addFilePathToMesssage(message, fileName) {
        const lines = message.split('\n');
        if (lines.length > 0) {
            lines[0] = lines[0].replace(/(\d*):(\d*)/g, `${fileName}:$1:$2`);
            return lines.join('\n');
        }
        return message;
    }
    /**
   * Runs prettier and updates the status on the statusbarItem
   *
   * @param cb callback function to execute prettier
   * @param rawDocumentText unformatted source document
   * @param fileName name/path of the file formatted
   *
   * @returns {string} string with either formatted/raw document
   */
    safeExecution(cb, rawDocumentText, fileName) {
        try {
            const returnValue = cb();
            this.loggingService.addToOutput(`${fileName} : Formatted Successfully`);
            this.statusbarService.updateStatusBarItem(`${utils_1.EXTENSION_NAME}: $(check)`);
            return returnValue;
        }
        catch (err) {
            this.loggingService.addToOutput(this.addFilePathToMesssage(err.message, fileName));
            this.statusbarService.updateStatusBarItem(`${utils_1.EXTENSION_NAME}: $(x)`);
            return rawDocumentText;
        }
    }
    getPrettierOptions(document, options) {
        const wsConfig = vscode_1.workspace.getConfiguration('scssFormatter');
        const { languageId } = document;
        return Object.assign(Object.assign({}, wsConfig), { tabWidth: options.tabSize, useTabs: !options.insertSpaces, parser: languageId });
    }
    // get range for the current document
    fullDocumentRange(document) {
        const rangeStart = document.lineAt(0).range.start;
        const rangeEnd = document.lineAt(document.lineCount - 1).range.end;
        return new vscode_1.Range(rangeStart, rangeEnd);
    }
    formatDocument(document, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const rawDocumentText = document.getText();
            const { fileName } = document;
            const prettierOptions = this.getPrettierOptions(document, options);
            return this.safeExecution(() => prettier_1.format(rawDocumentText, prettierOptions), rawDocumentText, fileName);
        });
    }
    provideDocumentFormattingEdits(document, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const formattedDocument = yield this.formatDocument(document, options);
            return [vscode_1.TextEdit.replace(this.fullDocumentRange(document), formattedDocument)];
        });
    }
}
exports.default = SCSSFormatter;
//# sourceMappingURL=FormatterProvider.js.map