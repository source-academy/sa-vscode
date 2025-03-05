"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AST = exports.DEFAULT_ECMA_VERSION = void 0;
const types_1 = require("js-slang/dist/types");
const finder_1 = require("js-slang/dist/finder");
const utils_1 = require("js-slang/dist/parser/utils");
const types_2 = require("./types");
const utils_2 = require("./utils");
const vscode_languageserver_1 = require("vscode-languageserver");
const name_extractor_1 = require("js-slang/dist/name-extractor");
const scope_refactoring_1 = require("js-slang/dist/scope-refactoring");
const acorn_1 = require("acorn");
const acorn_loose_1 = require("acorn-loose");
exports.DEFAULT_ECMA_VERSION = 6;
class AST {
    constructor(text, context, uri) {
        this.declarations = new Map();
        this.imported_names = {};
        this.diagnostics = [];
        // Array of callbacks to call once parsing is done
        // Needed for things like checking if an variable name has already been declared
        this.diagnosticsCallbacks = [];
        const acornOptions = (0, utils_1.createAcornParserOptions)(exports.DEFAULT_ECMA_VERSION, undefined, {
            onInsertedSemicolon: (pos, loc) => {
                this.diagnostics.push({
                    message: "Missing semicolon",
                    severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                    range: {
                        start: { line: loc.line - 1, character: loc.column },
                        end: { line: loc.line - 1, character: loc.column + 1 }
                    },
                });
            },
            onTrailingComma: (pos, loc) => {
                this.diagnostics.push({
                    message: "Trailing comma",
                    severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                    range: {
                        start: { line: loc.line - 1, character: loc.column },
                        end: { line: loc.line - 1, character: loc.column + 1 }
                    }
                });
            },
            locations: true,
        });
        try {
            this.ast = (0, acorn_1.parse)(text, acornOptions);
        }
        catch (e) {
            this.ast = (0, utils_1.looseParse)(text, context);
        }
        // console.debug(JSON.stringify(this.ast, null, 2));
        this.context = context;
        this.uri = uri;
        const queue = [this.ast];
        while (queue.length > 0) {
            const parent = queue.shift();
            // We iterate over the children here to maintain the parent pointer to store the scope.
            (0, utils_2.getNodeChildren)(parent).forEach((child) => {
                this.processDeclarations(child, parent);
                this.processDiagnostics(child, parent);
                queue.push(child);
            });
        }
        this.diagnosticsCallbacks.forEach(val => {
            val[0](val[1]);
        });
    }
    processDiagnostics(child, parent) {
        // If else is used over switch cause of type checking
        if (child.type === types_2.STATEMENTS.EXPRESSION) {
            const expression = child.expression;
            if (expression.type === types_2.EXPRESSIONS.BINARY)
                this.checkIncompleteBinaryStatement(expression.left, expression.right, expression.loc, "Incomplete binary expression");
            else if (expression.type === types_2.EXPRESSIONS.TERNARY)
                this.checkIncompleteBinaryStatement(expression.consequent, expression.alternate, expression.loc, "Incomplete ternary");
            else if (expression.type === types_2.EXPRESSIONS.LITERAL) {
                if (typeof expression.value === "string") {
                    if (expression.raw.length < 2 || !expression.raw.endsWith("\""))
                        this.addDiagnostic("Incomplete string expression", vscode_languageserver_1.DiagnosticSeverity.Error, expression.loc);
                }
            }
        }
        else if (child.type === types_2.DECLARATIONS.VARIABLE) {
            child.declarations.forEach(declaration => {
                this.checkIncompleteBinaryStatement(declaration.id, declaration.init, child.loc, "Incomplete variable declaration");
            });
        }
        else if (child.type === types_2.DECLARATIONS.FUNCTION) {
            if (this.isDummy(child.id))
                this.addDiagnostic("Missing function name", vscode_languageserver_1.DiagnosticSeverity.Error, child.loc);
            let hasRestElement = false;
            for (const param of child.params) {
                if (hasRestElement) {
                    this.addDiagnostic("No params allowed after rest element", vscode_languageserver_1.DiagnosticSeverity.Error, { start: param.loc.start, end: child.params[child.params.length - 1].loc.end });
                    break;
                }
                hasRestElement = param.type === "RestElement";
            }
            const paramNames = new Set();
            for (const param of child.params) {
                if (param.type === types_2.NODES.IDENTIFIER || (param.type === types_2.NODES.REST && param.argument.type === types_2.NODES.IDENTIFIER)) {
                    const name = param.type === types_2.NODES.IDENTIFIER ? param.name : param.argument.name;
                    if (paramNames.has(name))
                        this.addDiagnostic("No duplicate param names", vscode_languageserver_1.DiagnosticSeverity.Error, param.loc);
                    else
                        paramNames.add(name);
                }
            }
        }
        else if (child.type === types_2.EXPRESSIONS.CALL) {
            if (child.callee.type === types_2.NODES.IDENTIFIER) {
                this.addDiagnosticCallback((child) => {
                    const callee = child;
                    const declaration = this.findDeclarationByName(callee.name, callee.loc);
                    if (declaration !== undefined && declaration.meta !== "func" && !(callee.name in utils_2.source_functions[this.context.chapter - 1]))
                        this.addDiagnostic(`'${callee.name}' is not a function`, vscode_languageserver_1.DiagnosticSeverity.Error, callee.loc);
                }, child.callee);
            }
        }
        else if (child.type === types_2.NODES.IDENTIFIER && parent.type !== types_2.DECLARATIONS.IMPORT) {
            this.addDiagnosticCallback((child) => {
                const identifier = child;
                const declaration = this.findDeclarationByName(identifier.name, identifier.loc);
                if (declaration === undefined && !(identifier.name in utils_2.source_functions[this.context.chapter - 1]))
                    this.addDiagnostic(`'${identifier.name}' not declared`, vscode_languageserver_1.DiagnosticSeverity.Error, identifier.loc);
            }, child);
        }
    }
    addDiagnosticCallback(callback, child) {
        this.diagnosticsCallbacks.push([callback, child]);
    }
    checkIncompleteBinaryStatement(left, right, loc, message) {
        if (left === null || right === null || (left.type === types_2.NODES.IDENTIFIER && (0, acorn_loose_1.isDummy)(left)) || (right.type === types_2.NODES.IDENTIFIER && (0, acorn_loose_1.isDummy)(right))) {
            this.addDiagnostic(message, vscode_languageserver_1.DiagnosticSeverity.Error, loc);
        }
    }
    // Wrapper around isDummy due to type checking issues
    isDummy(node) {
        return (0, acorn_loose_1.isDummy)(node);
    }
    addDiagnostic(message, severity, loc) {
        this.diagnostics.push({
            message: message,
            severity: severity,
            range: (0, utils_2.sourceLocToRange)(loc)
        });
    }
    processDeclarations(child, parent) {
        if (child.type === types_2.DECLARATIONS.IMPORT) {
            const module_name = child.source.value;
            if (utils_2.imported_types.has(module_name)) {
                if (!this.imported_names[module_name])
                    this.imported_names[module_name] = new Map();
                child.specifiers.forEach(specifier => {
                    // Namespace and default imports are not allowed
                    if (specifier.type === types_2.NODES.IMPORT_SPECIFIER) {
                        const real_name = specifier.imported.name;
                        const name = specifier.local.name;
                        if (utils_2.imported_types.get(module_name).has(real_name)) {
                            this.imported_names[module_name].set(real_name, { range: (0, utils_2.sourceLocToRange)(specifier.loc), local: name });
                            this.addDeclaration(name, {
                                type: "declaration",
                                name: name,
                                scope: parent.loc,
                                meta: utils_2.imported_types.get(module_name).get(real_name),
                                declarationKind: name_extractor_1.DeclarationKind.KIND_IMPORT,
                                range: (0, utils_2.sourceLocToRange)(child.loc),
                                selectionRange: (0, utils_2.sourceLocToRange)(specifier.loc)
                            });
                        }
                    }
                });
            }
        }
        else if (child.type === types_2.DECLARATIONS.VARIABLE) {
            child.declarations.forEach(declaration => {
                const name = declaration.id.name;
                const variableDeclaration = {
                    type: "declaration",
                    name: name,
                    scope: parent.loc,
                    meta: child.kind === "var" || child.kind === "let" ? "let" : "const",
                    declarationKind: child.kind === "var" || child.kind === "let" ? name_extractor_1.DeclarationKind.KIND_LET : name_extractor_1.DeclarationKind.KIND_CONST,
                    range: (0, utils_2.sourceLocToRange)(declaration.loc),
                    selectionRange: (0, utils_2.sourceLocToRange)(declaration.id.loc),
                };
                this.addDeclaration(name, variableDeclaration);
                if (declaration.init && declaration.init.type == types_2.DECLARATIONS.LAMBDA) {
                    const lambda = declaration.init;
                    if (lambda.params.length !== 0)
                        variableDeclaration.parameters = [];
                    lambda.params.forEach(param => {
                        const name = param.name;
                        const param_declaration = {
                            type: "declaration",
                            name: name,
                            scope: lambda.body.loc,
                            meta: this.context.chapter == types_1.Chapter.SOURCE_1 || this.context.chapter === types_1.Chapter.SOURCE_2 ? "const" : "let",
                            declarationKind: name_extractor_1.DeclarationKind.KIND_PARAM,
                            range: (0, utils_2.sourceLocToRange)(param.loc),
                            selectionRange: (0, utils_2.sourceLocToRange)(param.loc),
                            showInDocumentSymbols: false
                        };
                        variableDeclaration.parameters.push(param_declaration);
                        this.addDeclaration(name, param_declaration);
                    });
                }
            });
        }
        else if (child.type === types_2.DECLARATIONS.FUNCTION) {
            const name = child.id.name;
            const functionDeclaration = {
                type: "declaration",
                name: name,
                scope: parent.loc,
                meta: "func",
                declarationKind: name_extractor_1.DeclarationKind.KIND_FUNCTION,
                range: (0, utils_2.sourceLocToRange)(child.loc),
                selectionRange: (0, utils_2.sourceLocToRange)(child.id.loc),
                parameters: []
            };
            this.addDeclaration(name, functionDeclaration);
            child.params.forEach(param => {
                if (param.type === types_2.NODES.IDENTIFIER) {
                    const name = param.name;
                    const param_declaration = {
                        type: "declaration",
                        name: name,
                        scope: child.body.loc,
                        meta: this.context.chapter == types_1.Chapter.SOURCE_1 || this.context.chapter === types_1.Chapter.SOURCE_2 ? "const" : "let",
                        declarationKind: name_extractor_1.DeclarationKind.KIND_PARAM,
                        range: (0, utils_2.sourceLocToRange)(param.loc),
                        selectionRange: (0, utils_2.sourceLocToRange)(param.loc),
                        showInDocumentSymbols: false
                    };
                    functionDeclaration.parameters.push(param_declaration);
                    this.addDeclaration(name, param_declaration);
                }
            });
        }
        // Handle anonymous lambdas
        else if (child.type === types_2.DECLARATIONS.LAMBDA && parent.type !== types_2.DECLARATIONS.VARIABLE) {
            child.params.forEach(param => {
                const name = param.name;
                const param_declaration = {
                    type: "declaration",
                    name: name,
                    scope: child.body.loc,
                    meta: this.context.chapter == types_1.Chapter.SOURCE_1 || this.context.chapter === types_1.Chapter.SOURCE_2 ? "const" : "let",
                    declarationKind: name_extractor_1.DeclarationKind.KIND_PARAM,
                    range: (0, utils_2.sourceLocToRange)(param.loc),
                    selectionRange: (0, utils_2.sourceLocToRange)(param.loc)
                };
                this.addDeclaration(name, param_declaration);
            });
        }
    }
    addDeclaration(name, declaration) {
        if (!this.declarations.has(name))
            this.declarations.set(name, []);
        this.declarations.get(name).push(declaration);
    }
    findDeclaration(pos) {
        const identifier = (0, finder_1.findIdentifierNode)(this.ast, this.context, { line: pos.line + 1, column: pos.character });
        if (!identifier)
            return null;
        const declaration = (0, finder_1.findDeclarationNode)(this.ast, identifier);
        if (!declaration)
            return null;
        return declaration.loc;
    }
    findDeclarationByName(name, loc) {
        if (this.declarations.has(name)) {
            let mostSpecificDeclaration;
            this.declarations.get(name).forEach(declaration => {
                if ((0, utils_2.sourceLocInSourceLoc)(loc, declaration.scope) && (mostSpecificDeclaration === undefined || (0, utils_2.sourceLocInSourceLoc)(declaration.scope, mostSpecificDeclaration.scope)))
                    mostSpecificDeclaration = declaration;
            });
            return mostSpecificDeclaration;
        }
        else
            return undefined;
    }
    getOccurences(pos) {
        const identifier = (0, finder_1.findIdentifierNode)(this.ast, this.context, { line: pos.line + 1, column: pos.character });
        if (!identifier)
            return [];
        const declaration = (0, finder_1.findDeclarationNode)(this.ast, identifier);
        if (!declaration)
            return [];
        return (0, scope_refactoring_1.getAllOccurrencesInScopeHelper)(declaration.loc, this.ast, identifier.name).map(loc => ({ range: (0, utils_2.sourceLocToRange)(loc) }));
    }
    getDocumentSymbols() {
        let ret = [];
        this.declarations.forEach((value, key) => {
            ret = ret.concat(value.filter(x => x.showInDocumentSymbols !== false).map((declaration) => (0, utils_2.mapDeclarationSymbolToDocumentSymbol)(declaration, this.context)));
        });
        return ret;
    }
    renameSymbol(pos, newName) {
        const occurences = this.getOccurences(pos);
        if (occurences.length === 0)
            return null;
        return {
            changes: {
                [this.uri]: occurences.map(loc => vscode_languageserver_1.TextEdit.replace(loc.range, newName))
            }
        };
    }
    getCompletionItems(pos) {
        let ret = [];
        this.declarations.forEach(value => {
            // Find the most specific scope
            let mostSpecificDeclaration;
            value.forEach(declaration => {
                if (declaration.declarationKind != name_extractor_1.DeclarationKind.KIND_IMPORT && (0, utils_2.VsPosInSourceLoc)(pos, declaration.scope)) {
                    if (mostSpecificDeclaration === undefined || (0, utils_2.sourceLocInSourceLoc)(declaration.scope, mostSpecificDeclaration.scope)) {
                        mostSpecificDeclaration = declaration;
                    }
                }
            });
            if (mostSpecificDeclaration) {
                ret.push({
                    label: mostSpecificDeclaration.name,
                    labelDetails: { detail: ` (${mostSpecificDeclaration.meta})` },
                    kind: (0, utils_2.mapMetaToCompletionItemKind)(mostSpecificDeclaration.meta),
                    data: {
                        type: types_2.AUTOCOMPLETE_TYPES.SYMBOL,
                        ...mostSpecificDeclaration.parameters && { parameters: mostSpecificDeclaration.parameters.map(x => x.name) }
                    },
                    sortText: '' + types_2.AUTOCOMPLETE_TYPES.SYMBOL
                });
            }
        });
        return utils_2.autocomplete_labels[this.context.chapter - 1]
            .concat(ret)
            .concat(utils_2.module_autocomplete.map((item) => {
            if (this.imported_names[item.data.module_name]) {
                if (this.imported_names[item.data.module_name].has(item.label)) {
                    return {
                        ...item,
                        label: this.imported_names[item.data.module_name].get(item.label).local,
                        detail: `Imported from ${item.data.module_name}`,
                        data: { type: types_2.AUTOCOMPLETE_TYPES.SYMBOL, ...item.data }
                    };
                }
                else {
                    // Not sure if the map preserves the order that names were inserted
                    let last_imported_range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
                    this.imported_names[item.data.module_name].forEach(range => {
                        last_imported_range = (0, utils_2.findLastRange)(last_imported_range, range.range);
                    });
                    return {
                        ...item,
                        additionalTextEdits: [
                            vscode_languageserver_1.TextEdit.insert(last_imported_range.end, `, ${item.label}`)
                        ]
                    };
                }
                ;
            }
            else
                return {
                    ...item,
                    additionalTextEdits: [
                        vscode_languageserver_1.TextEdit.insert({ line: 0, character: 0 }, `import { ${item.label} } from "${item.data.module_name}";\n`)
                    ]
                };
        }));
    }
    getDiagnostics() {
        return this.diagnostics.map(diagnostic => ({
            ...diagnostic,
            source: `Source ${this.context.chapter}`
        }));
    }
}
exports.AST = AST;
//# sourceMappingURL=ast.js.map