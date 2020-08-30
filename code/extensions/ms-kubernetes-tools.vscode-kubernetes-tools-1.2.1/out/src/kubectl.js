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
const host_1 = require("./host");
const binutil = require("./binutil");
const outputUtils_1 = require("./outputUtils");
const compatibility = require("./components/kubectl/compatibility");
const config_1 = require("./components/config/config");
const autoversion_1 = require("./components/kubectl/autoversion");
const binutilplusplus_1 = require("./binutilplusplus");
const yaml_schema_1 = require("./yaml-support/yaml-schema");
const KUBECTL_OUTPUT_COLUMN_SEPARATOR = /\s\s+/g;
const KUBECTL_BINARY = {
    binBaseName: 'kubectl',
    configKeyName: 'kubectl',
    displayName: 'Kubectl',
    offersInstall: true,
};
// TODO: invalidate this when the context changes or if we know kubectl has changed (e.g. config)
let checkedCompatibility = false; // We don't want to spam the user (or CPU!) repeatedly running the version check
class KubectlImpl {
    constructor(host, fs, shell, pathfinder, kubectlFound /* TODO: this is now safe to remove */) {
        this.sharedTerminal = null;
        this.context = {
            host: host,
            fs: fs,
            shell: shell,
            pathfinder: pathfinder,
            binFound: kubectlFound,
            binPath: 'kubectl',
            binary: KUBECTL_BINARY,
            status: undefined
        };
    }
    checkPresent(errorMessageMode) {
        return checkPresent(this.context, errorMessageMode);
    }
    legacyInvokeAsync(command, stdin, callback) {
        return invokeAsync(this.context, command, stdin, callback);
    }
    legacySpawnAsChild(command) {
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
    checkPossibleIncompatibility(afterError) {
        return __awaiter(this, void 0, void 0, function* () {
            if (checkedCompatibility) {
                return;
            }
            if (afterError.resultKind === 'exec-bin-not-found') {
                return;
            }
            checkedCompatibility = true;
            const kubectl = this;
            function kubectlLoadJSON(cmd) {
                return __awaiter(this, void 0, void 0, function* () {
                    const json = yield kubectl.readJSON(cmd);
                    return binutilplusplus_1.ExecResult.asErrorable(json, {});
                });
            }
            const compat = yield compatibility.check(kubectlLoadJSON);
            if (!compatibility.isGuaranteedCompatible(compat) && compat.didCheck) {
                const versionAlert = `kubectl version ${compat.clientVersion} may be incompatible with cluster Kubernetes version ${compat.serverVersion}`;
                this.context.host.showWarningMessage(versionAlert);
            }
        });
    }
    ensurePresent(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.context.pathfinder) {
                return true;
            }
            const status = yield binutilplusplus_1.findBinary(this.context);
            if (status.found) {
                return true;
            }
            if (!options.silent) {
                // TODO: suppressible once refactoring complete!
                binutilplusplus_1.showErrorMessageWithInstallPrompt(this.context, status, options.warningIfNotPresent);
            }
            return false;
        });
    }
    invokeCommand(command, stdin) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield binutilplusplus_1.invokeForResult(this.context, command, stdin);
        });
    }
    invokeCommandThen(command, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            const er = yield this.invokeCommand(command);
            const result = fn(er);
            return result;
        });
    }
    observeCommand(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield binutilplusplus_1.invokeTracking(this.context, args);
        });
    }
    spawnCommand(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield binutilplusplus_1.invokeBackground(this.context, args);
        });
    }
    invokeCommandWithFeedback(command, uiOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.context.host.longRunning(uiOptions, () => this.invokeCommand(command));
        });
    }
    invokeCommandWithFeedbackThen(command, uiOptions, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            const er = yield this.context.host.longRunning(uiOptions, () => this.invokeCommand(command));
            const result = fn(er);
            return result;
        });
    }
    reportResult(execResult, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const discardFailureOptions = { whatFailed: options.whatFailed };
            const success = yield binutilplusplus_1.discardFailureInteractive(this.context, execResult, discardFailureOptions);
            if (success) {
                if (options.updateSchemasOnSuccess) {
                    yaml_schema_1.updateYAMLSchema(); // TODO: boo - move to higher level
                }
                host_1.host.showInformationMessage(success.stdout);
            }
            else {
                console.log(binutilplusplus_1.logText(this.context, execResult));
                this.checkPossibleIncompatibility(execResult);
            }
            return success;
        });
    }
    reportFailure(execResult, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const discardFailureOptions = { whatFailed: options.whatFailed };
            yield binutilplusplus_1.discardFailureInteractive(this.context, execResult, discardFailureOptions);
            console.log(binutilplusplus_1.logText(this.context, execResult));
            this.checkPossibleIncompatibility(execResult);
        });
    }
    promptInstallDependencies(execResult, message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield binutilplusplus_1.showErrorMessageWithInstallPrompt(this.context, execResult.findResult, message);
        });
    }
    parseJSON(execResult) {
        return binutilplusplus_1.parseJSON(execResult);
    }
    parseTable(execResult) {
        return binutilplusplus_1.parseTable(execResult, KUBECTL_OUTPUT_COLUMN_SEPARATOR);
    }
    readJSON(command) {
        return __awaiter(this, void 0, void 0, function* () {
            const er = yield this.invokeCommand(command);
            return binutilplusplus_1.ExecResult.map(er, (s) => JSON.parse(s));
        });
    }
    readTable(command) {
        return __awaiter(this, void 0, void 0, function* () {
            const er = yield this.invokeCommand(command);
            return binutilplusplus_1.ExecResult.map(er, (s) => binutilplusplus_1.parseLinedText(s, KUBECTL_OUTPUT_COLUMN_SEPARATOR));
        });
    }
}
function create(versioning, host, fs, shell) {
    if (versioning === config_1.KubectlVersioning.Infer) {
        return createAutoVersioned(host, fs, shell);
    }
    return createSingleVersion(host, fs, shell);
}
exports.create = create;
function createSingleVersion(host, fs, shell) {
    return new KubectlImpl(host, fs, shell, undefined, false);
}
function createAutoVersioned(host, fs, shell) {
    const bootstrapper = createSingleVersion(host, fs, shell);
    const pathfinder = () => __awaiter(this, void 0, void 0, function* () { return (yield autoversion_1.ensureSuitableKubectl(bootstrapper, shell, host)) || 'kubectl'; });
    return new KubectlImpl(host, fs, shell, pathfinder, false);
}
function createOnBinary(host, fs, shell, bin) {
    const pathfinder = () => __awaiter(this, void 0, void 0, function* () { return bin; });
    return new KubectlImpl(host, fs, shell, pathfinder, false);
}
exports.createOnBinary = createOnBinary;
var CheckPresentMessageMode;
(function (CheckPresentMessageMode) {
    CheckPresentMessageMode[CheckPresentMessageMode["Command"] = 0] = "Command";
    CheckPresentMessageMode[CheckPresentMessageMode["Silent"] = 1] = "Silent";
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
    if (errorMessageMode === CheckPresentMessageMode.Command) {
        return ' Cannot execute command.';
    }
    return '';
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
                checkPossibleIncompatibilityLegacy(context);
            }
            return sr;
        }
        else {
            return { code: -1, stdout: '', stderr: '' };
        }
    });
}
function checkPossibleIncompatibilityLegacy(context) {
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