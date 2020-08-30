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
const vscode = require("vscode");
const jsonalike_symbol_provider_1 = require("../../yaml-support/jsonalike-symbol-provider");
const jsonhierarchicalsymbolprovider_1 = require("../json/jsonhierarchicalsymbolprovider");
const jsonalikeYamlSymboliser = new jsonalike_symbol_provider_1.JsonALikeYamlDocumentSymbolProvider();
const jsonSymboliser = new jsonhierarchicalsymbolprovider_1.JsonHierarchicalDocumentSymbolProvider();
function parseJSON(document) {
    return __awaiter(this, void 0, void 0, function* () {
        const symbols = yield jsonSymboliser.provideDocumentSymbols(document, new vscode.CancellationTokenSource().token);
        return toSyntaxTree(symbols);
    });
}
exports.parseJSON = parseJSON;
function parseYAML(document) {
    return __awaiter(this, void 0, void 0, function* () {
        const symbols = yield jsonalikeYamlSymboliser.provideDocumentSymbols(document, new vscode.CancellationTokenSource().token);
        return toSyntaxTree(symbols);
    });
}
exports.parseYAML = parseYAML;
function toSyntaxTree(symbols) {
    if (!symbols) {
        return [];
    }
    for (const s of symbols) {
        console.log(s);
    }
    return [];
}
//# sourceMappingURL=parsers.js.map