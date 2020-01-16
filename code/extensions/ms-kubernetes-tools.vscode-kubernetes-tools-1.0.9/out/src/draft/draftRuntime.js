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
const events_1 = require("events");
const child_process_1 = require("child_process");
const host_1 = require("../host");
const shell_1 = require("../shell");
const fs_1 = require("../fs");
const draft_1 = require("./draft");
const extension_1 = require("../extension");
class DraftRuntime extends events_1.EventEmitter {
    constructor() {
        super();
        this.draft = draft_1.create(host_1.host, fs_1.fs, shell_1.shell, extension_1.installDependencies);
    }
    killConnect() {
        this.connectProcess.kill('SIGTERM');
    }
    draftUpDebug(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const output = vscode.window.createOutputChannel("draft");
            output.show();
            const isPresent = yield this.draft.checkPresent(draft_1.CheckPresentMode.Alert);
            if (!isPresent) {
                host_1.host.showInformationMessage("Draft is not installed!");
                return;
            }
            const debugFolders = vscode.workspace.workspaceFolders;
            if (!debugFolders || debugFolders.length === 0) {
                host_1.host.showErrorMessage("This command reauires an open folder.");
                return;
            }
            const hasDraftApp = debugFolders.some((f) => this.draft.isFolderMapped(f.uri.fsPath));
            if (!hasDraftApp) {
                host_1.host.showErrorMessage("This folder or workspace does not contain a Draft app. Run draft create first!");
                return;
            }
            // //wait for `draft up` to finish
            yield waitForProcessToExit(createProcess('draft', ['up'], output));
            // wait for `draft connect` to be ready
            this.connectProcess = createProcess('draft', ['connect'], output);
            yield waitConnectionReady(this.connectProcess, config);
            host_1.host.showInformationMessage(`attaching debugger`);
            vscode.debug.startDebugging(undefined, config['original-debug']);
            vscode.debug.onDidTerminateDebugSession((_e) => {
                this.killConnect();
                output.dispose();
            });
        });
    }
}
exports.DraftRuntime = DraftRuntime;
function createProcess(cmd, args, output) {
    // notify that cmd started
    console.log(`started ${cmd} ${args.toString()}`);
    host_1.host.showInformationMessage(`starting ${cmd} ${args.toString()}`);
    const proc = child_process_1.spawn(cmd, args, shell_1.shell.execOpts());
    console.log(process.env.PATH);
    // output data on the tab
    subscribeToDataEvent(proc.stdout, output);
    subscribeToDataEvent(proc.stderr, output);
    proc.on('exit', (code) => {
        host_1.host.showInformationMessage(`finished ${cmd} ${args.toString()}`);
        console.log(`finished ${cmd} ${args.toString()} with exit code ${code}`);
    });
    return proc;
}
function waitForProcessToExit(proc) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            proc.addListener('message', (message) => { console.log(message); });
            proc.addListener('close', (code, signal) => { console.log(`Code: ${code}, Signal: ${signal}`); });
            proc.addListener('disconnect', () => console.log('disconnected'));
            proc.addListener('error', (err) => { console.log(`Error: ${err}`); });
            proc.addListener('exit', resolve);
        });
    });
}
// TODO - wait for specific stdout output based on debugger type
function waitConnectionReady(proc, config) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let isConnectionReady = false;
            proc.stdout.on('data', (data) => __awaiter(this, void 0, void 0, function* () {
                if ((!isConnectionReady) && canAttachDebugger(data, config)) {
                    isConnectionReady = true;
                    resolve();
                }
            }));
            proc.on('close', (_code) => __awaiter(this, void 0, void 0, function* () {
                if (!isConnectionReady) {
                    reject('Cannot connect.');
                }
            }));
        });
    });
}
// TODO - add other debugger type outputs here
function canAttachDebugger(data, config) {
    switch (config['original-debug'].type) {
        case 'node': {
            if (config['original-debug'].localRoot === '' || config['original-debug'].localRoot === null) {
                config['original-debug'].localRoot = vscode.workspace.rootPath;
            }
            if (data.indexOf('Debugger listening') >= 0) {
                return true;
            }
            break;
        }
        case 'go': {
            if (config["original-debug"].program === '' || config["original-debug"].program === null) {
                config['original-debug'].program = vscode.workspace.rootPath;
            }
            if (data.indexOf('API server listening') >= 0) {
                return true;
            }
            break;
        }
    }
    return false;
}
function subscribeToDataEvent(readable, outputChannel) {
    readable.on('data', (chunk) => {
        const chunkAsString = typeof chunk === 'string' ? chunk : chunk.toString();
        outputChannel.append(chunkAsString);
    });
}
//# sourceMappingURL=draftRuntime.js.map