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
const vscode = require("vscode");
const browser = require("../platform/browser");
const fs_1 = require("fs");
const path_1 = require("path");
const fs_2 = require("../../fs");
const port_forward_1 = require("./port-forward");
const errorable_1 = require("../../errorable");
const KUBE_DASHBOARD_URL = "http://localhost:8001/ui/";
const TERMINAL_NAME = "Kubernetes Dashboard";
const PROXY_OUTPUT_FILE = path_1.resolve(__dirname, 'proxy.out');
// The instance of the terminal running Kubectl Dashboard
let terminal = null;
/**
 * Determines if the selected cluster is AKS or not by examining
 * all the attached nodes for two heuristics:
 * 1. Is every node an agent?
 * 2. Is the node name prefixed with `aks-`? (TODO: identify if there's a better method for this/convince AKS team to add a label) for this.
 * @returns Boolean identifying if we think this is an AKS cluster.
 */
function isAKSCluster(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const nodes = yield kubectl.asJson('get nodes -o json');
        if (errorable_1.failed(nodes)) {
            return false;
        }
        const nodeItems = nodes.result.items;
        for (const nodeItem of nodeItems) {
            const isAKSNode = isNodeAKS(nodeItem);
            if (!isAKSNode) {
                return false;
            }
        }
        return true;
    });
}
function isNodeAKS(node) {
    const name = node.metadata.name;
    const roleLabel = node.metadata.labels ? node.metadata.labels["kubernetes.io/role"] : '';
    // Kind of a hack to determine if we're using an AKS cluster…
    const isAKSNode = name.startsWith('aks-');
    const isAgentRole = roleLabel === "agent";
    return isAKSNode && isAgentRole;
}
/**
 * Finds the name of the dashboard pod running in the kube-system namespace
 * on the cluster.
 *
 * @returns The name of the dashboard pod.
 */
function findDashboardPod(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const dashboardPod = yield kubectl.asJson("get pod -n kube-system -l k8s-app=kubernetes-dashboard -o json");
        if (errorable_1.failed(dashboardPod)) {
            return undefined;
        }
        const livenessProbeHttpGet = dashboardPod.result.items[0].spec.containers[0].livenessProbe.httpGet;
        return { name: dashboardPod.result.items[0].metadata.name, port: livenessProbeHttpGet.port, scheme: livenessProbeHttpGet.scheme };
    });
}
/**
 * Stopgap to open the dashboard for AKS users. We port-forward directly
 * to the kube-system dashboard pod instead of invoking `kubectl proxy`.
 */
function openDashboardForAKSCluster(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const dashboardPod = yield findDashboardPod(kubectl);
        if (!dashboardPod) {
            return;
        }
        // Local port 9090 could be bound to something else.
        const portMapping = port_forward_1.buildPortMapping(String(dashboardPod.port));
        const boundPort = yield port_forward_1.portForwardToPod(kubectl, dashboardPod.name, portMapping, 'kube-system');
        setTimeout(() => {
            browser.open(`${dashboardPod.scheme}://localhost:${boundPort[0]}`);
        }, 2500);
        return;
    });
}
/**
 * Runs `kubectl proxy` in a terminal process spawned by the extension, and opens the Kubernetes
 * dashboard in the user's preferred browser.
 */
function dashboardKubernetes(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        // AKS clusters are handled differently due to some intricacies
        // in the way the dashboard works between k8s versions, and between
        // providers. In an ideal world, we'd only use `kubectl proxy`, this
        // is intended as a stopgap until we can re-evaluate the implementation
        // in the future.
        const isAKS = yield isAKSCluster(kubectl);
        if (isAKS) {
            yield openDashboardForAKSCluster(kubectl);
            return;
        }
        // If we've already got a terminal instance, just open the dashboard.
        if (terminal) {
            browser.open(KUBE_DASHBOARD_URL);
            return;
        }
        let outputExists;
        try {
            outputExists = yield fs_2.fs.existsAsync(PROXY_OUTPUT_FILE);
            if (!outputExists) {
                yield fs_2.fs.openAsync(PROXY_OUTPUT_FILE, 'w+');
            }
        }
        catch (e) {
            vscode.window.showErrorMessage("Something went wrong when ensuring the Kubernetes API Proxy output stream existed");
            return;
        }
        // Read kubectl proxy's stdout as a stream.
        fs_1.createReadStream(PROXY_OUTPUT_FILE, { encoding: 'utf8' }).on('data', onStreamData);
        // stdout is also written to a file via `tee`. We read this file as a stream
        // to listen for when the server is ready.
        yield kubectl.invokeInNewTerminal('proxy', TERMINAL_NAME, onClosedTerminal, `tee ${PROXY_OUTPUT_FILE}`);
    });
}
exports.dashboardKubernetes = dashboardKubernetes;
/**
 * Called when the terminal window is closed by the user.
 * @param proxyTerminal
 */
const onClosedTerminal = (proxyTerminal) => __awaiter(void 0, void 0, void 0, function* () {
    // Make sure we only dispose when it's *our* terminal we want gone.
    if (proxyTerminal.name !== TERMINAL_NAME) {
        return;
    }
    terminal = null;
    console.log("Closing Kubernetes API Proxy");
    try {
        yield fs_2.fs.unlinkAsync(PROXY_OUTPUT_FILE);
        console.log('Kubernetes API Proxy stream removed');
    }
    catch (e) {
        console.log('Could not remove Kubernetes API Proxy stream');
    }
});
/**
 * Callback to read data written to the Kubernetes API Proxy output stream.
 * @param data
 */
const onStreamData = (data) => {
    // Everything's alright…
    if (data.startsWith("Starting to serve")) {
        // Let the proxy warm up a bit… otherwise we might hit a browser's error page.
        setTimeout(() => {
            browser.open(KUBE_DASHBOARD_URL);
        }, 2500);
        vscode.window.showInformationMessage(`Kubernetes Dashboard running at ${KUBE_DASHBOARD_URL}`);
        return;
    }
    // Maybe we've bound to the port already outside of the extension?
    vscode.window.showErrorMessage("Could not start the Kubernetes Dashboard. Is it already running?");
    if (terminal) {
        terminal.dispose();
    }
};
//# sourceMappingURL=dashboard.js.map