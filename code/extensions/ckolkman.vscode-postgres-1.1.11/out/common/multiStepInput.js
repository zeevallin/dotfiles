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
const vscode_1 = require("vscode");
class InputFlowAction {
    constructor() { }
}
InputFlowAction.Back = new InputFlowAction();
InputFlowAction.Cancel = new InputFlowAction();
InputFlowAction.Resume = new InputFlowAction();
exports.InputFlowAction = InputFlowAction;
class MultiStepInput {
    constructor() {
        this.steps = [];
    }
    static run(start) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = new MultiStepInput();
            return input.stepThrough(start);
        });
    }
    get CurrentStepNumber() { return this.steps.length; }
    stepThrough(start) {
        return __awaiter(this, void 0, void 0, function* () {
            let step = start;
            let inputCompleted = true;
            while (step) {
                this.steps.push(step);
                if (this.current) {
                    this.current.enabled = false;
                    this.current.busy = true;
                }
                try {
                    step = yield step(this);
                }
                catch (err) {
                    if (err === InputFlowAction.Back) {
                        this.steps.pop();
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.Resume) {
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.Cancel) {
                        step = undefined;
                        inputCompleted = false;
                    }
                    else {
                        throw err;
                    }
                }
            }
            if (this.current) {
                this.current.dispose();
            }
            return inputCompleted;
        });
    }
    redoLastStep() {
        // const input = window.createInputBox();
        // if (this.current) {
        //   this.current.dispose();
        // }
        // this.current = input;
        throw InputFlowAction.Back;
    }
    showInputBox({ title, step, totalSteps, value, prompt, placeholder, ignoreFocusOut, password, validate, convert, buttons, shouldResume }) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode_1.window.createInputBox();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.value = value || '';
                    input.prompt = prompt;
                    input.placeholder = placeholder;
                    input.password = !!password;
                    input.ignoreFocusOut = !!ignoreFocusOut;
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    let validating = validate('');
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode_1.QuickInputButtons.Back) {
                            reject(InputFlowAction.Back);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidAccept(() => __awaiter(this, void 0, void 0, function* () {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(yield validate(value))) {
                            if (convert) {
                                resolve(yield convert(value));
                            }
                            else {
                                resolve(value);
                            }
                        }
                        input.enabled = true;
                        input.busy = false;
                    })), input.onDidChangeValue((text) => __awaiter(this, void 0, void 0, function* () {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = yield current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    })), input.onDidHide(() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.Resume : InputFlowAction.Cancel);
                        }
                        catch (errorInShouldResume) {
                            reject(errorInShouldResume);
                        }
                    })));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    setTimeout(() => input.show(), 5);
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
    showQuickPick({ title, step, totalSteps, items, activeItem, placeholder, ignoreFocusOut, matchOnDescription, matchOnDetail, canPickMany, convert, buttons, shouldResume }) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode_1.window.createQuickPick();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.placeholder = placeholder;
                    input.ignoreFocusOut = !!ignoreFocusOut;
                    input.matchOnDescription = !!matchOnDescription;
                    input.matchOnDetail = !!matchOnDetail;
                    input.canSelectMany = !!canPickMany;
                    input.items = items;
                    if (activeItem) {
                        input.activeItems = [activeItem];
                    }
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode_1.QuickInputButtons.Back) {
                            reject(InputFlowAction.Back);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidAccept(() => __awaiter(this, void 0, void 0, function* () {
                        if (!convert)
                            convert = (value) => __awaiter(this, void 0, void 0, function* () { return value; });
                        let convertedItems = yield Promise.all(input.activeItems.map(v => convert(v)));
                        if (canPickMany) {
                            resolve(convertedItems);
                        }
                        else {
                            resolve(convertedItems[0]);
                        }
                    })), input.onDidHide(() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.Resume : InputFlowAction.Cancel);
                        }
                        catch (errorInShouldResume) {
                            reject(errorInShouldResume);
                        }
                    })));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    setTimeout(() => input.show(), 5);
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
}
exports.MultiStepInput = MultiStepInput;
//# sourceMappingURL=multiStepInput.js.map