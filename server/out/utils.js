"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.module_autocomplete = exports.autocomplete_labels = exports.imported_types = exports.source_functions = void 0;
exports.getNodeChildren = getNodeChildren;
exports.sourceLocToRange = sourceLocToRange;
exports.mapDeclarationKindToSymbolKind = mapDeclarationKindToSymbolKind;
exports.mapMetaToCompletionItemKind = mapMetaToCompletionItemKind;
exports.mapDeclarationSymbolToDocumentSymbol = mapDeclarationSymbolToDocumentSymbol;
exports.findLastRange = findLastRange;
exports.VsPosInSourceLoc = VsPosInSourceLoc;
exports.sourceLocInSourceLoc = sourceLocInSourceLoc;
const types_1 = require("js-slang/dist/types");
const vscode_languageserver_1 = require("vscode-languageserver");
const name_extractor_1 = require("js-slang/dist/name-extractor");
const types_2 = require("./types");
const source_json_1 = __importDefault(require("./docs/source.json"));
const modules_json_1 = __importDefault(require("./docs/modules/modules.json"));
exports.source_functions = source_json_1.default.map(version => version.filter(doc => doc.meta === "func").reduce((a, v) => ({ ...a, [v.label]: v }), {}));
exports.imported_types = new Map();
exports.autocomplete_labels = source_json_1.default.map(version => version.map((doc, idx) => {
    return {
        label: doc.label,
        labelDetails: { detail: ` (${doc.meta})` },
        detail: doc.title,
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: doc.description
        },
        kind: doc.meta === "const" ? vscode_languageserver_1.CompletionItemKind.Constant : vscode_languageserver_1.CompletionItemKind.Function,
        data: { type: types_2.AUTOCOMPLETE_TYPES.BUILTIN, idx: idx, parameters: doc.parameters, optional_params: doc.optional_params },
        sortText: '' + types_2.AUTOCOMPLETE_TYPES.BUILTIN
    };
}));
exports.module_autocomplete = [];
for (const key in modules_json_1.default) {
    const module = modules_json_1.default[key];
    exports.imported_types.set(key, new Map());
    module.forEach((doc, idx) => {
        exports.imported_types.get(key).set(doc.label, doc.meta === "func" ? "func" : "const");
        exports.module_autocomplete.push({
            label: doc.label,
            labelDetails: { detail: ` (${doc.meta})` },
            detail: doc.title,
            documentation: {
                kind: vscode_languageserver_1.MarkupKind.Markdown,
                value: doc.description
            },
            kind: doc.meta === "const" ? vscode_languageserver_1.CompletionItemKind.Constant : vscode_languageserver_1.CompletionItemKind.Function,
            // @ts-ignore
            data: { type: types_2.AUTOCOMPLETE_TYPES.MODULE, idx: idx, module_name: key, parameters: doc.parameters, optional_params: doc.optional_params },
            sortText: '' + types_2.AUTOCOMPLETE_TYPES.MODULE
        });
    });
}
function isNotNull(x) {
    // This function exists to appease the mighty typescript type checker
    return x !== null;
}
function isNotNullOrUndefined(x) {
    // This function also exists to appease the mighty typescript type checker
    return x !== undefined && isNotNull(x);
}
function getNodeChildren(node) {
    switch (node.type) {
        case 'Program':
            return node.body;
        case 'BlockStatement':
            return node.body;
        case 'WhileStatement':
            return [node.test, node.body];
        case 'ForStatement':
            return [node.init, node.test, node.update, node.body].filter(isNotNullOrUndefined);
        case 'ExpressionStatement':
            return [node.expression];
        case 'IfStatement':
            const children = [node.test, node.consequent];
            if (isNotNullOrUndefined(node.alternate)) {
                children.push(node.alternate);
            }
            return children;
        case 'ReturnStatement':
            return node.argument ? [node.argument] : [];
        case 'FunctionDeclaration':
            return [node.body];
        case 'VariableDeclaration':
            return node.declarations.flatMap(getNodeChildren);
        case 'VariableDeclarator':
            return node.init ? [node.init] : [];
        case 'ImportDeclaration':
            return node.specifiers.flatMap(getNodeChildren);
        case 'ImportSpecifier':
            return [node.imported, node.local];
        case 'ArrowFunctionExpression':
            return [node.body];
        case 'FunctionExpression':
            return [node.body];
        case 'UnaryExpression':
            return [node.argument];
        case 'BinaryExpression':
            return [node.left, node.right];
        case 'LogicalExpression':
            return [node.left, node.right];
        case 'ConditionalExpression':
            return [node.test, node.alternate, node.consequent];
        case 'CallExpression':
            return [...node.arguments, node.callee];
        // case 'Identifier':
        // case 'DebuggerStatement':
        // case 'BreakStatement':
        // case 'ContinueStatement':
        // case 'MemberPattern':
        case 'ArrayExpression':
            return node.elements.filter(isNotNull);
        case 'AssignmentExpression':
            return [node.left, node.right];
        case 'MemberExpression':
            return [node.object, node.property];
        case 'Property':
            return [node.key, node.value];
        case 'ObjectExpression':
            return [...node.properties];
        case 'NewExpression':
            return [...node.arguments, node.callee];
        default:
            return [];
    }
}
function sourceLocToRange(loc) {
    return {
        start: {
            line: loc.start.line - 1,
            character: loc.start.column
        },
        end: {
            line: loc.end.line - 1,
            character: loc.end.column
        }
    };
}
function mapDeclarationKindToSymbolKind(kind, context) {
    switch (kind) {
        case name_extractor_1.DeclarationKind.KIND_IMPORT:
            return vscode_languageserver_1.SymbolKind.Namespace;
        case name_extractor_1.DeclarationKind.KIND_FUNCTION:
            return vscode_languageserver_1.SymbolKind.Function;
        case name_extractor_1.DeclarationKind.KIND_LET:
            return vscode_languageserver_1.SymbolKind.Variable;
        case name_extractor_1.DeclarationKind.KIND_PARAM:
            return context.chapter === types_1.Chapter.SOURCE_1 || context.chapter === types_1.Chapter.SOURCE_2 ? vscode_languageserver_1.SymbolKind.Constant : vscode_languageserver_1.SymbolKind.Variable;
        case name_extractor_1.DeclarationKind.KIND_CONST:
            return vscode_languageserver_1.SymbolKind.Constant;
        default:
            return vscode_languageserver_1.SymbolKind.Namespace;
    }
}
function mapMetaToCompletionItemKind(meta) {
    switch (meta) {
        case "const":
            return vscode_languageserver_1.CompletionItemKind.Constant;
        case "let":
            return vscode_languageserver_1.CompletionItemKind.Variable;
        case "import":
            return vscode_languageserver_1.CompletionItemKind.Module;
        default:
            return vscode_languageserver_1.CompletionItemKind.Text;
    }
}
function mapDeclarationSymbolToDocumentSymbol(declaration, context) {
    return ({
        name: declaration.name,
        kind: mapDeclarationKindToSymbolKind(declaration.declarationKind, context),
        range: declaration.range,
        selectionRange: declaration.selectionRange,
        ...declaration.parameters && { children: declaration.parameters.map(x => mapDeclarationSymbolToDocumentSymbol(x, context)) }
    });
}
// Helper function to find which range ends later
function findLastRange(r1, r2) {
    if (r1.end.line > r2.end.line)
        return r1;
    if (r1.end.line < r2.end.line)
        return r2;
    if (r1.end.character < r2.end.character)
        return r2;
    return r1;
}
function VsPosInSourceLoc(pos, loc) {
    function before(first, second) {
        return first.line < second.line || (first.line === second.line && first.column <= second.column);
    }
    const esPos = { line: pos.line + 1, column: pos.character };
    return before(loc.start, esPos) && before(esPos, loc.end);
}
function sourceLocInSourceLoc(inner, outer) {
    return VsPosInSourceLoc({ line: inner.start.line - 1, character: inner.start.column }, outer) && VsPosInSourceLoc({ line: inner.end.line - 1, character: inner.end.column }, outer);
}
//# sourceMappingURL=utils.js.map