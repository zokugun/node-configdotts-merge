import * as ts from 'typescript';
import { cloneExpression } from './clone-expression.js';
import { clonePropertyName } from './clone-property-name.js';
import { copyAllComments } from './copy-all-comments.js';

export function clonePropertyElement(element: ts.ObjectLiteralElementLike, sf: ts.SourceFile): ts.ObjectLiteralElementLike {
	if(ts.isPropertyAssignment(element)) {
		return copyAllComments(
			element,
			ts.factory.createPropertyAssignment(
				clonePropertyName(element.name, sf),
				cloneExpression(element.initializer, sf),
			),
			sf,
		);
	}

	if(ts.isShorthandPropertyAssignment(element)) {
		let name: ts.Identifier;
		if(ts.isIdentifier(element.name)) {
			name = element.name;
		}
		else if(ts.isStringLiteral(element.name)) {
			name = ts.factory.createIdentifier(element.name);
		}
		else {
			throw new Error('Unsupported shorthand property name type');
		}

		return copyAllComments(
			element,
			ts.factory.createShorthandPropertyAssignment(
				name,
				element.objectAssignmentInitializer ? cloneExpression(element.objectAssignmentInitializer, sf) : undefined,
			),
			sf,
		);
	}

	if(ts.isSpreadAssignment(element)) {
		return copyAllComments(
			element,
			ts.factory.createSpreadAssignment(cloneExpression(element.expression, sf)),
			sf,
		);
	}

	// Add more cases for MethodDeclaration, GetAccessor, SetAccessor, etc.
	return copyAllComments(element, element, sf);
}
