"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sysfs = require("fs");
const util_1 = require("util");
exports.fs = {
    chmod: util_1.promisify((path, mode, cb) => sysfs.chmod(path, mode, cb)),
    existsSync: (path) => sysfs.existsSync(path),
    readFile: (filename, encoding, callback) => sysfs.readFile(filename, encoding, callback),
    readTextFile: util_1.promisify((path, cb) => sysfs.readFile(path, { encoding: 'utf8' }, cb)),
    readFileAsync: util_1.promisify((path, cb) => sysfs.readFile(path, null, cb)),
    readFileSync: (filename, encoding) => sysfs.readFileSync(filename, encoding),
    readFileToBufferSync: (filename) => sysfs.readFileSync(filename),
    renameAsync: util_1.promisify((oldName, newName, cb) => sysfs.rename(oldName, newName, cb)),
    writeFile: (filename, data, callback) => sysfs.writeFile(filename, data, callback),
    writeTextFile: util_1.promisify((filename, data, callback) => sysfs.writeFile(filename, data, callback)),
    writeFileSync: (filename, data) => sysfs.writeFileSync(filename, data),
    dirSync: (path) => sysfs.readdirSync(path),
    unlinkAsync: (path) => {
        return new Promise((resolve, reject) => {
            sysfs.unlink(path, (error) => {
                if (error) {
                    reject();
                    return;
                }
                resolve();
            });
        });
    },
    existsAsync: (path) => {
        return new Promise((resolve) => {
            sysfs.exists(path, (exists) => {
                resolve(exists);
            });
        });
    },
    openAsync: (path, flags) => {
        return new Promise((resolve, reject) => {
            sysfs.open(path, flags, (error, _fd) => {
                if (error) {
                    reject();
                    return;
                }
                resolve();
            });
        });
    },
    statSync: (path) => sysfs.statSync(path)
};
//# sourceMappingURL=fs.js.map