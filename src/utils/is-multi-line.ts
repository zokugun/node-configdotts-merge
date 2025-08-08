import ts from 'typescript';

export function isMultiLine(node: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression, sourceFile: ts.SourceFile): boolean {
	const elements = ts.isObjectLiteralExpression(node)	? node.properties : (node).elements;

	if(elements.length === 0) {
		return false;
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
