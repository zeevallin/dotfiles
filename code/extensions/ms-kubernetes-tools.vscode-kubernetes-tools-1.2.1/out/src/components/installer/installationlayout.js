"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shell_1 = require("../../shell");
function platformUrlString(platform, supported) {
    if (supported && supported.indexOf(platform) < 0) {
        return null;
    }
    switch (platform) {
        case shell_1.Platform.Windows: return 'windows';
        case shell_1.Platform.MacOS: return 'darwin';
        case shell_1.Platform.Linux: return 'linux';
        default: return null;
    }
}
exports.platformUrlString = platformUrlString;
function formatBin(tool, platform) {
    const platformString = platformUrlString(platform);
    if (!platformString) {
        return null;
    }
    const toolPath = `${platformString}-amd64/${tool}`;
    if (platform === shell_1.Platform.Windows) {
        return toolPath + '.exe';
    }
    return toolPath;
}
exports.formatBin = formatBin;
//# sourceMappingURL=installationlayout.js.map