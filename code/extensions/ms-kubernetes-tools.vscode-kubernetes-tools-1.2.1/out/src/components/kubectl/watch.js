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
const kubernetes = require("@kubernetes/client-node");
const kubeconfig_1 = require("./kubeconfig");
class WatchManager {
    constructor() {
        this.watchers = new Map();
    }
    static instance() {
        if (!this.mng) {
            this.mng = new WatchManager();
        }
        return this.mng;
    }
    addWatch(id, apiUri, params, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                return;
            }
            if (this.watchers.has(id) && this.watchers.get(id).active) {
                return;
            }
            const kc = yield kubeconfig_1.loadKubeconfig();
            const kcWatch = new kubernetes.Watch(kc);
            const restartWatchOnConnectionError = (err) => {
                // Error: read ECONNRESET
                // at TLSWrap.onStreamRead (internal/stream_base_commons.js:183:27)
                if (err &&
                    err.name === "ECONNRESET") {
                    this.removeWatch(id);
                    this.addWatch(id, apiUri, params, callback);
                }
            };
            if (!params) {
                params = {};
            }
            const req = kcWatch.watch(apiUri, params, callback, restartWatchOnConnectionError);
            this.watchers.set(id, { active: true, request: req });
        });
    }
    removeWatch(id) {
        if (!id || !this.watchers.has(id)) {
            return;
        }
        if (this.watchers.has(id) && !this.watchers.get(id).active) {
            return;
        }
        const watcher = this.watchers.get(id);
        if (watcher && watcher.active) {
            watcher.request.abort();
        }
        this.watchers.set(id, { active: false });
    }
    clear() {
        if (this.watchers && this.watchers.size > 0) {
            this.watchers.forEach((_value, key, _map) => {
                this.removeWatch(key);
            });
            this.watchers.clear();
        }
    }
    existsWatch(id) {
        return id && this.watchers.has(id);
    }
}
exports.WatchManager = WatchManager;
//# sourceMappingURL=watch.js.map