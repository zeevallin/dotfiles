"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const outputUtils_1 = require("./outputUtils");
const KUBECTL_OUTPUT_COLUMN_SEPARATOR = /\s\s+/g;
function parseJson(shellResult, context) {
    if (!shellResult) {
        return { succeeded: false, error: [`Unable to run command (${context.command})`] };
    }
    if (shellResult.code === 0) {
        return { succeeded: true, result: JSON.parse(shellResult.stdout.trim()) };
    }
    return { succeeded: false, error: [shellResult.stderr] };
}
exports.parseJson = parseJson;
function splitLines(shellResult, context) {
    if (!shellResult) {
        return { succeeded: false, error: [`Unable to run command (${context.command})`] };
    }
    if (shellResult.code === 0) {
        let lines = shellResult.stdout.split('\n');
        lines.shift();
        lines = lines.filter((l) => l.length > 0);
        return { succeeded: true, result: lines };
    }
    return { succeeded: false, error: [shellResult.stderr] };
}
exports.splitLines = splitLines;
function parseLines(shellResult, context) {
    if (!shellResult) {
        return { succeeded: false, error: [`Unable to run command (${context.command})`] };
    }
    if (shellResult.code === 0) {
        let lines = shellResult.stdout.split('\n');
        lines = lines.filter((l) => l.length > 0);
        const parsedOutput = outputUtils_1.parseLineOutput(lines, KUBECTL_OUTPUT_COLUMN_SEPARATOR);
        return { succeeded: true, result: parsedOutput };
    }
    return { succeeded: false, error: [shellResult.stderr] };
}
exports.parseLines = parseLines;
//# sourceMappingURL=kubectl-output-parsers.js.map