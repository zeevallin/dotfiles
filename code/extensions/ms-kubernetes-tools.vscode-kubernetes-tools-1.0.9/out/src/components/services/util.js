'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const yamljs = require("yamljs");
const clipboardy = require("clipboardy");
const host_1 = require("../../host");
const binding_1 = require("./binding");
const fs_1 = require("../../fs");
const helm_exec_1 = require("../../helm.exec");
/**
 * Writes the secret keys (not the values) to the values.yaml.
 * @param serviceType the type of the service
 * @param bindingName the name of the binding/service
 * @param secretKeys array containing keys in the deployed secret.
 * @param chartYaml ChartYaml object.
 */
function writeSecretData(serviceType, bindingName, value, chartYaml) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (serviceType) {
            case binding_1.ServiceType.serviceEnv:
                const serviceBinding = {
                    name: bindingName,
                    value: value
                };
                if (chartYaml.yaml.serviceEnv) {
                    chartYaml.yaml.serviceEnv.push(serviceBinding);
                }
                else {
                    chartYaml.yaml.serviceEnv = [serviceBinding];
                }
                break;
            case binding_1.ServiceType.serviceCatalogEnv:
                // if we have service catalog keys already, add them.
                const serviceCatalogBinding = {
                    name: bindingName,
                    vars: value
                };
                if (chartYaml.yaml.serviceCatalogEnv) {
                    chartYaml.yaml.serviceCatalogEnv.push(serviceCatalogBinding);
                }
                else {
                    chartYaml.yaml.serviceCatalogEnv = [serviceCatalogBinding];
                }
                break;
            default:
                break;
        }
        // remove the file, and re-write our modified version.
        yield fs_1.fs.unlinkAsync(chartYaml.path);
        yield fs_1.fs.writeFile(chartYaml.path, yamljs.stringify(chartYaml.yaml, 2));
    });
}
exports.writeSecretData = writeSecretData;
/**
 * Checks to see if we've already added a binding for a service.
 * @param serviceType
 * @param bindingName A binding name to check in valuesYaml.serviceCatalogEnv.
 * @param valuesYaml The loaded values.yaml file.
 * @returns A boolean indicating that the binding to be added is already in the values yaml.
 */
function isBindingAdded(serviceType, bindingName, valuesYaml) {
    const environment = valuesYaml[serviceType];
    if (!environment) {
        return false;
    }
    return environment.some((binding) => {
        return binding.name === bindingName;
    });
}
exports.isBindingAdded = isBindingAdded;
function pickChartAsync() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            helm_exec_1.pickChart((chartPath) => {
                resolve(chartPath);
            });
        });
    });
}
exports.pickChartAsync = pickChartAsync;
/**
 * Writes usage information for the deployed service to the system clipboard.
 * @param serviceType the type of Service to write binding info for.
 * @param bindingName The name of the external service
 * @param secretKeys The keys to write usage information about.
 */
function writeUsageToClipboard(serviceType, bindingName, secretKeys) {
    return __awaiter(this, void 0, void 0, function* () {
        if (serviceType === binding_1.ServiceType.serviceEnv) {
            const message = `// To use service ${bindingName}, we added an environment variable containing the DNS hostname: SERVICE_${bindingName.toUpperCase()}`;
            yield clipboardy.write(message);
            return;
        }
        host_1.host.showInformationMessage("Wrote Service Usage information to your clipboard.");
        const environmentVariableMessages = [];
        for (const variableName of secretKeys) {
            const envVar = `${bindingName}_${variableName}`.toUpperCase();
            environmentVariableMessages.push(`// ${envVar}`);
        }
        const message = `// To use service ${bindingName}, we added a number of environment variables\n// to your application, as listed below:\n${environmentVariableMessages.join('\n')}`;
        yield clipboardy.write(message);
    });
}
exports.writeUsageToClipboard = writeUsageToClipboard;
function loadChartValues() {
    return __awaiter(this, void 0, void 0, function* () {
        const chartPath = yield pickChartAsync();
        const valuesFile = `${chartPath}/values.yaml`;
        const valuesYaml = yamljs.load(valuesFile);
        return {
            path: valuesFile,
            yaml: valuesYaml
        };
    });
}
exports.loadChartValues = loadChartValues;
function removeServiceBinding(serviceType) {
    return __awaiter(this, void 0, void 0, function* () {
        const chartYaml = yield loadChartValues();
        if (chartYaml.yaml[serviceType].length === 0) {
            host_1.host.showInformationMessage("No Services to remove.");
            return;
        }
        const chartBindings = [];
        for (let binding of chartYaml.yaml[serviceType]) {
            chartBindings.push(binding.name);
        }
        const bindingToRemove = yield host_1.host.showQuickPick(chartBindings, {
            placeholder: "Select a Service to remove"
        });
        // No selection was made.
        if (bindingToRemove === undefined || bindingToRemove === "") {
            return;
        }
        const prunedChartBindings = chartYaml.yaml[serviceType].filter((binding) => binding.name != bindingToRemove);
        chartYaml.yaml[serviceType] = prunedChartBindings;
        yield fs_1.fs.unlinkAsync(chartYaml.path);
        yield fs_1.fs.writeFile(chartYaml.path, yamljs.stringify(chartYaml.yaml, 2));
    });
}
exports.removeServiceBinding = removeServiceBinding;
//# sourceMappingURL=util.js.map