'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const shell_1 = require("./shell");
const fs_1 = require("./fs");
const yaml = require("js-yaml");
function readKubectlConfig() {
    return new Promise((resolve, reject) => {
        const kubeConfig = shell_1.shell.combinePath(shell_1.shell.home(), ".kube/config");
        fs_1.fs.readFile(kubeConfig, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            const kcconfigf = data;
            const kcconfig = yaml.safeLoad(kcconfigf);
            const apiVersion = kcconfig['apiVersion'];
            const currentContextName = kcconfig['current-context'];
            const currentContextDef = kcconfig['contexts'].find((c) => c['name'] === currentContextName);
            if (!currentContextDef) {
                reject({ kubectlError: 'noCurrentContext', message: 'No current context in .kube/config' });
                return;
            }
            const currentContext = currentContextDef['context'];
            const currentClusterDef = kcconfig['clusters'].find((c) => c['name'] === currentContext['cluster']);
            if (!currentClusterDef) {
                reject({ kubectlError: 'noCluster', message: 'Invalid cluster in current context in .kube/config' });
                return;
            }
            const currentCluster = currentClusterDef['cluster'];
            const endpoint = currentCluster['server'];
            const cadata = currentCluster['certificate-authority-data'];
            const cadataFile = currentCluster['certificate-authority'];
            const currentUserDef = kcconfig['users'].find((u) => u['name'] === currentContext['user']);
            if (!currentUserDef) {
                reject({ kubectlError: 'noUser', message: 'Invalid user in current context in .kube/config' });
                return;
            }
            const currentUser = currentUserDef['user'];
            const clientCertData = currentUser['client-certificate-data'];
            const clientKeyData = currentUser['client-key-data'];
            const clientCertDataFile = currentUser['client-certificate'];
            const clientKeyFile = currentUser['client-key'];
            resolve({
                endpoint: endpoint,
                clientCertificateData: clientCertDataFile ? fs_1.fs.readFileToBufferSync(clientCertDataFile) : Buffer.from(clientCertData, 'base64'),
                clientKeyData: clientKeyFile ? fs_1.fs.readFileToBufferSync(clientKeyFile) : Buffer.from(clientKeyData, 'base64'),
                certificateAuthorityData: cadataFile ? fs_1.fs.readFileToBufferSync(cadataFile) : Buffer.from(cadata, 'base64')
            });
        });
    });
}
exports.readKubectlConfig = readKubectlConfig;
//# sourceMappingURL=kubeconfig.js.map