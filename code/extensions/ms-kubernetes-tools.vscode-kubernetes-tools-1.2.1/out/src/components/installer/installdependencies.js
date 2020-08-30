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
const helmexec = require("../../helm.exec");
const kubeChannel_1 = require("../../kubeChannel");
const kubectl_1 = require("../../kubectl");
const draft_1 = require("../../draft/draft");
const minikube_1 = require("../clusterprovider/minikube/minikube");
const fs_1 = require("../../fs");
const host_1 = require("../../host");
const shell_1 = require("../../shell");
const config = require("../config/config");
const installer_1 = require("./installer");
const errorable_1 = require("../../errorable");
const kubectl = kubectl_1.create(config.getKubectlVersioning(), host_1.host, fs_1.fs, shell_1.shell);
const draft = draft_1.create(host_1.host, fs_1.fs, shell_1.shell);
const minikube = minikube_1.create(host_1.host, fs_1.fs, shell_1.shell);
function installDependencies() {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: gosh our binchecking is untidy
        const gotKubectl = yield kubectl.ensurePresent({ silent: true });
        const gotHelm = helmexec.ensureHelm(helmexec.EnsureMode.Silent);
        const gotDraft = yield draft.checkPresent(draft_1.CheckPresentMode.Silent);
        const gotMinikube = yield minikube.checkPresent(minikube_1.CheckPresentMode.Silent);
        const warn = (m) => kubeChannel_1.kubeChannel.showOutput(m);
        const installPromises = [
            installDependency("kubectl", gotKubectl, installer_1.installKubectl),
            installDependency("Helm", gotHelm, (sh) => installer_1.installHelm(sh, warn)),
            installDependency("Draft", gotDraft, installer_1.installDraft),
        ];
        if (!config.getUseWsl()) {
            // TODO: Install Win32 Minikube
            installPromises.push(installDependency("Minikube", gotMinikube, (sh) => installer_1.installMinikube(sh, null)));
        }
        yield Promise.all(installPromises);
        kubeChannel_1.kubeChannel.showOutput("Done");
    });
}
exports.installDependencies = installDependencies;
function installDependency(name, alreadyGot, installFunc) {
    return __awaiter(this, void 0, void 0, function* () {
        if (alreadyGot) {
            kubeChannel_1.kubeChannel.showOutput(`Already got ${name}...`);
        }
        else {
            kubeChannel_1.kubeChannel.showOutput(`Installing ${name}...`);
            const result = yield installFunc(shell_1.shell);
            if (errorable_1.failed(result)) {
                kubeChannel_1.kubeChannel.showOutput(`Unable to install ${name}: ${result.error[0]}`);
            }
        }
    });
}
//# sourceMappingURL=installdependencies.js.map