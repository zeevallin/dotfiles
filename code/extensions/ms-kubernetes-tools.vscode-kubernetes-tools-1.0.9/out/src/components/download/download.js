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
const tmp = require("tmp");
const errorable_1 = require("../../errorable");
const dictionary_1 = require("../../utils/dictionary");
const sleep_1 = require("../../sleep");
let download;
const DOWNLOAD_ONCE_STATUS = dictionary_1.Dictionary.of();
var DownloadOperationStatus;
(function (DownloadOperationStatus) {
    DownloadOperationStatus[DownloadOperationStatus["Queued"] = 1] = "Queued";
    DownloadOperationStatus[DownloadOperationStatus["Completed"] = 2] = "Completed";
    DownloadOperationStatus[DownloadOperationStatus["Failed"] = 3] = "Failed";
})(DownloadOperationStatus || (DownloadOperationStatus = {}));
function ensureDownloadFunc() {
    if (!download) {
        // Fix download module corrupting HOME environment variable on Windows
        // See https://github.com/Azure/vscode-kubernetes-tools/pull/302#issuecomment-404678781
        // and https://github.com/kevva/npm-conf/issues/13
        const home = process.env['HOME'];
        download = require('download');
        if (home) {
            process.env['HOME'] = home;
        }
    }
}
function toTempFile(sourceUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const tempFileObj = tmp.fileSync({ prefix: "vsk-autoinstall-" });
        const downloadResult = yield to(sourceUrl, tempFileObj.name);
        if (errorable_1.succeeded(downloadResult)) {
            return { succeeded: true, result: tempFileObj.name };
        }
        return { succeeded: false, error: downloadResult.error };
    });
}
exports.toTempFile = toTempFile;
function to(sourceUrl, destinationFile) {
    return __awaiter(this, void 0, void 0, function* () {
        ensureDownloadFunc();
        try {
            yield download(sourceUrl, path.dirname(destinationFile), { filename: path.basename(destinationFile) }); // safe because we ensured it
            return { succeeded: true, result: null };
        }
        catch (e) {
            return { succeeded: false, error: [e.message] };
        }
    });
}
exports.to = to;
function once(sourceUrl, destinationFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const downloadStatus = DOWNLOAD_ONCE_STATUS[destinationFile];
        if (!downloadStatus || downloadStatus === DownloadOperationStatus.Failed) {
            DOWNLOAD_ONCE_STATUS[destinationFile] = DownloadOperationStatus.Queued;
            const result = yield to(sourceUrl, destinationFile);
            DOWNLOAD_ONCE_STATUS[destinationFile] = errorable_1.succeeded(result) ? DownloadOperationStatus.Completed : DownloadOperationStatus.Failed;
            return result;
        }
        else {
            while (true) {
                yield sleep_1.sleep(100);
                if (DOWNLOAD_ONCE_STATUS[destinationFile] === DownloadOperationStatus.Completed) {
                    return { succeeded: true, result: null };
                }
                else {
                    return yield once(sourceUrl, destinationFile);
                }
            }
        }
    });
}
exports.once = once;
//# sourceMappingURL=download.js.map