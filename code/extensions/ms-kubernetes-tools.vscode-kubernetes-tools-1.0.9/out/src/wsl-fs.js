"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
// TODO: would rather this was in ./shell.ts
const shell = require("shelljs");
const config_1 = require("./components/config/config");
class StatImpl {
    constructor(line) {
        this.line = line;
        this.line = line;
    }
    isDirectory() {
        return this.line.startsWith('d');
    }
}
function statSync(file) {
    if (config_1.getUseWsl()) {
        const filePath = file.replace(/\\/g, '/');
        const result = shell.exec(`wsl.exe sh -c "ls -l ${filePath} | grep -v total"`);
        if (result.code !== 0) {
            if (result.stderr.indexOf('No such file or directory') !== -1) {
                return new StatImpl('');
            }
            throw new Error(result.stderr);
        }
        return new StatImpl(result.stdout.trim());
    }
    else {
        return fs.statSync(file);
    }
}
exports.statSync = statSync;
function existsSync(file) {
    if (config_1.getUseWsl()) {
        const filePath = file.replace(/\\/g, '/');
        const result = shell.exec(`wsl.exe ls ${filePath}`);
        return result.code === 0;
    }
    else {
        return fs.existsSync(file);
    }
}
exports.existsSync = existsSync;
function unlinkSync(file) {
    if (config_1.getUseWsl()) {
        const filePath = file.replace(/\\/g, '/');
        const result = shell.exec(`wsl.exe rm -rf ${filePath}`);
        if (result.code !== 0) {
            throw new Error(result.stderr);
        }
    }
    fs.unlinkSync(file);
}
exports.unlinkSync = unlinkSync;
//# sourceMappingURL=wsl-fs.js.map