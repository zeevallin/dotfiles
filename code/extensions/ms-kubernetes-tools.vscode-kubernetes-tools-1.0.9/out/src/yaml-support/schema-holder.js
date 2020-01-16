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
const _ = require("lodash");
const yaml_constant_1 = require("./yaml-constant");
const schema_formatting_1 = require("../schema-formatting");
const swagger = require("../components/swagger/swagger");
const errorable_1 = require("../errorable");
const util = require("./yaml-util");
class KubernetesClusterSchemaHolder {
    constructor() {
        this.definitions = {};
    }
    static fromActiveCluster(kubectl) {
        return __awaiter(this, void 0, void 0, function* () {
            const holder = new KubernetesClusterSchemaHolder();
            yield holder.loadSchemaFromActiveCluster(kubectl, yaml_constant_1.KUBERNETES_SCHEMA_ENUM_FILE);
            return holder;
        });
    }
    static fallback() {
        const holder = new KubernetesClusterSchemaHolder();
        const fallbackSchema = util.loadJson(yaml_constant_1.FALLBACK_SCHEMA_FILE);
        holder.loadSchemaFromRaw(fallbackSchema, yaml_constant_1.KUBERNETES_SCHEMA_ENUM_FILE);
        return holder;
    }
    loadSchemaFromActiveCluster(kubectl, schemaEnumFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const clusterSwagger = yield swagger.getClusterSwagger(kubectl);
            const schemaRaw = errorable_1.succeeded(clusterSwagger) ? this.definitionsObject(clusterSwagger.result) : util.loadJson(yaml_constant_1.FALLBACK_SCHEMA_FILE);
            this.loadSchemaFromRaw(schemaRaw, schemaEnumFile);
        });
    }
    definitionsObject(swagger) {
        return {
            definitions: swagger.definitions
        };
    }
    loadSchemaFromRaw(schemaRaw, schemaEnumFile) {
        this.schemaEnums = schemaEnumFile ? util.loadJson(schemaEnumFile) : {};
        const definitions = schemaRaw.definitions;
        makeSafeIntOrString(definitions);
        for (const name of Object.keys(definitions)) {
            this.saveSchemaWithManifestStyleKeys(name, definitions[name]);
        }
        for (const schema of _.values(this.definitions)) {
            if (schema.properties) {
                // the swagger schema has very short description on properties, we need to get the actual type of
                // the property and provide more description/properties details, just like `kubernetes explain` do.
                _.each(schema.properties, (propVal, propKey) => {
                    if (schema.kind && propKey === 'kind') {
                        propVal.markdownDescription = this.getMarkdownDescription(schema.kind, undefined, schema, true);
                        return;
                    }
                    const currentPropertyTypeRef = propVal.$ref || (propVal.items ? propVal.items.$ref : undefined);
                    if (_.isString(currentPropertyTypeRef)) {
                        const id = getNameInDefinitions(currentPropertyTypeRef);
                        const propSchema = this.lookup(id);
                        if (propSchema) {
                            propVal.markdownDescription = this.getMarkdownDescription(propKey, propVal, propSchema);
                        }
                    }
                    else {
                        propVal.markdownDescription = this.getMarkdownDescription(propKey, propVal, undefined);
                    }
                });
                // fix on each node in properties for $ref since it will directly reference '#/definitions/...'
                // we need to convert it into schema like 'kubernetes://schema/...'
                // we need also an array to collect them since we need to get schema from _definitions, at this point, we have
                // not finished the process of add schemas to _definitions, call patchOnRef will fail for some cases.
                this.replaceDefinitionRefsWithYamlSchemaUris(schema.properties);
                this.loadEnumsForKubernetesSchema(schema);
            }
        }
    }
    // get kubernetes schema by the key
    lookup(key) {
        return key ? this.definitions[key.toLowerCase()] : undefined;
    }
    /**
     * Save the schema object in swagger json to schema map.
     *
     * @param {string} name the property name in definition node of swagger json
     * @param originalSchema the origin schema object in swagger json
     */
    saveSchemaWithManifestStyleKeys(name, originalSchema) {
        if (isGroupVersionKindStyle(originalSchema)) {
            // if the schema contains 'x-kubernetes-group-version-kind'. then it is a direct kubernetes manifest,
            getManifestStyleSchemas(originalSchema).forEach((schema) => {
                this.saveSchema(Object.assign({ name }, schema));
            });
        }
        else {
            // if x-kubernetes-group-version-kind cannot be found, then it is an in-direct schema refereed by
            // direct kubernetes manifest, eg: io.k8s.kubernetes.pkg.api.v1.PodSpec
            this.saveSchema(Object.assign({ name }, originalSchema));
        }
    }
    // replace schema $ref with values like 'kubernetes://schema/...'
    replaceDefinitionRefsWithYamlSchemaUris(node) {
        if (!node) {
            return;
        }
        if (_.isArray(node)) {
            for (const subItem of node) {
                this.replaceDefinitionRefsWithYamlSchemaUris(subItem);
            }
        }
        if (!_.isObject(node)) {
            return;
        }
        for (const key of Object.keys(node)) {
            this.replaceDefinitionRefsWithYamlSchemaUris(node[key]);
        }
        if (_.isString(node.$ref)) {
            const name = getNameInDefinitions(node.$ref);
            const schema = this.lookup(name);
            if (schema) {
                // replacing $ref
                node.$ref = util.makeKubernetesUri(schema.name);
            }
        }
    }
    // add enum field for pre-defined enums in schema-enums json file
    loadEnumsForKubernetesSchema(node) {
        if (node.properties && this.schemaEnums[node.name]) {
            _.each(node.properties, (propSchema, propKey) => {
                if (this.schemaEnums[node.name][propKey]) {
                    if (propSchema.type === "array" && propSchema.items) {
                        propSchema.items.enum = this.schemaEnums[node.name][propKey];
                    }
                    else {
                        propSchema.enum = this.schemaEnums[node.name][propKey];
                    }
                }
            });
        }
    }
    // save the schema to the _definitions
    saveSchema(schema) {
        if (schema.name) {
            this.definitions[schema.name.toLowerCase()] = schema;
        }
        if (schema.id) {
            this.definitions[schema.id.toLowerCase()] = schema;
        }
    }
    // get the markdown format of document for the current property and the type of current property
    getMarkdownDescription(currentPropertyName, currentProperty, targetSchema, isKind = false) {
        if (isKind) {
            return schema_formatting_1.formatComplex(currentPropertyName, targetSchema.description, undefined, targetSchema.properties);
        }
        if (!targetSchema) {
            return schema_formatting_1.formatOne(currentPropertyName, schema_formatting_1.formatType(currentProperty), currentProperty.description);
        }
        const properties = targetSchema.properties;
        if (properties) {
            return schema_formatting_1.formatComplex(currentPropertyName, currentProperty ? currentProperty.description : "", targetSchema.description, properties);
        }
        return currentProperty ? currentProperty.description : (targetSchema ? targetSchema.description : "");
    }
}
exports.KubernetesClusterSchemaHolder = KubernetesClusterSchemaHolder;
/**
 * Tell whether or not the swagger schema is a kubernetes manifest schema, a kubernetes manifest schema like Service
 * should have `x-kubernetes-group-version-kind` node.
 *
 * @param originalSchema the origin schema object in swagger json
 * @return whether or not the swagger schema is
 */
