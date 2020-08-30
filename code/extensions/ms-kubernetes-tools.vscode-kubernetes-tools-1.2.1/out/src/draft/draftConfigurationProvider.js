"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Net = require("net");
const debugDebug_1 = require("./debugDebug");
class DraftConfigurationProvider {
    constructor() {
    }
    resolveDebugConfiguration(_folder, config, _token) {
        if (!this.server) {
            this.server = Net.createServer((socket) => {
                const session = new debugDebug_1.DraftDebugSession();
                session.config = config;
                session.setRunAsServer(true);
                session.start(socket, socket);
            }).listen(0);
        }
        config.debugServer = extractPort(this.server.address());
        return config;
    }
    dispose() {
        if (this.server) {
            this.server.close();
        }
    }
}
exports.DraftConfigurationProvider = DraftConfigurationProvider;
function extractPort(address) {
    return address.port; // always an AddressInfo unless listening on a pipe or Unix domain socket
}
//# sourceMappingURL=draftConfigurationProvider.js.map