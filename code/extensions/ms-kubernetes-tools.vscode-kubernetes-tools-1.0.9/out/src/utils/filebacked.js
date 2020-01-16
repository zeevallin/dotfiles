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
class FileBacked {
    constructor(fs, filename, defaultValue) {
        this.fs = fs;
        this.filename = filename;
        this.defaultValue = defaultValue;
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.value) {
                return this.value;
            }
            if (yield this.fs.existsAsync(this.filename)) {
                const text = yield this.fs.readTextFile(this.filename);
                this.value = JSON.parse(text);
                return this.value;
            }
            yield this.update(this.defaultValue());
            return this.value;
        });
    }
    update(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.value = value;
            const text = JSON.stringify(this.value, undefined, 2);
            yield this.fs.writeTextFile(this.filename, text);
        });
    }
}
exports.FileBacked = FileBacked;
//# sourceMappingURL=filebacked.js.map