function isGroupVersionKindStyle(originalSchema) {
    return originalSchema[yaml_constant_1.KUBERNETES_GROUP_VERSION_KIND] && originalSchema[yaml_constant_1.KUBERNETES_GROUP_VERSION_KIND].length;
}
/**
 * Process on kubernetes manifest schemas, for each selector in x-kubernetes-group-version-kind,
 * extract apiVersion and kind and make a id composed by apiVersion and kind.
 *
 * @param originalSchema the origin schema object in swagger json
 * @returns {KubernetesSchema[]} an array of schemas for the same manifest differentiated by id/apiVersion/kind;
 */
function getManifestStyleSchemas(originalSchema) {
    const schemas = Array.of();
    // eg: service, pod, deployment
    const groupKindNode = originalSchema[yaml_constant_1.KUBERNETES_GROUP_VERSION_KIND];
    // delete 'x-kubernetes-group-version-kind' since it is not a schema standard, it is only a selector
    delete originalSchema[yaml_constant_1.KUBERNETES_GROUP_VERSION_KIND];
    groupKindNode.forEach((groupKindNode) => {
        const gvk = util.parseKubernetesGroupVersionKind(groupKindNode);
        if (!gvk) {
            return;
        }
        const { id, apiVersion, kind } = gvk;
        // a direct kubernetes manifest has two reference keys: id && name
        // id: apiVersion + kind
        // name: the name in 'definitions' of schema
        schemas.push(Object.assign({ id,
            apiVersion,
            kind }, originalSchema));
    });
    return schemas;
}
// convert '#/definitions/com.github.openshift.origin.pkg.build.apis.build.v1.ImageLabel' to
// 'com.github.openshift.origin.pkg.build.apis.build.v1.ImageLabel'
function getNameInDefinitions($ref) {
    const prefix = '#/definitions/';
    if ($ref.startsWith(prefix)) {
        return $ref.slice(prefix.length);
    }
    else {
        return prefix;
    }
}
function makeSafeIntOrString(definitions) {
    // We need to tweak the IntOrString schema because the live schema has
    // it as type 'string' with format 'int-or-string', and this doesn't
    // play nicely with Red Hat YAML on Mac or Linux - it presents a validation
    // warning on unquoted integers saying they should be strings. This schema
    // is more semantically correct and appears to restore the correct behaviour
    // from RH YAML.
    const intOrStringDefinition = definitions['io.k8s.apimachinery.pkg.util.intstr.IntOrString'];
    if (intOrStringDefinition) {
        if (intOrStringDefinition.type === 'string') {
            intOrStringDefinition.oneOf = [
                { type: 'string' },
                { type: 'integer' }
            ];
            delete intOrStringDefinition.type;
        }
    }
}
//# sourceMappingURL=schema-holder.js.map