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
const host_1 = require("../../host");
const extension_1 = require("../../extension");
const portFinder = require("portfinder");
const errorable_1 = require("../../errorable");
const kubectlUtils = require("../../kubectlUtils");
const kuberesources = require("../../kuberesources");
const binutilplusplus_1 = require("../../binutilplusplus");
const PORT_FORWARD_TERMINAL = 'kubectl port-forward';
const MAX_PORT_COUNT = 65535;
function isFindResultFromDocument(obj) {
    return obj.fromOpenDocument;
}
/**
 * Implements port-forwarding to a target pod in the current namespace
 * @param explorerNode The treeview explorer node, if invoked from
 * tree view.
 */
function portForwardKubernetes(kubectl, explorerNode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (explorerNode) {
            // The port forward option only appears on pod level workloads in the tree view.
            const resourceNode = explorerNode;
            const podName = resourceNode.name;
            const namespace = resourceNode.namespace || (yield kubectlUtils.currentNamespace(kubectl));
            const portMapping = yield promptForPort(kubectl, podName, namespace);
            if (portMapping.length !== 0) {
                if (explorerNode.kind === kuberesources.allKinds.pod) {
                    portForwardToPod(kubectl, podName, portMapping, namespace);
                }
                else if (explorerNode.kind === kuberesources.allKinds.service) {
                    portForwardToService(kubectl, resourceNode.name, portMapping, namespace);
                }
                else if (explorerNode.kind === kuberesources.allKinds.deployment) {
                    portForwardToDeployment(kubectl, resourceNode.name, portMapping, namespace);
                }
            }
            return;
        }
        else {
            let portForwardablePods;
            try {
                portForwardablePods = yield findPortForwardablePods();
            }
            catch (e) {
                host_1.host.showErrorMessage("Error while fetching pods for port-forward");
                throw e;
            }
            if (!portForwardablePods.succeeded) {
                host_1.host.showInformationMessage("Error while fetching pods for port-forward");
            }
            if (isFindResultFromDocument(portForwardablePods)) {
                // The pod is described by the open document. Skip asking which pod to use and go straight to port-forward.
                const podSelection = portForwardablePods.pod;
                const portMapping = yield promptForPort(kubectl, podSelection, portForwardablePods.namespace);
                if (portMapping.length !== 0) {
                    portForwardToPod(kubectl, podSelection, portMapping, portForwardablePods.namespace);
                }
                return;
            }
            let podSelection;
            const pods = portForwardablePods.pods;
            try {
                const podNames = pods.map((podObj) => podObj.metadata.name);
                podSelection = yield host_1.host.showQuickPick(podNames, { placeHolder: "Select a pod to port-forward to" });
            }
            catch (e) {
                host_1.host.showErrorMessage("Error while selecting pod for port-forward");
                throw e;
            }
            if (!podSelection) {
                host_1.host.showErrorMessage("Error while selecting pod for port-forward");
                return;
            }
            const namespace = yield kubectlUtils.currentNamespace(kubectl);
            const portMapping = yield promptForPort(kubectl, podSelection, namespace);
            if (portMapping.length !== 0) {
                portForwardToPod(kubectl, podSelection, portMapping, namespace);
            }
        }
    });
}
exports.portForwardKubernetes = portForwardKubernetes;
/**
 * Given a JSON representation of a Pod, extract the ports to suggest to the user for
 * for port forwarding.
 */
function extractPodPorts(podJson) {
    const pod = JSON.parse(podJson);
    const containers = pod.spec.containers;
    const ports = Array.of();
    containers.forEach((container) => {
        if (container.ports) {
            const containerPorts = container.ports.map((port) => port.containerPort);
            ports.push(...containerPorts);
        }
    });
    if (ports.length > 0) {
        const portPairs = ports.map((port) => `${port}:${port}`);
        return portPairs.join(' ');
    }
    return;
}
/**
 * Prompts the user on what port to port-forward to, and validates numeric input.
 * @returns An array of PortMapping objects.
 */
function promptForPort(kubectl, podName, namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        let portString;
        let defaultValue = undefined;
        if (podName && kubectl) {
            const ns = namespace || 'default';
            try {
                const result = yield kubectl.invokeCommand(`get pods ${podName} --namespace ${ns} -o json`);
                if (binutilplusplus_1.ExecResult.failed(result)) {
                    console.log(binutilplusplus_1.ExecResult.failureMessage(result, { whatFailed: 'Error getting ports' }));
                }
                else {
                    defaultValue = extractPodPorts(result.stdout);
                }
            }
            catch (err) {
                console.log(err);
            }
        }
        try {
            portString = yield host_1.host.showInputBox({
                placeHolder: 'ex: 8888:5000 8889:5001',
                value: defaultValue,
                prompt: `Port mappings in the format LOCAL:REMOTE. Separate multiple port mappings with spaces.`,
                validateInput: (portMapping) => {
                    const validatedPortMapping = validatePortMapping(portMapping);
                    if (validatedPortMapping && validatedPortMapping.error) {
                        return validatedPortMapping.error;
                    }
                    return undefined;
                }
            });
        }
        catch (e) {
            host_1.host.showErrorMessage("Could not validate on input port");
        }
        if (!portString) {
            return [];
        }
        return buildPortMapping(portString);
    });
}
/**
 * Validates the user supplied port mapping(s)
 * @param portMapping The portMapping string captured from an input field
 * @returns A ValidationResult object describing the first error found.
 */
