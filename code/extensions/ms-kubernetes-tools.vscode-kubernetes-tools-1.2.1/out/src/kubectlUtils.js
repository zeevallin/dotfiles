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
const vscode = require("vscode");
const kubeChannel_1 = require("./kubeChannel");
const sleep_1 = require("./sleep");
const errorable_1 = require("./errorable");
const binutilplusplus_1 = require("./binutilplusplus");
const shell_1 = require("./shell");
function getKubeconfig(kubectl, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield kubectl.readJSON("config view -o json");
        if (binutilplusplus_1.ExecResult.failed(config)) {
            if (options.silent) {
                console.log(binutilplusplus_1.ExecResult.failureMessage(config, {}));
            }
            else {
                kubectl.reportFailure(config, {});
            }
            return null;
        }
        return config.result;
    });
}
function getCurrentClusterConfig(kubectl, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const kubeConfig = yield getKubeconfig(kubectl, options);
        if (!kubeConfig || !kubeConfig.clusters || !kubeConfig.contexts) {
            return undefined;
        }
        const contextConfig = kubeConfig.contexts.find((context) => context.name === kubeConfig["current-context"]); // current-context should refer to an actual context
        const clusterConfig = kubeConfig.clusters.find((cluster) => cluster.name === contextConfig.context.cluster);
        return {
            server: clusterConfig.cluster.server,
            certificateAuthority: clusterConfig.cluster["certificate-authority"]
        };
    });
}
exports.getCurrentClusterConfig = getCurrentClusterConfig;
function getContexts(kubectl, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const kubectlConfig = yield getKubeconfig(kubectl, options);
        if (!kubectlConfig) {
            return [];
        }
        const currentContext = kubectlConfig["current-context"];
        const contexts = kubectlConfig.contexts || [];
        return contexts.map((c) => {
            return {
                clusterName: c.context.cluster,
                contextName: c.name,
                userName: c.context.user,
                active: c.name === currentContext
            };
        });
    });
}
exports.getContexts = getContexts;
function getCurrentContext(kubectl, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const contexts = yield getContexts(kubectl, options);
        return contexts.find((c) => c.active);
    });
}
exports.getCurrentContext = getCurrentContext;
function deleteCluster(kubectl, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const deleteClusterResult = yield kubectl.invokeCommandWithFeedback(`config delete-cluster ${context.clusterName}`, "Deleting cluster...");
        if (binutilplusplus_1.ExecResult.failed(deleteClusterResult)) {
            const whatFailed = `Failed to remove the underlying cluster for context ${context.clusterName} from the kubeconfig`;
            kubeChannel_1.kubeChannel.showOutput(binutilplusplus_1.ExecResult.failureMessage(deleteClusterResult, { whatFailed }), `Delete ${context.contextName}`);
            if (deleteClusterResult.resultKind === 'exec-bin-not-found') {
                // Special handling for the first step in the process - if kubectl doesn't exist,
                // prompt to install dependencies and _don't try any further_.  (Not worth trying to
                // be this graceful about the possibility of kubectl disappearing between the first and
                // last steps though!)
                kubectl.promptInstallDependencies(deleteClusterResult, `Can't delete ${context.contextName}): kubectl not found`);
                return false;
            }
            vscode.window.showWarningMessage(`Failed to remove the underlying cluster for context ${context.contextName}. See Output window for more details.`);
        }
        const deleteUserResult = yield kubectl.invokeCommandWithFeedback(`config unset users.${context.userName}`, "Deleting user...");
        if (binutilplusplus_1.ExecResult.failed(deleteUserResult)) {
            const whatFailed = `Failed to remove the underlying user for context ${context.contextName} from the kubeconfig`;
            kubeChannel_1.kubeChannel.showOutput(binutilplusplus_1.ExecResult.failureMessage(deleteUserResult, { whatFailed }));
            vscode.window.showWarningMessage(`Failed to remove the underlying user for context ${context.contextName}. See Output window for more details.`);
        }
        const deleteContextResult = yield kubectl.invokeCommandWithFeedback(`config delete-context ${context.contextName}`, "Deleting context...");
        if (binutilplusplus_1.ExecResult.failed(deleteContextResult)) {
            const whatFailed = `Failed to delete the specified cluster's context ${context.contextName} from the kubeconfig`;
            kubeChannel_1.kubeChannel.showOutput(binutilplusplus_1.ExecResult.failureMessage(deleteContextResult, { whatFailed }));
            vscode.window.showErrorMessage(`Delete ${context.contextName} failed. See Output window for more details.`);
            return false;
        }
        vscode.window.showInformationMessage(`Deleted context '${context.contextName}' and associated data from the kubeconfig.`);
        return true;
    });
}
exports.deleteCluster = deleteCluster;
function getAsDataResources(resource, kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentNS = yield currentNamespace(kubectl);
        const resources = yield kubectl.asJson(`get ${resource} -o json --namespace=${currentNS}`);
        if (errorable_1.failed(resources)) {
            vscode.window.showErrorMessage(resources.error[0]);
            return [];
        }
        return resources.result.items;
    });
}
exports.getAsDataResources = getAsDataResources;
function getGlobalResources(kubectl, resource) {
    return __awaiter(this, void 0, void 0, function* () {
        const rsrcs = yield kubectl.asJson(`get ${resource} -o json`);
        if (errorable_1.failed(rsrcs)) {
            vscode.window.showErrorMessage(rsrcs.error[0]);
            return [];
        }
        return rsrcs.result.items.map((item) => {
            return {
                metadata: item.metadata,
                kind: resource
            };
        });
    });
}
exports.getGlobalResources = getGlobalResources;
function getCRDTypes(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const crdTypes = yield kubectl.asJson(`get crd -o json`);
        if (errorable_1.failed(crdTypes)) {
            vscode.window.showErrorMessage(crdTypes.error[0]);
            return [];
        }
        return crdTypes.result.items.map((item) => {
            return {
                metadata: item.metadata,
                kind: item.spec.names.kind,
                spec: item.spec
            };
        });
    });
}
exports.getCRDTypes = getCRDTypes;
function getNamespaces(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const ns = yield kubectl.asJson("get namespaces -o json");
        if (errorable_1.failed(ns)) {
            vscode.window.showErrorMessage(ns.error[0]);
            return [];
        }
        const currentNS = yield currentNamespace(kubectl);
        return ns.result.items.map((item) => {
            return {
                name: item.metadata.name,
                metadata: item.metadata,
                active: item.metadata.name === currentNS
            };
        });
    });
}
exports.getNamespaces = getNamespaces;
function getResourceWithSelector(resource, kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentNS = yield currentNamespace(kubectl);
        const shellResult = yield kubectl.asJson(`get ${resource} -o json --namespace=${currentNS}`);
        if (errorable_1.failed(shellResult)) {
            vscode.window.showErrorMessage(shellResult.error[0]);
            return [];
        }
        return shellResult.result.items.map((item) => {
            return {
                name: item.metadata.name,
                metadata: item.metadata,
                selector: item.spec.selector
            };
        });
    });
}
exports.getResourceWithSelector = getResourceWithSelector;
function getPods(kubectl, selector, namespace = null) {
    return __awaiter(this, void 0, void 0, function* () {
        const ns = namespace || (yield currentNamespace(kubectl));
        let nsFlag = `--namespace=${ns}`;
        if (ns === 'all') {
            nsFlag = '--all-namespaces';
        }
        const labels = Array.of();
        let matchLabelObj = selector;
        if (selector && selector.matchLabels) {
            matchLabelObj = selector.matchLabels;
        }
        if (matchLabelObj) {
            Object.keys(matchLabelObj).forEach((key) => {
                labels.push(`${key}=${matchLabelObj[key]}`);
            });
        }
        let labelStr = "";
        if (labels.length > 0) {
            labelStr = "--selector=" + labels.join(",");
        }
        const pods = yield kubectl.readTable(`get pods -o wide ${nsFlag} ${labelStr}`);
        if (binutilplusplus_1.ExecResult.failed(pods)) {
            kubectl.reportFailure(pods, {});
            return [];
        }
        return pods.result.map((item) => {
            return {
                name: item.name,
                namespace: item.namespace || ns,
                nodeName: item.node,
                status: item.status,
                metadata: { name: item.name, namespace: item.namespace || ns },
            };
        });
    });
}
exports.getPods = getPods;
function currentNamespace(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const kubectlConfig = yield getKubeconfig(kubectl, { silent: false }); // TODO: should this be silent
        if (!kubectlConfig) {
            return "";
        }
        const ctxName = kubectlConfig["current-context"];
        const currentContext = (kubectlConfig.contexts || []).find((ctx) => ctx.name === ctxName);
        if (!currentContext) {
            return "";
        }
        return currentContext.context.namespace || "default";
    });
}
exports.currentNamespace = currentNamespace;
function currentNamespaceArg(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const ns = yield currentNamespace(kubectl);
        if (ns.length === 0) {
            return '';
        }
        return `--namespace ${ns}`;
    });
}
exports.currentNamespaceArg = currentNamespaceArg;
function switchNamespace(kubectl, namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        const er = yield kubectl.invokeCommand("config current-context");
        if (binutilplusplus_1.ExecResult.failed(er)) {
            kubeChannel_1.kubeChannel.showOutput(binutilplusplus_1.ExecResult.failureMessage(er, { whatFailed: 'Cannot get the current context' }), `Switch namespace ${namespace}`);
            vscode.window.showErrorMessage("Switch namespace failed. See Output window for more details.");
            return false;
        }
        const updateResult = yield kubectl.invokeCommandWithFeedback(`config set-context ${er.stdout.trim()} --namespace="${namespace}"`, "Switching namespace...");
        if (binutilplusplus_1.ExecResult.failed(updateResult)) {
            kubeChannel_1.kubeChannel.showOutput(binutilplusplus_1.ExecResult.failureMessage(updateResult, { whatFailed: `Failed to switch the namespace` }), `Switch namespace ${namespace}`);
            if (updateResult.resultKind === 'exec-bin-not-found') {
                kubectl.promptInstallDependencies(updateResult, `Switch namespace failed: kubectl not found`);
            }
            else {
                vscode.window.showErrorMessage("Switch namespace failed. See Output window for more details.");
            }
            return false;
        }
        return true;
    });
}
exports.switchNamespace = switchNamespace;
/**
 * Run the specified image in the kubernetes cluster.
 *
 * @param kubectl the kubectl client.
 * @param deploymentName the deployment name.
 * @param image the docker image.
 * @param exposedPorts the exposed ports.
 * @param env the additional environment variables when running the docker container.
 * @return the deployment name.
 */
