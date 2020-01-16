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
const sleep_1 = require("../../sleep");
function trackReadiness(interval, f) {
    let refreshCount = 0;
    const observers = [];
    const observable = {
        subscribe(observer) {
            observers.push(observer);
        },
        notify(value) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const o of observers) {
                    yield o.onNext(value);
                }
            });
        },
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                while (true) {
                    yield sleep_1.sleep(interval);
                    const [value, retry] = yield f(refreshCount);
                    yield this.notify(value);
                    if (!retry) {
                        while (observers.length > 0) {
                            observers.unshift();
                        }
                        return;
                    }
                    ++refreshCount;
                }
            });
        }
    };
    observable.run();
    return observable;
}
exports.trackReadiness = trackReadiness;
//# sourceMappingURL=readinesstracker.js.map