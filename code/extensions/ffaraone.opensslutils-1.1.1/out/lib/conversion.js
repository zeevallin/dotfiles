"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openssl_1 = require("./openssl");
const path = require("path");
const vscode = require("vscode");
const converters = {
    'pem': {
        srcext: ['.cer', '.der', '.crt'],
        dstext: '.pem',
        handler: openssl_1.default.crtToPem
    },
    'der': {
        srcext: ['.pem', '.cer', '.txt', '.crt'],
        dstext: '.der',
        handler: openssl_1.default.pemToCrt
    }
};
function certConverter(infile, to) {
    const converter = converters[to];
    const parsed = path.parse(infile);
    let outfile = converter.srcext.includes(parsed.ext) ? path.join(parsed.dir, parsed.name + converter.dstext) : path.join(parsed.dir, parsed.base + converter.dstext);
    converter.handler(infile, outfile)
        .then(() => {
        vscode.window.showInformationMessage(`The file ${parsed.base} has been successfully converted.`);
    })
        .catch((err) => {
        vscode.window.showErrorMessage(err.message);
    });
}
function convertCrtToPem(fileObj) {
    certConverter(fileObj.path, 'pem');
}
exports.convertCrtToPem = convertCrtToPem;
function convertPemToCrt(fileObj) {
    certConverter(fileObj.path, 'der');
}
exports.convertPemToCrt = convertPemToCrt;
//# sourceMappingURL=conversion.js.map