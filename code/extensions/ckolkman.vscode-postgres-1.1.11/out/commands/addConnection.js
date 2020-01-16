"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const baseCommand_1 = require("../common/baseCommand");
const vscode = require("vscode");
const treeProvider_1 = require("../tree/treeProvider");
const constants_1 = require("../common/constants");
const uuidv1 = require("uuid/v1");
const global_1 = require("../common/global");
const multiStepInput_1 = require("../common/multiStepInput");
const database_1 = require("../common/database");
'use strict';
const sslOptions = [
    { label: 'Use Secure Connection', ssl: true },
    { label: 'Standard Connection', ssl: false }
];
class addConnectionCommand extends baseCommand_1.default {
    constructor() {
        super(...arguments);
        this.TITLE = 'Add Database Connection';
        this.TotalSteps = 7;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = { port: 5432 };
            if (!(yield multiStepInput_1.MultiStepInput.run(input => this.setHostName(input, state)))) {
                // command cancelled
                return;
            }
            // create the db connection
            const tree = treeProvider_1.PostgreSQLTreeDataProvider.getInstance();
            let connections = tree.context.globalState.get(constants_1.Constants.GlobalStateKey);
            if (!connections)
                connections = {};
            const id = uuidv1();
            connections[id] = {
                label: state.label,
                host: state.host,
                user: state.user,
                port: state.port,
                ssl: state.secure,
                database: state.database
            };
            connections[id].hasPassword = !!state.password;
            if (connections[id].hasPassword) {
                yield global_1.Global.keytar.setPassword(constants_1.Constants.ExtensionId, id, state.password);
            }
            yield tree.context.globalState.update(constants_1.Constants.GlobalStateKey, connections);
            tree.refresh();
        });
    }
    setHostName(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            state.host = yield input.showInputBox({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                prompt: 'The hostname of the database',
                placeholder: 'ex. 127.0.0.1',
                ignoreFocusOut: true,
                value: (typeof state.host === 'string') ? state.host : '',
                validate: (value) => __awaiter(this, void 0, void 0, function* () { return (!value || !value.trim()) ? 'Hostname is required' : ''; })
            });
            state.label = state.host;
            return (input) => this.setUsername(input, state);
        });
    }
    setUsername(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            state.user = yield input.showInputBox({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                prompt: 'The PostgreSQL user to authenticate as',
                placeholder: 'ex. root',
                ignoreFocusOut: true,
                value: (typeof state.user === 'string') ? state.user : '',
                validate: (value) => __awaiter(this, void 0, void 0, function* () { return (!value || !value.trim()) ? 'Username is required' : ''; })
            });
            return (input) => this.setPassword(input, state);
        });
    }
    setPassword(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            state.password = yield input.showInputBox({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                prompt: 'The password of the PostgreSQL user',
                placeholder: '',
                ignoreFocusOut: true,
                password: true,
                value: (typeof state.password === 'string') ? state.password : '',
                validate: (value) => __awaiter(this, void 0, void 0, function* () { return ''; })
            });
            return (input) => this.setPort(input, state);
        });
    }
    setPort(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            state.port = yield input.showInputBox({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                prompt: 'The port number to connect to',
                placeholder: 'ex. 5432',
                ignoreFocusOut: true,
                value: (typeof state.port === 'number') ? state.port.toString() : '',
                validate: (value) => __awaiter(this, void 0, void 0, function* () {
                    if (!value || !value.trim())
                        return 'Port number is required';
                    return Number.isNaN(Number.parseInt(value)) ? 'The port number specified was not a number' : '';
                }),
                convert: (value) => __awaiter(this, void 0, void 0, function* () { return Number.parseInt(value); })
            });
            return (input) => this.setSSL(input, state);
        });
    }
    setSSL(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            let active = sslOptions.find(s => s.ssl === !!state.secure);
            state.secure = yield input.showQuickPick({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                placeholder: 'Use an ssl connection?',
                ignoreFocusOut: true,
                items: sslOptions,
                activeItem: active || undefined,
                convert: (value) => __awaiter(this, void 0, void 0, function* () { return value.ssl; })
            });
            if (typeof state.secure === 'undefined')
                state.secure = false;
            return (input) => this.setDatabase(input, state);
        });
    }
    setDatabase(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            // first need the databases
            let connection = null;
            let databases = [];
            let connectionError = null;
            try {
                connection = yield database_1.Database.createConnection({
                    label: '',
                    host: state.host,
                    user: state.user,
                    password: state.password,
                    port: state.port,
                    ssl: state.secure
                }, 'postgres');
                const res = yield connection.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
                databases = res.rows.map(database => ({ label: database.datname, dbname: database.datname }));
            }
            catch (err) {
                if (err.message === `permission denied for database "postgres"`) {
                    // Heroku message anyway... probably varies
                    // is there another common parameter could be checked?
                }
                else {
                    // vscode.window.showErrorMessage(err.message);
                }
            }
            finally {
                if (connection) {
                    yield connection.end();
                    connection = null;
                }
            }
            if (databases.length < 1) {
                // specify database via text input - may not have permission to list databases
                let connectionOK = false;
                do {
                    state.database = yield input.showInputBox({
                        title: this.TITLE,
                        step: input.CurrentStepNumber,
                        totalSteps: this.TotalSteps,
                        prompt: '[Optional] The database to connect to. Leave empty to enumerate databases on the server',
                        placeholder: '',
                        ignoreFocusOut: true,
                        value: (typeof state.database === 'string') ? state.database : '',
                        validate: (value) => __awaiter(this, void 0, void 0, function* () { return ''; })
                    });
                    try {
                        let databaseToTry = state.database && state.database.trim() ? state.database : 'postgres';
                        connection = yield database_1.Database.createConnection({
                            label: '',
                            host: state.host,
                            user: state.user,
                            password: state.password,
                            port: state.port,
                            ssl: state.secure
                        }, databaseToTry);
                        connectionOK = true;
                    }
                    catch (err) {
                        connectionError = err;
                        vscode.window.showErrorMessage(err.message);
                    }
                    finally {
                        if (connection) {
                            yield connection.end();
                            connection = null;
                        }
                    }
                } while (!connectionOK);
                return (input) => this.setDisplayName(input, state);
            }
            if (connectionError) {
                input.redoLastStep();
            }
            databases.unshift({ label: 'Show All Databases' });
            let active = databases.find(d => d.dbname && d.dbname === state.database);
            let selected = yield input.showQuickPick({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                placeholder: '',
                ignoreFocusOut: true,
                items: databases,
                activeItem: active || undefined,
                convert: (value) => __awaiter(this, void 0, void 0, function* () { return value.dbname; })
            });
            state.database = selected || '';
            return (input) => this.setDisplayName(input, state);
        });
    }
    setDisplayName(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            state.label = yield input.showInputBox({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                prompt: 'The display name of the database connection',
                placeholder: 'ex. My Local DB (optional)',
                ignoreFocusOut: true,
                value: (typeof state.label === 'string') ? state.label : '',
                validate: (value) => __awaiter(this, void 0, void 0, function* () { return ''; }) // empty error message (no error)
            });
        });
    }
}
exports.addConnectionCommand = addConnectionCommand;
//# sourceMappingURL=addConnection.js.map