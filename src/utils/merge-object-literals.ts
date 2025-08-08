import * as ts from 'typescript';
import { cloneExpression } from './clone-expression.js';
import { clonePropertyElement } from './clone-property-element.js';
import { copyAllComments } from './copy-all-comments.js';

export function mergeObjectLiterals(object1: ts.ObjectLiteralExpression, object2: ts.ObjectLiteralExpression, sf1: ts.SourceFile, sf2: ts.SourceFile): ts.ObjectLiteralExpression {
	const mergedProperties: ts.ObjectLiteralElementLike[] = [];

	// Build a map for quick lookup: property name -> (index, property)
	const map1 = new Map<string, { index: number; property: ts.PropertyAssignment }>();

	// Add properties from first object
	for(const [index, property] of object1.properties.entries()) {
		if(!ts.isPropertyAssignment(property)) {
			continue;
		}

		const newProperty = clonePropertyElement(property, sf1);

		mergedProperties.push(newProperty);

		if(ts.isPropertyAssignment(property)) {
			let key: string | undefined;

			if(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) {
				key = property.name.text;
			}

			if(key) {
				map1.set(key, { index, property });
			}
		}
	}

	// Add properties from second object, giving priority to second object's values
	for(const property of object2.properties) {
		if(!ts.isPropertyAssignment(property)) {
			continue;
		}

		if(!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name)) {
			continue;
		}

		if(map1.has(property.name.text)) {
			let { index, property: existingProperty } = map1.get(property.name.text)!;

			if(ts.isObjectLiteralExpression(existingProperty.initializer) && ts.isObjectLiteralExpression(property.initializer)) {
				(existingProperty as any).initializer = mergeObjectLiterals(existingProperty.initializer, property.initializer, sf1, sf2);
			}
			else if(ts.isArrayLiteralExpression(existingProperty.initializer) && ts.isArrayLiteralExpression(property.initializer)) {
				const elements1 = existingProperty.initializer.elements.map((item) => cloneExpression(item, sf1));
				const elements2 = property.initializer.elements.map((item) => cloneExpression(item, sf2));
				const elements = elements1.concat(elements2);

				(existingProperty as any).initializer = ts.factory.createArrayLiteralExpression(elements);
			}
			else {
				(existingProperty as any).initializer = property.initializer;
			}

			existingProperty = copyAllComments(property, existingProperty, sf1);
			existingProperty = copyAllComments(property, existingProperty, sf2);

			mergedProperties[index] = existingProperty;
		}
		else {
			const newProperty = clonePropertyElement(property, sf2);

			mergedProperties.push(newProperty);
		}
	}

	const mergedObject = ts.factory.createObjectLiteralExpression(mergedProperties, true);

	return mergedObject;
}
