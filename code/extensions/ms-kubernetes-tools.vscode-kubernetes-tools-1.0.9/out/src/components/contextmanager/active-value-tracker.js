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
const vscode_1 = require("vscode");
const sleep_1 = require("../../sleep");
function create(getActiveValue, pollIntervalMS) {
    return new ActiveValueTrackerImpl(getActiveValue, pollIntervalMS);
}
exports.create = create;
class ActiveValueTrackerImpl {
    constructor(getActiveValue, pollIntervalMS) {
        this.getActiveValue = getActiveValue;
        this.pollIntervalMS = pollIntervalMS;
        this.activeValue = null;
        this.activeChangedEmitter = new vscode_1.EventEmitter();
        this.pollActive();
    }
    get activeChanged() {
        return this.activeChangedEmitter.event;
    }
    setActive(switchedTo) {
        if (switchedTo !== this.activeValue) {
            this.activeValue = switchedTo;
            this.activeChangedEmitter.fire(this.activeValue);
        }
    }
    activeAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const value = yield this.getActiveValue();
            this.setActive(value);
            return value;
        });
    }
    active() {
        return this.activeValue;
    }
    pollActive() {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                const activeContext = yield this.getActiveValue();
                this.setActive(activeContext);
                yield sleep_1.sleep(this.pollIntervalMS);
            }
        });
    }
}
//# sourceMappingURL=active-value-tracker.js.map