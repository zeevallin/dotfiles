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
function append(first, ...rest) {
    if (isThenable(first)) {
        return appendAsync(first, ...rest);
    }
    else {
        return appendSyncAsync(first, ...rest);
    }
}
exports.append = append;
function transform(obj, f) {
    if (isThenableStrict(obj)) {
        return transformThenable(obj, f);
    }
    f(obj);
    return obj;
}
exports.transform = transform;
function transformPossiblyAsync(obj, f) {
    if (isThenableStrict(obj)) {
        return transformPossiblyAsyncThenable(obj, f);
    }
    const transformer = f(obj);
    if (transformer === true) {
        return obj;
    }
    else {
        return whenReady(transformer, obj);
    }
}
exports.transformPossiblyAsync = transformPossiblyAsync;
function map(source, f) {
    if (isThenable(source)) {
        return mapThenable(source, f);
    }
    if (!source) {
        return source;
    }
    return source.map(f);
}
exports.map = map;
function isThenable(r) {
    return !!(r.then);
}
function isThenableStrict(r) {
    return !!(r.then);
}
function appendAsync(first, ...rest) {
    return __awaiter(this, void 0, void 0, function* () {
        return appendSyncAsync(yield first, ...rest);
    });
}
function appendSyncAsync(first, ...rest) {
    return __awaiter(this, void 0, void 0, function* () {
        const f = first || [];
        const r = yield Promise.all(rest);
        return f.concat(...r);
    });
}
function transformThenable(obj, f) {
    return __awaiter(this, void 0, void 0, function* () {
        f(yield obj);
        return obj;
    });
}
function transformPossiblyAsyncThenable(obj, f) {
    return __awaiter(this, void 0, void 0, function* () {
        const transformer = f(yield obj);
        if (transformer === true) {
            return obj;
        }
        else {
            return whenReady(transformer, obj);
        }
    });
}
function mapThenable(obj, f) {
    return __awaiter(this, void 0, void 0, function* () {
        const sequence = yield obj;
        if (!sequence) {
            return sequence;
        }
        return sequence.map(f);
    });
}
function whenReady(w, obj) {
    return __awaiter(this, void 0, void 0, function* () {
        yield w;
        return obj;
    });
}
//# sourceMappingURL=providerresult.js.map