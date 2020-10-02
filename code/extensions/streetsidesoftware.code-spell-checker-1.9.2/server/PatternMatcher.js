"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRegExp = exports.toRegExp = exports.isPatternMatchTimeout = exports.isPatternMatch = exports.PatternMatcher = void 0;
const regexp_worker_1 = require("regexp-worker");
const timer_1 = require("./timer");
class PatternMatcher {
    constructor() {
        this.worker = new regexp_worker_1.RegExpWorker(2000);
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        this.dispose = () => this.worker.dispose();
    }
    async matchPatternsInText(patterns, text, settings) {
        const resolvedPatterns = resolvePatterns(patterns, settings);
        // Optimistically expect them all to work.
        try {
            const result = await timer_1.measurePromiseExecution(() => matchMatrix(this.worker, text, resolvedPatterns));
            return result.r;
        }
        catch (e) {
            if (!isTimeoutError(e)) {
                return Promise.reject(e);
            }
        }
        // At least one of the expressions failed to complete in time.
        // Process them one-by-one
        const results = resolvedPatterns.map(pat => exec(this.worker, text, pat));
        return Promise.all(results);
    }
}
exports.PatternMatcher = PatternMatcher;
function isPatternMatch(m) {
    return Array.isArray(m.ranges);
}
exports.isPatternMatch = isPatternMatch;
function isPatternMatchTimeout(m) {
    return !isPatternMatch(m);
}
exports.isPatternMatchTimeout = isPatternMatchTimeout;
function matchMatrix(worker, text, patterns) {
    const regexArray = patterns.map(pat => pat.regexp);
    const result = worker.matchRegExpArray(text, regexArray)
        .then(r => {
        return r.results.map((result, index) => toPatternMatch(patterns[index], result));
    });
    return result;
}
function exec(worker, text, pattern) {
    return worker.matchRegExp(text, pattern.regexp)
        .then(r => toPatternMatch(pattern, r))
        .catch(e => toPatternMatchTimeout(pattern, e));
}
function toPatternMatchTimeout(pattern, error) {
    if (!isTimeoutError(error))
        return Promise.reject(error);
    return Object.assign(Object.assign({}, error), pattern);
}
function isTimeoutError(e) {
    return typeof e === 'object'
        && typeof e.message === 'string'
        && typeof e.elapsedTimeMs === 'number';
}
function toPatternMatch(pattern, result) {
    return Object.assign(Object.assign({}, pattern), { elapsedTimeMs: result.elapsedTimeMs, ranges: [...result.ranges] });
}
function resolvePatterns(patterns, settings) {
    const knownPatterns = extractPatternsFromSettings(settings);
    const matchingPatterns = patterns
        .map(pat => resolvePattern(pat, knownPatterns));
    return matchingPatterns;
}
function resolvePattern(pat, knownPatterns) {
    if (isNamedPattern(pat)) {
        return Object.assign(Object.assign({}, pat), { regexp: toRegExp(pat.regexp) });
    }
    return knownPatterns.get(pat) || knownPatterns.get(pat.toLowerCase()) || ({ name: pat, regexp: toRegExp(pat, 'g') });
}
function isNamedPattern(pattern) {
    return typeof pattern !== 'string';
}
function extractPatternsFromSettings(settings) {
    var _a;
    const patterns = ((_a = settings.patterns) === null || _a === void 0 ? void 0 : _a.map(({ name, pattern }) => ({ name, regexp: toRegExp(pattern) }))) || [];
    const knownPatterns = patterns.map(pat => [pat.name.toLowerCase(), pat]);
    const knownRegexp = patterns.map(pat => [pat.regexp.toString(), pat]);
    return new Map(knownPatterns.concat(knownRegexp));
}
function toRegExp(r, defaultFlags) {
    if (isRegExp(r))
        return r;
    const match = r.match(/^\/(.*)\/([gimsuy]*)$/);
    if (match) {
        return new RegExp(match[1], match[2] || undefined);
    }
    return new RegExp(r, defaultFlags);
}
exports.toRegExp = toRegExp;
function isRegExp(r) {
    return r instanceof RegExp;
}
exports.isRegExp = isRegExp;
//# sourceMappingURL=PatternMatcher.js.map