import * as ts from 'typescript';
import { cloneExpression } from './clone-expression.js';
import { clonePropertyElement } from './clone-property-element.js';
import { copyAllComments } from './copy-all-comments.js';

export function mergeObjectLiterals(object1: ts.ObjectLiteralExpression, object2: ts.ObjectLiteralExpression, sf1: ts.SourceFile, sf2: ts.SourceFile): ts.ObjectLiteralExpression {
	const mergedProperties: ts.ObjectLiteralElementLike[] = [];

	// Build a map for quick lookup: property name -> (index, property)
	const map1 = new Map<string, { index: number; property: ts.PropertyAssignment; sourceProperty: ts.PropertyAssignment }>();

	// Add properties from first object
	for(const property of object1.properties) {
		if(!ts.isPropertyAssignment(property)) {
			continue;
		}

		const newProperty = clonePropertyElement(property, sf1);

		mergedProperties.push(newProperty);

		if(ts.isPropertyAssignment(newProperty)) {
			let key: string | undefined;

			if(ts.isIdentifier(newProperty.name) || ts.isStringLiteral(newProperty.name)) {
				key = newProperty.name.text;
			}

			if(key) {
				map1.set(key, { index: mergedProperties.length - 1, property: newProperty, sourceProperty: property });
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
			const { index, property: existingProperty, sourceProperty } = map1.get(property.name.text)!;
			let initializer: ts.Expression;

			if(ts.isObjectLiteralExpression(existingProperty.initializer) && ts.isObjectLiteralExpression(property.initializer)) {
				const sourceInitializer = ts.isObjectLiteralExpression(sourceProperty.initializer)
					? sourceProperty.initializer
					: existingProperty.initializer;

				initializer = mergeObjectLiterals(sourceInitializer, property.initializer, sf1, sf2);
			}
			else if(ts.isArrayLiteralExpression(existingProperty.initializer) && ts.isArrayLiteralExpression(property.initializer)) {
				const elements1 = existingProperty.initializer.elements.map((item) => cloneExpression(item, sf1));
				const elements2 = property.initializer.elements.map((item) => cloneExpression(item, sf2));

				initializer = ts.factory.createArrayLiteralExpression(elements1.concat(elements2));
			}
			else {
				initializer = cloneExpression(property.initializer, sf2);
			}

			let updatedProperty = ts.factory.updatePropertyAssignment(
				existingProperty,
				existingProperty.name,
				initializer,
			);

			updatedProperty = copyAllComments(property, updatedProperty, sf2);

			mergedProperties[index] = updatedProperty;
			map1.set(property.name.text, { index, property: updatedProperty, sourceProperty });
		}
		else {
			const newProperty = clonePropertyElement(property, sf2);

			mergedProperties.push(newProperty);
		}
	}

	const mergedObject = ts.factory.createObjectLiteralExpression(mergedProperties, true);
	const keys1 = getPropertyKeys(object1);
	const keys2 = getPropertyKeys(object2);
	const sameKeys = keys1.length === keys2.length && keys1.every((key, i) => key === keys2[i]);

	if(sameKeys && hasTrailingComma(object1, sf1) && hasTrailingComma(object2, sf2)) {
		(mergedObject as ts.ObjectLiteralExpression & { properties: ts.NodeArray<ts.ObjectLiteralElementLike> }).properties = ts.factory.createNodeArray(mergedProperties, true);
	}

	return mergedObject;
}

function getPropertyKeys(node: ts.ObjectLiteralExpression): string[] {
	const keys: string[] = [];

	for(const property of node.properties) {
		if(ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) {
			keys.push(property.name.text);
		}
	}

	keys.sort();

	return keys;
}

function hasTrailingComma(node: ts.ObjectLiteralExpression, sf: ts.SourceFile): boolean {
	if(node.pos < 0 || node.end < 0 || node.properties.length === 0) {
		return node.properties.hasTrailingComma;
	}

	const lastProperty = node.properties.at(-1)!;
	const trailingText = sf.text.slice(lastProperty.end, node.end);

	return trailingText.includes(',');
}
