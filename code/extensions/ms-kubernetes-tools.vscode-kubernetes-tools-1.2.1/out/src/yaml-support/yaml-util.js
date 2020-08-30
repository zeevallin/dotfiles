"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const _ = require("lodash");
const yaml_locator_1 = require("./yaml-locator");
const node_yaml_parser_1 = require("node-yaml-parser");
const yaml_constant_1 = require("./yaml-constant");
var StringComparison;
(function (StringComparison) {
    StringComparison[StringComparison["Ordinal"] = 0] = "Ordinal";
    StringComparison[StringComparison["OrdinalIgnoreCase"] = 1] = "OrdinalIgnoreCase";
})(StringComparison = exports.StringComparison || (exports.StringComparison = {}));
/**
 * Test whether the current position is at any key in yaml file.
 *
 * @param {vscode.TextDocument} doc the yaml text document
 * @param {vscode.Position} pos the position
 * @returns {boolean} whether the current position is at any key
 */
function isPositionInKey(doc, pos) {
    if (!doc || !pos) {
        return false;
    }
    const { matchedNode } = yaml_locator_1.yamlLocator.getMatchedElement(doc, pos);
    return node_yaml_parser_1.util.isKey(matchedNode);
}
exports.isPositionInKey = isPositionInKey;
/**
 * Load json data from a json file.
 * @param {string} file
 * @returns the parsed data if no error occurs, otherwise undefined is returned
 */
function loadJson(file) {
    if (fs.existsSync(file)) {
        try {
            return JSON.parse(fs.readFileSync(file, 'utf-8'));
        }
        catch (err) {
            // ignore
        }
    }
    return undefined;
}
exports.loadJson = loadJson;
/**
 * Construct a kubernetes uri for kubernetes manifest, if there are multiple type of manifest, combine them
 * using a '+' character, duplicate ids is allowed and will be removed.
 *
 * @param {string[]} ids the id array of the manifest,
 *                  eg: ['io.k8s.kubernetes.pkg.apis.extensions.v1beta1.HTTPIngressPath']
 * @returns {string} the schema uri,
 *                  eg:  kubernetes://schema/io.k8s.kubernetes.pkg.apis.extensions.v1beta1.
 *  httpingresspath, the uri is converted to low case.
 */
function makeKubernetesUri(ids) {
    if (!ids) {
        throw new Error("'id' is required for constructing a schema uri.");
    }
    if (_.isString(ids)) {
        return yaml_constant_1.KUBERNETES_SCHEMA_PREFIX + ids.toLowerCase();
    }
    // vscode-yaml now supports schema-sequence, we need to be care about the order in ids
    if (ids.length === 1) {
        return makeKubernetesUri(ids[0]);
    }
    else if (ids.length > 1) {
        return yaml_constant_1.KUBERNETES_SCHEMA_PREFIX + ids.map((id) => id.toLowerCase()).join('+');
    }
    else {
        return undefined;
    }
}
exports.makeKubernetesUri = makeKubernetesUri;
// create a $ref schema for kubernetes manifest
function makeRefOnKubernetes(id) {
    const uri = makeKubernetesUri(id);
    return uri ? { $ref: uri } : undefined;
}
exports.makeRefOnKubernetes = makeRefOnKubernetes;
// extract id, apiVersion, kind from x-kubernetes-group-version-kind node in schema
function parseKubernetesGroupVersionKind(groupKindNodeItem) {
    const group = getStringValue(groupKindNodeItem, 'group', StringComparison.OrdinalIgnoreCase);
    const version = getStringValue(groupKindNodeItem, 'version', StringComparison.OrdinalIgnoreCase);
    const apiVersion = group ? `${group}/${version}` : version;
    const kind = getStringValue(groupKindNodeItem, 'kind', StringComparison.OrdinalIgnoreCase);
    return apiVersion && kind ? { id: apiVersion + yaml_constant_1.GROUP_VERSION_KIND_SEPARATOR + kind, apiVersion, kind } : undefined;
}
exports.parseKubernetesGroupVersionKind = parseKubernetesGroupVersionKind;
// test whether two strings are equal ignore case
function equalIgnoreCase(a, b) {
    return _.isString(a) && _.isString(b) && a.toLowerCase() === b.toLowerCase();
}
exports.equalIgnoreCase = equalIgnoreCase;
// Get the string value of key in a yaml mapping node(parsed by node-yaml-parser)
// eg: on the following yaml, this method will return 'value1' for key 'key1'
//
//      key1: value1
//      key2: value2
//
function getYamlMappingValue(mapRootNode, key, ignoreCase = StringComparison.Ordinal) {
    // TODO, unwrap quotes
    if (!key) {
        return undefined;
    }
    const keyValueItem = mapRootNode.mappings.find((mapping) => mapping.key &&
        (ignoreCase === StringComparison.OrdinalIgnoreCase ? key === mapping.key.raw : equalIgnoreCase(key, mapping.key.raw)));
    return keyValueItem ? keyValueItem.value.raw : undefined;
}
exports.getYamlMappingValue = getYamlMappingValue;
// get the string value in a javascript object with key(may be case sensitive due to the third parameter)
function getStringValue(node, key, ignoreCase = StringComparison.Ordinal) {
    if (!node) {
        return undefined;
    }
    if (node.hasOwnProperty(key)) {
        return node[key];
    }
    if (ignoreCase === StringComparison.OrdinalIgnoreCase) {
        for (const nodeKey of Object.keys(node)) {
            if (equalIgnoreCase(key, nodeKey)) {
                return node[nodeKey];
            }
        }
    }
    return undefined;
}
//# sourceMappingURL=yaml-util.js.map