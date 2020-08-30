"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clusterproviderregistry = require("./clusterproviderregistry");
const wizard_1 = require("../../wizard");
const telemetry_1 = require("../../telemetry");
const wizard_2 = require("../wizard/wizard");
exports.SENDING_STEP_KEY = 'sendingStep';
const SELECT_CLUSTER_TYPE = 'selectClusterType';
function subscriber(action) {
    return {
        onCancel() {
        },
        onStep(w, m) {
            const clusterType = m.clusterType;
            if (m[exports.SENDING_STEP_KEY] === SELECT_CLUSTER_TYPE) {
                if (telemetry_1.reporter) {
                    telemetry_1.reporter.sendTelemetryEvent("cloudselection", { action: action, clusterType: clusterType });
                }
            }
            const cp = clusterproviderregistry.get().list().find((cp) => cp.id === clusterType);
            if (cp) {
                cp.next(w, action, m);
            }
        }
    };
}
function runClusterWizard(tabTitle, action) {
    const wizard = wizard_2.createWizard(tabTitle, 'form', subscriber(action));
    const html = handleGetProviderListHtml(action);
    wizard.showPage(html);
}
exports.runClusterWizard = runClusterWizard;
function handleGetProviderListHtml(action) {
    const clusterTypes = clusterproviderregistry.get().list().filter((cp) => cp.supportedActions.indexOf(action) >= 0);
    if (clusterTypes.length === 0) {
        return `<html><body><h1 id='h'>No suitable providers</h1>
            <style id='styleholder'>
            </style>
            ${wizard_1.styles()}
            <div id='content'>
            <p>There aren't any providers loaded that support this command.
            You could try looking for Kubernetes providers in the Visual Studio
            Code Marketplace.</p>
            </div></body></html>`;
    }
    // const initialUri = `http://localhost:${cpPort}/?action=${action}&clusterType=${clusterTypes[0].id}`;
    const options = clusterTypes.map((cp) => `<option value="${cp.id}">${cp.displayName}</option>`).join('\n');
    const otherClustersInfo = action === 'configure' ? `
    <p>
    If your type of cluster isn't listed here, don't worry. Just add it to your
    kubeconfig file normally (see your cloud or cluster documentation), and it will show
    up in Visual Studio Code automatically. If you're using multiple kubeconfig files,
    you may need to change the <b>vs-kubernetes &gt; vs-kubernetes.kubeconfig</b> setting
    to refer to the right file.
    </p>
    ` : `
    <p>
    If your type of cluster isn't listed here, don't worry. Just create it normally
    (see your cloud or cluster documentation) and add it to your kubeconfig file, and it will show
    up in Visual Studio Code automatically. If you're using multiple kubeconfig files,
    you may need to change the <b>vs-kubernetes &gt; vs-kubernetes.kubeconfig</b> setting
    to refer to the right file.
    </p>
    `;
    const html = `<html><body>
            ${wizard_1.formStyles()}
            ${wizard_1.styles()}
            <h1 id='h'>Choose cluster type</h1>
            <div id='content'>
            <form id='form'>
            <input type='hidden' name='${exports.SENDING_STEP_KEY}' value='${SELECT_CLUSTER_TYPE}' />
            <input type='hidden' name='action' value='${action}' />
            <p>
            Cluster type: <select name='clusterType'>
            ${options}
            </select>
            </p>
            </form>

            <p>
            <button onclick='${wizard_2.NEXT_FN}' class='link-button'>Next &gt;</button>
            </p>

            ${otherClustersInfo}

            </div></body></html>`;
    return html;
}
//# sourceMappingURL=clusterproviderserver.js.map