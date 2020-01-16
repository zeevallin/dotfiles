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
const EasyXml = require("easyxml");
const csv = require("csv-stringify");
const global_1 = require("../common/global");
class saveResultCommand extends baseCommand_1.default {
    run(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = global_1.Global.ResultManager.activeWinResults;
            if (!results) {
                vscode.window.showWarningMessage('Unable to save data - dataset not found');
                return;
            }
            let resultIndex = 0;
            if (results.length > 1) {
                let tables = [];
                for (let i = 1; i <= results.length; i++) {
                    tables.push({
                        label: 'Table ' + i,
                        index: i - 1
                    });
                }
                let selected = yield vscode.window.showQuickPick(tables);
                if (!selected)
                    return;
                resultIndex = selected.index;
            }
            if (results[resultIndex].rowCount < 1) {
                vscode.window.showWarningMessage('Unable to save data - table has no data');
                return;
            }
            let formats = ['json', 'xml', 'csv'];
            let selFormat = yield vscode.window.showQuickPick(formats);
            if (!selFormat)
                return;
            let fileData = null;
            if (selFormat === 'json') {
                let data = transformResult(results[resultIndex]);
                fileData = JSON.stringify(data, null, 2);
            }
            else if (selFormat === 'xml') {
                var ser = new EasyXml({
                    singularize: true,
                    rootElement: 'results',
                    dateFormat: 'ISO',
                    manifest: true
                });
                let data = transformResult(results[resultIndex]);
                fileData = ser.render(data);
            }
            else if (selFormat === 'csv') {
                let columns = {};
                results[resultIndex].fields.forEach(field => {
                    columns[field.name] = field.name;
                });
                let csvError = false;
                fileData = yield new Promise((resolve) => {
                    csv(results[resultIndex].rows, {
                        header: true,
                        columns: columns,
                        formatters: {
                            bool: (value) => {
                                return value ? 'true' : 'false';
                            }
                        }
                    }, (err, output) => {
                        if (err) {
                            csvError = err;
                            resolve('');
                            return;
                        }
                        resolve(output);
                    });
                });
            }
            try {
                let doc = yield vscode.workspace.openTextDocument({ language: selFormat });
                let editor = yield vscode.window.showTextDocument(doc, 1, false);
                let result = yield editor.edit(edit => edit.insert(new vscode.Position(0, 0), fileData));
                if (!result)
                    vscode.window.showErrorMessage('Error occurred opening content in editor');
            }
            catch (err) {
                vscode.window.showErrorMessage(err);
            }
        });
    }
}
exports.saveResultCommand = saveResultCommand;
function transformResult(result) {
    let trxFunc = transformData.bind(null, result.fields);
    return result.rows.map(trxFunc);
}
function transformData(fields, row) {
    let newRow = {};
    let fieldCounts = {};
    fields.forEach((field, idx) => {
        if (fieldCounts.hasOwnProperty(field)) {
            fieldCounts[field.name]++;
            newRow[field.name + '_' + fieldCounts[field.name]] = row[idx];
        }
        else {
            fieldCounts[field.name] = 0;
            newRow[field.name] = row[idx];
        }
    });
    return newRow;
}
//# sourceMappingURL=saveResult.js.map