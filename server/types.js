"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPRESSIONS = exports.STATEMENTS = exports.DECLARATIONS = exports.NODES = exports.AUTOCOMPLETE_TYPES = void 0;
// Note that the order the enum fields appear in determine the order they are displayed in the autocomplete list
var AUTOCOMPLETE_TYPES;
(function (AUTOCOMPLETE_TYPES) {
    AUTOCOMPLETE_TYPES[AUTOCOMPLETE_TYPES["BUILTIN"] = 0] = "BUILTIN";
    AUTOCOMPLETE_TYPES[AUTOCOMPLETE_TYPES["SYMBOL"] = 1] = "SYMBOL";
    AUTOCOMPLETE_TYPES[AUTOCOMPLETE_TYPES["MODULE"] = 2] = "MODULE";
})(AUTOCOMPLETE_TYPES || (exports.AUTOCOMPLETE_TYPES = AUTOCOMPLETE_TYPES = {}));
var NODES;
(function (NODES) {
    NODES["IDENTIFIER"] = "Identifier";
    NODES["REST"] = "RestElement";
    NODES["IMPORT_SPECIFIER"] = "ImportSpecifier";
})(NODES || (exports.NODES = NODES = {}));
var DECLARATIONS;
(function (DECLARATIONS) {
    DECLARATIONS["VARIABLE"] = "VariableDeclaration";
    DECLARATIONS["FUNCTION"] = "FunctionDeclaration";
    DECLARATIONS["IMPORT"] = "ImportDeclaration";
    DECLARATIONS["LAMBDA"] = "ArrowFunctionExpression";
})(DECLARATIONS || (exports.DECLARATIONS = DECLARATIONS = {}));
var STATEMENTS;
(function (STATEMENTS) {
    STATEMENTS["EXPRESSION"] = "ExpressionStatement";
})(STATEMENTS || (exports.STATEMENTS = STATEMENTS = {}));
var EXPRESSIONS;
(function (EXPRESSIONS) {
    EXPRESSIONS["BINARY"] = "BinaryExpression";
    EXPRESSIONS["TERNARY"] = "ConditionalExpression";
    EXPRESSIONS["LITERAL"] = "Literal";
    EXPRESSIONS["CALL"] = "CallExpression";
})(EXPRESSIONS || (exports.EXPRESSIONS = EXPRESSIONS = {}));
//# sourceMappingURL=types.js.map