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
const vscode = require("vscode");
function promptForPort(promptMessage, defaultPort) {
    return __awaiter(this, void 0, void 0, function* () {
        const input = yield vscode.window.showInputBox({
            prompt: promptMessage,
            placeHolder: defaultPort,
            value: defaultPort
        });
        return input && input.trim();
    });
}
function promptForDebugPort(defaultPort) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield promptForPort("Please specify debug port exposed for debugging", defaultPort);
    });
}
exports.promptForDebugPort = promptForDebugPort;
function promptForAppPort(ports, defaultPort, env) {
    return __awaiter(this, void 0, void 0, function* () {
        let rawAppPortInfo;
        if (ports.length === 0) {
            return yield promptForPort("What port does your application listen on?", defaultPort);
        }
        if (ports.length === 1) {
            rawAppPortInfo = ports[0];
        }
        else if (ports.length > 1) {
            rawAppPortInfo = yield vscode.window.showQuickPick(ports, { placeHolder: "Choose the port your app listens on." });
        }
        if (!rawAppPortInfo) {
            return undefined;
        }
        // If the chosen port is a variable, then need set it in environment variables.
        const portRegExp = /\$\{?(\w+)\}?/;
        const portRegExpMatch = rawAppPortInfo.match(portRegExp);
        if (portRegExpMatch && portRegExpMatch.length > 0) {
            const varName = portRegExpMatch[1];
            if (rawAppPortInfo.trim() === `$${varName}` || rawAppPortInfo.trim() === `\${${varName}}`) {
                const defaultAppPort = "50006"; // Configure an unusual port number for the variable.
                env[varName] = defaultAppPort;
                rawAppPortInfo = defaultAppPort;
            }
            else {
                vscode.window.showErrorMessage(`Invalid port variable ${rawAppPortInfo} in the docker file.`);
                return undefined;
            }
        }
        return rawAppPortInfo;
    });
}
exports.promptForAppPort = promptForAppPort;
/**
 * Get the command info associated with the processes in the target container.
 *
 * @param kubectl the kubectl client.
 * @param pod the pod name.
 * @param container the container name.
 * @return the commands associated with the processes.
 */
function getCommandsOfProcesses(kubectl, pod, podNamespace, container) {
    return __awaiter(this, void 0, void 0, function* () {
        const commandLines = [];
        const nsarg = podNamespace ? `--namespace ${podNamespace}` : '';
        const containerCommand = container ? `-c ${container}` : '';
        const execCmd = `exec ${pod} ${nsarg} ${containerCommand} -- ps -ef`;
        const execResult = yield kubectl.invokeAsync(execCmd);
        if (execResult && execResult.code === 0) {
            /**
             * PID   USER     TIME   COMMAND
             *  1    root     2:09   java -Djava.security.egd=file:/dev/./urandom -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=1044,quiet=y -jar target/app.jar
             * 44    root     0:00   sh
             * 48    root     0:00   ps -ef
             */
            const rows = execResult.stdout.split("\n");
            const columnCount = rows[0].trim().split(/\s+/).length;
            // The 1st row is the header, loop from the 2nd row.
            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i].trim().split(/\s+/);
                if (cols.length < columnCount) {
                    continue;
                }
                commandLines.push(cols.slice(columnCount - 1, cols.length).join(" "));
            }
        }
        return commandLines;
    });
}
exports.getCommandsOfProcesses = getCommandsOfProcesses;
//# sourceMappingURL=debugUtils.js.map