function runAsDeployment(kubectl, deploymentName, image, exposedPorts, env, debugArgs) {
    return __awaiter(this, void 0, void 0, function* () {
        const imageName = image.split(":")[0];
        const imagePrefix = imageName.substring(0, imageName.lastIndexOf("/") + 1);
        if (!deploymentName) {
            const baseName = imageName.substring(imageName.lastIndexOf("/") + 1);
            deploymentName = `${baseName}-${Date.now()}`;
        }
        const runCmd = [
            "run",
            deploymentName,
            `--image=${image}`,
            imagePrefix ? "" : "--image-pull-policy=Never",
            ...exposedPorts.map((port) => `--port=${port}`),
            ...Object.keys(env || {}).map((key) => `--env="${key}=${env[key]}"`),
            debugArgs ? debugArgs : ""
        ];
        const runResult = yield kubectl.invokeCommand(runCmd.join(" "));
        if (binutilplusplus_1.ExecResult.failed(runResult)) {
            throw new Error(binutilplusplus_1.ExecResult.failureMessage(runResult, { whatFailed: `Failed to run the image "${image}" on Kubernetes` }));
        }
        return deploymentName;
    });
}
exports.runAsDeployment = runAsDeployment;
/**
 * Query the pod list for the specified label.
 *
 * @param kubectl the kubectl client.
 * @param labelQuery the query label.
 * @return the pod list.
 */
