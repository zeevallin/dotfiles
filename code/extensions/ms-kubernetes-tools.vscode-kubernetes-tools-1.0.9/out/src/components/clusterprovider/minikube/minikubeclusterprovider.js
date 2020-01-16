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
const wizard_1 = require("../../../wizard");
const form_1 = require("../common/form");
const explorer_1 = require("../common/explorer");
const errorable_1 = require("../../../errorable");
const wizard_2 = require("../../wizard/wizard");
const readinesstracker_1 = require("../readinesstracker");
let registered = false;
function init(registry, context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!registered) {
            registry.register({ id: 'minikube', displayName: "Minikube local cluster", supportedActions: ['create', 'configure'], next: (w, a, m) => next(context, w, a, m) });
            registered = true;
        }
    });
}
exports.init = init;
function next(context, wizard, action, message) {
    const nextStep = message.nextStep;
    const requestData = nextStep ? message : { clusterType: message["clusterType"] };
    if (action === 'create') {
        wizard.showPage(getHandleCreateHtml(nextStep, context, requestData));
    }
    else {
        wizard.showPage(getHandleConfigureHtml(nextStep, requestData));
    }
}
function getHandleCreateHtml(step, context, requestData) {
    if (!step) {
        return promptForConfiguration(requestData, "create", "create");
    }
    else if (step === "create") {
        return createCluster(requestData, context);
    }
    else if (step === "wait") {
        return waitForClusterAndReportConfigResult(requestData, context);
    }
    else {
        return renderInternalError(`MinikubeStepError (${step})`);
    }
}
function getHandleConfigureHtml(step, _requestData) {
    if (!step || step === "configure") {
        return configureKubernetes();
    }
    else {
        return renderInternalError(`MinikubeStepError (${step})`);
    }
}
function promptForConfiguration(previousData, action, nextStep) {
    return __awaiter(this, void 0, void 0, function* () {
        return form_1.formPage({
            stepId: 'PromptForConfiguration',
            title: 'Configure Minikube',
            waitText: 'Configuring Minikube',
            action: action,
            nextStep: nextStep,
            submitText: 'Start Minikube',
            previousData: previousData,
            formContent: `
        <table style='width:50%'>
        <tr>
        <td>Minikube VM Driver</td>
        <td style='text-align: right'><select name='vmdriver' id='vmdriver'>
           <option selected='true'>virtualbox</option>
           <option>vmwarefusion</option>
           <option>kvm</option>
           <option>xhyve</option>
           <option>hyperv</option>
           <option>hyperkit</option>
           <option>kvm2</option>
           <option>none</option>
        </select></td>
        </tr>
        <tr>
        <td>Additional Flags:</td>
        <td style='text-align: right'><input name='additionalflags' type='text' value='' /></td>
        </tr>
        </table>
        `
        });
    });
}
function configureKubernetes() {
    return __awaiter(this, void 0, void 0, function* () {
        yield explorer_1.refreshExplorer();
        return renderConfigurationResult();
    });
}
function runMinikubeCommand(context, cmd) {
    return __awaiter(this, void 0, void 0, function* () {
        const sr = yield context.shell.exec(cmd);
        const createCluster = yield wizard_1.fromShellExitCodeOnly(sr, "Unable to run Minikube");
        return {
            actionDescription: 'creating cluster',
            result: createCluster
        };
    });
}
function createCluster(previousData, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const runnable = yield context.minikube.isRunnable();
        const createResult = {
            actionDescription: 'creating cluster',
            result: runnable
        };
        context.minikube.start({
            vmDriver: previousData.vmdriver,
            additionalFlags: previousData.additionalflags
        });
        const title = createResult.result.succeeded ? 'Cluster creation has started' : `Error ${createResult.actionDescription}`;
        const message = errorable_1.succeeded(createResult.result) ?
            `<div id='content'>
         ${wizard_1.formStyles()}
         ${wizard_1.styles()}
         <form id='form'>
         <input type='hidden' name='nextStep' value='wait' />
         ${form_1.propagationFields(previousData)}
         <p class='success'>Minikube is creating the cluster, but this may take some time. You can now close this window,
         or wait for creation to complete so that we can add the new cluster to your Kubernetes configuration.</p>
         <p><button onclick=${wizard_2.NEXT_FN} class='link-button'>Wait and add the new cluster &gt;</button></p>
         </form>
         </div>` :
            `<p class='error'>An error occurred while creating the cluster. Is 'minikube' installed and in your PATH?</p>
         <p><b>Details</b></p>
         <p>${createResult.result.error[0]}</p>`;
        return `<!-- Complete -->
            <h1 id='h'>${title}</h1>
            ${wizard_1.styles()}
            ${wizard_1.waitScript('Waiting for cluster - this will take several minutes')}
            ${message}`;
    });
}
function refreshCountIndicator(refreshCount) {
    return ".".repeat(refreshCount % 4);
}
function waitForClusterAndReportConfigResult(previousData, context) {
    function waitOnce(refreshCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const waitResult = yield runMinikubeCommand(context, 'minikube status');
            if (!waitResult.result.succeeded) {
                const failed = waitResult.result;
                const message = `<h1>Waiting for minikube cluster${refreshCountIndicator(refreshCount)}</h1>
            <p>Current Status</p>
            <pre><code>${failed.error[0]}</code></pre>
            <form id='form'>
            <input type='hidden' name='nextStep' value='wait' />
            ${form_1.propagationFields(previousData)}
            </form>
            `;
                return [message, true];
            }
            yield explorer_1.refreshExplorer();
            return [renderConfigurationResult(), false];
        });
    }
    return readinesstracker_1.trackReadiness(100, waitOnce);
}
function renderConfigurationResult() {
    const title = 'Cluster added';
    return `<!-- Complete -->
            <h1>${title}</h1>
            ${wizard_1.styles()}`;
}
function renderInternalError(error) {
    return `
<h1>Internal extension error</h1>
${wizard_1.styles()}
<p class='error'>An internal error occurred in the vscode-kubernetes-tools extension.</p>
<p>This is not an Azure or Kubernetes issue.  Please report error text '${error}' to the extension authors.</p>
`;
}
//# sourceMappingURL=minikubeclusterprovider.js.map