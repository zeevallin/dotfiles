"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.languageSelector = exports.supportedLanguages = exports.EXTENSION_VERSION = exports.EXTENSION_NAME = void 0;
const vscode_1 = require("vscode");
/**
 * @returns {string} package version
 */
function getExtensionVersion() {
    const extension = vscode_1.extensions.getExtension('sibiraj-s.vscode-scss-formatter');
    if (extension && extension.packageJSON) {
        return extension.packageJSON.version;
    }
    return null;
}
/** languages supported by scss formatter */
const supportedLanguages = [
    'css',
    'scss'
];
exports.supportedLanguages = supportedLanguages;
/** files to format by language */
const languageSelector = supportedLanguages.map((language) => ({ scheme: 'file', language }));
exports.languageSelector = languageSelector;
const EXTENSION_NAME = 'SCSS Formatter';
exports.EXTENSION_NAME = EXTENSION_NAME;
const EXTENSION_VERSION = getExtensionVersion();
exports.EXTENSION_VERSION = EXTENSION_VERSION;
//# sourceMappingURL=utils.js.map