function findPodsByLabel(kubectl, labelQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const getResult = yield kubectl.asJson(`get pods -o json -l ${labelQuery}`);
        if (errorable_1.failed(getResult)) {
            throw new Error('Kubectl command failed: ' + getResult.error[0]);
        }
        return getResult.result;
    });
}
exports.findPodsByLabel = findPodsByLabel;
/**
 * Wait and block until the specified pod's status becomes running.
 *
 * @param kubectl the kubectl client.
 * @param podName the pod name.
 */
function waitForRunningPod(kubectl, podName) {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            const er = yield kubectl.invokeCommand(`get pod/${podName} --no-headers`);
            if (binutilplusplus_1.ExecResult.failed(er)) {
                throw new Error(binutilplusplus_1.ExecResult.failureMessage(er, { whatFailed: 'Failed to get pod status' }));
            }
            const status = er.stdout.split(/\s+/)[2];
            kubeChannel_1.kubeChannel.showOutput(`pod/${podName} status: ${status}`);
            if (status === "Running") {
                return;
            }
            else if (!isTransientPodState(status)) {
                const logsResult = yield kubectl.invokeCommand(`logs pod/${podName}`);
                kubeChannel_1.kubeChannel.showOutput(`Failed to start the pod "${podName}". Its status is "${status}".
                Pod logs:\n${shell_1.shellMessage(logsResult, "Unable to retrieve logs")}`);
                throw new Error(`Failed to start the pod "${podName}". Its status is "${status}".`);
            }
            yield sleep_1.sleep(1000);
        }
    });
}
exports.waitForRunningPod = waitForRunningPod;
function isTransientPodState(status) {
    return status === "ContainerCreating" || status === "Pending" || status === "Succeeded";
}
/**
 * Get the specified resource information.
 *
 * @param kubectl the kubectl client.
 * @param resourceId the resource id.
 * @return the result as a json object, or undefined if errors happen.
 */
