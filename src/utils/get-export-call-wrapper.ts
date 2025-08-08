import * as ts from 'typescript';

export function getExportCallWrapper(exportDefault: ts.ExportAssignment | undefined): ts.CallExpression | undefined {
	if(!exportDefault) {
		return undefined;
	}

	if(ts.isCallExpression(exportDefault.expression) && ts.isIdentifier(exportDefault.expression.expression)) {
		return exportDefault.expression;
	}

	return undefined;
}
