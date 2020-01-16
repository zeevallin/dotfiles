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
class JsonHierarchicalDocumentSymbolProvider {
    provideDocumentSymbols(document, _token) {
        return this.provideDocumentSymbolsImpl(document);
    }
    provideDocumentSymbolsImpl(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const sis = yield vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
            if (sis && sis.length) {
                const hnSymbols = hierarchicalContainers(sis);
                return hnSymbols;
            }
            return [];
        });
    }
}
exports.JsonHierarchicalDocumentSymbolProvider = JsonHierarchicalDocumentSymbolProvider;
function hierarchicalContainers(symbols) {
    return symbols.map((symbol) => {
        const containingSymbols = symbols.filter((s) => contains(s, symbol));
        const hierarchisedContainerName = makeHierarchicalContainerName(symbol, containingSymbols);
        const s = new vscode.SymbolInformation(symbol.name, symbol.kind, hierarchisedContainerName, symbol.location);
        return s;
    });
}
function contains(s, symbol) {
    return (s !== symbol) && s.location.range.contains(symbol.location.range);
}
function makeHierarchicalContainerName(symbol, symbols) {
    if (!symbol.containerName) {
        return '';
    }
    const immediateContainer = findImmediateContainer(symbol, symbols);
    if (!immediateContainer) {
        return symbol.containerName;
    }
    const immediateContainerHN = makeHierarchicalContainerName(immediateContainer, symbols.filter((s) => contains(s, immediateContainer)));
    if (immediateContainerHN === '') {
        return symbol.containerName;
    }
    if (symbol.containerName === '0') {
        return immediateContainerHN;
    }
    return `${immediateContainerHN}.${symbol.containerName}`;
}
function findImmediateContainer(symbol, symbols) {
    const candidates = symbols.filter((s) => s.name === symbol.containerName);
    if (candidates.length === 1) {
        return candidates[0];
    }
    if (candidates.length === 0) {
        return undefined;
    }
    return mostContained(candidates);
}
function mostContained(symbols) {
    let candidate = symbols[0];
    for (const s of symbols) {
        if (contains(candidate, s)) {
            candidate = s;
        }
    }
    return candidate;
}
//# sourceMappingURL=jsonhierarchicalsymbolprovider.js.map