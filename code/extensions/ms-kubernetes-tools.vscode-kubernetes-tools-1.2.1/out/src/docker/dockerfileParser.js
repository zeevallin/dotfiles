"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const docker_file_parser_1 = require("docker-file-parser");
class RawDockerfile {
    constructor(filePath) {
        this.dockerfilePath = filePath;
        const dockerData = fs.readFileSync(this.dockerfilePath, 'utf-8');
        this.commandEntries = docker_file_parser_1.parse(dockerData, { includeComments: false });
    }
    getCommandsOfType(...commands) {
        return this.commandEntries.filter((entry) => {
            const cmdName = entry.name.toLowerCase();
            return commands.find((command) => command === cmdName);
        });
    }
    mergeCommandArgsOfType(command) {
        let args = Array.of();
        this.commandEntries.forEach((entry) => {
            if (entry.name.toLowerCase() === command) {
                args = args.concat(argArray(entry));
            }
        });
        return args;
    }
    searchInArgs(regularExpression, commands) {
        const commandEntries = (commands ? this.getCommandsOfType(...commands) : this.commandEntries);
        for (const entry of commandEntries) {
            const args = Array.isArray(entry.args) ? entry.args : [String(entry.args)];
            for (const arg of args) {
                const matches = arg.match(regularExpression);
                if (matches && matches.length) {
                    return matches;
                }
            }
        }
        return [];
    }
}
class Dockerfile {
    constructor(filePath) {
        this.dockerfilePath = filePath;
        this.dockerfile = new RawDockerfile(this.dockerfilePath);
    }
    getBaseImage() {
        const fromEntries = this.dockerfile.getCommandsOfType("from");
        if (fromEntries.length === 0) {
            return undefined;
        }
        const baseImageTag = String(fromEntries[0].args);
        const baseImageNameParts = baseImageTag.split("/");
        return baseImageNameParts[baseImageNameParts.length - 1].toLowerCase();
    }
    getExposedPorts() {
        return this.dockerfile.mergeCommandArgsOfType("expose");
    }
    getWorkDir() {
        const workDirEntry = this.dockerfile.getCommandsOfType("workdir");
        if (workDirEntry.length === 0) {
            return undefined;
        }
        return String(workDirEntry[0].args);
    }
    searchLaunchArgs(regularExpression) {
        return this.dockerfile.searchInArgs(regularExpression, ["run", "cmd", "entrypoint"]);
    }
}
class DockerfileParser {
    parse(dockerfilePath) {
        return new Dockerfile(dockerfilePath);
    }
}
exports.DockerfileParser = DockerfileParser;
function argArray(entry) {
    const args = entry.args;
    if (Array.isArray(args)) {
        return args;
    }
    if (typeof args === 'string' || args instanceof String) {
        return [args];
    }
    return Object.keys(args).map((k) => `${k} ${args[k]}`);
}
//# sourceMappingURL=dockerfileParser.js.map