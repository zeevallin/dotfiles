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
const kp = require("k8s-manifest-parser");
const linters_1 = require("../../../components/lint/linters");
const never_1 = require("../../../utils/never");
const array_1 = require("../../../utils/array");
const lintedit = require("../../../components/lint/edit");
function impl(refresh) {
    return new DiagnosticsV1Impl(refresh);
}
exports.impl = impl;
class DiagnosticsV1Impl {
    constructor(refresh) {
        this.refresh = refresh;
    }
    registerDiagnosticsContributor(diagnosticContributor) {
        const linter = asLinter(diagnosticContributor);
        linters_1.registerLinter(linter, this.refresh);
    }
    registerDiagnosticsContributor2(diagnosticContributor) {
        const linter = asLinter2(diagnosticContributor);
        linters_1.registerLinter(linter, this.refresh);
    }
}
function asLinter(diagnosticContributor) {
    function name() { return diagnosticContributor.name; }
    function lint(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const diagnostics = yield diagnosticContributor.analyse(document);
            if (Array.isArray(diagnostics)) {
                return diagnostics;
            }
            return Array.of(...diagnostics);
        });
    }
    function codeActions(document, range, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!diagnosticContributor.codeActions) {
                return [];
            }
            return yield diagnosticContributor.codeActions(document, range, context);
        });
    }
    return {
        name,
        lint,
        codeActions
    };
}
class EasyModeDiagnostic extends vscode.Diagnostic {
    constructor(range, message, severity, code, metadata) {
        super(range, message, severity);
        this.metadata = metadata;
        this.diagnosticKind = 'k8s-easy-mode';
        this.code = code;
    }
}
function isDocumentDiagnoser(o) {
    return !!(o.analyseDocument);
}
function isResourceParsesDiagnoser(o) {
    return !!(o.analyseResourceParses);
}
function isResourceParseDiagnoser(o) {
    return !!(o.analyseResourceParse);
}
function isResourceDiagnoser(o) {
    return !!(o.analyseResource);
}
function isResourceParseEvaluatorDiagnoser(o) {
    return !!(o.evaluator);
}
function asLinter2(diagnosticContributor) {
    function name() { return diagnosticContributor.name; }
    return {
        name,
        lint: makeLintFunction(diagnosticContributor),
        codeActions: makeCodeActionsFunction(diagnosticContributor) || ((_d, _r, _c) => __awaiter(this, void 0, void 0, function* () { return Array.of(); }))
    };
}
function makeLintFunction(diagnosticContributor) {
    if (isDocumentDiagnoser(diagnosticContributor)) {
        return makeDocumentDiagnoserLintFunction(diagnosticContributor);
    }
    if (isResourceParsesDiagnoser(diagnosticContributor)) {
        return makeResourceParsesDiagnoserLintFunction(diagnosticContributor);
    }
    if (isResourceParseDiagnoser(diagnosticContributor)) {
        return makeResourceParseDiagnoserLintFunction(diagnosticContributor);
    }
    if (isResourceDiagnoser(diagnosticContributor)) {
        return makeResourceDiagnoserLintFunction(diagnosticContributor);
    }
    if (isResourceParseEvaluatorDiagnoser(diagnosticContributor)) {
        return makeResourceParseEvaluatorDiagnoserLintFunction(diagnosticContributor);
    }
    return never_1.cantHappen(diagnosticContributor);
}
function makeCodeActionsFunction(diagnosticContributor) {
    if (isDocumentDiagnoser(diagnosticContributor)) {
        return diagnosticContributor.codeActions;
    }
    return makeEasyModeDiagnoserCodeActionsFunction(diagnosticContributor.codeActions);
}
function arrayOf(items) {
    if (Array.isArray(items)) {
        return items;
    }
    return Array.of(...items);
}
function isNativeAction(ema) {
    return !!(ema.edit) || !!(ema.command);
}
function codeActionOf(ema, document, parsedDocument) {
    if (isNativeAction(ema)) {
        return ema;
    }
    const edit = new vscode.WorkspaceEdit();
    for (const e of ema.edits) {
        switch (e.kind) {
            case 'insert':
                edit.insert(document.uri, document.positionAt(e.at), e.text);
                break;
            case 'merge':
                lintedit.merge(edit, document, parsedDocument, e.into, e.value);
                break;
            default:
                never_1.cantHappen(e);
                break;
            // case 'insert-map-entry':
            //     lintedit.appendMapEntries(edit, document, e.under, e.mapEntry);
            //     // const map = e.under;
            //     // const mapRange = new vscode.Range(document.positionAt(map.range.start), document.positionAt(map.range.end));
            //     // edit.replace(document.uri, range, newText);
            //     break;
        }
    }
    const a = new vscode.CodeAction(ema.title, vscode.CodeActionKind.QuickFix);
    a.edit = edit;
    return a;
}
function makeDocumentDiagnoserLintFunction(diagnosticContributor) {
    return function (document) {
        return __awaiter(this, void 0, void 0, function* () {
            const diagnostics = yield diagnosticContributor.analyseDocument(document);
            return arrayOf(diagnostics);
        });
    };
}
function makeResourceParsesDiagnoserLintFunction(diagnosticContributor) {
    return function analyseImpl(document) {
        return __awaiter(this, void 0, void 0, function* () {
            function rangeOf(r) {
                return new vscode.Range(document.positionAt(r.start), document.positionAt(r.end));
            }
            const text = document.getText();
            const parses = (document.languageId === 'yaml' ? kp.parseYAML(text) :
                (document.languageId === 'json' ? kp.parseJSON(text) :
                    []));
            if (parses.length === 0) {
                return [];
            }
            const diags = yield diagnosticContributor.analyseResourceParses(parses);
            return arrayOf(diags).map((d) => new EasyModeDiagnostic(rangeOf(d.range), d.message, d.severity, d.code, d.metadata));
        });
    };
}
function makeEasyModeDiagnoserCodeActionsFunction(impl) {
    if (!impl) {
        return undefined;
    }
    return function (document, range, context) {
        return __awaiter(this, void 0, void 0, function* () {
            function unrangeOf(r) {
                return { start: document.offsetAt(r.start), end: document.offsetAt(r.end) };
            }
            // TODO: could cache in a diagnostic?
            const text = document.getText();
            const parses = (document.languageId === 'yaml' ? kp.parseYAML(text) :
                (document.languageId === 'json' ? kp.parseJSON(text) :
                    []));
            if (parses.length === 0) {
                return [];
            }
            const emdiags = context.diagnostics
                .filter((d) => d.diagnosticKind === 'k8s-easy-mode')
                .map((d) => ({ range: unrangeOf(d.range), message: d.message, severity: d.severity, code: d.code, metadata: d.metadata }));
            const emas = yield impl(parses, unrangeOf(range), emdiags);
            return emas.map((ema) => codeActionOf(ema, document, parses));
        });
    };
}
function makeResourceParseDiagnoserLintFunction(diagnosticContributor) {
    return function analyseImpl(document) {
        return __awaiter(this, void 0, void 0, function* () {
            function rangeOf(r) {
                return new vscode.Range(document.positionAt(r.start), document.positionAt(r.end));
            }
            const text = document.getText();
            const parses = (document.languageId === 'yaml' ? kp.parseYAML(text) :
                (document.languageId === 'json' ? kp.parseJSON(text) :
                    []));
            const resources = diagnosticContributor.manifestKind ? parses.filter((p) => kp.isKind(p, diagnosticContributor.manifestKind)) : parses;
            if (resources.length === 0) {
                return [];
            }
            const diagPromises = resources.map((r) => diagnosticContributor.analyseResourceParse(r));
            const diagsArray = yield Promise.all(diagPromises);
            const diagsArray2 = diagsArray.map((c) => arrayOf(c));
            const diags = array_1.flatten(...diagsArray2);
            return diags.map((d) => new EasyModeDiagnostic(rangeOf(d.range), d.message, d.severity, d.code, d.metadata));
        });
    };
}
function makeResourceDiagnoserLintFunction(diagnosticContributor) {
    return function analyseImpl(document) {
        return __awaiter(this, void 0, void 0, function* () {
            function rangeOf(r) {
                return new vscode.Range(document.positionAt(r.start), document.positionAt(r.end));
            }
            const text = document.getText();
            const parses = (document.languageId === 'yaml' ? kp.parseYAML(text) :
                (document.languageId === 'json' ? kp.parseJSON(text) :
                    [])).map((p) => kp.asTraversable(p));
            const resources = diagnosticContributor.manifestKind ? parses.filter((p) => kp.isKind(p, diagnosticContributor.manifestKind)) : parses;
            if (resources.length === 0) {
                return [];
            }
            const diagPromises = resources.map((r) => diagnosticContributor.analyseResource(r));
            const diagsArray = yield Promise.all(diagPromises);
            const diagsArray2 = diagsArray.map((c) => arrayOf(c));
            const diags = array_1.flatten(...diagsArray2);
            return diags.map((d) => new EasyModeDiagnostic(rangeOf(d.range), d.message, d.severity, d.code, d.metadata));
        });
    };
}
function makeResourceParseEvaluatorDiagnoserLintFunction(diagnosticContributor) {
    return function analyseImpl(document) {
        return __awaiter(this, void 0, void 0, function* () {
            function rangeOf(r) {
                return new vscode.Range(document.positionAt(r.start), document.positionAt(r.end));
            }
            const text = document.getText();
            const parses = (document.languageId === 'yaml' ? kp.parseYAML(text) :
                (document.languageId === 'json' ? kp.parseJSON(text) :
                    []));
            const resources = diagnosticContributor.manifestKind ? parses.filter((p) => kp.isKind(p, diagnosticContributor.manifestKind)) : parses;
            if (resources.length === 0) {
                return [];
            }
            const diags = kp.evaluate(resources, diagnosticContributor.evaluator);
            return diags.map((d) => new EasyModeDiagnostic(rangeOf(d.range), d.message, d.severity, d.code, d.metadata));
        });
    };
}
//# sourceMappingURL=v1.js.map