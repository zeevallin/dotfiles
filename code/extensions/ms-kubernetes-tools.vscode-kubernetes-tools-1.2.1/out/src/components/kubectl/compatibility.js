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
const errorable_1 = require("../../errorable");
function isGuaranteedCompatible(c) {
    return c.guaranteed;
}
exports.isGuaranteedCompatible = isGuaranteedCompatible;
function check(kubectlLoadJSON) {
    return __awaiter(this, void 0, void 0, function* () {
        const version = yield kubectlLoadJSON('version -o json');
        if (errorable_1.failed(version)) {
            return {
                guaranteed: false,
                didCheck: false,
                clientVersion: '',
                serverVersion: ''
            };
        }
        const clientVersion = version.result.clientVersion;
        const serverVersion = version.result.serverVersion;
        if (isCompatible(clientVersion, serverVersion)) {
            return { guaranteed: true };
        }
        return {
            guaranteed: false,
            didCheck: true,
            clientVersion: clientVersion.gitVersion,
            serverVersion: serverVersion.gitVersion
        };
    });
}
exports.check = check;
function isCompatible(clientVersion, serverVersion) {
    if (clientVersion.major === serverVersion.major) {
        const clientMinor = Number.parseInt(clientVersion.minor);
        const serverMinor = Number.parseInt(serverVersion.minor);
        if (Number.isInteger(clientMinor) && Number.isInteger(serverMinor) && Math.abs(clientMinor - serverMinor) <= 1) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=compatibility.js.map