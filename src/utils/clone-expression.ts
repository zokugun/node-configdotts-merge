import ts from 'typescript';
import { clonePropertyName } from './clone-property-name.js';
import { copyAllComments } from './copy-all-comments.js';
import { isMultiLine } from './is-multi-line.js';

/**
 * Recursively clones an expression node, handling string, numeric, boolean, object, array literals.
 */
export function cloneExpression(node: ts.Expression, sf: ts.SourceFile): ts.Expression {
	let result = node;

	if(ts.isStringLiteral(node)) {
		result = ts.factory.createStringLiteral(node.text);
	}
	else if(ts.isNumericLiteral(node)) {
		result = ts.factory.createNumericLiteral(node.text);
	}
	else if(ts.isIdentifier(node)) {
		result = ts.factory.createIdentifier(node.text);
	}
	else if(node.kind === ts.SyntaxKind.TrueKeyword) {
		result = ts.factory.createTrue();
	}
	else if(node.kind === ts.SyntaxKind.FalseKeyword) {
		result = ts.factory.createFalse();
	}
	else if(ts.isObjectLiteralExpression(node)) {
		result = ts.factory.createObjectLiteralExpression(
			node.properties.map((property) => {
				let newProperty = property;

				if(ts.isPropertyAssignment(property)) {
					newProperty = ts.factory.createPropertyAssignment(
						clonePropertyName(property.name, sf),
						cloneExpression(property.initializer, sf),
					);
				}
				else if(ts.isShorthandPropertyAssignment(property)) {
					newProperty = ts.factory.createShorthandPropertyAssignment(property.name.text);
				}
				else if(ts.isSpreadAssignment(property)) {
					newProperty = ts.factory.createSpreadAssignment(cloneExpression(property.expression, sf));
				}

				return copyAllComments(property, newProperty, sf);
			}),
			isMultiLine(node, sf),
		);
	}
	else if(ts.isArrayLiteralExpression(node)) {
		result = ts.factory.createArrayLiteralExpression(
			node.elements.map((item) => cloneExpression(item, sf)),
			isMultiLine(node, sf),
		);
	}
	else if(ts.isConditionalExpression(node)) {
		result = ts.factory.createConditionalExpression(
			cloneExpression(node.condition, sf),
			node.questionToken,
			cloneExpression(node.whenTrue, sf),
			node.colonToken,
			cloneExpression(node.whenFalse, sf),
		);
	}
	else if(ts.isBinaryExpression(node)) {
		result = ts.factory.createBinaryExpression(
			cloneExpression(node.left, sf),
			node.operatorToken,
			cloneExpression(node.right, sf),
		);
	}

	return copyAllComments(node, result, sf);
}