function getResourceAsJson(kubectl, resourceId, resourceNamespace) {
    return __awaiter(this, void 0, void 0, function* () {
        const nsarg = resourceNamespace ? `--namespace ${resourceNamespace}` : '';
        const shellResult = yield kubectl.asJson(`get ${resourceId} ${nsarg} -o json`);
        if (errorable_1.failed(shellResult)) {
            vscode.window.showErrorMessage(shellResult.error[0]);
            return undefined;
        }
        return shellResult.result;
    });
}
exports.getResourceAsJson = getResourceAsJson;
function createResourceFromUri(uri, kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        yield changeResourceFromUri(uri, kubectl, 'create', 'creating', 'created');
    });
}
exports.createResourceFromUri = createResourceFromUri;
function deleteResourceFromUri(uri, kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield vscode.window.showWarningMessage('Are you sure you want to delete this resource?', 'Delete', 'Cancel');
        if (result === 'Delete') {
            yield changeResourceFromUri(uri, kubectl, 'delete', 'deleting', 'deleted');
        }
    });
}
exports.deleteResourceFromUri = deleteResourceFromUri;
function applyResourceFromUri(uri, kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        yield changeResourceFromUri(uri, kubectl, 'apply', 'applying', 'applied');
    });
}
exports.applyResourceFromUri = applyResourceFromUri;
function changeResourceFromUri(uri, kubectl, command, verbParticiple, verbPast) {
    return __awaiter(this, void 0, void 0, function* () {
        if (uri.scheme !== 'file') {
            vscode.window.showErrorMessage(`${uri.toString()} is not a file path.`);
            return;
        }
        const path = vscode.workspace.asRelativePath(uri);
        const result = yield kubectl.invokeCommand(`${command} -f "${path}"`);
        if (binutilplusplus_1.ExecResult.failed(result)) {
            kubectl.reportFailure(result, { whatFailed: `Error ${verbParticiple} resource` });
        }
        else {
            vscode.window.showInformationMessage(`Resource ${path} ${verbPast}.`);
        }
    });
}
function namespaceResources(kubectl, ns) {
    return __awaiter(this, void 0, void 0, function* () {
        const arresult = yield kubectl.readTable('api-resources -o wide');
        if (binutilplusplus_1.ExecResult.failed(arresult)) {
            return { succeeded: false, error: [binutilplusplus_1.ExecResult.failureMessage(arresult, {})] };
        }
        const resourceKinds = arresult.result.filter((r) => r.namespaced === 'true')
            .filter((r) => r.verbs.includes('list'))
            .map((r) => r.name);
        const resourceKindsList = resourceKinds.join(',');
        const getresult = yield kubectl.invokeCommand(`get ${resourceKindsList} -o name --namespace ${ns} --ignore-not-found`);
        return binutilplusplus_1.ExecResult.tryMap(getresult, (text) => text.split('\n').map((s) => s.trim()).filter((s) => s.length > 0));
    });
}
exports.namespaceResources = namespaceResources;
function getResourceVersion(kubectl, resource) {
    return __awaiter(this, void 0, void 0, function* () {
        const documentation = yield kubectl.asLines(` explain ${resource}`);
        if (errorable_1.failed(documentation)) {
            return undefined;
        }
        const rgx = new RegExp('(?<=VERSION:\\s*)(\\S)+.*');
        for (const line of documentation.result) {
            const match = line.match(rgx);
            if (match) {
                return match[0];
            }
        }
        return undefined;
    });
}
exports.getResourceVersion = getResourceVersion;
//# sourceMappingURL=kubectlUtils.js.map