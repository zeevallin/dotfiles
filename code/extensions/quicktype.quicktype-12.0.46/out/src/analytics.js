"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ua = require("universal-analytics");
const uuid_1 = require("uuid");
const ANALYTICS_ID = "UA-102732788-4";
let visitor;
function initialize(context) {
    const uuid = context.globalState.get("uuid", uuid_1.v4());
    context.globalState.update("uuid", uuid);
    visitor = ua(ANALYTICS_ID, uuid);
    visitor.pageview("/").send();
}
exports.initialize = initialize;
function sendEvent(action, label) {
    visitor.event("extension", action, label).send();
}
exports.sendEvent = sendEvent;
//# sourceMappingURL=analytics.js.map