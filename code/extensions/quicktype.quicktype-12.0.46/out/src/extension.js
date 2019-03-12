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
const os_1 = require("os");
const path = require("path");
const vscode = require("vscode");
const vscode_1 = require("vscode");
const clipboardy_1 = require("clipboardy");
const quicktype_core_1 = require("quicktype-core");
const quicktype_typescript_input_1 = require("quicktype-typescript-input");
const persist = require("node-persist");
const analytics = require("./analytics");
const configurationSection = "quicktype";
var Command;
(function (Command) {
    Command["PasteJSONAsTypes"] = "quicktype.pasteJSONAsTypes";
    Command["PasteJSONAsTypesAndSerialization"] = "quicktype.pasteJSONAsTypesAndSerialization";
    Command["PasteSchemaAsTypes"] = "quicktype.pasteJSONSchemaAsTypes";
    Command["PasteSchemaAsTypesAndSerialization"] = "quicktype.pasteJSONSchemaAsTypesAndSerialization";
    Command["PasteTypeScriptAsTypesAndSerialization"] = "quicktype.pasteTypeScriptAsTypesAndSerialization";
    Command["OpenQuicktypeForJSON"] = "quicktype.openForJSON";
    Command["OpenQuicktypeForJSONSchema"] = "quicktype.openForJSONSchema";
    Command["OpenQuicktypeForTypeScript"] = "quicktype.openForTypeScript";
    Command["ChangeTargetLanguage"] = "quicktype.changeTargetLanguage";
})(Command || (Command = {}));
function jsonIsValid(json) {
    try {
        JSON.parse(json);
    }
    catch (e) {
        return false;
    }
    return true;
}
function promptTopLevelName() {
    return __awaiter(this, void 0, void 0, function* () {
        let topLevelName = yield vscode.window.showInputBox({
            prompt: "Top-level type name?"
        });
        return {
            cancelled: topLevelName === undefined,
            name: topLevelName || "TopLevel"
        };
    });
}
function pickTargetLanguage() {
    return __awaiter(this, void 0, void 0, function* () {
        const languageChoices = quicktype_core_1.defaultTargetLanguages.map(l => l.displayName).sort();
        let chosenName = yield vscode.window.showQuickPick(languageChoices);
        const cancelled = chosenName === undefined;
        if (chosenName === undefined) {
            chosenName = "typescript";
        }
        return { cancelled, lang: quicktype_core_1.languageNamed(chosenName) };
    });
}
function getTargetLanguage(editor) {
    return __awaiter(this, void 0, void 0, function* () {
        const documentLanguage = editor.document.languageId;
        const currentLanguage = quicktype_core_1.languageNamed(documentLanguage);
        if (currentLanguage !== undefined) {
            return {
                cancelled: false,
                lang: currentLanguage
            };
        }
        return yield pickTargetLanguage();
    });
}
function runQuicktype(content, kind, lang, topLevelName, forceJustTypes, indentation, additionalLeadingComments) {
    return __awaiter(this, void 0, void 0, function* () {
        const configuration = vscode.workspace.getConfiguration(configurationSection);
        const justTypes = forceJustTypes || configuration.justTypes;
        const rendererOptions = {};
        if (justTypes) {
            // FIXME: The target language should have a property to return these options.
            if (lang.name === "csharp") {
                rendererOptions["features"] = "just-types";
            }
            else if (lang.name === "kotlin") {
                rendererOptions["framework"] = "just-types";
            }
            else {
                rendererOptions["just-types"] = "true";
            }
        }
        const inputData = new quicktype_core_1.InputData();
        switch (kind) {
            case "json":
                yield inputData.addSource("json", { name: topLevelName, samples: [content] }, () => quicktype_core_1.jsonInputForTargetLanguage(lang));
                break;
            case "schema":
                yield inputData.addSource("schema", { name: topLevelName, schema: content }, () => new quicktype_core_1.JSONSchemaInput(undefined));
                break;
            case "typescript":
                yield inputData.addSource("schema", quicktype_typescript_input_1.schemaForTypeScriptSources({
                    [`${topLevelName}.ts`]: content
                }), () => new quicktype_core_1.JSONSchemaInput(undefined));
                break;
            default:
                throw new Error(`Unrecognized input format: ${kind}`);
        }
        const options = {
            lang: lang,
            inputData,
            leadingComments: ["Generated by https://quicktype.io"].concat(additionalLeadingComments),
            rendererOptions,
            indentation,
            inferMaps: configuration.inferMaps,
            inferEnums: configuration.inferEnums,
            inferDateTimes: configuration.inferDateTimes,
            inferIntegerStrings: configuration.inferIntegerStrings
        };
        for (const flag of quicktype_core_1.inferenceFlagNames) {
            if (typeof configuration[flag] === "boolean") {
                options[flag] = configuration[flag];
            }
        }
        return yield quicktype_core_1.quicktype(options);
    });
}
function pasteAsTypes(editor, kind, justTypes) {
    return __awaiter(this, void 0, void 0, function* () {
        let indentation;
        if (editor.options.insertSpaces) {
            const tabSize = editor.options.tabSize;
            indentation = " ".repeat(tabSize);
        }
        else {
            indentation = "\t";
        }
        const language = yield getTargetLanguage(editor);
        if (language.cancelled) {
            return;
        }
        let content;
        try {
            content = yield clipboardy_1.read();
        }
        catch (e) {
            vscode.window.showErrorMessage("Could not get clipboard contents");
            return;
        }
        if (kind !== "typescript" && !jsonIsValid(content)) {
            vscode.window.showErrorMessage("Clipboard does not contain valid JSON.");
            return;
        }
        let topLevelName;
        if (kind === "typescript") {
            topLevelName = "input";
        }
        else {
            const tln = yield promptTopLevelName();
            if (tln.cancelled) {
                return;
            }
            topLevelName = tln.name;
        }
        analytics.sendEvent(`paste ${kind}`, language.lang.name);
        let result;
        try {
            result = yield runQuicktype(content, kind, language.lang, topLevelName, justTypes, indentation, []);
        }
        catch (e) {
            // TODO Invalid JSON produces an uncatchable exception from quicktype
            // Fix this so we can catch and show an error message.
            vscode.window.showErrorMessage(e);
            return;
        }
        const text = result.lines.join("\n");
        const selection = editor.selection;
        editor.edit(builder => {
            if (selection.isEmpty) {
                builder.insert(selection.start, text);
            }
            else {
                builder.replace(new vscode_1.Range(selection.start, selection.end), text);
            }
        });
    });
}
class CodeProvider {
    constructor(_inputKind, _targetLanguage, _document) {
        this._inputKind = _inputKind;
        this._targetLanguage = _targetLanguage;
        this._document = _document;
        this.scheme = "quicktype";
        this._documentText = "{}";
        this._targetCode = "";
        this._onDidChange = new vscode.EventEmitter();
        this._isOpen = false;
        this._timer = undefined;
        this.scheme = `quicktype-${this._targetLanguage.name}`;
        // TODO use this.documentName instead of QuickType in uri
        this.uri = vscode.Uri.parse(`${this.scheme}:QuickType.${this._targetLanguage.extension}`);
        this._changeSubscription = vscode.workspace.onDidChangeTextDocument(ev => this.textDidChange(ev));
        this._onDidChangeVisibleTextEditors = vscode.window.onDidChangeVisibleTextEditors(editors => this.visibleTextEditorsDidChange(editors));
        this._onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(ev => this.configurationDidChange(ev));
    }
    dispose() {
        this._onDidChange.dispose();
        this._changeSubscription.dispose();
        this._onDidChangeVisibleTextEditors.dispose();
        this._onDidChangeConfiguration.dispose();
    }
    get inputKind() {
        return this._inputKind;
    }
    setInputKind(inputKind) {
        this._inputKind = inputKind;
    }
    get document() {
        return this._document;
    }
    get documentName() {
        const basename = path.basename(this.document.fileName);
        const extIndex = basename.lastIndexOf(".");
        return extIndex === -1 ? basename : basename.substring(0, extIndex);
    }
    setDocument(document) {
        this._document = document;
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    visibleTextEditorsDidChange(editors) {
        const isOpen = editors.some(e => e.document.uri.scheme === this.scheme);
        if (!this._isOpen && isOpen) {
            this.update();
        }
        this._isOpen = isOpen;
    }
    configurationDidChange(ev) {
        if (ev.affectsConfiguration(configurationSection)) {
            this.update();
        }
    }
    textDidChange(ev) {
        if (!this._isOpen)
            return;
        if (ev.document !== this._document)
            return;
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this._timer = setTimeout(() => {
            this._timer = undefined;
            this.update();
        }, 300);
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            this._documentText = this._document.getText();
            try {
                const result = yield runQuicktype(this._documentText, this._inputKind, this._targetLanguage, this.documentName, false, undefined, ["", "To change quicktype's target language, run command:", "", '  "Set quicktype target language"']);
                this._targetCode = result.lines.join("\n");
                if (!this._isOpen)
                    return;
                this._onDidChange.fire(this.uri);
            }
            catch (e) { }
        });
    }
    provideTextDocumentContent(_uri, _token) {
        this._isOpen = true;
        return this._targetCode;
    }
}
function deduceTargetLanguage() {
    const documents = vscode.workspace.textDocuments;
    const counts = new Map();
    for (const doc of documents) {
        const name = doc.languageId;
        let count = counts.get(name);
        if (count === undefined) {
            count = 0;
        }
        count += 1;
        counts.set(name, count);
    }
    const sorted = Array.from(counts).sort(([_na, ca], [_nb, cb]) => cb - ca);
    for (const [name] of sorted) {
        const lang = quicktype_core_1.languageNamed(name);
        if (lang !== undefined)
            return lang;
    }
    return quicktype_core_1.languageNamed("typescript");
}
const lastTargetLanguageUsedKey = "lastTargetLanguageUsed";
let extensionContext = undefined;
const codeProviders = new Map();
let lastCodeProvider = undefined;
let explicitlySetTargetLanguage = undefined;
function openQuicktype(inputKind, targetLanguage, document) {
    return __awaiter(this, void 0, void 0, function* () {
        let codeProvider = codeProviders.get(targetLanguage.name);
        const openNew = codeProvider === undefined;
        if (codeProvider === undefined) {
            codeProvider = new CodeProvider(inputKind, targetLanguage, document);
            codeProviders.set(targetLanguage.name, codeProvider);
            if (extensionContext !== undefined) {
                extensionContext.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(codeProvider.scheme, codeProvider));
            }
        }
        else {
            codeProvider.setInputKind(inputKind);
            codeProvider.setDocument(document);
        }
        let originalEditor;
        if (lastCodeProvider !== undefined) {
            const doc = lastCodeProvider.document;
            originalEditor = vscode.window.visibleTextEditors.find(e => e.document === doc);
        }
        if (originalEditor === undefined) {
            originalEditor = vscode.window.activeTextEditor;
        }
        let column;
        if (originalEditor !== undefined && originalEditor.viewColumn !== undefined) {
            column = originalEditor.viewColumn + 1;
        }
        else {
            column = 0;
        }
        lastCodeProvider = codeProvider;
        codeProvider.update();
        const doc = yield vscode.workspace.openTextDocument(codeProvider.uri);
        vscode.window.showTextDocument(doc, column, true);
        analytics.sendEvent(`open${openNew ? " new" : ""} ${inputKind}`, targetLanguage.name);
    });
}
function openForEditor(editor, inputKind) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetLanguage = explicitlySetTargetLanguage !== undefined ? explicitlySetTargetLanguage : deduceTargetLanguage();
        yield openQuicktype(inputKind, targetLanguage, editor.document);
    });
}
function changeTargetLanguage() {
    return __awaiter(this, void 0, void 0, function* () {
        const pick = yield pickTargetLanguage();
        if (pick.cancelled)
            return;
        explicitlySetTargetLanguage = pick.lang;
        if (lastCodeProvider === undefined)
            return;
        yield openQuicktype(lastCodeProvider.inputKind, explicitlySetTargetLanguage, lastCodeProvider.document);
        yield persist.setItem(lastTargetLanguageUsedKey, explicitlySetTargetLanguage.name);
    });
}
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        extensionContext = context;
        analytics.initialize(context);
        context.subscriptions.push(vscode.commands.registerTextEditorCommand(Command.PasteJSONAsTypes, editor => pasteAsTypes(editor, "json", true)), vscode.commands.registerTextEditorCommand(Command.PasteJSONAsTypesAndSerialization, editor => pasteAsTypes(editor, "json", false)), vscode.commands.registerTextEditorCommand(Command.PasteSchemaAsTypes, editor => pasteAsTypes(editor, "schema", true)), vscode.commands.registerTextEditorCommand(Command.PasteSchemaAsTypesAndSerialization, editor => pasteAsTypes(editor, "schema", false)), vscode.commands.registerTextEditorCommand(Command.PasteTypeScriptAsTypesAndSerialization, editor => pasteAsTypes(editor, "typescript", false)), vscode.commands.registerTextEditorCommand(Command.OpenQuicktypeForJSON, editor => openForEditor(editor, "json")), vscode.commands.registerTextEditorCommand(Command.OpenQuicktypeForJSONSchema, editor => openForEditor(editor, "schema")), vscode.commands.registerTextEditorCommand(Command.OpenQuicktypeForTypeScript, editor => openForEditor(editor, "typescript")), vscode.commands.registerCommand(Command.ChangeTargetLanguage, changeTargetLanguage));
        yield persist.init({ dir: path.join(os_1.homedir(), ".quicktype-vscode") });
        const maybeName = yield persist.getItem(lastTargetLanguageUsedKey);
        if (typeof maybeName === "string") {
            explicitlySetTargetLanguage = quicktype_core_1.languageNamed(maybeName);
        }
    });
}
exports.activate = activate;
function deactivate() {
    return;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map