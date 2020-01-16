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
const wizard_1 = require("../../../wizard");
const errorable_1 = require("../../../errorable");
const compareVersions = require("compare-versions");
const sleep_1 = require("../../../sleep");
const config_1 = require("../../config/config");
const dictionary_1 = require("../../../utils/dictionary");
const MIN_AZ_CLI_VERSION = '2.0.23';
function getSubscriptionList(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // check for prerequisites
        const prerequisiteErrors = yield verifyPrerequisitesAsync(context);
        if (prerequisiteErrors.length > 0) {
            return {
                actionDescription: 'checking prerequisites',
                result: { succeeded: false, error: prerequisiteErrors }
            };
        }
        // list subs
        const subscriptions = yield listSubscriptionsAsync(context);
        return {
            actionDescription: 'listing subscriptions',
            result: subscriptions
        };
    });
}
exports.getSubscriptionList = getSubscriptionList;
function verifyPrerequisitesAsync(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = new Array();
        const azVersion = yield azureCliVersion(context);
        if (azVersion === null) {
            errors.push('Azure CLI 2.0 not found - install Azure CLI 2.0 and log in');
        }
        else if (compareVersions(azVersion, MIN_AZ_CLI_VERSION) < 0) {
            errors.push(`Azure CLI required version is ${MIN_AZ_CLI_VERSION} (you have ${azVersion}) - you need to upgrade Azure CLI 2.0`);
        }
        return errors;
    });
}
function azureCliVersion(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const sr = yield context.shell.exec('az --version');
        if (!sr || sr.code !== 0) {
            return null;
        }
        else {
            const versionMatches = /azure-cli\s+\(?([0-9.]+)\)?/.exec(sr.stdout);
            if (versionMatches === null || versionMatches.length < 2) {
                return null;
            }
            return versionMatches[1];
        }
    });
}
function listSubscriptionsAsync(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const sr = yield context.shell.exec("az account list --all --query [*].name -ojson");
        return wizard_1.fromShellJson(sr, "Unable to list Azure subscriptions");
    });
}
function setSubscriptionAsync(context, subscription) {
    return __awaiter(this, void 0, void 0, function* () {
        const sr = yield context.shell.exec(`az account set --subscription "${subscription}"`);
        return wizard_1.fromShellExitCodeAndStandardError(sr, "Unable to set Azure CLI subscription");
    });
}
exports.setSubscriptionAsync = setSubscriptionAsync;
function getClusterList(context, subscription, clusterType) {
    return __awaiter(this, void 0, void 0, function* () {
        // log in
        const login = yield setSubscriptionAsync(context, subscription);
        if (errorable_1.failed(login)) {
            return {
                actionDescription: 'logging into subscription',
                result: { succeeded: false, error: login.error }
            };
        }
        // list clusters
        const clusters = yield listClustersAsync(context, clusterType);
        return {
            actionDescription: 'listing clusters',
            result: clusters
        };
    });
}
exports.getClusterList = getClusterList;
function listClustersAsync(context, clusterType) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = getListClustersCommand(context, clusterType);
        const sr = yield context.shell.exec(cmd);
        return wizard_1.fromShellJson(sr, "Unable to list Kubernetes clusters");
    });
}
function listClustersFilter(clusterType) {
    if (clusterType === 'acs') {
        return '?orchestratorProfile.orchestratorType==`Kubernetes`';
    }
    return '';
}
function getListClustersCommand(context, clusterType) {
    const filter = listClustersFilter(clusterType);
    let query = `[${filter}].{name:name,resourceGroup:resourceGroup}`;
    if (context.shell.isUnix()) {
        query = `'${query}'`;
    }
    return `az ${getClusterCommand(clusterType)} list --query ${query} -ojson`;
}
function listLocations(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let query = "[].{name:name,displayName:displayName}";
        if (context.shell.isUnix()) {
            query = `'${query}'`;
        }
        const sr = yield context.shell.exec(`az account list-locations --query ${query} -ojson`);
        return wizard_1.fromShellJson(sr, "Unable to list Azure regions", (response) => {
            /* tslint:disable-next-line:prefer-const */
            let locations = dictionary_1.Dictionary.of();
            for (const r of response) {
                locations[r.name] = r.displayName;
            }
            return { locations: locations };
        });
    });
}
function listAcsLocations(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const locationInfo = yield listLocations(context);
        if (errorable_1.failed(locationInfo)) {
            return { succeeded: false, error: locationInfo.error };
        }
        const locations = locationInfo.result;
        const sr = yield context.shell.exec(`az acs list-locations -ojson`);
        return wizard_1.fromShellJson(sr, "Unable to list ACS locations", (response) => locationDisplayNamesEx(response.productionRegions, response.previewRegions, locations));
    });
}
exports.listAcsLocations = listAcsLocations;
function listAksLocations(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const locationInfo = yield listLocations(context);
        if (errorable_1.failed(locationInfo)) {
            return { succeeded: false, error: locationInfo.error };
        }
        const locations = locationInfo.result;
        // There's no CLI for this, so we have to hardwire it for now
        const productionRegions = [
            "australiaeast",
            "australiasoutheast",
            "canadacentral",
            "canadaeast",
            "centralindia",
            "centralus",
            "eastasia",
            "eastus",
            "eastus2",
            "francecentral",
            "japaneast",
            "northeurope",
            "southeastasia",
            "southindia",
            "uksouth",
            "ukwest",
            "westeurope",
            "westus",
            "westus2",
        ];
        const result = locationDisplayNamesEx(productionRegions, [], locations);
        return { succeeded: true, result: result };
    });
}
exports.listAksLocations = listAksLocations;
function locationDisplayNames(names, preview, locationInfo) {
    return names.map((n) => { return { displayName: locationInfo.locations[n], isPreview: preview }; });
}
function locationDisplayNamesEx(production, preview, locationInfo) {
    let result = locationDisplayNames(production, false, locationInfo);
    result = result.concat(locationDisplayNames(preview, true, locationInfo));
    return result;
}
function listVMSizes(context, location) {
    return __awaiter(this, void 0, void 0, function* () {
        const sr = yield context.shell.exec(`az vm list-sizes -l "${location}" -ojson`);
        return wizard_1.fromShellJson(sr, "Unable to list Azure VM sizes", (response) => response.map((r) => r.name)
            .filter((name) => !name.startsWith('Basic_')));
    });
}
exports.listVMSizes = listVMSizes;
function resourceGroupExists(context, resourceGroupName) {
    return __awaiter(this, void 0, void 0, function* () {
        const sr = yield context.shell.exec(`az group show -n "${resourceGroupName}" -ojson`);
        if (sr && sr.code === 0 && !sr.stderr) {
            return sr.stdout !== null && sr.stdout.length > 0;
        }
        else {
            return false;
        }
    });
}
function ensureResourceGroupAsync(context, resourceGroupName, location) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield resourceGroupExists(context, resourceGroupName)) {
            return { succeeded: true, result: null };
        }
        const sr = yield context.shell.exec(`az group create -n "${resourceGroupName}" -l "${location}"`);
        return wizard_1.fromShellExitCodeAndStandardError(sr, "Unable to check if resource group exists");
    });
}
function execCreateClusterCmd(context, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const clusterCmd = getClusterCommand(options.clusterType);
        let createCmd = `az ${clusterCmd} create -n "${options.metadata.clusterName}" -g "${options.metadata.resourceGroupName}" -l "${options.metadata.location}" --generate-ssh-keys --no-wait `;
        if (clusterCmd === 'acs') {
            createCmd = createCmd + `--agent-count ${options.agentSettings.count} --agent-vm-size "${options.agentSettings.vmSize}" -t Kubernetes`;
        }
        else {
            createCmd = createCmd + `--node-count ${options.agentSettings.count} --node-vm-size "${options.agentSettings.vmSize}"`;
        }
        const sr = yield context.shell.exec(createCmd);
        return wizard_1.fromShellExitCodeOnly(sr, "Unable to call Azure CLI to create cluster");
    });
}
function createCluster(context, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const login = yield setSubscriptionAsync(context, options.subscription);
        if (!login.succeeded) {
            return {
                actionDescription: 'logging into subscription',
                result: login
            };
        }
        const ensureResourceGroup = yield ensureResourceGroupAsync(context, options.metadata.resourceGroupName, options.metadata.location);
        if (!ensureResourceGroup || !ensureResourceGroup.succeeded) {
            return {
                actionDescription: 'ensuring resource group exists',
                result: ensureResourceGroup
            };
        }
        const createCluster = yield execCreateClusterCmd(context, options);
        return {
            actionDescription: 'creating cluster',
            result: createCluster
        };
    });
}
exports.createCluster = createCluster;
function waitForCluster(context, clusterType, clusterName, clusterResourceGroup) {
    return __awaiter(this, void 0, void 0, function* () {
        const clusterCmd = getClusterCommand(clusterType);
        const waitCmd = `az ${clusterCmd} wait --created --interval 5 --timeout 10 -n ${clusterName} -g ${clusterResourceGroup} -o json`;
        const sr = yield context.shell.exec(waitCmd);
        if (!sr) {
            return { succeeded: false, error: ["Unable to invoke Azure CLI"] };
        }
        if (sr.code === 0) {
            return { succeeded: true, result: { stillWaiting: sr.stdout !== "" } };
        }
        else {
            return { succeeded: false, error: [sr.stderr] };
        }
    });
}
exports.waitForCluster = waitForCluster;
function configureCluster(context, clusterType, clusterName, clusterGroup) {
    return __awaiter(this, void 0, void 0, function* () {
        const downloadKubectlCliPromise = downloadKubectlCli(context, clusterType);
        const getCredentialsPromise = getCredentials(context, clusterType, clusterName, clusterGroup, 5);
        const [cliResult, credsResult] = yield Promise.all([downloadKubectlCliPromise, getCredentialsPromise]);
        const result = {
            clusterType: clusterType,
            gotCli: cliResult.succeeded,
            cliInstallFile: cliResult.installFile,
            cliOnDefaultPath: cliResult.onDefaultPath,
            cliError: cliResult.error,
            gotCredentials: credsResult.succeeded,
            credentialsError: credsResult.error
        };
        return {
            actionDescription: 'configuring Kubernetes',
            result: { succeeded: cliResult.succeeded && credsResult.succeeded, result: result, error: [] } // TODO: this ends up not fitting our structure very well - fix?
        };
    });
}
exports.configureCluster = configureCluster;
function downloadKubectlCli(context, clusterType) {
    return __awaiter(this, void 0, void 0, function* () {
        const cliInfo = installKubectlCliInfo(context, clusterType);
        const sr = yield context.shell.exec(cliInfo.commandLine);
        if (!sr) {
            return { succeeded: false, error: ["Unable to invoke Azure CLI"] };
        }
        if (sr.code === 0) {
            return {
                succeeded: true,
                installFile: cliInfo.installFile,
                onDefaultPath: !context.shell.isWindows()
            };
        }
        else {
            return {
                succeeded: false,
                error: sr.stderr
            };
        }
    });
}
function getCredentials(context, clusterType, clusterName, clusterGroup, maxAttempts) {
    return __awaiter(this, void 0, void 0, function* () {
        const kubeconfig = config_1.getActiveKubeconfig();
        const kubeconfigFileOption = kubeconfig ? `-f "${kubeconfig}"` : '';
        let attempts = 0;
        while (true) {
            attempts++;
            const cmd = `az ${getClusterCommandAndSubcommand(clusterType)} get-credentials -n ${clusterName} -g ${clusterGroup} ${kubeconfigFileOption}`;
            const sr = yield context.shell.exec(cmd);
            if (sr && sr.code === 0 && !sr.stderr) {
                return {
                    succeeded: true
                };
            }
            else if (attempts < maxAttempts) {
                yield sleep_1.sleep(15000);
            }
            else {
                return {
                    succeeded: false,
                    error: sr ? sr.stderr : "Unable to invoke Azure CLI"
                };
            }
        }
    });
}
function installKubectlCliInfo(context, clusterType) {
    const cmdCore = `az ${getClusterCommandAndSubcommand(clusterType)} install-cli`;
    const isWindows = context.shell.isWindows();
    if (isWindows) {
        // The default Windows install location requires admin permissions; install
        // into a user profile directory instead. We process the path explicitly
        // instead of using %LOCALAPPDATA% in the command, so that we can render the
        // physical path when notifying the user.
        const appDataDir = process.env['LOCALAPPDATA'];
        const installDir = appDataDir + '\\kubectl';
        const installFile = installDir + '\\kubectl.exe';
        const cmd = `(if not exist "${installDir}" md "${installDir}") & ${cmdCore} --install-location="${installFile}"`;
        return { installFile: installFile, commandLine: cmd };
    }
    else {
        // Bah, the default Linux install location requires admin permissions too!
        // Fortunately, $HOME/bin is on the path albeit not created by default.
        const homeDir = process.env['HOME'];
        const installDir = homeDir + '/bin';
        const installFile = installDir + '/kubectl';
        const cmd = `mkdir -p "${installDir}" ; ${cmdCore} --install-location="${installFile}"`;
        return { installFile: installFile, commandLine: cmd };
    }
}
function getClusterCommand(clusterType) {
    if (clusterType === 'Azure Container Service' || clusterType === 'acs') {
        return 'acs';
    }
    return 'aks';
}
function getClusterCommandAndSubcommand(clusterType) {
    if (clusterType === 'Azure Container Service' || clusterType === 'acs') {
        return 'acs kubernetes';
    }
    return 'aks';
}
//# sourceMappingURL=azure.js.map