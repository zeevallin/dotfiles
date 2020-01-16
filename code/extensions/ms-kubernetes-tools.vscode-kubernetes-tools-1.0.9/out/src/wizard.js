"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function selectionChangedScript(commandName, operationId) {
    const js = `
function selectionChanged() {
    var selectCtrl = document.getElementById('selector');
    if (!selectCtrl.options[selectCtrl.selectedIndex]) {
        return;
    }
    var selection = selectCtrl.options[selectCtrl.selectedIndex].value;
    var request = '{"operationId":"${operationId}","requestData":"' + selection + '"}';
    document.getElementById('nextlink').href = encodeURI('command:extension.${commandName}?' + request);
}
`;
    return script(js);
}
exports.selectionChangedScript = selectionChangedScript;
function script(text) {
    return `
<script>
${text}
</script>
`;
}
exports.script = script;
function waitScript(title) {
    const js = `
function promptWait() {
    document.getElementById('h').innerText = '${title}';
    document.getElementById('content').style.visibility = 'hidden';
}
`;
    return script(js);
}
exports.waitScript = waitScript;
function styles() {
    return `
<style>
.vscode-light a {
    color: navy;
}

.vscode-dark a {
    color: azure;
}

.vscode-light .error {
    color: red;
    font-weight: bold;
}

.vscode-dark .error {
    color: red;
    font-weight: bold;
}

.vscode-light .success {
    color: green;
    font-weight: bold;
}

.vscode-dark .success {
    color: darkseagreen;
    font-weight: bold;
}
</style>
`;
}
exports.styles = styles;
function formStyles() {
    return `
<style>
.link-button {
    background: none;
    border: none;
    color: blue;
    text-decoration: underline;
    cursor: pointer;
    font-size: 1em;
    font-family: sans-serif;
}
.vscode-light .link-button {
    color: navy;
}
.vscode-dark .link-button {
    color: azure;
}
.link-button:focus {
    outline: none;
}
.link-button:active {
    color:red;
}
</style>
`;
}
exports.formStyles = formStyles;
function fromShellExitCodeAndStandardError(sr, invocationFailureMessage) {
    if (!sr) {
        return { succeeded: false, error: [invocationFailureMessage] };
    }
    if (sr.code === 0 && !sr.stderr) {
        return { succeeded: true, result: { value: sr.stderr } };
    }
    return { succeeded: false, error: [sr.stderr] };
}
exports.fromShellExitCodeAndStandardError = fromShellExitCodeAndStandardError;
function fromShellExitCodeOnly(sr, invocationFailureMessage) {
    if (!sr) {
        return { succeeded: false, error: [invocationFailureMessage] };
    }
    if (sr.code === 0) {
        return { succeeded: true, result: { value: sr.stderr } };
    }
    return { succeeded: false, error: [sr.stderr] };
}
exports.fromShellExitCodeOnly = fromShellExitCodeOnly;
function fromShellJson(sr, invocationFailureMessage, processor) {
    if (!sr) {
        return { succeeded: false, error: [invocationFailureMessage] };
    }
    if (sr.code === 0 && !sr.stderr) {
        const raw = JSON.parse(sr.stdout);
        const result = processor ? processor(raw) : raw;
        return { succeeded: true, result: result };
    }
    return { succeeded: false, error: [sr.stderr] };
}
exports.fromShellJson = fromShellJson;
//# sourceMappingURL=wizard.js.map