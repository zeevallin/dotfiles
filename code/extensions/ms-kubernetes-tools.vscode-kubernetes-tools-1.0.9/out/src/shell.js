'use strict';
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
const shelljs = require("shelljs");
const path = require("path");
const config_1 = require("./components/config/config");
const host_1 = require("./host");
var Platform;
(function (Platform) {
    Platform[Platform["Windows"] = 0] = "Windows";
    Platform[Platform["MacOS"] = 1] = "MacOS";
    Platform[Platform["Linux"] = 2] = "Linux";
    Platform[Platform["Unsupported"] = 3] = "Unsupported";
})(Platform = exports.Platform || (exports.Platform = {}));
exports.shell = {
    isWindows: isWindows,
    isUnix: isUnix,
    platform: platform,
    home: home,
    combinePath: combinePath,
    fileUri: fileUri,
    execOpts: execOpts,
    exec: exec,
    execStreaming: execStreaming,
    execCore: execCore,
    unquotedPath: unquotedPath,
    which: which,
    cat: cat,
    ls: ls,
};
const WINDOWS = 'win32';
function isWindows() {
    return (process.platform === WINDOWS) && !config_1.getUseWsl();
}
function isUnix() {
    return !isWindows();
}
function platform() {
    if (config_1.getUseWsl()) {
        return Platform.Linux;
    }
    switch (process.platform) {
        case 'win32': return Platform.Windows;
        case 'darwin': return Platform.MacOS;
        case 'linux': return Platform.Linux;
        default: return Platform.Unsupported;
    }
}
function concatIfSafe(homeDrive, homePath) {
    if (homeDrive && homePath) {
        const safe = !homePath.toLowerCase().startsWith('\\windows\\system32');
        if (safe) {
            return homeDrive.concat(homePath);
        }
    }
    return undefined;
}
function home() {
    if (config_1.getUseWsl()) {
        return shelljs.exec('wsl.exe echo ${HOME}').stdout.trim();
    }
    return process.env['HOME'] ||
        concatIfSafe(process.env['HOMEDRIVE'], process.env['HOMEPATH']) ||
        process.env['USERPROFILE'] ||
        '';
}
function combinePath(basePath, relativePath) {
    let separator = '/';
    if (isWindows()) {
        relativePath = relativePath.replace(/\//g, '\\');
        separator = '\\';
    }
    return basePath + separator + relativePath;
}
function isWindowsFilePath(filePath) {
    return filePath[1] === ':' && filePath[2] === '\\';
}
function fileUri(filePath) {
    if (isWindowsFilePath(filePath)) {
        return vscode.Uri.parse('file:///' + filePath.replace(/\\/g, '/'));
    }
    return vscode.Uri.parse('file://' + filePath);
}
function execOpts() {
    let env = process.env;
    if (isWindows()) {
        env = Object.assign({}, env, { HOME: home() });
    }
    env = shellEnvironment(env);
    const opts = {
        cwd: vscode.workspace.rootPath,
        env: env,
        async: true
    };
    return opts;
}
function exec(cmd, stdin) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield execCore(cmd, execOpts(), null, stdin);
        }
        catch (ex) {
            vscode.window.showErrorMessage(ex);
            return undefined;
        }
    });
}
function execStreaming(cmd, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield execCore(cmd, execOpts(), callback);
        }
        catch (ex) {
            vscode.window.showErrorMessage(ex);
            return undefined;
        }
    });
}
function execCore(cmd, opts, callback, stdin) {
    return new Promise((resolve) => {
        if (config_1.getUseWsl()) {
            cmd = 'wsl ' + cmd;
        }
        const proc = shelljs.exec(cmd, opts, (code, stdout, stderr) => resolve({ code: code, stdout: stdout, stderr: stderr }));
        if (stdin) {
            proc.stdin.end(stdin);
        }
        if (callback) {
            callback(proc);
        }
    });
}
function unquotedPath(path) {
    if (isWindows() && path && path.length > 1 && path.startsWith('"') && path.endsWith('"')) {
        return path.substring(1, path.length - 1);
    }
    return path;
}
function shellEnvironment(baseEnvironment) {
    const env = Object.assign({}, baseEnvironment);
    const pathVariable = pathVariableName(env);
    for (const tool of ['kubectl', 'helm', 'draft', 'minikube']) {
        const toolPath = config_1.getToolPath(host_1.host, exports.shell, tool);
        if (toolPath) {
            const toolDirectory = path.dirname(toolPath);
            const currentPath = env[pathVariable];
            env[pathVariable] = toolDirectory + (currentPath ? `${pathEntrySeparator()}${currentPath}` : '');
        }
    }
    const kubeconfig = config_1.getActiveKubeconfig();
    if (kubeconfig) {
        env['KUBECONFIG'] = kubeconfig;
    }
    return env;
}
exports.shellEnvironment = shellEnvironment;
function pathVariableName(env) {
    if (isWindows()) {
        for (const v of Object.keys(env)) {
            if (v.toLowerCase() === "path") {
                return v;
            }
        }
    }
    return "PATH";
}
function pathEntrySeparator() {
    return isWindows() ? ';' : ':';
}
function which(bin) {
    if (config_1.getUseWsl()) {
        const result = shelljs.exec(`wsl.exe which ${bin}`);
        if (result.code !== 0) {
            throw new Error(result.stderr);
        }
        return result.stdout;
    }
    return shelljs.which(bin);
}
function cat(path) {
    if (config_1.getUseWsl()) {
        const filePath = path.replace(/\\/g, '/');
        const result = shelljs.exec(`wsl.exe cat ${filePath}`);
        if (result.code !== 0) {
            throw new Error(result.stderr);
        }
        return result.stdout;
    }
    return shelljs.cat(path);
}
function ls(path) {
    if (config_1.getUseWsl()) {
        const filePath = path.replace(/\\/g, '/');
        const result = shelljs.exec(`wsl.exe ls ${filePath}`);
        if (result.code !== 0) {
            throw new Error(result.stderr);
        }
        return result.stdout.trim().split('\n');
    }
    return shelljs.ls(path);
}
function shellMessage(sr, invocationFailureMessage) {
    if (!sr) {
        return invocationFailureMessage;
    }
    return sr.code === 0 ? sr.stdout : sr.stderr;
}
exports.shellMessage = shellMessage;
//# sourceMappingURL=shell.js.map