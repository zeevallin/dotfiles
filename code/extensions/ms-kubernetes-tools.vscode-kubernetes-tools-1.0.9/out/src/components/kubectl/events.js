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
const kubectlUtils = require("../../kubectlUtils");
var EventDisplayMode;
(function (EventDisplayMode) {
    EventDisplayMode[EventDisplayMode["Show"] = 0] = "Show";
    EventDisplayMode[EventDisplayMode["Follow"] = 1] = "Follow";
})(EventDisplayMode = exports.EventDisplayMode || (exports.EventDisplayMode = {}));
function getEvents(kubectl, displayMode, explorerNode) {
    return __awaiter(this, void 0, void 0, function* () {
        let eventsNS;
        if (explorerNode) {
            eventsNS = explorerNode.name;
        }
        else {
            eventsNS = yield kubectlUtils.currentNamespace(kubectl);
        }
        let cmd = `get events --namespace ${eventsNS}`;
        if (displayMode === EventDisplayMode.Follow) {
            cmd += ' -w';
            return kubectl.invokeInNewTerminal(cmd, 'Kubernetes Events');
        }
        else {
            return kubectl.invokeInSharedTerminal(cmd);
        }
    });
}
exports.getEvents = getEvents;
//# sourceMappingURL=events.js.map