"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// get type description defined in JSON-schema
function formatType(p) {
    const baseType = p.type || 'object';
    if (baseType === 'array') {
        return (p.items ? formatType(p.items) : 'object') + '[]';
    }
    return baseType;
}
exports.formatType = formatType;
// format a simple property schema into user readable description, with the style of ${name} ${type} ${description}
function formatOne(name, type, description) {
    return `**${name}** (${type})\n\n${description || ''}`;
}
exports.formatOne = formatOne;
// format a complex object schema into user readable description with its own description and its properties
function formatComplex(name, description, typeDescription, children) {
    let ph = '';
    // we need to sort on keys when generating documents
    for (const p of Object.keys(children).sort()) {
        ph = ph + `**${p}** (${formatType(children[p])})\n\n${children[p].description}\n\n`;
    }
    let typeDescriptionPara = '';
    if (typeDescription) {
        typeDescriptionPara = `\n\n${typeDescription}`;
    }
    return `${name}: ${description || ''}${typeDescriptionPara}\n\n${ph}`;
}
exports.formatComplex = formatComplex;
//# sourceMappingURL=schema-formatting.js.map