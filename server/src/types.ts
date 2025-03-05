import { DeclarationKind } from "js-slang/dist/name-extractor";
import { Range } from "vscode-languageserver/node";
import * as es from 'estree';

// Note that the order the enum fields appear in determine the order they are displayed in the autocomplete list
export enum AUTOCOMPLETE_TYPES {
	BUILTIN,
	SYMBOL,
	MODULE
}

export enum NODES {
    IDENTIFIER = "Identifier",
    REST = "RestElement",
    IMPORT_SPECIFIER = "ImportSpecifier"
}

export enum DECLARATIONS {
    VARIABLE = "VariableDeclaration",
    FUNCTION = "FunctionDeclaration",
    IMPORT = "ImportDeclaration",
    LAMBDA = "ArrowFunctionExpression"
}

export enum STATEMENTS {
    EXPRESSION = "ExpressionStatement"
}

export enum EXPRESSIONS {
    BINARY = "BinaryExpression",
    TERNARY = "ConditionalExpression",
    LITERAL = "Literal",
    CALL = "CallExpression"
}

export interface DeclarationSymbol {
    type: "declaration",
    name: string,
    scope: es.SourceLocation,
    meta: "const" | "let" | "func",
    declarationKind: DeclarationKind,
    range: Range,
    selectionRange: Range,
    parameters?: Array<DeclarationSymbol>,
    showInDocumentSymbols?: boolean;
}

export interface CompletionItemData {
    type: AUTOCOMPLETE_TYPES,
    idx: number
    module_name?: string,
    parameters?: string[],
    optional_params?: string[]
}