"use strict";
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
const linter_utils_1 = require("./linter.utils");
const array_1 = require("../../utils/array");
// Pod->spec (which can also be found as Deployment->spec.template.spec)
// .containers[each].resources.limits.{cpu,memory}
class ResourceLimitsLinter {
    name() {
        return "resource-limits";
    }
    lint(document, syntax) {
        return __awaiter(this, void 0, void 0, function* () {
            const resources = syntax.load(document.getText());
            if (!resources) {
                return [];
            }
            const symbols = yield syntax.symbolise(document);
            if (!symbols) {
                return [];
            }
            const diagnostics = resources.map((r) => this.lintOne(r, symbols));
            return array_1.flatten(...diagnostics);
        });
    }
    lintOne(resource, symbols) {
        if (!resource) {
            return [];
        }
        const podSpecPrefix = resource.kind === 'Pod' ? 'spec' :
            resource.kind === 'Deployment' ? 'spec.template.spec' :
                undefined;
        if (!podSpecPrefix) {
            return [];
        }
        const containersSymbols = symbols.filter((s) => s.name === 'containers' && s.containerName === podSpecPrefix);
        if (!containersSymbols) {
            return [];
        }
        const warnings = [];
        const warnOn = (symbol, text) => {
            warnings.push(linter_utils_1.warningOn(symbol, text));
        };
        for (const containersSymbol of containersSymbols) {
            const imagesSymbols = linter_utils_1.childSymbols(symbols, containersSymbol, 'image');
            const resourcesSymbols = linter_utils_1.childSymbols(symbols, containersSymbol, 'resources');
            if (resourcesSymbols.length < imagesSymbols.length) {
                warnOn(containersSymbol, 'One or more containers do not have resource limits - this could starve other processes');
            }
            for (const resourcesSymbol of resourcesSymbols) {
                const limitsSymbols = linter_utils_1.childSymbols(symbols, resourcesSymbol, 'limits');
                if (limitsSymbols.length === 0) {
                    warnOn(resourcesSymbol, 'No resource limits specified for this container - this could starve other processes');
                }
                for (const limitsSymbol of limitsSymbols) {
                    const cpuSymbols = linter_utils_1.childSymbols(symbols, limitsSymbol, 'cpu');
                    if (cpuSymbols.length === 0) {
                        warnOn(limitsSymbol, 'No CPU limit specified for this container - this could starve other processes');
                    }
                    const memorySymbols = linter_utils_1.childSymbols(symbols, limitsSymbol, 'memory');
                    if (memorySymbols.length === 0) {
                        warnOn(limitsSymbol, 'No memory limit specified for this container - this could starve other processes');
                    }
                }
            }
        }
        return warnings;
    }
}
exports.ResourceLimitsLinter = ResourceLimitsLinter;
//# sourceMappingURL=resourcelimits.js.map