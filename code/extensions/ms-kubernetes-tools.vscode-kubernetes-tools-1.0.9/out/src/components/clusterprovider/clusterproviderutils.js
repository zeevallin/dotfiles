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
const clusterproviderserver = require("./clusterproviderserver");
function renderWizardContainer(action) {
    return __awaiter(this, void 0, void 0, function* () {
        yield clusterproviderserver.init();
        return `
    <html>
    <head>
        <style>
            html, body {
                width: 100%;
                height: 100%;
            }
            iframe {
                width: 100%;
                height: 100%;
                border: 0px;
            }
            .vscode-light #theme-canary {
                display: none;
                visibility: hidden;
            }
            .vscode-dark #theme-canary {
                display: none;
                visibility: visible;
            }
        </style>
        <script>
        function styleme() {
            // TODO: shameful, shameful, shameful
            var vscodeStyles = document.getElementById('_defaultStyles');
            var contentFrame = document.getElementById('contentFrame');
            var embeddedDocStyles = contentFrame.contentDocument.getElementById('styleholder');
            embeddedDocStyles.textContent = vscodeStyles.textContent;
            var b = document.getElementById('theme-canary');
            var canary = window.getComputedStyle(b).visibility;
            var theme = (canary === 'hidden') ? 'vscode-light' : 'vscode-dark';
            contentFrame.contentDocument.body.setAttribute('class', theme);
        }
        </script>
    </head>
    <body>
        <p id='theme-canary'>Theme canary - if you see this, it's a bug</p>
        <iframe id='contentFrame' src='${clusterproviderserver.url(action)}' onload='styleme()' />
    </body>
    </html>`;
    });
}
exports.renderWizardContainer = renderWizardContainer;
//# sourceMappingURL=clusterproviderutils.js.map