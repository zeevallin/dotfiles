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
const semver = require("semver");
const vscode_uri_1 = require("vscode-uri");
const vscode = require("vscode");
const yaml_locator_1 = require("./yaml-locator");
const yaml_constant_1 = require("./yaml-constant");
const util = require("./yaml-util");
const background_context_cache_1 = require("../components/contextmanager/background-context-cache");
const schema_holder_1 = require("./schema-holder");
let schemas = null;
function registerYamlSchemaSupport(activeContextTracker, kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        schemas = new background_context_cache_1.BackgroundContextCache(activeContextTracker, () => schema_holder_1.KubernetesClusterSchemaHolder.fromActiveCluster(kubectl), schema_holder_1.KubernetesClusterSchemaHolder.fallback());
        const yamlPlugin = yield activateYamlExtension();
        if (!yamlPlugin || !yamlPlugin.registerContributor) {
            // activateYamlExtension has already alerted to users for errors.
            return;
        }
        // register for kubernetes schema provider
        yamlPlugin.registerContributor(yaml_constant_1.KUBERNETES_SCHEMA, requestYamlSchemaUriCallback, requestYamlSchemaContentCallback);
    });
}
exports.registerYamlSchemaSupport = registerYamlSchemaSupport;
// see docs from YamlSchemaContributor
function requestYamlSchemaUriCallback(resource) {
    const textEditor = vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === resource);
    if (textEditor) {
        const yamlDocs = yaml_locator_1.yamlLocator.getYamlDocuments(textEditor.document);
        const choices = [];
        const activeSchema = schemas && schemas.active();
        if (!activeSchema) {
            return undefined;
        }
        yamlDocs.forEach((doc) => {
            // if the yaml document contains apiVersion and kind node, it will report it is a kubernetes yaml
            // file
            const topLevelMapping = doc.nodes.find((node) => node.kind === 'MAPPING');
            if (topLevelMapping) {
                // if the overall yaml is an map, find the apiVersion and kind properties in yaml
                const apiVersion = util.getYamlMappingValue(topLevelMapping, 'apiVersion');
                const kind = util.getYamlMappingValue(topLevelMapping, 'kind');
                if (apiVersion && kind) {
                    const qualifiedKind = apiVersion + yaml_constant_1.GROUP_VERSION_KIND_SEPARATOR + kind;
                    // Check we have a schema here - returning undefined from the schema content callback reports an error
                    if (activeSchema.lookup(qualifiedKind)) {
                        choices.push(qualifiedKind);
                    }
                }
            }
        });
        return util.makeKubernetesUri(choices);
    }
    return undefined;
}
// see docs from YamlSchemaContributor
function requestYamlSchemaContentCallback(uri) {
    const parsedUri = vscode_uri_1.default.parse(uri);
    if (parsedUri.scheme !== yaml_constant_1.KUBERNETES_SCHEMA) {
        return undefined;
    }
    if (!parsedUri.path || !parsedUri.path.startsWith('/')) {
        return undefined;
    }
    if (!schemas) {
        return undefined;
    }
    // slice(1) to remove the first '/' in schema
    // eg: kubernetes://schema/io.k8s.kubernetes.pkg.apis.extensions.v1beta1.httpingresspath will have
    // path '/io.k8s.kubernetes.pkg.apis.extensions.v1beta1.httpingresspath'
    const manifestType = parsedUri.path.slice(1);
    // if it is a multiple choice, make an 'oneof' schema.
    if (manifestType.includes('+')) {
        const manifestRefList = manifestType.split('+').choose(util.makeRefOnKubernetes);
        // yaml language server supports schemaSequence at
        // https://github.com/redhat-developer/yaml-language-server/pull/81
        return JSON.stringify({ schemaSequence: manifestRefList });
    }
    const schema = schemas.active().lookup(manifestType);
    // convert it to string since vscode-yaml need the string format
    if (schema) {
        return JSON.stringify(schema);
    }
    return undefined;
}
// find redhat.vscode-yaml extension and try to activate it to get the yaml contributor
function activateYamlExtension() {
    return __awaiter(this, void 0, void 0, function* () {
        const ext = vscode.extensions.getExtension(yaml_constant_1.VSCODE_YAML_EXTENSION_ID);
        if (!ext) {
            vscode.window.showWarningMessage('Please install \'YAML Support by Red Hat\' via the Extensions pane.');
            return undefined;
        }
        const yamlPlugin = yield ext.activate();
        if (!yamlPlugin || !yamlPlugin.registerContributor) {
            vscode.window.showWarningMessage('The installed Red Hat YAML extension doesn\'t support Kubernetes Intellisense. Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
            return undefined;
        }
        if (ext.packageJSON.version && !semver.gte(ext.packageJSON.version, '0.0.15')) {
            vscode.window.showWarningMessage('The installed Red Hat YAML extension doesn\'t support multiple schemas. Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
        }
        return yamlPlugin;
    });
}
function updateYAMLSchema() {
    if (schemas) {
        schemas.invalidateActive();
        // There doesn't seem to be a way to get the YAML extension to pick up the update so
        // for now users would need to close and reopen any affected open documents.  Raised
        // issue with RedHat: https://github.com/redhat-developer/vscode-yaml/issues/202
    }
}
exports.updateYAMLSchema = updateYAMLSchema;
//# sourceMappingURL=yaml-schema.js.map