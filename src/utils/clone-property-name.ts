import * as ts from 'typescript';
import { cloneExpression } from './clone-expression.js';

export function clonePropertyName(node: ts.PropertyName, sf: ts.SourceFile): ts.PropertyName {
	if(ts.isIdentifier(node)) {
		return ts.factory.createIdentifier(node.text);
	}

	if(ts.isStringLiteral(node)) {
		return ts.factory.createStringLiteral(node.text);
	}

	if(ts.isNumericLiteral(node)) {
		return ts.factory.createNumericLiteral(node.text);
	}

	if(ts.isNoSubstitutionTemplateLiteral(node)) {
		return ts.factory.createNoSubstitutionTemplateLiteral(node.text);
	}

	if(ts.isComputedPropertyName(node)) {
		return ts.factory.createComputedPropertyName(cloneExpression(node.expression, sf));
	}

	if(ts.isPrivateIdentifier(node)) {
		return ts.factory.createPrivateIdentifier(node.text);
	}

	if(ts.isBigIntLiteral?.(node)) {
		return ts.factory.createBigIntLiteral(node.text);
	}

	return node;
}
