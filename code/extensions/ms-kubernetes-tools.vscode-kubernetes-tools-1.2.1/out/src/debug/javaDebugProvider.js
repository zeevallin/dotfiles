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
const path = require("path");
const vscode = require("vscode");
const debugUtils = require("./debugUtils");
const extensionUtils = require("../extensionUtils");
// Use the java debugger extension provided by microsoft team for java debugging.
const defaultJavaDebuggerExtensionId = "vscjava.vscode-java-debug";
const defaultJavaDebuggerExtension = "Debugger for Java";
const defaultJavaDebuggerConfigType = "java";
const defaultJavaDebugPort = "50005";
const defaultJavaAppPort = "8080";
const defaultJavaDebugOpts = `-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=${defaultJavaDebugPort},quiet=y`;
const javaDebugOptsRegExp = /(-agentlib|-Xrunjdwp):\S*(address=[^\s,]+)/i;
const fullJavaDebugOptsRegExp = /^java\s+.*(-agentlib|-Xrunjdwp):\S*(address=[^\s,]+)\S*/i;
class JavaDebugProvider {
    getDebuggerType() {
        return defaultJavaDebuggerConfigType;
    }
    isDebuggerInstalled() {
        return __awaiter(this, void 0, void 0, function* () {
            if (vscode.extensions.getExtension(defaultJavaDebuggerExtensionId)) {
                return true;
            }
            const answer = yield vscode.window.showInformationMessage(`Java debugging requires the '${defaultJavaDebuggerExtension}' extension. Would you like to install it now?`, "Install Now");
            if (answer === "Install Now") {
                return yield extensionUtils.installVscodeExtension(defaultJavaDebuggerExtensionId);
            }
            return false;
        });
    }
    startDebugging(workspaceFolder, sessionName, port, _pod, _pidToDebug) {
        return __awaiter(this, void 0, void 0, function* () {
            const debugConfiguration = {
                type: "java",
                request: "attach",
                name: sessionName,
                hostName: "localhost",
                port
            };
            const currentFolder = (vscode.workspace.workspaceFolders || []).find((folder) => folder.name === path.basename(workspaceFolder));
            if (!currentFolder) {
                return false; // shouldn't happen as workspaceFolder should be one of the workspaceFolders
            }
            return yield vscode.debug.startDebugging(currentFolder, debugConfiguration);
        });
    }
    isSupportedImage(baseImage) {
        if (!baseImage) {
            return false;
        }
        return baseImage.indexOf("java") >= 0
            || baseImage.indexOf("openjdk") >= 0
            || baseImage.indexOf("oracle") >= 0;
    }
    resolvePortsFromFile(dockerfile, env) {
        return __awaiter(this, void 0, void 0, function* () {
            let rawDebugPortInfo;
            // Resolve the debug port.
            const matches = dockerfile.searchLaunchArgs(javaDebugOptsRegExp);
            if (extensionUtils.isNonEmptyArray(matches)) { // Enable debug options in command lines directly.
                const addresses = matches[2].split("=")[1].split(":");
                rawDebugPortInfo = addresses[addresses.length - 1];
            }
            else if (extensionUtils.isNonEmptyArray(dockerfile.searchLaunchArgs(/\$\{?JAVA_OPTS\}?/))) { // Use $JAVA_OPTS env var in command lines.
                env["JAVA_OPTS"] = defaultJavaDebugOpts;
                rawDebugPortInfo = defaultJavaDebugPort;
            }
            else { // Enable debug options by the global JVM environment variables.
                // According to the documents https://bugs.openjdk.java.net/browse/JDK-4971166 and
                // https://stackoverflow.com/questions/28327620/difference-between-java-options-java-tool-options-and-java-opts,
                // JAVA_TOOL_OPTIONS and _JAVA_OPTIONS are ways to specify JVM arguments as an environment variable instead of command line parameters.
                // JAVA_TOOL_OPTIONS is included in standard JVMTI specification and is the recommended way.
                // _JAVA_OPTIONS trumps command-line arguments, which in turn trump JAVA_TOOL_OPTIONS.
                env["JAVA_TOOL_OPTIONS"] = defaultJavaDebugOpts;
                rawDebugPortInfo = defaultJavaDebugPort;
            }
            // Resolve the app port.
            const exposedPorts = dockerfile.getExposedPorts();
            const possiblePorts = exposedPorts.length ? exposedPorts.filter((port) => port !== rawDebugPortInfo) : [];
            const rawAppPortInfo = yield debugUtils.promptForAppPort(possiblePorts, defaultJavaAppPort, env);
            return {
                debugPort: Number(rawDebugPortInfo),
                appPort: Number(rawAppPortInfo)
            };
        });
    }
    resolvePortsFromContainer(kubectl, pod, podNamespace, container) {
        return __awaiter(this, void 0, void 0, function* () {
            let rawDebugPortInfo;
            const processes = yield debugUtils.getProcesses(kubectl, pod, podNamespace, container);
            const commandLines = processes ? processes.map(({ command }) => command) : undefined;
            if (commandLines) {
                for (const commandLine of commandLines) {
                    // java -Djava.security.egd=file:/dev/./urandom -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=1044,quiet=y -jar target/app.jar
                    const matches = commandLine.match(fullJavaDebugOptsRegExp);
                    if (matches && matches.length > 0) {
                        const addresses = matches[2].split("=")[1].split(":");
                        rawDebugPortInfo = addresses[addresses.length - 1];
                        break;
                    }
                }
            }
            if (!rawDebugPortInfo) {
                rawDebugPortInfo = yield debugUtils.promptForDebugPort(defaultJavaDebugPort);
            }
            if (!rawDebugPortInfo) {
                return undefined;
            }
            return {
                debugPort: Number(rawDebugPortInfo)
            };
        });
    }
    filterSupportedProcesses(_processes) {
        return undefined;
    }
    isPortRequired() {
        return true;
    }
    getDebugArgs() {
        return __awaiter(this, void 0, void 0, function* () {
            return { cancelled: false };
        });
    }
}
exports.JavaDebugProvider = JavaDebugProvider;
//# sourceMappingURL=javaDebugProvider.js.map