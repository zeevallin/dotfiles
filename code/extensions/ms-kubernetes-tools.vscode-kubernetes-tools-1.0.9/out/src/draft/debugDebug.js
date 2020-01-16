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
const vscode_debugadapter_1 = require("vscode-debugadapter");
const draftRuntime_1 = require("./draftRuntime");
const { Subject } = require('await-notify');
class DraftDebugSession extends vscode_debugadapter_1.LoggingDebugSession {
    constructor() {
        super("draft-debug.txt");
        this.configurationDone = new Subject();
        this.runtime = new draftRuntime_1.DraftRuntime();
        this.runtime.on('end', () => {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        });
    }
    initializeRequest(response, _args) {
        this.sendResponse(response);
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
    }
    configurationDoneRequest(_response, _args) {
        this.configurationDone.notify();
    }
    launchRequest(response, _args) {
        return __awaiter(this, void 0, void 0, function* () {
            // wait until configuration has finished (and configurationDoneRequest has been called)
            yield this.configurationDone.wait(1000);
            // start a `draft up` and `draft connect` session and attach debugger
            this.runtime.draftUpDebug(this.config);
            this.sendResponse(response);
        });
    }
    evaluateRequest(response, args) {
        if (args['restart'] === true) {
            // TODO - check for request type
            //
            // when a request is received (such as a file was saved), restart the Draft cycle
            this.runtime.killConnect();
            this.runtime.draftUpDebug(this.config);
        }
        if (args['stop'] === true) {
            this.runtime.killConnect();
            this.stop();
        }
        this.sendResponse(response);
    }
}
exports.DraftDebugSession = DraftDebugSession;
//# sourceMappingURL=debugDebug.js.map