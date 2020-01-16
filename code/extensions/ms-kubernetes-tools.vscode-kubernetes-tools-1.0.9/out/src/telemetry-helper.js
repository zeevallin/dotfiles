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
const telemetry_1 = require("./telemetry");
function telemetrise(command, kubectl, callback) {
    return (a) => {
        clusterType(kubectl).then(([ct, ndr]) => {
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent("command", { command: command, clusterType: ct, nonDeterminationReason: ndr });
            }
        });
        return callback(a);
    };
}
exports.telemetrise = telemetrise;
var ClusterType;
(function (ClusterType) {
    ClusterType[ClusterType["Unassigned"] = 0] = "Unassigned";
    ClusterType[ClusterType["Indeterminate"] = 1] = "Indeterminate";
    ClusterType[ClusterType["Azure"] = 2] = "Azure";
    ClusterType[ClusterType["Minikube"] = 3] = "Minikube";
    ClusterType[ClusterType["Local"] = 4] = "Local";
    ClusterType[ClusterType["FailedLocal"] = 5] = "FailedLocal";
    ClusterType[ClusterType["Other"] = 6] = "Other";
})(ClusterType = exports.ClusterType || (exports.ClusterType = {}));
var NonDeterminationReason;
(function (NonDeterminationReason) {
    NonDeterminationReason[NonDeterminationReason["Unassigned"] = 0] = "Unassigned";
    NonDeterminationReason[NonDeterminationReason["None"] = 1] = "None";
    NonDeterminationReason[NonDeterminationReason["GetCurrentContextError"] = 2] = "GetCurrentContextError";
    NonDeterminationReason[NonDeterminationReason["GetClusterInfoFailed"] = 3] = "GetClusterInfoFailed";
    NonDeterminationReason[NonDeterminationReason["ConnectionRefused"] = 4] = "ConnectionRefused";
    NonDeterminationReason[NonDeterminationReason["ConnectionTimeout"] = 5] = "ConnectionTimeout";
    NonDeterminationReason[NonDeterminationReason["ConnectionOtherError"] = 6] = "ConnectionOtherError";
    NonDeterminationReason[NonDeterminationReason["CredentialsExecError"] = 7] = "CredentialsExecError";
    NonDeterminationReason[NonDeterminationReason["CredentialsOtherError"] = 8] = "CredentialsOtherError";
    NonDeterminationReason[NonDeterminationReason["GetClusterInfoOtherError"] = 9] = "GetClusterInfoOtherError";
    NonDeterminationReason[NonDeterminationReason["NoMasterInClusterInfo"] = 10] = "NoMasterInClusterInfo";
    NonDeterminationReason[NonDeterminationReason["NonAzureMasterURL"] = 11] = "NonAzureMasterURL";
})(NonDeterminationReason = exports.NonDeterminationReason || (exports.NonDeterminationReason = {}));
let latestContextName;
let cachedClusterType = ClusterType.Indeterminate;
let cachedReason = NonDeterminationReason.None;
const knownClusters = {};
function invalidateClusterType(newContext, kubectl) {
    latestContextName = newContext || null;
    cachedClusterType = ClusterType.Indeterminate;
    if (kubectl) {
        setImmediate(() => {
            try {
                loadCachedClusterType(kubectl);
            }
            catch (_a) {
                // swallow it
            }
        });
    }
}
exports.invalidateClusterType = invalidateClusterType;
function clusterType(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cachedClusterType === ClusterType.Indeterminate || cachedClusterType === ClusterType.Unassigned) {
            yield loadCachedClusterType(kubectl);
        }
        return [telemetryNameOf(cachedClusterType), telemetryReasonOf(cachedReason)];
    });
}
function telemetryNameOf(clusterType) {
    switch (clusterType) {
        case ClusterType.Azure:
            return 'azure';
        case ClusterType.Minikube:
            return 'minikube';
        case ClusterType.Local:
            return 'local_non_minikube';
        case ClusterType.FailedLocal:
            return 'local_unreachable';
        case ClusterType.Other:
            return 'other';
        case ClusterType.Indeterminate:
            return 'indeterminate';
        case ClusterType.Unassigned:
            return 'internal_k8s_extension_error';
    }
}
function telemetryReasonOf(reason) {
    switch (reason) {
        case NonDeterminationReason.None:
            return '';
        case NonDeterminationReason.GetCurrentContextError:
            return 'error_getting_current_context';
        case NonDeterminationReason.GetClusterInfoFailed:
            return 'error_calling_kubectl_cluster_info';
        case NonDeterminationReason.ConnectionRefused:
            return 'cluster_connection_refused';
        case NonDeterminationReason.ConnectionTimeout:
            return 'cluster_connection_timeout';
        case NonDeterminationReason.ConnectionOtherError:
            return 'cluster_connection_misc_error';
        case NonDeterminationReason.CredentialsExecError:
            return 'cluster_credentials_exec_error';
        case NonDeterminationReason.CredentialsOtherError:
            return 'cluster_credentials_misc_error';
        case NonDeterminationReason.GetClusterInfoOtherError:
            return 'kubectl_cluster_info_misc_error';
        case NonDeterminationReason.NoMasterInClusterInfo:
            return 'no_master_in_cluster_info';
        case NonDeterminationReason.NonAzureMasterURL:
            return 'master_url_not_recognised';
        case NonDeterminationReason.Unassigned:
            return 'internal_k8s_extension_error';
    }
}
function loadCachedClusterType(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (latestContextName && knownClusters[latestContextName]) {
            [cachedClusterType, cachedReason] = knownClusters[latestContextName];
        }
        else {
            [cachedClusterType, cachedReason] = yield inferCurrentClusterType(kubectl);
            if (latestContextName) {
                knownClusters[latestContextName] = [cachedClusterType, cachedReason];
            }
        }
    });
}
function inferCurrentClusterType(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!latestContextName) {
            const ctxsr = yield kubectl.invokeAsync('config current-context');
            if (ctxsr && ctxsr.code === 0) {
                latestContextName = ctxsr.stdout.trim();
            }
            else {
                return [ClusterType.Other, NonDeterminationReason.GetCurrentContextError]; // something is terribly wrong; we don't want to retry
            }
        }
        if (latestContextName === 'minikube') {
            return [ClusterType.Minikube, NonDeterminationReason.None];
        }
        const cisr = yield kubectl.invokeAsync('cluster-info');
        if (!cisr || cisr.code !== 0) {
            return [inferClusterTypeFromError(cisr), diagnoseKubectlClusterInfoError(cisr)];
        }
        const masterInfos = cisr.stdout.split('\n')
            .filter((s) => s.indexOf('master is running at') >= 0);
        if (masterInfos.length === 0) {
            return [ClusterType.Other, NonDeterminationReason.NoMasterInClusterInfo]; // something is terribly wrong; we don't want to retry
        }
        const masterInfo = masterInfos[0];
        if (masterInfo.indexOf('azmk8s.io') >= 0 || masterInfo.indexOf('azure.com') >= 0) {
            return [ClusterType.Azure, NonDeterminationReason.None];
        }
        if (latestContextName) {
            const gcsr = yield kubectl.invokeAsync(`config get-contexts ${latestContextName}`);
            if (gcsr && gcsr.code === 0) {
                if (gcsr.stdout.indexOf('minikube') >= 0) {
                    return [ClusterType.Minikube, NonDeterminationReason.None]; // It's pretty heuristic, so don't spend time parsing the table
                }
            }
        }
        // TODO: validate this
        if (masterInfo.indexOf('localhost') >= 0 || masterInfo.indexOf('127.0.0.1') >= 0) {
            return [ClusterType.Local, NonDeterminationReason.None];
        }
        return [ClusterType.Other, NonDeterminationReason.NonAzureMasterURL];
    });
}
function inferClusterTypeFromError(sr) {
    if (!sr || sr.code === 0 || !sr.stderr) {
        return ClusterType.Indeterminate; // shouldn't be calling us in this case!
    }
    const errorText = sr.stderr.toLowerCase();
    if (errorText.includes('dial tcp localhost') || errorText.includes('dial tcp 127.0.0.1')) {
        return ClusterType.FailedLocal;
    }
    return ClusterType.Indeterminate;
}
function diagnoseKubectlClusterInfoError(sr) {
    if (!sr) {
        return NonDeterminationReason.GetClusterInfoFailed;
    }
    if (sr.code === 0) {
        return NonDeterminationReason.None;
    }
    if (!sr.stderr || sr.stderr.length === 0) {
        return NonDeterminationReason.GetClusterInfoOtherError;
    }
    const error = sr.stderr.toLowerCase();
    if (error.includes('connectex:')) {
        if (error.includes('actively refused')) {
            return NonDeterminationReason.ConnectionRefused;
        }
        if (error.includes('did not properly response after a period of time')) {
            return NonDeterminationReason.ConnectionTimeout;
        }
        return NonDeterminationReason.ConnectionOtherError;
    }
    if (error.includes('getting credentials')) {
        if (error.includes('exec')) {
            return NonDeterminationReason.CredentialsExecError;
        }
        return NonDeterminationReason.CredentialsOtherError;
    }
    return NonDeterminationReason.GetClusterInfoOtherError;
}
//# sourceMappingURL=telemetry-helper.js.map