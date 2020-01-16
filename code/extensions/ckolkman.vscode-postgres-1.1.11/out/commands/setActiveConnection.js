"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseCommand_1 = require("../common/baseCommand");
const editorState_1 = require("../common/editorState");
const global_1 = require("../common/global");
'use strict';
class setActiveConnectionCommand extends baseCommand_1.default {
    run(connection) {
        let config = global_1.Global.Configuration.get("setConnectionFromExplorer");
        if (config == "always" || (config == "ifunset" &&
            (!editorState_1.EditorState.connection || !editorState_1.EditorState.connection.host ||
                (connection.database && !editorState_1.EditorState.connection.database)))) {
            editorState_1.EditorState.connection = connection;
        }
    }
}
exports.setActiveConnectionCommand = setActiveConnectionCommand;
//# sourceMappingURL=setActiveConnection.js.map