"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wizard_1 = require("../../../wizard");
const wizard_2 = require("../../wizard/wizard");
const clusterproviderserver_1 = require("../clusterproviderserver");
// HTML rendering boilerplate
const DO_NOT_PROPAGATE = ['nextStep', clusterproviderserver_1.SENDING_STEP_KEY];
function propagationFields(previousData) {
    let formFields = "";
    for (const k in previousData) {
        if (DO_NOT_PROPAGATE.indexOf(k) < 0) {
            formFields = formFields + `<input type='hidden' name='${k}' value='${previousData[k]}' />\n`;
        }
    }
    return formFields;
}
exports.propagationFields = propagationFields;
function formPage(fd) {
    return `<!-- ${fd.stepId} -->
            <h1 id='h'>${fd.title}</h1>
            ${wizard_1.formStyles()}
            ${wizard_1.styles()}
            <div id='content'>
            <form id='form'>
            <input type='hidden' name='nextStep' value='${fd.nextStep}' />
            ${propagationFields(fd.previousData)}
            ${fd.formContent}
            <p>
            <button onclick='${wizard_2.NEXT_FN}' class='link-button'>${fd.submitText} &gt;</button>
            </p>
            </form>
            </div>`;
}
exports.formPage = formPage;
//# sourceMappingURL=form.js.map