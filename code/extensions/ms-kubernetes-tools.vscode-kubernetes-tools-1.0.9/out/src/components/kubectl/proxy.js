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
function proxy(kubectl, port) {
    return __awaiter(this, void 0, void 0, function* () {
        const portNumber = (port === 'random') ? 0 : port;
        const args = ['proxy', `--port=${portNumber}`];
        // TODO: option to show a cancellable progress indicator while opening proxy?  We don't really need this for the Swagger scenario though
        const proxyingProcess = yield kubectl.spawnAsChild(args);
        if (!proxyingProcess) {
            return { succeeded: false, error: ['Failed to invoke kubectl'] };
        }
        const forwarding = yield waitForOutput(proxyingProcess, /Starting to serve on \d+\.\d+\.\d+\.\d+:(\d+)/);
        if (forwarding.waitResult === 'process-exited') {
            return { succeeded: false, error: ['Failed to open proxy to cluster'] }; // TODO: get the error moar betters
        }
        if (forwarding.matchedOutput.length < 2) {
            return { succeeded: false, error: [`Failed to open proxy to cluster: unexpected kubectl output ${forwarding.matchedOutput[0]}`] }; // TODO: get the error moar betters
        }
        const actualPort = Number.parseInt(forwarding.matchedOutput[1]);
        const dispose = () => { proxyingProcess.kill(); };
        return {
            succeeded: true,
            result: { port: actualPort, dispose: dispose }
        };
    });
}
exports.proxy = proxy;
function waitForOutput(process, pattern) {
    return new Promise((resolve) => {
        let didOutput = false;
        process.stdout.on('data', (data) => __awaiter(this, void 0, void 0, function* () {
            const message = `${data}`;
            const matchResult = pattern.exec(message);
            if (matchResult && matchResult.length > 0) {
                didOutput = true;
                resolve({ waitResult: 'succeeded', matchedOutput: matchResult });
            }
        }));
        process.on('close', (_code) => __awaiter(this, void 0, void 0, function* () {
            if (!didOutput) {
                resolve({ waitResult: 'process-exited' });
            }
        }));
    });
}
//# sourceMappingURL=proxy.js.map