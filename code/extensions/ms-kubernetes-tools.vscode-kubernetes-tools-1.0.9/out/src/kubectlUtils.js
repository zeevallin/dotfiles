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
const shell_1 = require("./shell");
function getKubeconfig(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const shellResult = yield kubectl.asJson("config view -o json");
        if (errorable_1.failed(shellResult)) {
            vscode.window.showErrorMessage(shellResult.error[0]);
            return null;
        }
        return shellResult.result;
    });
}
function getCurrentClusterConfig(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const kubeConfig = yield getKubeconfig(kubectl);
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
function getContexts(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const kubectlConfig = yield getKubeconfig(kubectl);
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
function getCurrentContext(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const contexts = yield getContexts(kubectl);
        return contexts.find((c) => c.active);
    });
}
exports.getCurrentContext = getCurrentContext;
function deleteCluster(kubectl, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const deleteClusterResult = yield kubectl.invokeAsyncWithProgress(`config delete-cluster ${context.clusterName}`, "Deleting cluster...");
        if (!deleteClusterResult || deleteClusterResult.code !== 0) {
            kubeChannel_1.kubeChannel.showOutput(`Failed to remove the underlying cluster for context ${context.clusterName} from the kubeconfig: ${deleteClusterResult ? deleteClusterResult.stderr : "Unable to run kubectl"}`, `Delete ${context.contextName}`);
            vscode.window.showWarningMessage(`Failed to remove the underlying cluster for context ${context.contextName}. See Output window for more details.`);
        }
        const deleteUserResult = yield kubectl.invokeAsyncWithProgress(`config unset users.${context.userName}`, "Deleting user...");
        if (!deleteUserResult || deleteUserResult.code !== 0) {
            kubeChannel_1.kubeChannel.showOutput(`Failed to remove the underlying user for context ${context.contextName} from the kubeconfig: ${deleteUserResult ? deleteUserResult.stderr : "Unable to run kubectl"}`);
            vscode.window.showWarningMessage(`Failed to remove the underlying user for context ${context.contextName}. See Output window for more details.`);
        }
        const deleteContextResult = yield kubectl.invokeAsyncWithProgress(`config delete-context ${context.contextName}`, "Deleting context...");
        if (!deleteContextResult || deleteContextResult.code !== 0) {
            kubeChannel_1.kubeChannel.showOutput(`Failed to delete the specified cluster's context ${context.contextName} from the kubeconfig: ${deleteContextResult ? deleteContextResult.stderr : "Unable to run kubectl"}`);
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
        const pods = yield kubectl.fromLines(`get pods -o wide ${nsFlag} ${labelStr}`);
        if (errorable_1.failed(pods)) {
            vscode.window.showErrorMessage(pods.error[0]);
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
        const kubectlConfig = yield getKubeconfig(kubectl);
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
        const shellResult = yield kubectl.invokeAsync("config current-context");
        if (!shellResult || shellResult.code !== 0) {
            kubeChannel_1.kubeChannel.showOutput(`Failed. Cannot get the current context: ${shellResult ? shellResult.stderr : "Unable to run kubectl"}`, `Switch namespace ${namespace}`);
            vscode.window.showErrorMessage("Switch namespace failed. See Output window for more details.");
            return false;
        }
        const updateResult = yield kubectl.invokeAsyncWithProgress(`config set-context ${shellResult.stdout.trim()} --namespace="${namespace}"`, "Switching namespace...");
        if (!updateResult || updateResult.code !== 0) {
            kubeChannel_1.kubeChannel.showOutput(`Failed to switch the namespace: ${updateResult ? updateResult.stderr : "Unable to run kubectl"}`, `Switch namespace ${namespace}`);
            vscode.window.showErrorMessage("Switch namespace failed. See Output window for more details.");
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
function runAsDeployment(kubectl, deploymentName, image, exposedPorts, env) {
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
            ...Object.keys(env || {}).map((key) => `--env="${key}=${env[key]}"`)
        ];
        const runResult = yield kubectl.invokeAsync(runCmd.join(" "));
        if (!runResult || runResult.code !== 0) {
            throw new Error(`Failed to run the image "${image}" on Kubernetes: ${runResult ? runResult.stderr : "Unable to run kubectl"}`);
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
            const shellResult = yield kubectl.invokeAsync(`get pod/${podName} --no-headers`);
            if (!shellResult || shellResult.code !== 0) {
                throw new Error(`Failed to get pod status: ${shellResult ? shellResult.stderr : "Unable to run kubectl"}`);
            }
            const status = shellResult.stdout.split(/\s+/)[2];
            kubeChannel_1.kubeChannel.showOutput(`pod/${podName} status: ${status}`);
            if (status === "Running") {
                return;
            }
            else if (!isTransientPodState(status)) {
                const logsResult = yield kubectl.invokeAsync(`logs pod/${podName}`);
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
        const result = yield kubectl.invokeAsync(`${command} -f "${path}"`);
        if (!result || result.code !== 0) {
            const message = result ? result.stderr : "Unable to run kubectl";
            vscode.window.showErrorMessage(`Error ${verbParticiple} resource: ${message}`);
            kubeChannel_1.kubeChannel.showOutput(message, `Error ${verbParticiple} resource (${result ? result.code : 'program not found'})`);
        }
        else {
            vscode.window.showInformationMessage(`Resource ${path} ${verbPast}.`);
        }
    });
}
//# sourceMappingURL=kubectlUtils.js.map