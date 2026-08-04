import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function unwrap(node) {
  let current = node;

  while (
    ts.isParenthesizedExpression(current)
    || ts.isAsExpression(current)
    || ts.isTypeAssertionExpression(current)
    || ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) {
    return name.text;
  }

  if (
    ts.isStringLiteral(name)
    || ts.isNumericLiteral(name)
    || ts.isNoSubstitutionTemplateLiteral(name)
  ) {
    return name.text;
  }

  throw new Error(`Unsupported property name kind: ${ts.SyntaxKind[name.kind]}`);
}

function evaluateLiteral(node) {
  const value = unwrap(node);

  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    return value.text;
  }

  if (ts.isNumericLiteral(value)) {
    return Number(value.text);
  }

  if (value.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (value.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  if (value.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }

  if (
    ts.isPrefixUnaryExpression(value)
    && value.operator === ts.SyntaxKind.MinusToken
  ) {
    return -Number(evaluateLiteral(value.operand));
  }

  if (ts.isArrayLiteralExpression(value)) {
    return value.elements.map((element) => evaluateLiteral(element));
  }

  if (ts.isObjectLiteralExpression(value)) {
    const result = {};

    for (const property of value.properties) {
      if (!ts.isPropertyAssignment(property)) {
        throw new Error(
          `Unsupported object property kind: ${ts.SyntaxKind[property.kind]}`,
        );
      }

      result[propertyNameText(property.name)] = evaluateLiteral(
        property.initializer,
      );
    }

    return result;
  }

  throw new Error(`Unsupported literal kind: ${ts.SyntaxKind[value.kind]}`);
}

export function readNamedLiteralObject(
  sourceText,
  variableName,
  fileName = "source.ts",
) {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  let declaration;

  function visit(node) {
    if (declaration) {
      return;
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      if (node.name.text === variableName) {
        declaration = node;
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!declaration?.initializer) {
    throw new Error(
      `Variable ${variableName} was not found in ${fileName}`,
    );
  }

  const result = evaluateLiteral(declaration.initializer);

  if (!result || Array.isArray(result) || typeof result !== "object") {
    throw new Error(`${variableName} is not an object literal`);
  }

  return result;
}
