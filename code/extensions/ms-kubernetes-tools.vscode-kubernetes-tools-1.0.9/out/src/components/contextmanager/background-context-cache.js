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
// The use case here is when we have to work with an API that requires
// information to be available synchronously, but for us to know the
// current value is time-consuming and best performed asynchronously.
class BackgroundContextCache {
    constructor(activeContextTracker, getActiveContextValue, fallbackValue) {
        this.activeContextTracker = activeContextTracker;
        this.getActiveContextValue = getActiveContextValue;
        this.fallbackValue = fallbackValue;
        this.cache = new Map();
        this.activeUpdates = new Map();
        this.activeContextTracker.activeChanged(this.onActiveContextChanged, this);
        const activeContext = this.activeContextTracker.active();
        if (activeContext) {
            this.updateCache(activeContext);
        }
    }
    onActiveContextChanged(newContext) {
        if (newContext) {
            this.updateCache(newContext);
        }
    }
    activeAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const contextName = yield this.activeContextTracker.activeAsync();
            if (!contextName) {
                return this.fallbackValue;
            }
            const result = this.cache.get(contextName);
            if (result) {
                return result;
            }
            const value = yield this.getActiveContextValue();
            this.cache.set(contextName, value);
            return value;
        });
    }
    changedActiveContextValue() {
        const activeContext = this.activeContextTracker.active();
        if (activeContext) {
            this.updateCache(activeContext);
        }
    }
    active() {
        const activeContext = this.activeContextTracker.active();
        if (!activeContext) {
            return this.fallbackValue;
        }
        const result = this.cache.get(activeContext);
        if (result) {
            return result;
        }
        this.updateCache(activeContext);
        return this.fallbackValue;
    }
    updateCache(activeContextName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.activeUpdates.get(activeContextName)) {
                return;
            }
            try {
                this.activeUpdates.set(activeContextName, true);
                const value = yield this.getActiveContextValue();
                // Heuristic check that the active context didn't change while getActiveContextValue
                // was doing it thing (because it it did then the retrieved value might not be for the
                // context we thought it was!).
                if (this.activeContextTracker.active() === activeContextName) {
                    this.cache.set(activeContextName, value);
                }
            }
            finally {
                this.activeUpdates.delete(activeContextName);
            }
        });
    }
    invalidateActive() {
        const activeContext = this.activeContextTracker.active();
        if (activeContext) {
            this.updateCache(activeContext);
        }
    }
}
exports.BackgroundContextCache = BackgroundContextCache;
//# sourceMappingURL=background-context-cache.js.map