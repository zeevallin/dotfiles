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
const rx = require("rxjs");
const spawnrx = require("spawn-rx");
const child_process_1 = require("child_process");
const installdependencies_1 = require("./components/installer/installdependencies");
const config_1 = require("./components/config/config");
const errorable_1 = require("./errorable");
const outputUtils_1 = require("./outputUtils");
var ExecResult;
(function (ExecResult) {
    function tryMap(execResult, fn) {
        if (execResult.resultKind === 'exec-bin-not-found') {
            return { succeeded: false, error: [`${execResult.execProgram.displayName} command failed trying to run '${execResult.command}': ${execResult.execProgram.binBaseName} not found`] };
        }
        if (execResult.resultKind === 'exec-failed') {
            return { succeeded: false, error: [`${execResult.execProgram.displayName} command failed trying to run '${execResult.command}': unable to run ${execResult.execProgram.binBaseName}`] };
        }
        if (execResult.resultKind === 'exec-succeeded') {
            return { succeeded: true, result: fn(execResult.stdout.trim()) };
        }
        return { succeeded: false, error: [execResult.stderr] };
    }
    ExecResult.tryMap = tryMap;
    function map(execResult, fn) {
        if (ExecResult.failed(execResult)) {
            return execResult;
        }
        return {
            resultKind: execResult.resultKind,
            execProgram: execResult.execProgram,
            command: execResult.command,
            result: fn(execResult.stdout.trim())
        };
    }
    ExecResult.map = map;
    function failureMessage(execResult, options) {
        const err = ExecResult.tryMap(execResult, (s) => s);
        if (errorable_1.Errorable.failed(err)) {
            const prefix = options.whatFailed ?
                `${options.whatFailed}: ` :
                '';
            return prefix + err.error[0];
        }
        return '';
    }
    ExecResult.failureMessage = failureMessage;
    function failed(execResult) {
        return execResult.resultKind !== 'exec-succeeded';
    }
    ExecResult.failed = failed;
    function succeeded(execResult) {
        return execResult.resultKind === 'exec-succeeded';
    }
    ExecResult.succeeded = succeeded;
    function asErrorable(execResult, options) {
        if (failed(execResult)) {
            return { succeeded: false, error: [failureMessage(execResult, options)] };
        }
        return { succeeded: true, result: execResult.result };
    }
    ExecResult.asErrorable = asErrorable;
})(ExecResult = exports.ExecResult || (exports.ExecResult = {}));
function unquotedBaseBinPath(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (context.pathfinder) {
            return yield context.pathfinder();
        }
        if (context.status && context.status.found && context.status.how === 'config') {
            return context.status.where;
        }
        return context.binary.binBaseName;
    });
}
function baseBinPath(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let binPath = yield unquotedBaseBinPath(context);
        if (binPath && binPath.includes(' ')) {
            binPath = `"${binPath}"`;
        }
        return binPath;
    });
}
// This is silent - just caching over findBinaryCore
function findBinary(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (context.status && context.status.found) {
            return context.status;
        }
        const fbr = yield findBinaryCore(context);
        context.status = fbr;
        return fbr;
    });
}
exports.findBinary = findBinary;
// This is silent: tells us whether we can find the required binary
function findBinaryCore(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (context.pathfinder) {
            return { found: true, how: 'pathfinder' };
        }
        // Do we have a configured location?
        const configuredPath = config_1.getToolPath(context.host, context.shell, context.binary.configKeyName);
        if (configuredPath) {
            // Does the file exist?
            if (config_1.getUseWsl()) {
                const sr = yield context.shell.exec(`ls ${configuredPath}`);
                const found = (!!sr && sr.code === 0);
                return { found, how: 'config', where: configuredPath };
            }
            else {
                const found = yield context.fs.existsAsync(configuredPath);
                return { found, how: 'config', where: configuredPath };
            }
        }
        // No config so look on the system PATH
        const cmd = context.shell.isWindows() ? `where.exe ${context.binary.binBaseName}.exe` : `which ${context.binary.binBaseName}`;
        const opts = {
            async: true,
            env: {
                HOME: process.env.HOME,
                PATH: process.env.PATH
            }
        };
        const execResult = yield context.shell.execCore(cmd, opts);
        if (execResult.code !== 0) {
            return { found: false, how: 'path' };
        }
        return { found: true, how: 'path', where: execResult.stdout };
    });
}
// This is silent - building block for experiences that need an input->output invoke
function invokeForResult(context, command, stdin) {
    return __awaiter(this, void 0, void 0, function* () {
        const fbr = yield findBinary(context);
        if (!fbr.found) {
            return { resultKind: 'exec-bin-not-found', execProgram: context.binary, command, findResult: fbr };
        }
        const bin = yield baseBinPath(context);
        const cmd = `${bin} ${command}`;
        const sr = yield context.shell.exec(cmd, stdin);
        if (!sr) {
            return { resultKind: 'exec-failed', execProgram: context.binary, command };
        }
        if (sr.code === 0) {
            return { resultKind: 'exec-succeeded', execProgram: context.binary, command, stdout: sr.stdout };
        }
        return { resultKind: 'exec-errored', execProgram: context.binary, command, code: sr.code, stderr: sr.stderr };
    });
}
exports.invokeForResult = invokeForResult;
function invokeTracking(context, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const linesSubject = new rx.Subject();
        const fbr = yield findBinary(context);
        if (!fbr.found) {
            linesSubject.error({ resultKind: 'exec-bin-not-found', execProgram: context.binary, command: args.join(' '), findResult: fbr });
        }
        const bin = yield baseBinPath(context);
        let pending = '';
        const stdout = spawnrx.spawn(bin, args);
        stdout.subscribe((chunk) => {
            const todo = pending + chunk;
            const lines = todo.split('\n').map((l) => l.trim());
            const lastIsWholeLine = todo.endsWith('\n');
            pending = lastIsWholeLine ? '' : lines.pop();
            for (const line of lines) {
                linesSubject.next(line);
            }
        });
        return { lines: linesSubject, terminate: () => linesSubject.unsubscribe() };
    });
}
exports.invokeTracking = invokeTracking;
function invokeBackground(context, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const fbr = yield findBinary(context);
        if (!fbr.found) {
            return { resultKind: 'exec-bin-not-found', execProgram: context.binary, command: args.join(' '), findResult: fbr };
        }
        const bin = yield baseBinPath(context);
        const childProcess = child_process_1.spawn(bin, args, context.shell.execOpts());
        return { resultKind: 'exec-child-process-started', execProgram: context.binary, command: args.join(' '), childProcess };
    });
}
exports.invokeBackground = invokeBackground;
// This is noisy - handles failure UI for an interactive command that performs an invokeForResult
function discardFailureInteractive(context, result, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const prefix = options.whatFailed ?
            `${options.whatFailed}: ` :
            '';
        const announcement = `${prefix}${result.execProgram.displayName} command failed`;
        switch (result.resultKind) {
            case 'exec-bin-not-found':
                yield showErrorMessageWithInstallPrompt(context, result.findResult, `${announcement}: ${result.execProgram.binBaseName} not found`);
                return undefined;
            case 'exec-failed':
                yield context.host.showErrorMessage(`${announcement}: unable to run ${result.execProgram.binBaseName}`);
                return undefined;
            case 'exec-errored':
                yield context.host.showErrorMessage(`${announcement}: ${result.stderr}`);
                return undefined;
            case 'exec-succeeded':
                return result;
        }
    });
}
exports.discardFailureInteractive = discardFailureInteractive;
function showErrorMessageWithInstallPrompt(context, findResult, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const binary = context.binary;
        switch (findResult.how) {
            case 'path':
                return showErrorMessageWithInstallPromptForSystemPath(context, message, binary);
            case 'config':
                return showErrorMessageWithInstallPromptForConfiguredBinPath(context, message);
        }
    });
}
exports.showErrorMessageWithInstallPrompt = showErrorMessageWithInstallPrompt;
function showErrorMessageWithInstallPromptForSystemPath(context, message, binary) {
    return __awaiter(this, void 0, void 0, function* () {
        const choice = yield context.host.showErrorMessage(message, 'Install dependencies', 'Learn more');
        switch (choice) {
            case 'Learn more':
                context.host.showInformationMessage(`Add '${binary.binBaseName}' directory to path, or set "vs-kubernetes.${binary.configKeyName}-path" config to ${binary.binBaseName} binary.`);
                break;
            case 'Install dependencies':
                installdependencies_1.installDependencies();
                break;
        }
    });
}
function showErrorMessageWithInstallPromptForConfiguredBinPath(context, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const choice = yield context.host.showErrorMessage(message, 'Install dependencies');
        if (choice === 'Install dependencies') {
            installdependencies_1.installDependencies();
        }
    });
}
function logText(context, execResult) {
    switch (execResult.resultKind) {
        case 'exec-bin-not-found':
            return `*** ${context.binary.binBaseName} binary not found (using ${context.status ? context.status.how : '(unknown strategy)'})`;
        case 'exec-failed':
            return `*** failed to invoke ${context.binary.binBaseName} (from ${context.status ? (context.status.how === 'config' ? context.status.where : 'path') : '(unknown strategy)'}`;
        case 'exec-errored':
            return `${context.binary.binBaseName} exited with code ${execResult.code}\n${execResult.stderr}`;
        case 'exec-succeeded':
            return '';
    }
}
exports.logText = logText;
function parseJSON(execResult) {
    return ExecResult.tryMap(execResult, (text) => JSON.parse(text));
}
exports.parseJSON = parseJSON;
function parseTable(execResult, columnSeparator) {
    return ExecResult.tryMap(execResult, (text) => parseLinedText(text, columnSeparator));
}
exports.parseTable = parseTable;
function parseLinedText(text, columnSeparator) {
    const lines = text.split('\n').filter((l) => l.length > 0);
    const parsedOutput = outputUtils_1.parseLineOutput(lines, columnSeparator);
    return parsedOutput;
}
exports.parseLinedText = parseLinedText;
//# sourceMappingURL=binutilplusplus.js.map