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
const fs = require("fs");
const browser = require("../components/platform/browser");
const path = require("path");
const portfinder = require("portfinder");
const providerRegistry = require("./providerRegistry");
const kubeChannel_1 = require("../kubeChannel");
const kubectlUtils = require("../kubectlUtils");
const shell_1 = require("../shell");
const dockerfileParser_1 = require("../docker/dockerfileParser");
const dockerUtils = require("../docker/dockerUtils");
const config = require("../components/config/config");
const dictionary_1 = require("../utils/dictionary");
const array_1 = require("../utils/array");
const imageUtils = require("../image/imageUtils");
const debugCommandDocumentationUrl = "https://github.com/Azure/vscode-kubernetes-tools/blob/master/debug-on-kubernetes.md";
class DebugSession {
    constructor(kubectl) {
        this.kubectl = kubectl;
    }
    /**
     * In launch mode, build the docker image from docker file first and then run it on kubernetes cluster,
     * after that smartly resolve the debugging info from the docker image and create port-forward,
     * finally start a debugger to attach to the debugging process.
     *
     * Besides, when the debug session is terminated, kill the port-forward and cleanup the created kubernetes resources (deployment/pod) automatically.
     *
     * @param workspaceFolder the active workspace folder.
     * @param debugProvider the debug provider. If not specified, prompt user to pick up a debug provider from the supported list.
     */
    launch(workspaceFolder, debugProvider) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!workspaceFolder) {
                return;
            }
            // TODO: Support docker-compose.yml
            const dockerfilePath = path.join(workspaceFolder.uri.fsPath, "Dockerfile");
            if (!fs.existsSync(dockerfilePath)) {
                yield this.openInBrowser(`No Dockerfile found in the workspace ${workspaceFolder.name}. See the documentation for how to use this command.`, debugCommandDocumentationUrl);
                return;
            }
            const dockerfile = new dockerfileParser_1.DockerfileParser().parse(dockerfilePath);
            if (debugProvider) {
                this.debugProvider = (yield debugProvider.isDebuggerInstalled()) ? debugProvider : undefined;
            }
            else {
                this.debugProvider = yield this.pickupAndInstallDebugProvider(dockerfile.getBaseImage());
            }
            if (!this.debugProvider) {
                return;
            }
            const cwd = workspaceFolder.uri.fsPath;
            const imagePrefix = vscode.workspace.getConfiguration().get("vsdocker.imageUser", null);
            const containerEnv = dictionary_1.Dictionary.of();
            const portInfo = yield this.debugProvider.resolvePortsFromFile(dockerfile, containerEnv);
            if (!imagePrefix) {
                yield vscode.window.showErrorMessage("No Docker image prefix set for image push. Please set 'vsdocker.imageUser' in your Kubernetes extension settings.");
                return;
            }
            if (!portInfo || !portInfo.debugPort || !portInfo.appPort) {
                yield this.openInBrowser("Cannot resolve debug/application port from Dockerfile. See the documentation for how to use this command.", debugCommandDocumentationUrl);
                return;
            }
            vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, (p) => __awaiter(this, void 0, void 0, function* () {
                let appName;
                try {
                    // Build/push docker image.
                    p.report({ message: "Building Docker image..." });
                    const shellOpts = Object.assign({}, shell_1.shell.execOpts(), { cwd });
                    const imageName = yield this.buildDockerImage(imagePrefix, shellOpts);
                    // Run docker image in k8s container.
                    p.report({ message: "Running Docker image on Kubernetes..." });
                    const exposedPorts = array_1.definedOf(portInfo.appPort, portInfo.debugPort);
                    appName = yield this.runAsDeployment(imageName, exposedPorts, containerEnv);
                    // Find the running debug pod.
                    p.report({ message: "Finding the debug pod..." });
                    const podName = yield this.findDebugPod(appName);
                    // Wait for the debug pod status to be running.
                    p.report({ message: "Waiting for the pod to be ready..." });
                    yield this.waitForPod(podName);
                    // Setup port-forward.
                    p.report({ message: "Setting up port forwarding..." });
                    const proxyResult = yield this.setupPortForward(podName, undefined, portInfo.debugPort, portInfo.appPort);
                    if (!proxyResult.proxyProcess) {
                        return; // No port forwarding, so can't debug
                    }
                    // Start debug session.
                    p.report({ message: `Starting ${this.debugProvider.getDebuggerType()} debug session...` }); // safe because checked outside the lambda
                    yield this.startDebugSession(appName, cwd, proxyResult);
                }
                catch (error) {
                    vscode.window.showErrorMessage(error);
                    kubeChannel_1.kubeChannel.showOutput(`Debug on Kubernetes failed. The errors were: ${error}.`);
                    if (appName) {
                        yield this.promptForCleanup(`deployment/${appName}`);
                    }
                    kubeChannel_1.kubeChannel.showOutput(`\nTo learn more about the usage of the debug feature, take a look at ${debugCommandDocumentationUrl}`);
                }
            }));
        });
    }
    /**
     * In attach mode, the user should choose the running pod first, then the debugger will attach to it.
     *
     * @param workspaceFolder the active workspace folder.
     * @param pod the target pod name.
     */
    attach(workspaceFolder, pod, podNamespace) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!workspaceFolder) {
                return;
            }
            const targetPodInfo = yield this.getPodTarget(pod, podNamespace);
            if (!targetPodInfo) {
                return;
            }
            const { targetPod, targetPodNS, containers } = targetPodInfo;
            // Select the image type to attach.
            this.debugProvider = yield this.pickupAndInstallDebugProvider();
            if (!this.debugProvider) {
                return;
            }
            // Select the target container to attach.
            // TODO: consolidate with container selection in extension.ts.
            const targetContainer = yield this.pickContainer(containers);
            if (!targetContainer) {
                return;
            }
            // Find the debug port to attach.
            const portInfo = yield this.debugProvider.resolvePortsFromContainer(this.kubectl, targetPod, targetPodNS, targetContainer);
            if (!portInfo || !portInfo.debugPort) {
                yield this.openInBrowser("Cannot resolve the debug port to attach. See the documentation for how to use this command.", debugCommandDocumentationUrl);
                return;
            }
            vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, (p) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Setup port-forward.
                    p.report({ message: "Setting up port forwarding..." });
                    const proxyResult = yield this.setupPortForward(targetPod, targetPodNS, portInfo.debugPort);
                    if (!proxyResult.proxyProcess) {
                        return; // No port forwarding, so can't debug
                    }
                    // Start debug session.
                    p.report({ message: `Starting ${this.debugProvider.getDebuggerType()} debug session...` }); // safe because checked outside lambda
                    yield this.startDebugSession(undefined, workspaceFolder.uri.fsPath, proxyResult);
                }
                catch (error) {
                    vscode.window.showErrorMessage(error);
                    kubeChannel_1.kubeChannel.showOutput(`Debug on Kubernetes failed. The errors were: ${error}.`);
                    kubeChannel_1.kubeChannel.showOutput(`\nTo learn more about the usage of the debug feature, take a look at ${debugCommandDocumentationUrl}`);
                }
            }));
        });
    }
    getPodTarget(pod, podNamespace) {
        return __awaiter(this, void 0, void 0, function* () {
            // Select the target pod to attach.
            let targetPod = pod, targetPodNS = podNamespace, containers = [];
            if (targetPod) {
                const resource = yield kubectlUtils.getResourceAsJson(this.kubectl, `pod/${pod}`, podNamespace);
                if (!resource) {
                    return undefined;
                }
                containers = resource.spec.containers;
                return { targetPod, targetPodNS, containers };
            }
            const resource = yield kubectlUtils.getResourceAsJson(this.kubectl, "pods");
            if (!resource) {
                return;
            }
            const podPickItems = resource.items.map((pod) => {
                return {
                    label: `${pod.metadata.name} (${pod.spec.nodeName})`,
                    description: "pod",
                    name: pod.metadata.name,
                    namespace: pod.metadata.namespace,
                    containers: pod.spec.containers
                };
            });
            const selectedPod = yield vscode.window.showQuickPick(podPickItems, { placeHolder: `Please select a pod to attach` });
            if (!selectedPod) {
                return;
            }
            targetPod = selectedPod.name;
            targetPodNS = selectedPod.namespace;
            containers = selectedPod.containers;
            return { targetPod, targetPodNS, containers };
        });
    }
    pickContainer(containers) {
        return __awaiter(this, void 0, void 0, function* () {
            if (containers.length === 0) {
                return undefined;
            }
            if (containers.length === 1) {
                return containers[0].name;
            }
            const containerPickItems = containers.map((container) => {
                return {
                    label: container.name,
                    description: '',
                    detail: container.image,
                    name: container.name
                };
            });
            const selectedContainer = yield vscode.window.showQuickPick(containerPickItems, { placeHolder: "Please select a container to attach" });
            if (!selectedContainer) {
                return undefined;
            }
            return selectedContainer.name;
        });
    }
    pickupAndInstallDebugProvider(baseImage) {
        return __awaiter(this, void 0, void 0, function* () {
            const debugProvider = yield providerRegistry.getDebugProvider(baseImage);
            if (!debugProvider) {
                return undefined;
            }
            else if (!(yield debugProvider.isDebuggerInstalled())) {
                return undefined;
            }
            return debugProvider;
        });
    }
    buildDockerImage(imagePrefix, shellOpts) {
        return __awaiter(this, void 0, void 0, function* () {
            kubeChannel_1.kubeChannel.showOutput("Starting to build/push Docker image...", "Docker build/push");
            if (!imagePrefix) {
                // In order to allow local kubernetes cluster (e.g. minikube) to have access to local docker images,
                // need override docker-env before running docker build.
                const dockerEnv = yield dockerUtils.resolveKubernetesDockerEnv(this.kubectl);
                shellOpts.env = Object.assign({}, shellOpts.env, dockerEnv);
            }
            const imageName = yield imageUtils.buildAndPushImage(shellOpts, imagePrefix);
            kubeChannel_1.kubeChannel.showOutput(`Finished building/pushing Docker image ${imageName}.`);
            return imageName;
        });
    }
    runAsDeployment(image, exposedPorts, containerEnv) {
        return __awaiter(this, void 0, void 0, function* () {
            kubeChannel_1.kubeChannel.showOutput(`Starting to run image ${image} on Kubernetes cluster...`, "Run on Kubernetes");
            const imageName = image.split(":")[0];
            const baseName = imageName.substring(imageName.lastIndexOf("/") + 1);
            const deploymentName = `${baseName}-debug-${Date.now()}`;
            const appName = yield kubectlUtils.runAsDeployment(this.kubectl, deploymentName, image, exposedPorts, containerEnv);
            kubeChannel_1.kubeChannel.showOutput(`Finished launching image ${image} as a deployment ${appName} on Kubernetes cluster.`);
            return appName;
        });
    }
    findDebugPod(appName) {
        return __awaiter(this, void 0, void 0, function* () {
            kubeChannel_1.kubeChannel.showOutput(`Searching for pods with label run=${appName}`, "Find debug pod");
            const podList = yield kubectlUtils.findPodsByLabel(this.kubectl, `run=${appName}`);
            if (podList.items.length === 0) {
                throw new Error("Failed to find debug pod.");
            }
            const podName = podList.items[0].metadata.name;
            kubeChannel_1.kubeChannel.showOutput(`Found the running debug pod: ${podName}`);
            return podName;
        });
    }
    waitForPod(podName) {
        return __awaiter(this, void 0, void 0, function* () {
            kubeChannel_1.kubeChannel.showOutput(`Waiting for pod ${podName} status to become Running...`, "Wait for pod");
            yield kubectlUtils.waitForRunningPod(this.kubectl, podName);
            kubeChannel_1.kubeChannel.showOutput(`Finshed waiting.`);
        });
    }
    setupPortForward(podName, podNamespace, debugPort, appPort) {
        return __awaiter(this, void 0, void 0, function* () {
            kubeChannel_1.kubeChannel.showOutput(`Setting up port forwarding on pod ${podName}...`, "Set up port forwarding");
            const proxyResult = yield this.createPortForward(this.kubectl, podName, podNamespace, debugPort, appPort);
            if (!proxyResult.proxyProcess) {
                kubeChannel_1.kubeChannel.showOutput("Unable to launch kubectl for port forwarding");
                return proxyResult;
            }
            const appPortStr = appPort ? `${proxyResult.proxyAppPort}:${appPort}` : "";
            kubeChannel_1.kubeChannel.showOutput(`Created port-forward ${proxyResult.proxyDebugPort}:${debugPort} ${appPortStr}`);
            // Wait for the port-forward proxy to be ready.
            kubeChannel_1.kubeChannel.showOutput("Waiting for port forwarding to be ready...");
            yield this.waitForProxyReady(proxyResult.proxyProcess);
            kubeChannel_1.kubeChannel.showOutput("Port forwarding is ready.");
            return proxyResult;
        });
    }
    startDebugSession(appName, cwd, proxyResult) {
        return __awaiter(this, void 0, void 0, function* () {
            kubeChannel_1.kubeChannel.showOutput("Starting debug session...", "Start debug session");
            const sessionName = appName || `${Date.now()}`;
            yield this.startDebugging(cwd, sessionName, proxyResult.proxyDebugPort, proxyResult.proxyAppPort, () => __awaiter(this, void 0, void 0, function* () {
                if (proxyResult.proxyProcess) {
                    proxyResult.proxyProcess.kill();
                }
                if (appName) {
                    kubeChannel_1.kubeChannel.showOutput("The debug session exited.");
                    yield this.promptForCleanup(`deployment/${appName}`);
                }
            }));
        });
    }
    promptForCleanup(resourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const autoCleanupFlag = config.getAutoCompleteOnDebugTerminate();
            if (autoCleanupFlag) {
                return yield this.cleanupResource(resourceId);
            }
            const answer = yield vscode.window.showWarningMessage(`Resource ${resourceId} will continue running on the cluster.`, "Clean Up", "Always Clean Up");
            if (answer === "Clean Up") {
                return yield this.cleanupResource(resourceId);
            }
            else if (answer === "Always Clean Up") {
                yield config.setAlwaysCleanUp();
                return yield this.cleanupResource(resourceId);
            }
        });
    }
    cleanupResource(resourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            kubeChannel_1.kubeChannel.showOutput(`Starting to clean up debug resource...`, "Cleanup debug resource");
            const deleteResult = yield this.kubectl.invokeAsync(`delete ${resourceId}`);
            if (!deleteResult || deleteResult.code !== 0) {
                kubeChannel_1.kubeChannel.showOutput(`Kubectl command failed: ${deleteResult ? deleteResult.stderr : "Unable to run kubectl"}`);
                return;
            }
            else {
                kubeChannel_1.kubeChannel.showOutput(`Resource ${resourceId} is removed successfully.`);
                vscode.commands.executeCommand("extension.vsKubernetesRefreshExplorer");
            }
        });
    }
    createPortForward(kubectl, podName, podNamespace, debugPort, appPort) {
        return __awaiter(this, void 0, void 0, function* () {
            const portMapping = [];
            // Find a free local port for forwarding data to remote app port.
            let proxyAppPort = 0;
            if (appPort) {
                proxyAppPort = yield portfinder.getPortPromise({
                    port: appPort
                });
                portMapping.push(`${proxyAppPort}:${appPort}`);
            }
            // Find a free local port for forwarding data to remote debug port.
            const proxyDebugPort = yield portfinder.getPortPromise({
                port: Math.max(10000, Number(proxyAppPort) + 1)
            });
            portMapping.push(`${proxyDebugPort}:${debugPort}`);
            const nsarg = podNamespace ? ['--namespace', podNamespace] : [];
            return {
                proxyProcess: yield kubectl.spawnAsChild(["port-forward", podName, ...nsarg, ...portMapping]),
                proxyDebugPort,
                proxyAppPort
            };
        });
    }
    waitForProxyReady(proxyProcess) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let isProxyReady = false;
                proxyProcess.stdout.on('data', (data) => __awaiter(this, void 0, void 0, function* () {
                    const message = `${data}`;
                    if (!isProxyReady && this.isForwardingCompleteMessage(message)) {
                        isProxyReady = true;
                        resolve();
                    }
                }));
                proxyProcess.stderr.on('data', (data) => {
                    kubeChannel_1.kubeChannel.showOutput(`${data}`, "port-forward");
                });
                proxyProcess.on('close', (_code) => __awaiter(this, void 0, void 0, function* () {
                    if (!isProxyReady) {
                        reject("Cannot setup port-forward.");
                        return;
                    }
                }));
            });
        });
    }
    isForwardingCompleteMessage(message) {
        const forwardingRegExp = /Forwarding\s+from\s+127\.0\.0\.1:/;
        return forwardingRegExp.test(message);
    }
    startDebugging(workspaceFolder, sessionName, proxyDebugPort, proxyAppPort, onTerminateCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            disposables.push(vscode.debug.onDidStartDebugSession((debugSession) => {
                if (debugSession.name === sessionName) {
                    kubeChannel_1.kubeChannel.showOutput("The debug session has started. Your application is ready for you to debug.");
                    if (proxyAppPort) {
                        kubeChannel_1.kubeChannel.showOutput(`You can access your application via localhost port ${proxyAppPort}.`);
                    }
                }
            }));
            disposables.push(vscode.debug.onDidTerminateDebugSession((debugSession) => __awaiter(this, void 0, void 0, function* () {
                if (debugSession.name === sessionName) {
                    disposables.forEach((d) => d.dispose());
                    yield onTerminateCallback();
                }
            })));
            if (!this.debugProvider) {
                console.warn("INTERNAL ERROR: DebugSession.debugProvider was expected to be assigned before starting debugging");
                return false;
            }
            const success = yield this.debugProvider.startDebugging(workspaceFolder, sessionName, proxyDebugPort);
            if (!success) {
                disposables.forEach((d) => d.dispose());
                yield onTerminateCallback();
            }
            return success;
        });
    }
    openInBrowser(errorMessage, link) {
        return __awaiter(this, void 0, void 0, function* () {
            const answer = yield vscode.window.showErrorMessage(errorMessage, "Open in Browser");
            if (answer === "Open in Browser") {
                browser.open(link);
            }
        });
    }
}
exports.DebugSession = DebugSession;
//# sourceMappingURL=debugSession.js.map