function validatePortMapping(portMapping) {
    const portPairs = portMapping.split(' ');
    const validationResults = portPairs.map(validatePortPair);
    return validationResults.find((result) => !result.valid);
}
/**
 * Validates a single port mapping
 * @param portPair The port pair to validate
 * @returns An error to be displayed, or undefined
 */
function validatePortPair(portPair) {
    const splitMapping = portPair.split(':');
    // User provided only the target port
    if (!portPair.includes(':') && Number(portPair)) {
        return {
            valid: true
        };
    }
    // User provided local:target port mapping
    if (splitMapping.length > 2) {
        return {
            valid: false,
            error: `Invalid port mapping: ${portPair}`
        };
    }
    const localPort = splitMapping[0];
    const targetPort = splitMapping[1];
    if (Number(localPort) &&
        Number(localPort) <= MAX_PORT_COUNT &&
        Number(targetPort) &&
        Number(targetPort) <= MAX_PORT_COUNT) {
        return {
            valid: true
        };
    }
    return {
        valid: false,
        error: `Invalid ports. Please enter a valid port mapping ie: 8888:5000 or 5000. Valid port range:  1 – ${MAX_PORT_COUNT}`
    };
}
/**
 * Builds and returns multiple PortMapping objects
 * @param portString A validated, user provided string containing the port mappings
 * @returns An array containing the requested PortMappings
 */
function buildPortMapping(portString) {
    const portPairs = portString.split(' ');
    return portPairs.map(buildPortPair);
}
exports.buildPortMapping = buildPortMapping;
/**
 * Builds a single PortMapping object from the captured user input
 * @param portString The port string provided by the user
 * @returns PortMapping object
 */
function buildPortPair(portPair) {
    // Only target port supplied.
    if (!portPair.includes(':')) {
        return {
            targetPort: Number(portPair),
            localPort: undefined
        };
    }
    // Both local and target ports supplied.
    const splitString = portPair.split(':');
    const localPort = splitString[0];
    const targetPort = splitString[1];
    return {
        localPort: Number(localPort),
        targetPort: Number(targetPort)
    };
}
/**
 * Returns one or all available port-forwardable pods
 * Checks the open document and returns an object describing the Pod, if it can find one
 */
function findPortForwardablePods() {
    return __awaiter(this, void 0, void 0, function* () {
        const kindFromEditor = extension_1.tryFindKindNameFromEditor();
        // Find the pod type from the open editor.
        if (errorable_1.succeeded(kindFromEditor)) {
            // Not a pod type, so not port-forwardable, fallback to looking
            // up all pods.
            if (kindFromEditor.result.kind !== 'pods' && kindFromEditor.result.kind !== 'pod') {
                return yield extension_1.findAllPods();
            }
            return {
                succeeded: true,
                pod: kindFromEditor.result.resourceName,
                namespace: kindFromEditor.result.namespace,
                fromOpenDocument: true
            };
        }
        return yield extension_1.findAllPods();
    });
}
/**
 * Invokes kubectl port-forward
 * @param podName The pod name
 * @param portMapping The PortMapping objects. Each object contains the a requested local port and an optional target port.
 * @param namespace  The namespace to use to find the pod in
 * @returns The locally bound ports that were bound
 */
function portForwardToPod(kubectl, podName, portMapping, namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        return portForwardToResource(kubectl, 'pods', podName, portMapping, namespace);
    });
}
exports.portForwardToPod = portForwardToPod;
function portForwardToService(kubectl, serviceName, portMapping, namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        return portForwardToResource(kubectl, 'services', serviceName, portMapping, namespace);
    });
}
exports.portForwardToService = portForwardToService;
function portForwardToDeployment(kubectl, name, portMapping, namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        return portForwardToResource(kubectl, 'deployments', name, portMapping, namespace);
    });
}
exports.portForwardToDeployment = portForwardToDeployment;
function portForwardToResource(kubectl, kind, name, portMapping, namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        const usedPortMappings = yield Promise.all(portMapping.map(buildUsablePortPair));
        usedPortMappings.forEach((usedPortPair) => {
            host_1.host.showInformationMessage(`Forwarding from 127.0.0.1:${usedPortPair.localPort} -> ${kind}/${name}:${usedPortPair.targetPort}`);
        });
        const usedNamespace = namespace || 'default';
        const portPairStrings = usedPortMappings.map((usedPortPair) => `${usedPortPair.localPort}:${usedPortPair.targetPort}`);
        kubectl.invokeInNewTerminal(`port-forward ${kind}/${name} ${portPairStrings.join(' ')} -n ${usedNamespace}`, PORT_FORWARD_TERMINAL);
        return usedPortMappings.choose((usedPortPair) => usedPortPair.localPort);
    });
}
/**
 * Builds a 'usable' port pair, containing a local port and a target port
 * Selects a local port if only the target port is provided
 * @param portPair PortMapping object
 * @returns PortMapping object containing all requisite ports
 */
function buildUsablePortPair(portPair) {
    return __awaiter(this, void 0, void 0, function* () {
        const localPort = portPair.localPort;
        const targetPort = portPair.targetPort;
        let usedPort = localPort;
        if (!localPort) {
            // the port key/value is the `minimum` port to assign.
            usedPort = yield portFinder.getPortPromise({
                port: 10000
            });
        }
        return {
            targetPort: targetPort,
            localPort: usedPort
        };
    });
}
//# sourceMappingURL=port-forward.js.map