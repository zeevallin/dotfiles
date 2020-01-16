"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.KUBERNETES_SCHEMA = 'kubernetes';
exports.KUBERNETES_SCHEMA_PREFIX = exports.KUBERNETES_SCHEMA + '://schema/';
exports.VSCODE_YAML_EXTENSION_ID = 'redhat.vscode-yaml';
exports.KUBERNETES_SCHEMA_VERSION = '1.12.2';
exports.KUBERNETES_SCHEMA_FILE = path.join(__dirname, `../../../schema/swagger-v${exports.KUBERNETES_SCHEMA_VERSION}.json`);
exports.FALLBACK_SCHEMA_FILE = path.join(__dirname, `../../../schema/swagger-v${exports.KUBERNETES_SCHEMA_VERSION}.json`);
exports.KUBERNETES_SCHEMA_ENUM_FILE = path.join(__dirname, `../../../schema/schema_enums-v${exports.KUBERNETES_SCHEMA_VERSION}.json`);
exports.KUBERNETES_GROUP_VERSION_KIND = 'x-kubernetes-group-version-kind';
exports.GROUP_VERSION_KIND_SEPARATOR = '@';
//# sourceMappingURL=yaml-constant.js.map