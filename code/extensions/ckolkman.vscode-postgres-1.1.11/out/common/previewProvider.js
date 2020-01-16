"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const global_1 = require("./global");
class PreviewProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        this._queryResultsMap = new Map();
    }
    static get Instance() {
        if (!PreviewProvider._provider)
            PreviewProvider._provider = new PreviewProvider();
        return PreviewProvider._provider;
    }
    get onDidChange() { return this._onDidChange.event; }
    update(uri, newResults) {
        newResults = newResults.filter((result) => result.fields && result.fields.length);
        this._queryResultsMap.set(uri.toString(), newResults);
        this._onDidChange.fire(uri);
    }
    provideTextDocumentContent(uri, token) {
        let url = uri.toString();
        if (!this._queryResultsMap.has(url))
            return this.errorSnippet('Results not found: ' + url);
        return this.buildTable(this._queryResultsMap.get(url));
    }
    onDidCloseTextDocument(doc) {
        let keysToDelete = [];
        for (let [key, value] of this._queryResultsMap.entries()) {
            if (doc.uri.toString() === key) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => {
            this._queryResultsMap.delete(key);
        });
    }
    errorSnippet(error) { return `<body>${error}</body>`; }
    getTableStyles(config) {
        let jsonStyle = config.get("prettyPrintJSONfields") ? `.jsonb-field, .json-field { white-space: pre; }` : ``;
        return `<style>
    .field-type {
      font-size: smaller;
    }

    table {
      border-collapse: collapse;
    }

    table + table { margin-top: 15px; }

    th, td {
      border-width: 1px;
      border-style: solid;
      border-color: #444444;
      padding: 3px 5px;
    }

    .timestamptz-field { white-space: nowrap; }
    ${jsonStyle}
    </style>`;
    }
    htmlEntities(str) {
        if (typeof str !== 'string')
            return str;
        return str ? str.replace(/[\u00A0-\u9999<>\&"']/gim, (i) => `&#${i.charCodeAt(0)};`) : undefined;
    }
    formatData(field, value, config) {
        if (value === null)
            return `<i>null</i>`;
        if (typeof value === typeof undefined)
            return '';
        let canTruncate = false;
        // console.log('Field Format: ', field.format);
        switch (field.format) {
            case 'interval':
                value = this.formatInterval(value, config);
                break;
            case 'json':
            case 'jsonb':
            case 'point':
            case 'circle':
                if (config.get("prettyPrintJSONfields"))
                    value = JSON.stringify(value, null, 2);
                else
                    value = JSON.stringify(value);
                break;
            case 'timestamptz':
                value = value.toJSON().toString();
                break;
            case 'text':
                canTruncate = true;
                break;
            default:
                value = value.toString();
        }
        let formatted = this.htmlEntities(value);
        if (canTruncate) {
            if (formatted && formatted.length > 150)
                formatted = formatted.substring(0, 148) + '&hellip;';
        }
        return formatted;
    }
    formatInterval(value, config) {
        let keys = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];
        let is_negative = false;
        for (let key of keys) {
            if (!value.hasOwnProperty(key))
                value[key] = 0;
            else if (value[key] < 0) {
                is_negative = true;
                value[key] = Math.abs(value[key]);
            }
        }
        switch (config.get("intervalFormat")) {
            case 'humanize':
                return this.formatIntervalHumanize(value, is_negative);
            case 'succinct':
                return this.formatIntervalSuccinct(value, is_negative);
            default: // iso_8601
                return this.formatIntervalISO(value, is_negative);
        }
        // SELECT now() - start_date_time FROM "events" LIMIT 1;
    }
    formatIntervalISO(value, is_negative) {
        //{"days":4107,"hours":5,"minutes":56,"seconds":17,"milliseconds":681}
        let iso = 'P';
        if (value.years)
            iso += value.years.toString() + 'Y';
        if (value.months)
            iso += value.months.toString() + 'M';
        if (value.days)
            iso += value.days.toString() + 'D';
        if (iso === 'P' || (value.hours || value.minutes || value.seconds))
            iso += 'T';
        if (value.hours)
            iso += value.hours.toString() + 'H';
        if (value.minutes)
            iso += value.minutes.toString() + 'M';
        if (!value.hasOwnProperty('seconds'))
            value.seconds = 0;
        if (value.milliseconds)
            value.seconds += (value.milliseconds / 1000);
        if (value.seconds)
            iso += value.seconds.toString() + 'S';
        if (iso === 'PT')
            iso += '0S';
        return (is_negative ? '-' : '') + iso;
    }
    formatIntervalHumanize(value, is_negative) {
        let values = [];
        if (!value.hasOwnProperty('seconds'))
            value.seconds = 0;
        if (value.milliseconds)
            value.seconds += (value.milliseconds / 1000);
        if (value.years)
            values.push(value.years.toString() + ' years');
        if (value.months)
            values.push(value.months.toString() + ' months');
        if (value.days)
            values.push(value.days.toString() + ' days');
        if (value.hours)
            values.push(value.hours.toString() + ' hours');
        if (value.minutes)
            values.push(value.minutes.toString() + ' minutes');
        if (value.seconds)
            values.push(value.seconds.toString() + ' seconds');
        if (values.length < 1)
            values.push('0 seconds');
        if (is_negative)
            values.push('ago');
        return values.join(' ');
    }
    formatIntervalSuccinct(value, is_negative) {
        let values = [];
        if (value.milliseconds)
            value.seconds += (value.milliseconds / 1000);
        if (value.years)
            values.push(value.years.toString());
        if (values.length || value.months)
            values.push(value.months.toString());
        if (values.length || value.days)
            values.push(value.days.toString());
        if (values.length || value.hours)
            values.push(value.hours.toString());
        if (values.length || value.minutes)
            values.push(value.minutes.toString());
        if (values.length || value.seconds)
            values.push(value.seconds.toString());
        if (values.length < 1)
            values.push('0');
        if (is_negative)
            values.unshift('-');
        return values.join(':');
    }
    buildTable(res) {
        let config = global_1.Global.Configuration;
        let html = `<html><head>`;
        html += this.getTableStyles(config);
        html += `</head><body style="margin: 0; padding: 0;">`;
        res.forEach(result => {
            html += `<table>`;
            // first the column headers
            html += `<thead><tr><th></th>`;
            result.fields.forEach((field) => {
                html += `<th><div class="field-name">${field.name}</div><div class="field-type">${field.display_type}</div></th>`;
            });
            html += `</tr></thead>`;
            // now the body
            let rowIndex = 1;
            html += `<tbody>`;
            if (result.rows && result.rows.length) {
                result.rows.forEach((row) => {
                    html += `<tr><th class="row-header">${rowIndex++}</th>`;
                    result.fields.forEach((field, idx) => {
                        let formatted = this.formatData(field, row[idx], config);
                        html += `<td class="${field.format}-field">${formatted ? formatted : ''}</td>`;
                    });
                    html += `</tr>`;
                });
            }
            html += `</tbody>`;
            html += `</table>`;
        });
        let timeNow = new Date().getTime();
        return html + '</body></html>';
    }
    getResultData(uri) {
        let url = uri.toString();
        if (!this._queryResultsMap.has(url))
            return null;
        return this._queryResultsMap.get(url);
    }
}
exports.PreviewProvider = PreviewProvider;
//# sourceMappingURL=previewProvider.js.map