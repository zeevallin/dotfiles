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
const yaml = require("js-yaml");
const jsonalike_symbol_provider_1 = require("../../yaml-support/jsonalike-symbol-provider");
const jsonhierarchicalsymbolprovider_1 = require("../json/jsonhierarchicalsymbolprovider");
const jsonalikeYamlSymboliser = new jsonalike_symbol_provider_1.JsonALikeYamlDocumentSymbolProvider();
const jsonSymboliser = new jsonhierarchicalsymbolprovider_1.JsonHierarchicalDocumentSymbolProvider();
function expose(impl) {
    return new StandardLinter(impl);
}
exports.expose = expose;
class StandardLinter {
    constructor(impl) {
        this.impl = impl;
    }
    name() {
        return this.impl.name();
    }
    lint(document) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                switch (document.languageId) {
                    case 'json':
                        return yield this.impl.lint(document, jsonSyntax);
                    case 'yaml':
                        return yield this.impl.lint(document, yamlSyntax);
                    default:
                        // TODO: do we need to do Helm?
                        return [];
                }
            }
            catch (_a) {
                return [];
            }
        });
    }
}
const jsonSyntax = {
    load(text) { return [JSON.parse(text)]; },
    symbolise(document) {
        return __awaiter(this, void 0, void 0, function* () { return yield jsonSymboliser.provideDocumentSymbols(document, new vscode.CancellationTokenSource().token); });
    }
};
const yamlSyntax = {
    load(text) { return yaml.safeLoadAll(text); },
    symbolise(document) {
        return __awaiter(this, void 0, void 0, function* () { return yield jsonalikeYamlSymboliser.provideDocumentSymbols(document, new vscode.CancellationTokenSource().token); });
    }
};
//# sourceMappingURL=linter.impl.js.map