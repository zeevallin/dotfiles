"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREVIEW_SCHEME = 'helm-template-preview';
exports.PREVIEW_URI = exports.PREVIEW_SCHEME + '://preview';
exports.INSPECT_VALUES_SCHEME = 'helm-inspect-values';
exports.INSPECT_CHART_SCHEME = 'helm-inspect-chart';
exports.INSPECT_REPO_AUTHORITY = 'repo-chart';
exports.INSPECT_FILE_AUTHORITY = 'chart-file';
exports.DEPENDENCIES_SCHEME = 'helm-dependencies';
exports.DEPENDENCIES_REPO_AUTHORITY = 'repo-chart';
exports.HELM_OUTPUT_COLUMN_SEPARATOR = /\t+/g;
let previewShown = false;
function hasPreviewBeenShown() {
    return previewShown;
}
exports.hasPreviewBeenShown = hasPreviewBeenShown;
function recordPreviewHasBeenShown() {
    previewShown = true;
}
exports.recordPreviewHasBeenShown = recordPreviewHasBeenShown;
//# sourceMappingURL=helm.js.map