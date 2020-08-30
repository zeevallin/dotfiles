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
const path = require("path");
const yaml = require("js-yaml");
const _ = require("lodash");
const explorer_1 = require("./components/clusterexplorer/explorer");
const helm_exec_1 = require("./helm.exec");
const errorable_1 = require("./errorable");
const helm_symbolProvider_1 = require("./helm.symbolProvider");
const cancellation = require("./utils/cancellation");
function convertToTemplate(fs, host, projectPath, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = { fs, host, projectPath };
        const activeDocument = host.activeDocument();
        if (explorer_1.isKubernetesExplorerResourceNode(target)) {
            // it's a k8s explorer click
            const uri = target.uri('yaml');
            const yaml = (yield host.readDocument(uri)).getText();
            addChart(context, yaml);
        }
        else if (target) {
            // it's a file explorer click
            addChartFrom(context, target.fsPath);
        }
        else if (activeDocument) {
            addChart(context, activeDocument.getText());
        }
        else {
            host.showErrorMessage("This command requires a YAML file open or selected in the Explorer.");
        }
    });
}
exports.convertToTemplate = convertToTemplate;
function addChartFrom(context, fsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const yaml = context.fs.readFileSync(fsPath, 'utf-8');
        yield addChart(context, yaml);
    });
}
function addChart(context, resourceYaml) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: check text is valid YAML
        const chart = yield pickOrCreateChart(context);
        if (!chart) {
            return;
        }
        const template = yaml.safeLoad(resourceYaml);
        templatise(template);
        // TODO: offer a default
        const templateName = yield context.host.showInputBox({ prompt: "Name for the new template" });
        if (!templateName) {
            return;
        }
        const templateFile = path.join(chart.path, "templates", templateName + ".yaml");
        // TODO: check if file already exists
        const templateYaml = yaml.safeDump(template); // the parse-dump cycle can change the indentation of collections - is this an issue?
        const templateText = fixYamlValueQuoting(templateYaml);
        context.fs.writeFileSync(templateFile, templateText);
        yield context.host.showDocument(vscode.Uri.file(templateFile));
    });
}
var QuoteMode;
(function (QuoteMode) {
    QuoteMode[QuoteMode["None"] = 0] = "None";
    QuoteMode[QuoteMode["Double"] = 1] = "Double";
})(QuoteMode || (QuoteMode = {}));
const NAME_EXPRESSION = '{{ template "fullname" . }}';
const CHART_LABEL_EXPRESSION = '{{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}';
const QUOTE_CONTROL_INFO = [
    { text: NAME_EXPRESSION, mode: QuoteMode.None },
    { text: CHART_LABEL_EXPRESSION, mode: QuoteMode.Double },
];
function templatise(template) {
    ensureMetadata(template);
    cleanseMetadata(template.metadata);
    template.metadata.name = NAME_EXPRESSION;
    template.metadata.labels.chart = CHART_LABEL_EXPRESSION;
    delete template.status;
}
function ensureMetadata(template) {
    template.metadata = template.metadata || {};
    template.metadata.labels = template.metadata.labels || {};
}
const ANNOTATIONS_TO_STRIP = [
    'kubectl.kubernetes.io/last-applied-configuration'
];
function cleanseMetadata(metadata) {
    delete metadata.clusterName;
    delete metadata.creationTimestamp;
    delete metadata.deletionTimestamp;
    delete metadata.generation;
    delete metadata.generateName;
    delete metadata.namespace;
    delete metadata.resourceVersion;
    delete metadata.selfLink;
    delete metadata.uid;
    if (metadata.annotations) {
        for (const annotation of ANNOTATIONS_TO_STRIP) {
            delete metadata.annotations[annotation];
        }
    }
}
function chartsInProject(context) {
    const fs = context.fs;
    return subdirectories(fs, context.projectPath)
        .filter((d) => fs.existsSync(path.join(d, "Chart.yaml")))
        .map((d) => ({ name: path.basename(d), path: d }));
}
function subdirectories(fs, directory) {
    const immediate = fs.dirSync(directory)
        .map((e) => path.join(directory, e))
        .filter((e) => fs.statSync(e).isDirectory());
    const indirect = immediate.map((d) => subdirectories(fs, d));
    return immediate.concat(...indirect);
}
function pickOrCreateChart(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: refactor helmexec.pickChart so we can leverage it here
        const charts = chartsInProject(context);
        switch (charts.length) {
            case 0:
                return yield createChart(context);
            case 1:
                return charts[0];
            default:
                const chartPicks = charts.map((c) => ({ label: c.name, chart: c }));
                const pick = yield context.host.showQuickPick(chartPicks, { placeHolder: 'Select chart to add the new template to' });
                return pick ? pick.chart : undefined;
        }
    });
}
function fixYamlValueQuoting(yamlText) {
    let text = yamlText;
    for (const expr of QUOTE_CONTROL_INFO) {
        const q = expr.mode === QuoteMode.Double ? '"' : '';
        text = text.replace(`'${expr.text}'`, `${q}${expr.text}${q}`);
    }
    return text;
}
function createChart(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const createResult = yield helm_exec_1.helmCreateCore("No chart found. Enter name of the chart to create.", "mychart");
        if (!createResult) {
            return undefined;
        }
        if (errorable_1.failed(createResult)) {
            context.host.showErrorMessage(createResult.error[0]);
            return undefined;
        }
        return createResult.result;
    });
}
function convertToParameter(fs, host, document, selection) {
    return __awaiter(this, void 0, void 0, function* () {
        const helmSymbols = yield getHelmSymbols(document);
        if (helmSymbols.length === 0) {
            return { succeeded: false, error: ['Active document is not a Helm template'] };
        }
        const property = helm_symbolProvider_1.symbolAt(selection.anchor, helmSymbols);
        if (!property || property.kind !== vscode.SymbolKind.Constant) {
            return { succeeded: false, error: ['Selection is not a YAML field'] };
        }
        const templateName = path.parse(document.fileName).name;
        const valueLocation = property.location.range;
        const valueText = document.getText(valueLocation);
        const valueSymbolContainmentChain = helm_symbolProvider_1.containmentChain(property, helmSymbols);
        if (valueSymbolContainmentChain.length === 0) {
            return { succeeded: false, error: ['Cannot locate property name'] };
        }
        const rawKeyPath = [templateName, valueSymbolContainmentChain[0].name];
        const keyPath = rawKeyPath.map(sanitiseForGoTemplate);
        const insertParamEdit = yield addEntryToValuesFile(fs, host, document, keyPath, valueText);
        if (errorable_1.failed(insertParamEdit)) {
            return { succeeded: false, error: insertParamEdit.error };
        }
        const keyReference = keyPath.join('.');
        const replaceValueWithParamRef = new vscode.TextEdit(valueLocation, `{{ .Values.${keyReference} }}`);
        const appliedEdits = yield applyEdits({ document: document, edits: [replaceValueWithParamRef] }, { document: insertParamEdit.result.document, edits: [insertParamEdit.result.edit] });
        if (!appliedEdits) {
            return { succeeded: false, error: ['Unable to update the template and/or values file'] };
        }
        return { succeeded: true, result: insertParamEdit.result };
    });
}
exports.convertToParameter = convertToParameter;
function applyEdits(...edits) {
    return __awaiter(this, void 0, void 0, function* () {
        const wsEdit = new vscode.WorkspaceEdit();
        for (const e of edits) {
            wsEdit.set(e.document.uri, e.edits);
        }
        return yield vscode.workspace.applyEdit(wsEdit);
    });
}
function getHelmSymbols(document) {
    return __awaiter(this, void 0, void 0, function* () {
        const symbolProvider = new helm_symbolProvider_1.HelmDocumentSymbolProvider();
        const symbols = yield symbolProvider.provideDocumentSymbolsImpl(document, cancellation.dummyToken());
        return symbols;
    });
}
function addEntryToValuesFile(fs, host, template, keyPath, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const valuesYamlPath = path.normalize(path.join(path.dirname(template.fileName), '..', 'values.yaml'));
        if (!fs.existsSync(valuesYamlPath)) {
            fs.writeFileSync(valuesYamlPath, '');
        }
        const valuesYamlDoc = yield host.readDocument(vscode.Uri.file(valuesYamlPath));
        const valuesYamlAst = yield getHelmSymbols(valuesYamlDoc);
        const whatWeHave = findCreatableKeyPath(keyPath, valuesYamlAst);
        const insertion = addToYaml(valuesYamlDoc, valuesYamlAst, whatWeHave.found, whatWeHave.remaining, value);
        return { succeeded: true, result: insertion };
    });
}
function findCreatableKeyPath(keyPath, ast) {
    const foundPath = helm_symbolProvider_1.findKeyPath(keyPath, ast);
    if (foundPath.remaining.length > 0) {
        return foundPath;
    }
    const disambiguatingPath = disambiguateKeyPath(keyPath);
    const foundDisambiguatingPath = helm_symbolProvider_1.findKeyPath(disambiguatingPath, ast);
    if (foundDisambiguatingPath.remaining.length > 0) {
        return foundDisambiguatingPath;
    }
    return findCreatableKeyPathBySuffixing(keyPath, ast, 1);
}
function disambiguateKeyPath(keyPath) {
    const path = keyPath.slice(0, keyPath.length - 1);
    const disambiguatedFinal = keyPath.join('_');
    path.push(disambiguatedFinal);
    return path;
}
function findCreatableKeyPathBySuffixing(keyPath, ast, suffix) {
    const path = keyPath.slice(0, keyPath.length - 1);
    const suffixedFinal = keyPath[keyPath.length - 1] + suffix.toString();
    path.push(suffixedFinal);
    const foundPath = helm_symbolProvider_1.findKeyPath(path, ast);
    if (foundPath.remaining.length > 0) {
        return foundPath;
    }
    return findCreatableKeyPathBySuffixing(keyPath, ast, suffix + 1);
}
function addToYaml(document, ast, parent, keys, value) {
    const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
    if (parent) {
        // TODO: do we need to handle the possibility of a parent node without any child nodes?
        const before = firstChild(document, parent, ast);
        return insertBefore(document, before, keys, value, eol);
    }
    else {
        // TODO: handle the case where the document is entirely empty
        const before = firstChild(document, undefined, ast);
        return insertBefore(document, before, keys, value, eol);
    }
}
function firstChild(document, parent, ast) {
    const isDescendant = parent ?
        (n) => parent.location.range.contains(n.location.range) :
        (_n) => true;
    const linearPos = (p) => document.offsetAt(p);
    return _.chain(ast)
        .filter(isDescendant)
        .filter((n) => n !== parent)
        .filter((n) => n.kind === vscode.SymbolKind.Field)
        .orderBy([(n) => linearPos(n.location.range.start), (n) => linearPos(n.location.range.end)])
        .first()
        .value();
}
function insertBefore(document, element, keys, value, eol) {
    const insertAt = element ? lineStart(element.location.range.start) : document.positionAt(0);
    const indent = indentLevel(element);
    const text = makeTree(indent, keys, value, eol);
    const edit = vscode.TextEdit.insert(insertAt, text);
    return { document: document, keyPath: keys, edit: edit };
}
function lineStart(pos) {
    return new vscode.Position(pos.line, 0);
}
function indentLevel(element) {
    return element ? element.location.range.start.character : 0;
}
function makeTree(indentLevel, keys, value, eol) {
    if (keys.length < 1) {
        return '';
    }
    const indent = ' '.repeat(indentLevel);
    if (keys.length === 1) {
        return `${indent}${keys[0]}: ${value}${eol}`;
    }
    const subtree = makeTree(indentLevel + 2, keys.slice(1), value, eol);
    return `${indent}${keys[0]}:${eol}${subtree}`;
}
function sanitiseForGoTemplate(s) {
    return s.replace(/-./g, (h) => h.substring(1).toUpperCase());
}
//# sourceMappingURL=helm.authoring.js.map