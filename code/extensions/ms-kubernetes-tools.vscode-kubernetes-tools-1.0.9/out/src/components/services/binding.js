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
const host_1 = require("../../host");
const cli = require("../../shell");
const kubectl_1 = require("../../kubectl");
const fs_1 = require("../../fs");
const shell_1 = require("../../shell");
const util_1 = require("./util");
var ServiceType;
(function (ServiceType) {
    ServiceType["serviceEnv"] = "serviceEnv";
    ServiceType["serviceCatalogEnv"] = "serviceCatalogEnv";
})(ServiceType = exports.ServiceType || (exports.ServiceType = {}));
function depCallback() { }
const kubectl = kubectl_1.create(host_1.host, fs_1.fs, shell_1.shell, depCallback);
exports.ServiceInstanceNames = [];
exports.ServiceInstanceArray = [];
exports.ServiceInstanceMap = {};
/**
 * Add a Kubernetes Service.
 */
function addService() {
    return __awaiter(this, void 0, void 0, function* () {
        const chartYaml = yield util_1.loadChartValues();
        const serviceResult = yield kubectl.invokeAsync('get svc -o json');
        if (serviceResult.code === -1) {
            return;
        }
        const servicesJson = JSON.parse(serviceResult.stdout);
        if (servicesJson.items.length === 0) {
            host_1.host.showInformationMessage("No services found in current namespace");
            return;
        }
        const services = [];
        const serviceNames = [];
        for (const service of servicesJson.items) {
            const metadata = service.metadata;
            services.push({
                name: metadata.name,
                namespace: metadata.namespace
            });
            serviceNames.push(metadata.name);
        }
        const selectedService = yield host_1.host.showQuickPick(serviceNames, { placeHolder: "Select a Kubernetes service to bind" });
        if (selectedService === "") {
            return;
        }
        // filter on the name.
        const serviceObj = services.filter((service) => { return service.name === selectedService; })[0];
        const dnsName = `${serviceObj.name}.${serviceObj.namespace}.svc.cluster.local`;
        if (util_1.isBindingAdded(ServiceType.serviceEnv, serviceObj.name, chartYaml.yaml)) {
            return;
        }
        yield util_1.writeSecretData(ServiceType.serviceEnv, serviceObj.name, dnsName, chartYaml);
        yield util_1.writeUsageToClipboard(ServiceType.serviceEnv, serviceObj.name, serviceObj.name);
        host_1.host.showInformationMessage("Wrote service info to your clipboard");
    });
}
exports.addService = addService;
function removeService() {
    return __awaiter(this, void 0, void 0, function* () {
        yield util_1.removeServiceBinding(ServiceType.serviceEnv);
    });
}
exports.removeService = removeService;
/**
 * Creates a binding for the application to the selected service.
 * Modifies the values.yaml file to retain information about available environment variables.
 * Drops an information blurb on the clipboard for service catalog usage information.
 */
function addExternalService() {
    return __awaiter(this, void 0, void 0, function* () {
        const chartYaml = yield util_1.loadChartValues();
        if (exports.ServiceInstanceNames.length === 0 && Object.keys(exports.ServiceInstanceMap).length === 0) {
            let serviceInstances = yield getServiceInstances();
        }
        const serviceToBind = yield host_1.host.showQuickPick(exports.ServiceInstanceNames, {
            placeHolder: "Pick an External Service to add to the selected application",
        });
        const binding = yield createOrGetServiceBinding(serviceToBind);
        // could not create a new or get a service binding - not a case we should encounter.
        if (!binding) {
            return;
        }
        // check to see if we've already added this service binding.
        if (util_1.isBindingAdded(ServiceType.serviceCatalogEnv, binding, chartYaml.yaml)) {
            return;
        }
        const secretData = yield getSecretData(binding);
        const secretKeys = Object.keys(secretData);
        yield util_1.writeSecretData(ServiceType.serviceCatalogEnv, binding, secretKeys, chartYaml);
        yield util_1.writeUsageToClipboard(ServiceType.serviceCatalogEnv, binding, secretKeys);
        host_1.host.showInformationMessage(`Bound the application to External Service "${serviceToBind}"`);
    });
}
exports.addExternalService = addExternalService;
/**
 * Removes a binding from the values.yaml file. Does not delete the binding from the service catalog
 * due to concerns about other applications having bound it.
 */
