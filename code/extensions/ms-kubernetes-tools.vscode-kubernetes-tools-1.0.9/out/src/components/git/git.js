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
class Git {
    constructor(shell) {
        this.shell = shell;
    }
    git(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = `git ${args}`;
            const sr = yield this.shell.execCore(cmd, this.shell.execOpts());
            return sr;
        });
    }
    whenCreated(commitId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sr = yield this.git(`log --pretty=%ar -n 1 ${commitId}`);
            if (sr.code === 0) {
                return sr.stdout;
            }
            return null;
        });
    }
    checkout(commitId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sr = yield this.git(`checkout ${commitId}`);
            if (sr.code === 0) {
                return { succeeded: true, result: null };
            }
            return { succeeded: false, error: [sr.stderr] };
        });
    }
}
exports.Git = Git;
//# sourceMappingURL=git.js.map