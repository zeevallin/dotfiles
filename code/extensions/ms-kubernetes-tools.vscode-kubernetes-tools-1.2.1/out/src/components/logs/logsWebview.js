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
        this.panel.webview.postMessage({
            command: 'content',
            text: content,
        });
    }
    setAppendContentProcess(proc) {
        this.deleteAppendContentProcess();
        this.appendContentProcess = proc;
    }
    deleteAppendContentProcess() {
        if (this.appendContentProcess) {
            this.appendContentProcess.terminate();
            this.appendContentProcess = undefined;
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
                <input style='left:575px; position: absolute' type='button' id='goToBottom' size='25' value='Scroll To Bottom'/>
            </div>
            <div style='position: absolute; top: 55px; bottom: 10px; width: 97%'>
              <div id="logPanel" style="overflow-y: scroll; height: 100%">
                  <code>
                    <pre id='content'>
                    </pre>
                    <a id='bottom' />
                  </code>
                </div>
            </div>
            <script>
              let renderNonce = 0;
              let orig = \`${this.content}\`.split('\\n');

              const filterAll = () => {
                return filter(orig, false);
              }

              const filterNewLogs = (logsText) => {
                return filter(logsText, true);
              }

              const filter = (text, isNewLog) => {
                const regexp = document.getElementById('regexp').value;
                const mode = document.getElementById('mode').value;
                let content;
                if (regexp.length > 0 && mode !== 'all') {
                    const regex = new RegExp(regexp);
                    switch (mode) {
                        case 'include':
                            content = text.filter((line) => regex.test(line));
                            break;
                        case 'exclude':
                            content = text.filter((line) => !regex.test(line));
                            break;
                        case 'before':
                            content = [];
                            if (!isNewLog) {
                                for (const line of text) {
                                    if (regex.test(line)) {
                                        break;
                                    }
                                    content.push(line);
                                }
                            }
                            break;
                        case 'after':
                            if (isNewLog) {
                                content = text;
                            } else {
                                const i = text.findIndex((line) => {
                                    return regex.test(line)
                                });
                                content = text.slice(i+1);
                            }
                            break;
                        default:
                            content = []
                            break;
                    }
                } else {
                    content = text;
                }

                return content;
              };

              const beautifyContentLineRange = (contentLines, ix, end) => {
                if (ix && end) {
                    contentLines = contentLines.slice(ix, end);
                }
                return beautifyLines(contentLines);
              }

              const beautifyLines = (contentLines) => {
                let content = contentLines.join('\\n');
                if (content) {
                    content = content.match(/\\n$/) ? content : content + '\\n';
                }
                return content;
              };

              var lastMode = '';
              var lastRegexp = '';
              var isToBottom = true;

              function debounce(func, wait, immediate) {
                var timeout;
                return function() {
                  var context = this, args = arguments;
                  var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                  };
                  var callNow = immediate && !timeout;
                  clearTimeout(timeout);
                  timeout = setTimeout(later, wait);
                  if (callNow) func.apply(context, args);
                };
              };

              const elem = document.getElementById('logPanel');
              let lastScrollTop = 0;
              let toBottom = debounce(function() {
                const st = elem.scrollTop;
                if (st > lastScrollTop){
                  // scroll down
                  isToBottom = (elem.scrollTop + window.innerHeight) >= elem.scrollHeight;
                } else {
                  // scroll up
                  isToBottom = false;
                }
                lastScrollTop = st <= 0 ? 0 : st;
              }, 250);

              elem.addEventListener("scroll", toBottom);

              const button = document.getElementById('goToBottom');

              function scrollToBottom () {
                document.getElementById('bottom').scrollIntoView();
              }

              button.addEventListener('click', function(){
                scrollToBottom();
              });

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
                    const content = beautifyLines(filterNewLogs(text));
                    elt.appendChild(document.createTextNode(content));

                    // handle auto-scroll on/off
                    if (isToBottom) scrollToBottom();
                }
              });

              const eval = () => {
                setTimeout(evalInternal, 0);
              };

              const evalInternal = () => {
                // We use this to abort renders in progress if a new render starts
                renderNonce = Math.random();
                const currentNonce = renderNonce;

                const content = filterAll();

                const elt = document.getElementById('content');
                elt.textContent = '';

                // This is probably seems more complicated than necessary.
                // However, rendering large blocks of text are _slow_ and kill the UI thread.
                // So we split it up into manageable chunks to keep the UX lively.
                // Of course the trouble is then we could interleave multiple different filters.
                // So we use the random nonce to detect and pre-empt previous renders.
                let ix = 0;
                const step = 1000;
                const fn = () => {
                    if (renderNonce != currentNonce) {
                        return;
                    }
                    if (ix >= content.length) {
                        return;
                    }
                    const end = Math.min(content.length, ix + step);
                    elt.appendChild(document.createTextNode(beautifyContentLineRange(content, ix, end)));
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
    dispose() {
        this.deleteAppendContentProcess();
        super.dispose(LogsPanel.currentPanels);
    }
}
exports.LogsPanel = LogsPanel;
LogsPanel.viewType = 'vscodeKubernetesLogs';
LogsPanel.currentPanels = new Map();
//# sourceMappingURL=logsWebview.js.map