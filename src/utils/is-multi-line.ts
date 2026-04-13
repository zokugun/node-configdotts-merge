import ts from 'typescript';

export function isMultiLine(node: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression, sourceFile: ts.SourceFile): boolean {
	const elements = ts.isObjectLiteralExpression(node)	? node.properties : (node).elements;
	const hasRealNodePosition = node.pos >= 0 && node.end >= 0;

	if(elements.length === 0) {
		return false;
	}

	// Synthesized nodes can have no position information.
	if(!hasRealNodePosition) {
		const multiLine = (node as ts.ObjectLiteralExpression & { multiLine?: boolean }).multiLine;

		if(typeof multiLine === 'boolean') {
			return multiLine;
		}

		return elements.length > 1;
	}

	const previous: ts.Node = elements[0];
	let previousLine = sourceFile.getLineAndCharacterOfPosition(previous.getFullStart()).line;

	if(elements.length === 1) {
		return previousLine !== sourceFile.getLineAndCharacterOfPosition(previous.getEnd()).line;
	}

	for(let i = 1; i < elements.length; i++) {
		const current = elements[i];
		const currentLine = sourceFile.getLineAndCharacterOfPosition(current.getStart(sourceFile)).line;
		if(currentLine !== previousLine) {
			return true;
		}

		previousLine = currentLine;
	}

	return false;
}
