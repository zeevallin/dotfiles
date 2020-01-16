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
const syspath = require("path");
const binutil = require("../binutil");
const config_1 = require("../components/config/config");
function create(host, fs, shell, installDependenciesCallback) {
    return new DraftImpl(host, fs, shell, installDependenciesCallback, false);
}
exports.create = create;
var CheckPresentMode;
(function (CheckPresentMode) {
    CheckPresentMode[CheckPresentMode["Alert"] = 0] = "Alert";
    CheckPresentMode[CheckPresentMode["Silent"] = 1] = "Silent";
})(CheckPresentMode = exports.CheckPresentMode || (exports.CheckPresentMode = {}));
class DraftImpl {
    constructor(host, fs, shell, installDependenciesCallback, draftFound) {
        this.context = { host: host, fs: fs, shell: shell, installDependenciesCallback: installDependenciesCallback, binFound: draftFound, binPath: 'draft' };
    }
    checkPresent(mode) {
        return checkPresent(this.context, mode);
    }
    isFolderMapped(path) {
        return isFolderMapped(this.context, path);
    }
    packs() {
        return packs(this.context);
    }
    create(appName, pack, path) {
        return invokeCreate(this.context, appName, pack, path);
    }
    up() {
        return up(this.context);
    }
    version() {
        return version(this.context);
    }
}
function checkPresent(context, mode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (context.binFound) {
            return true;
        }
        return yield checkForDraftInternal(context, mode);
    });
}
function packs(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkPresent(context, CheckPresentMode.Alert)) {
            const dpResult = yield context.shell.exec(`"${context.binPath}" pack list`);
            if (dpResult && dpResult.code === 0) {
                // Packs may be of the form path/to/the/actual/name
                // We also may have spurious ones under github.com/Azure/draft/{cmd|pkg}
                const packs = dpResult.stdout.split('\n')
                    .slice(1) // remove "Available packs" line
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0)
                    .filter((p) => !isSpuriousPackPath(p))
                    .map((p) => packNameFromPath(p));
                return packs;
            }
        }
        return undefined;
    });
}
function invokeCreate(context, appName, pack, path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkPresent(context, CheckPresentMode.Alert)) {
            const packOpt = pack ? ` -p ${pack}` : '';
            const cmd = `create -a ${appName} ${packOpt} "${path}"`;
            const result = yield context.shell.exec(`"${context.binPath}" ${cmd}`);
            if (result && result.code === 0 && result.stdout.indexOf('chart directory charts/ already exists') >= 0) {
                const draftManifestFile = syspath.join(path, 'draft.toml');
                const hasDraftManifest = context.fs.existsSync(draftManifestFile);
                if (!hasDraftManifest) {
                    const toml = `[environments]
  [environments.development]
    name = "${appName}"
    namespace = "default"
    wait = true
    watch = false
    watch-delay = 2
    auto-connect = false
    dockerfile = ""
    chart = ""`;
                    context.fs.writeFileSync(draftManifestFile, toml);
                    return { code: 0, stdout: '--> skipping pack detection - chart directory charts/ already exists. Ready to sail!', stderr: '' };
                }
            }
            return result;
        }
        return undefined;
    });
}
function up(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkPresent(context, CheckPresentMode.Alert)) {
            if (context.shell.isUnix()) {
                const term = context.host.createTerminal('draft up', `bash`, ['-c', `draft up ; bash`]);
                term.show(true);
            }
            else {
                const term = context.host.createTerminal('draft up', 'powershell.exe', ['-NoExit', `draft`, `up`]);
                term.show(true);
            }
        }
    });
}
function version(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield checkPresent(context, CheckPresentMode.Alert)) {
            const result = yield context.shell.exec(`"${context.binPath}" version`);
            if (result && result.code === 0) {
                return { succeeded: true, result: result.stdout.trim() };
            }
            return { succeeded: false, error: [result ? result.stderr : "Unable to run Draft"] };
        }
        return { succeeded: false, error: [''] }; // already alerted
    });
}
function checkForDraftInternal(context, mode) {
    return __awaiter(this, void 0, void 0, function* () {
        const binName = 'draft';
        const bin = config_1.getToolPath(context.host, context.shell, binName);
        const inferFailedMessage = `Could not find "${binName}" binary.`;
        // TODO: this is duplicated in various places...
        const configuredFileMissingMessage = `${bin} does not exist!`;
        return binutil.checkForBinary(context, bin, binName, inferFailedMessage, configuredFileMissingMessage, mode === CheckPresentMode.Alert);
    });
}
function isFolderMapped(context, path) {
    // Heuristic based on files created by 'draft create'
    const tomlFile = syspath.join(path, 'draft.toml');
    const ignoreFile = syspath.join(path, '.draftignore');
    return context.fs.existsSync(tomlFile) && context.fs.existsSync(ignoreFile);
}
function isSpuriousPackPath(path) {
    return path.indexOf('draft/pkg') >= 0
        || path.indexOf('draft/cmd') >= 0;
}
function packNameFromPath(path) {
    const parsePoint = path.lastIndexOf('/');
    return path.substring(parsePoint + 1);
}
//# sourceMappingURL=draft.js.map