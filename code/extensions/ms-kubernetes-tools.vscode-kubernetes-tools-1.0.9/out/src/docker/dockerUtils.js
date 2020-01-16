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
const fs = require("fs");
const path = require("path");
const url = require("url");
const kubectlUtils_1 = require("../kubectlUtils");
const shell_1 = require("../shell");
const dictionary_1 = require("../utils/dictionary");
/**
 * When using the command "minikube docker-env" to get the local kubernetes docker env, it needs run with the admin privilege.
 * To workaround this, this function will try to resolve the equivalent docker env from kubeconfig instead.
 */
function resolveKubernetesDockerEnv(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const dockerEnv = dictionary_1.Dictionary.of();
        dockerEnv["DOCKER_API_VERSION"] = yield dockerApiVersion();
        const currentCluster = yield kubectlUtils_1.getCurrentClusterConfig(kubectl);
        if (!currentCluster || !currentCluster.server || !currentCluster.certificateAuthority) {
            return {};
        }
        if (/^https/.test(currentCluster.server)) {
            dockerEnv["DOCKER_TLS_VERIFY"] = 1;
        }
        const serverUrl = url.parse(currentCluster.server);
        dockerEnv["DOCKER_HOST"] = `tcp://${serverUrl.hostname}:2376`;
        const certDir = path.dirname(currentCluster.certificateAuthority);
        if (fs.existsSync(path.join(certDir, "certs"))) {
            dockerEnv["DOCKER_CERT_PATH"] = path.join(certDir, "certs");
        }
        else {
            dockerEnv["DOCKER_CERT_PATH"] = certDir;
        }
        return dockerEnv;
    });
}
exports.resolveKubernetesDockerEnv = resolveKubernetesDockerEnv;
function dockerApiVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultDockerVersion = "1.23";
        const versionResult = yield shell_1.shell.exec(`docker version --format "{{.Client.APIVersion}}"`);
        if (versionResult && versionResult.code === 0) {
            return versionResult.stdout.trim();
        }
        return defaultDockerVersion;
    });
}
//# sourceMappingURL=dockerUtils.js.map