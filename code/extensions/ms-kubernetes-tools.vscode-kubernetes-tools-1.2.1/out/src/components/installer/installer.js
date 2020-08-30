'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const https = require("https");
const download = require("../download/download");
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const unzipper = require("unzipper");
const tar = require("tar");
const errorable_1 = require("../../errorable");
const config_1 = require("../config/config");
const installationlayout_1 = require("./installationlayout");
var ArchiveKind;
(function (ArchiveKind) {
    ArchiveKind[ArchiveKind["Tar"] = 0] = "Tar";
    ArchiveKind[ArchiveKind["Zip"] = 1] = "Zip";
})(ArchiveKind || (ArchiveKind = {}));
function installKubectl(shell) {
    return __awaiter(this, void 0, void 0, function* () {
        const tool = 'kubectl';
        const binFile = (shell.isUnix()) ? 'kubectl' : 'kubectl.exe';
        const platform = shell.platform();
        const os = installationlayout_1.platformUrlString(platform);
        const version = yield getStableKubectlVersion();
        if (errorable_1.failed(version)) {
            return { succeeded: false, error: version.error };
        }
        const installFolder = getInstallFolder(shell, tool);
        mkdirp.sync(installFolder);
        const kubectlUrl = `https://storage.googleapis.com/kubernetes-release/release/${version.result.trim()}/bin/${os}/amd64/${binFile}`;
        const downloadFile = path.join(installFolder, binFile);
        const downloadResult = yield download.to(kubectlUrl, downloadFile);
        if (errorable_1.failed(downloadResult)) {
            return { succeeded: false, error: [`Failed to download kubectl: ${downloadResult.error[0]}`] };
        }
        if (shell.isUnix()) {
            fs.chmodSync(downloadFile, '0777');
        }
        yield config_1.addPathToConfig(config_1.toolPathOSKey(platform, tool), downloadFile);
        return { succeeded: true, result: null };
    });
}
exports.installKubectl = installKubectl;
function getStableMinikubeVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const downloadResult = yield download.toTempFile('https://api.github.com/repos/kubernetes/minikube/releases/latest');
        if (errorable_1.failed(downloadResult)) {
            return { succeeded: false, error: [`Failed to find minikube stable version: ${downloadResult.error[0]}`] };
        }
        const versionObj = JSON.parse(fs.readFileSync(downloadResult.result, 'utf-8'));
        fs.unlinkSync(downloadResult.result);
        return { succeeded: true, result: versionObj['tag_name'] };
    });
}
function getStableKubectlVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const downloadResult = yield download.toTempFile('https://storage.googleapis.com/kubernetes-release/release/stable.txt');
        if (errorable_1.failed(downloadResult)) {
            return { succeeded: false, error: [`Failed to establish kubectl stable version: ${downloadResult.error[0]}`] };
        }
        const version = fs.readFileSync(downloadResult.result, 'utf-8');
        fs.unlinkSync(downloadResult.result);
        return { succeeded: true, result: version };
    });
}
function getStableHelmVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, _reject) => {
            try {
                const request = https.get('https://github.com/helm/helm/releases/latest', (r) => {
                    const location = r.headers.location;
                    if (location) {
                        const locationBits = location.split('/');
                        const version = locationBits[locationBits.length - 1];
                        resolve({ succeeded: true, result: version });
                    }
                    else {
                        resolve({ succeeded: false, error: ['No location in response'] });
                    }
                });
                request.on('error', (err) => resolve({ succeeded: false, error: [`${err}`] }));
            }
            catch (err) {
                resolve({ succeeded: false, error: [`${err}`] });
            }
        });
    });
}
const DEFAULT_HELM_VERSION = 'v3.0.0';
function installHelm(shell, warn) {
    return __awaiter(this, void 0, void 0, function* () {
        const tool = 'helm';
        const latestVersionInfo = yield getStableHelmVersion();
        if (errorable_1.failed(latestVersionInfo)) {
            warn(`Couldn't identify latest stable Helm: defaulting to ${DEFAULT_HELM_VERSION}. Error info: ${latestVersionInfo.error[0]}`);
        }
        const latestVersion = errorable_1.succeeded(latestVersionInfo) ? latestVersionInfo.result : DEFAULT_HELM_VERSION;
        const fileExtension = shell.isWindows() ? 'zip' : 'tar.gz';
        const archiveKind = shell.isWindows() ? ArchiveKind.Zip : ArchiveKind.Tar;
        const urlTemplate = `https://get.helm.sh/helm-${latestVersion}-{os_placeholder}-amd64.${fileExtension}`;
        return yield installToolFromArchive(tool, urlTemplate, shell, archiveKind);
    });
}
exports.installHelm = installHelm;
function installDraft(shell) {
    return __awaiter(this, void 0, void 0, function* () {
        const tool = 'draft';
        const urlTemplate = 'https://azuredraft.blob.core.windows.net/draft/draft-v0.15.0-{os_placeholder}-amd64.tar.gz';
        return yield installToolFromArchive(tool, urlTemplate, shell, ArchiveKind.Tar);
    });
}
exports.installDraft = installDraft;
function installMinikube(shell, version) {
    return __awaiter(this, void 0, void 0, function* () {
        const tool = 'minikube';
        const os = installationlayout_1.platformUrlString(shell.platform());
        if (!os) {
            return { succeeded: false, error: ['Not supported on this OS'] };
        }
        if (!version) {
            const versionRes = yield getStableMinikubeVersion();
            if (errorable_1.failed(versionRes)) {
                return { succeeded: false, error: versionRes.error };
            }
            version = versionRes.result;
        }
        const exe = (shell.isWindows() ? '.exe' : '');
        const urlTemplate = `https://storage.googleapis.com/minikube/releases/${version}/minikube-{os_placeholder}-amd64${exe}`;
        const url = urlTemplate.replace('{os_placeholder}', os);
        const installFolder = getInstallFolder(shell, tool);
        const executable = installationlayout_1.formatBin(tool, shell.platform()); // safe because we checked platform earlier
        const executableFullPath = path.join(installFolder, executable);
        const downloadResult = yield download.to(url, executableFullPath);
        if (errorable_1.failed(downloadResult)) {
            return { succeeded: false, error: ['Failed to download Minikube: error was ' + downloadResult.error[0]] };
        }
        if (shell.isUnix()) {
            yield shell.exec(`chmod +x ${executableFullPath}`);
        }
        const configKey = config_1.toolPathOSKey(shell.platform(), tool);
        yield config_1.addPathToConfig(configKey, executableFullPath);
        return { succeeded: true, result: null };
    });
}
exports.installMinikube = installMinikube;
function installToolFromArchive(tool, urlTemplate, shell, archiveKind, supported) {
    return __awaiter(this, void 0, void 0, function* () {
        const os = installationlayout_1.platformUrlString(shell.platform(), supported);
        if (!os) {
            return { succeeded: false, error: ['Not supported on this OS'] };
        }
        const installFolder = getInstallFolder(shell, tool);
        const executable = installationlayout_1.formatBin(tool, shell.platform()); // safe because we have already checked the platform
        const url = urlTemplate.replace('{os_placeholder}', os);
        const configKey = config_1.toolPathOSKey(shell.platform(), tool);
        return installFromArchive(url, installFolder, executable, configKey, shell, archiveKind);
    });
}
function getInstallFolder(shell, tool) {
    return path.join(shell.home(), `.vs-kubernetes/tools/${tool}`);
}
function installFromArchive(sourceUrl, destinationFolder, executablePath, configKey, shell, archiveKind) {
    return __awaiter(this, void 0, void 0, function* () {
        // download it
        const downloadResult = yield download.toTempFile(sourceUrl);
        if (errorable_1.failed(downloadResult)) {
            return { succeeded: false, error: ['Failed to download: error was ' + downloadResult.error[0]] };
        }
        const archiveFile = downloadResult.result;
        // unarchive it
        const unarchiveResult = yield unarchive(archiveFile, destinationFolder, shell, archiveKind);
        if (errorable_1.failed(unarchiveResult)) {
            return { succeeded: false, error: ['Failed to unpack: error was ' + unarchiveResult.error[0]] };
        }
        // add path to config
        let executableFullPath = path.join(destinationFolder, executablePath);
        if (config_1.getUseWsl()) {
            executableFullPath = executableFullPath.replace(/\\/g, '/');
        }
        yield config_1.addPathToConfig(configKey, executableFullPath);
        fs.unlinkSync(archiveFile);
        return { succeeded: true, result: null };
    });
}
function unarchive(sourceFile, destinationFolder, shell, archiveKind) {
    return __awaiter(this, void 0, void 0, function* () {
        if (archiveKind === ArchiveKind.Tar) {
            return yield untar(sourceFile, destinationFolder, shell);
        }
        else {
            return yield unzip(sourceFile, destinationFolder);
        }
    });
}
function unzip(sourceFile, destinationFolder) {
    return new Promise((resolve, _reject) => {
        const stream = fs.createReadStream(sourceFile)
            .pipe(unzipper.Extract({ path: destinationFolder }));
        stream.on('close', () => resolve({ succeeded: true, result: null }));
        stream.on('error', (err) => resolve({ succeeded: false, error: [`zip extract failed: ${err}`] }));
    });
}
function untar(sourceFile, destinationFolder, shell) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (config_1.getUseWsl()) {
                const destination = destinationFolder.replace(/\\/g, '/');
                let result = yield shell.exec(`mkdir -p ${destination}`);
                if (!result || result.code !== 0) {
                    const message = result ? result.stderr : "Unable to run mkdir";
                    console.log(message);
                    throw new Error(`Error making directory: ${message}`);
                }
                const drive = sourceFile[0].toLowerCase();
                const filePath = sourceFile.substring(2).replace(/\\/g, '/');
                const fileName = `/mnt/${drive}/${filePath}`;
                const cmd = `tar -C ${destination} -xf ${fileName}`;
                result = yield shell.exec(cmd);
                if (!result || result.code !== 0) {
                    const message = result ? result.stderr : "Unable to run tar";
                    console.log(message);
                    throw new Error(`Error unpacking: ${message}`);
                }
                return { succeeded: true, result: null };
            }
            if (!fs.existsSync(destinationFolder)) {
                mkdirp.sync(destinationFolder);
            }
            yield tar.x({
                cwd: destinationFolder,
                file: sourceFile
            });
            return { succeeded: true, result: null };
        }
        catch (e) {
            console.log(e);
            return { succeeded: false, error: ["tar extract failed"] /* TODO: extract error from exception */ };
        }
    });
}
//# sourceMappingURL=installer.js.map