function removeExternalService() {
    return __awaiter(this, void 0, void 0, function* () {
        yield util_1.removeServiceBinding(ServiceType.serviceCatalogEnv);
    });
}
exports.removeExternalService = removeExternalService;
/**
 * Retrieves deployed secrets.
 * @param secretName The secret name deployed by service catalog.
 * @returns The secret data
 */
function getSecretData(secretName) {
    return __awaiter(this, void 0, void 0, function* () {
        let secretResults;
        try {
            secretResults = yield kubectl.invokeAsync(`get secret ${secretName} -o json`);
        }
        catch (e) {
            host_1.host.showErrorMessage(`Could not find the External Service secret ${secretName} on the cluster`);
            return;
        }
        if (secretResults.code !== 0) {
            host_1.host.showErrorMessage(`Could not get External Service ${secretName} on the cluster`);
            return;
        }
        const secretResultsJson = JSON.parse(secretResults.stdout);
        return secretResultsJson.data;
    });
}
/**
 * Binds an external service by creating a secret containing consumable binding information.
 * @param serviceName The service to create a binding for.
 */
function createOrGetServiceBinding(serviceName) {
    return __awaiter(this, void 0, void 0, function* () {
        let results;
        try {
            results = yield cli.shell.execCore(`svcat bind ${serviceName}`, '');
        }
        catch (e) {
            host_1.host.showErrorMessage(`Error binding to External Service "${serviceName}"`);
            return;
        }
        if (results.code !== 0) {
            // binding exists - consume it.
            if (results.stderr.indexOf("already exists")) {
                return serviceName;
            }
            host_1.host.showErrorMessage(`Could not bind to External Service "${serviceName}"`);
            return null;
        }
        return serviceName;
    });
}
/**
 * Gets available service instances deployed to your cluster.
 * @returns A list of ServiceInstance objects.
 */
function getServiceInstances() {
    return __awaiter(this, void 0, void 0, function* () {
        // If we've already got service instances, just return those.
        // TODO: figure out how we're gonna add new instances as they come up.
        if (exports.ServiceInstanceNames.length !== 0 && Object.keys(exports.ServiceInstanceMap).length !== 0) {
            return exports.ServiceInstanceArray;
        }
        let results;
        try {
            results = yield cli.shell.execCore(`svcat get instances`, '');
        }
        catch (e) {
            host_1.host.showErrorMessage(`Error retrieving Service Instances`);
            return;
        }
        if (results.code !== 0) {
            host_1.host.showErrorMessage(`Error retrieving Service Instances`);
            return;
        }
        return cleanUpInstanceResults(results.stdout);
    });
}
exports.getServiceInstances = getServiceInstances;
function cleanUpInstanceResults(results) {
    // Remove headers + empty lines.
    const splitResults = results.split('\n').slice(2).filter((s) => s.length != 0);
    const cleanedResults = [];
    // Build up ServiceInstance objects.
    for (let line of splitResults) {
        const filtered = line.split(' ').filter((s) => s.length != 0);
        const serviceInstance = {
            name: filtered[0],
            namespace: filtered[1],
            class: filtered[2],
            plan: filtered[3],
            status: filtered[4]
        };
        // Service instance name -> service instance map.
        exports.ServiceInstanceMap[serviceInstance.name] = serviceInstance;
        // All available service instance names.
        exports.ServiceInstanceNames.push(serviceInstance.name);
        exports.ServiceInstanceArray.push(serviceInstance);
        cleanedResults.push(serviceInstance);
    }
    return cleanedResults;
}
//# sourceMappingURL=binding.js.map