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
const vscode_1 = require("vscode");
const child_process_1 = require("child_process");
const binutil = require("./binutil");
const outputUtils_1 = require("./outputUtils");
const compatibility = require("./components/kubectl/compatibility");
const config_1 = require("./components/config/config");
const autoversion_1 = require("./components/kubectl/autoversion");
const yaml_schema_1 = require("./yaml-support/yaml-schema");
const KUBECTL_OUTPUT_COLUMN_SEPARATOR = /\s\s+/g;
class KubectlImpl {
    constructor(host, fs, shell, installDependenciesCallback, pathfinder, kubectlFound) {
        this.sharedTerminal = null;
        this.context = {
            host: host,
            fs: fs,
            shell: shell,
            installDependenciesCallback: installDependenciesCallback,
            pathfinder: pathfinder,
            binFound: kubectlFound,
            binPath: 'kubectl'
        };
    }
    checkPresent(errorMessageMode) {
        return checkPresent(this.context, errorMessageMode);
    }
    invoke(command, handler) {
        return invoke(this.context, command, handler);
    }
    invokeWithProgress(command, progressMessage, handler) {
        return invokeWithProgress(this.context, command, progressMessage, handler);
    }
    invokeAsync(command, stdin, callback) {
        return invokeAsync(this.context, command, stdin, callback);
    }
    invokeAsyncWithProgress(command, progressMessage) {
        return invokeAsyncWithProgress(this.context, command, progressMessage);
    }
    spawnAsChild(command) {
        return spawnAsChild(this.context, command);
    }
    invokeInNewTerminal(command, terminalName, onClose, pipeTo) {
        return __awaiter(this, void 0, void 0, function* () {
            const terminal = this.context.host.createTerminal(terminalName);
            const disposable = onClose ? this.context.host.onDidCloseTerminal(onClose) : new vscode_1.Disposable(() => { });
            yield invokeInTerminal(this.context, command, pipeTo, terminal);
            return disposable;
        });
    }
    invokeInSharedTerminal(command) {
        const terminal = this.getSharedTerminal();
        return invokeInTerminal(this.context, command, undefined, terminal);
    }
    runAsTerminal(command, terminalName) {
        return runAsTerminal(this.context, command, terminalName);
    }
    asLines(command) {
        return asLines(this.context, command);
    }
    fromLines(command) {
        return fromLines(this.context, command);
    }
    asJson(command) {
        return asJson(this.context, command);
    }
    getSharedTerminal() {
        if (!this.sharedTerminal) {
            this.sharedTerminal = this.context.host.createTerminal('kubectl');
            const disposable = this.context.host.onDidCloseTerminal((terminal) => {
                if (terminal === this.sharedTerminal) {
                    this.sharedTerminal = null;
                    disposable.dispose();
                }
            });
            this.context.host.onDidChangeConfiguration((change) => {
                if (config_1.affectsUs(change) && this.sharedTerminal) {
                    this.sharedTerminal.dispose();
                }
            });
        }
        return this.sharedTerminal;
    }
}
function create(versioning, host, fs, shell, installDependenciesCallback) {
    if (versioning === config_1.KubectlVersioning.Infer) {
        return createAutoVersioned(host, fs, shell, installDependenciesCallback);
    }
    return createSingleVersion(host, fs, shell, installDependenciesCallback);
}
exports.create = create;
function createSingleVersion(host, fs, shell, installDependenciesCallback) {
    return new KubectlImpl(host, fs, shell, installDependenciesCallback, undefined, false);
}
function createAutoVersioned(host, fs, shell, installDependenciesCallback) {
    const bootstrapper = createSingleVersion(host, fs, shell, installDependenciesCallback);
    const pathfinder = () => __awaiter(this, void 0, void 0, function* () { return (yield autoversion_1.ensureSuitableKubectl(bootstrapper, shell, host)) || 'kubectl'; });
    return new KubectlImpl(host, fs, shell, installDependenciesCallback, pathfinder, false);
}
var CheckPresentMessageMode;
(function (CheckPresentMessageMode) {
    CheckPresentMessageMode[CheckPresentMessageMode["Command"] = 0] = "Command";
    CheckPresentMessageMode[CheckPresentMessageMode["Activation"] = 1] = "Activation";
    CheckPresentMessageMode[CheckPresentMessageMode["Silent"] = 2] = "Silent";
})(CheckPresentMessageMode = exports.CheckPresentMessageMode || (exports.CheckPresentMessageMode = {}));
function checkPresent(context, errorMessageMode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (context.binFound || context.pathfinder) {
            return true;
        }
        return yield checkForKubectlInternal(context, errorMessageMode);
    });
}
function checkForKubectlInternal(context, errorMessageMode) {
    return __awaiter(this, void 0, void 0, function* () {
        const binName = 'kubectl';
        const bin = config_1.getToolPath(context.host, context.shell, binName);
        const contextMessage = getCheckKubectlContextMessage(errorMessageMode);
        const inferFailedMessage = `Could not find "${binName}" binary.${contextMessage}`;
        const configuredFileMissingMessage = `${bin} does not exist! ${contextMessage}`;
        return yield binutil.checkForBinary(context, bin, binName, inferFailedMessage, configuredFileMissingMessage, errorMessageMode !== CheckPresentMessageMode.Silent);
    });
}
function getCheckKubectlContextMessage(errorMessageMode) {
    if (errorMessageMode === CheckPresentMessageMode.Activation) {
        return ' Kubernetes commands other than configuration will not function correctly.';
    }
    else if (errorMessageMode === CheckPresentMessageMode.Command) {
        return ' Cannot execute command.';
    }
    return '';
}
function invoke(context, command, handler) {
    return __awaiter(this, void 0, void 0, function* () {
        yield kubectlInternal(context, command, handler || kubectlDone(context));
    });
}
function invokeWithProgress(context, command, progressMessage, handler) {
    return __awaiter(this, void 0, void 0, function* () {
        return context.host.withProgress((p) => {
            return new Promise((resolve) => {
                p.report({ message: progressMessage });
                kubectlInternal(context, command, (code, stdout, stderr) => {
                    resolve();
                    (handler || kubectlDone(context))(code, stdout, stderr);
                });
            });
        });
    });
}
function invokeAsync(context, command, stdin, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkPresent(context, CheckPresentMessageMode.Command)) {
            const bin = yield baseKubectlPath(context);
            const cmd = `${bin} ${command}`;
            let sr;
            if (stdin) {
                sr = yield context.shell.exec(cmd, stdin);
            }
            else {
                sr = yield context.shell.execStreaming(cmd, callback);
            }
            if (sr && sr.code !== 0) {
                checkPossibleIncompatibility(context);
            }
            return sr;
        }
        else {
            return { code: -1, stdout: '', stderr: '' };
        }
    });
}
// TODO: invalidate this when the context changes or if we know kubectl has changed (e.g. config)
let checkedCompatibility = false; // We don't want to spam the user (or CPU!) repeatedly running the version check
function checkPossibleIncompatibility(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (checkedCompatibility) {
            return;
        }
        checkedCompatibility = true;
        const compat = yield compatibility.check((cmd) => asJson(context, cmd));
        if (!compatibility.isGuaranteedCompatible(compat) && compat.didCheck) {
            const versionAlert = `kubectl version ${compat.clientVersion} may be incompatible with cluster Kubernetes version ${compat.serverVersion}`;
            context.host.showWarningMessage(versionAlert);
        }
    });
}
function invokeAsyncWithProgress(context, command, progressMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        return context.host.withProgress((p) => __awaiter(this, void 0, void 0, function* () {
            p.report({ message: progressMessage });
            return yield invokeAsync(context, command);
        }));
    });
}
function spawnAsChild(context, command) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkPresent(context, CheckPresentMessageMode.Command)) {
            return child_process_1.spawn(yield path(context), command, context.shell.execOpts());
        }
        return undefined;
    });
}
function invokeInTerminal(context, command, pipeTo, terminal) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkPresent(context, CheckPresentMessageMode.Command)) {
            // You might be tempted to think we needed to add 'wsl' here if user is using wsl
            // but this runs in the context of a vanilla terminal, which is controlled by the
            // existing preference, so it's not necessary.
            // But a user does need to default VS code to use WSL in the settings.json
            const kubectlCommand = `kubectl ${command}`;
            const fullCommand = pipeTo ? `${kubectlCommand} | ${pipeTo}` : kubectlCommand;
            terminal.sendText(fullCommand);
            terminal.show();
        }
    });
}
function runAsTerminal(context, command, terminalName) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkPresent(context, CheckPresentMessageMode.Command)) {
            let execPath = yield path(context);
            const cmd = command;
            if (config_1.getUseWsl()) {
                cmd.unshift(execPath);
                // Note VS Code is picky here. It requires the '.exe' to work
                execPath = 'wsl.exe';
            }
            const term = context.host.createTerminal(terminalName, execPath, cmd);
            term.show();
        }
    });
}
function kubectlInternal(context, command, handler) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkPresent(context, CheckPresentMessageMode.Command)) {
            const bin = yield baseKubectlPath(context);
            const cmd = `${bin} ${command}`;
            const sr = yield context.shell.exec(cmd);
            if (sr) {
                handler(sr.code, sr.stdout, sr.stderr);
            }
        }
    });
}
function kubectlDone(context) {
    return (result, stdout, stderr) => {
        if (result !== 0) {
            context.host.showErrorMessage('Kubectl command failed: ' + stderr);
            console.log(stderr);
            checkPossibleIncompatibility(context);
            return;
        }
        yaml_schema_1.updateYAMLSchema(); // TODO: I really do not like having this here. Massive separation of concerns red flag plus we lack context to decide whether it's needed. But hard to move without revamping the result handling system.
        context.host.showInformationMessage(stdout);
    };
}
function unquotedBaseKubectlPath(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (context.pathfinder) {
            return yield context.pathfinder();
        }
        let bin = config_1.getToolPath(context.host, context.shell, 'kubectl');
        if (!bin) {
            bin = 'kubectl';
        }
        return bin;
    });
}
function baseKubectlPath(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let bin = yield unquotedBaseKubectlPath(context);
        if (bin && bin.includes(' ')) {
            bin = `"${bin}"`;
        }
        return bin;
    });
}
function asLines(context, command) {
    return __awaiter(this, void 0, void 0, function* () {
        const shellResult = yield invokeAsync(context, command);
        if (!shellResult) {
            return { succeeded: false, error: [`Unable to run command (${command})`] };
        }
        if (shellResult.code === 0) {
            let lines = shellResult.stdout.split('\n');
            lines.shift();
            lines = lines.filter((l) => l.length > 0);
            return { succeeded: true, result: lines };
        }
        return { succeeded: false, error: [shellResult.stderr] };
    });
}
function fromLines(context, command) {
    return __awaiter(this, void 0, void 0, function* () {
        const shellResult = yield invokeAsync(context, command);
        if (!shellResult) {
            return { succeeded: false, error: [`Unable to run command (${command})`] };
        }
        if (shellResult.code === 0) {
            let lines = shellResult.stdout.split('\n');
            lines = lines.filter((l) => l.length > 0);
            const parsedOutput = outputUtils_1.parseLineOutput(lines, KUBECTL_OUTPUT_COLUMN_SEPARATOR);
            return { succeeded: true, result: parsedOutput };
        }
        return { succeeded: false, error: [shellResult.stderr] };
    });
}
function asJson(context, command) {
    return __awaiter(this, void 0, void 0, function* () {
        const shellResult = yield invokeAsync(context, command);
        if (!shellResult) {
            return { succeeded: false, error: [`Unable to run command (${command})`] };
        }
        if (shellResult.code === 0) {
            return { succeeded: true, result: JSON.parse(shellResult.stdout.trim()) };
        }
        return { succeeded: false, error: [shellResult.stderr] };
    });
}
function path(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const bin = yield baseKubectlPath(context);
        return binutil.execPath(context.shell, bin);
    });
}
//# sourceMappingURL=kubectl.js.map