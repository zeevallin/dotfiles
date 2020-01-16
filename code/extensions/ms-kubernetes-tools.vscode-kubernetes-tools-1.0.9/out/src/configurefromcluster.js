'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const clusterproviderutils = require("./components/clusterprovider/clusterproviderutils");
exports.uriScheme = "k8sconfigure";
function operationUri(operationId) {
    return vscode_1.Uri.parse(`${exports.uriScheme}://operations/${operationId}`);
}
exports.operationUri = operationUri;
function uiProvider() {
    return new UIProvider();
}
exports.uiProvider = uiProvider;
class UIProvider {
    provideTextDocumentContent(uri, token) {
        return clusterproviderutils.renderWizardContainer('configure');
    }
}
//# sourceMappingURL=configurefromcluster.js.map