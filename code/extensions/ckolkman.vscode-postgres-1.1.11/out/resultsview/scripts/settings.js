"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getData(key) {
    const element = document.getElementById('vscode-postgres-results-data');
    if (element) {
        const data = element.getAttribute(key);
        if (data) {
            return JSON.parse(data);
        }
    }
    throw new Error(`Could not load data for ${key}`);
}
exports.getData = getData;
//# sourceMappingURL=settings.js.map