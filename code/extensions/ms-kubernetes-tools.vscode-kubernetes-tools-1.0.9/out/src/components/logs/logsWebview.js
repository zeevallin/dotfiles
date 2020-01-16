"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpanel_1 = require("../webpanel/webpanel");
class LogsPanel extends webpanel_1.WebPanel {
    constructor(panel, content, resource) {
        super(panel, content, resource, LogsPanel.currentPanels);
    }
    static createOrShow(content, resource) {
        const fn = (panel, content, resource) => {
            return new LogsPanel(panel, content, resource);
        };
        return webpanel_1.WebPanel.createOrShowInternal(content, resource, LogsPanel.viewType, "Kubernetes Logs", LogsPanel.currentPanels, fn);
    }
    addContent(content) {
        this.content += content;
        if (this.canProcessMessages) {
            this.panel.webview.postMessage({
                command: 'content',
                text: content,
            });
        }
    }
    update() {
        this.panel.title = `Logs - ${this.resource}`;
        this.panel.webview.html = `
        <!doctype html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Kubernetes logs ${this.resource}</title>
        </head>
        <body>
            <div style='position: fixed; top: 15px; left: 2%; width: 100%'>
                <span style='position: absolute; left: 0%'>Show log entries</span>
                <select id='mode' style='margin-bottom: 5px; position: absolute; left: 110px' onchange='eval()'>
                    <option value='all'>all</option>
                    <option value='include'>that match</option>
                    <option value='exclude'>that don't match</option>
                    <option value='after'>after match</option>
                    <option value='before'>before match</option>
                </select>
                <span style='position: absolute; left: 240px'>Match expression</span>
                <input style='left:350px; position: absolute' type='text' id='regexp' onkeyup='eval()' placeholder='Filter' size='25'/>
            </div>
            <div style='position: absolute; top: 55px; bottom: 10px; width: 97%'>
              <div style="overflow-y: scroll; height: 100%">
                  <code>
                    <pre id='content'>
                    </pre>
                  </code>
                </div>
            </div>
            <script>
              var lastMode = '';
              var lastRegexp = '';
              var renderNonce = 0;

              var orig = \`${this.content}\`.split('\\n');

              window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'content':
                    const elt = document.getElementById('content');
                    const text = message.text.split('\\n');
                    text.forEach((line) => {
                        if (line.trim() != "" && line.length > 0) {
                            orig.push(line);
                        }
                    });
                    // TODO: need to apply filters here!
                    elt.appendChild(document.createTextNode(message.text));
                }
              });

              var eval = () => {
                setTimeout(evalInternal, 0);
              };
              var evalInternal = () => {
                // We use this to abort renders in progress if a new render starts
                renderNonce = Math.random();
                var currentNonce = renderNonce;

                var regexp = document.getElementById('regexp').value;
                var mode = document.getElementById('mode').value;
                if (lastMode == mode && lastRegexp == regexp) {
                    return;
                }
                lastRegexp = regexp;
                lastMode = mode;
                if (regexp.length > 0) {
                    var regex = new RegExp(regexp);
                    switch (mode) {
                        case 'all':
                            content = orig;
                            break;
                        case 'include':
                            content = orig.filter((line) => regex.test(line));
                            break;
                        case 'exclude':
                            content = orig.filter((line) => !regex.test(line));
                            break;
                        case 'before':
                            content = [];
                            for (const line of orig) {
                                if (regex.test(line)) {
                                    break;
                                }
                                content.push(line);
                            }
                            break;
                        case 'after':
                            const i = orig.findIndex((line) => {
                                return regex.test(line)
                            });
                            content = orig.slice(i+1);
                            break;
                    }
                } else {
                    content = orig;
                }

                var elt = document.getElementById('content');
                elt.textContent = '';

                // This is probably seems more complicated than necessary.
                // However, rendering large blocks of text are _slow_ and kill the UI thread.
                // So we split it up into manageable chunks to keep the UX lively.
                // Of course the trouble is then we could interleave multiple different filters.
                // So we use the random nonce to detect and pre-empt previous renders.
                var ix = 0;
                const step = 1000;
                var fn = () => {
                    if (renderNonce != currentNonce) {
                        return;
                    }
                    if (ix >= content.length) {
                        return;
                    }
                    var end = Math.min(content.length, ix + step);
                    elt.appendChild(document.createTextNode(content.slice(ix, end).join('\\n')));
                    ix += step;
                    setTimeout(fn, 0);
                }
                fn();
              };
              eval();
            </script>
            </body>
        </html>`;
    }
}
exports.LogsPanel = LogsPanel;
LogsPanel.viewType = 'vscodeKubernetesLogs';
LogsPanel.currentPanels = new Map();
//# sourceMappingURL=logsWebview.js.map