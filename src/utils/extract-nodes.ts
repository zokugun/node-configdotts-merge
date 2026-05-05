import ts from 'typescript';

export function extractNodes(sf: ts.SourceFile) {
	const imports: ts.ImportDeclaration[] = [];
	const statements: ts.Statement[] = [];
	let exportDefault: ts.ExportAssignment | undefined;
	let moduleExports: ts.ExpressionStatement | undefined;

	for(const stmt of sf.statements) {
		if(ts.isImportDeclaration(stmt)) {
			imports.push(stmt);

			continue;
		}

		if(ts.isExportAssignment(stmt)) {
			exportDefault = stmt;

			continue;
		}

		if(ts.isExpressionStatement(stmt) && ts.isBinaryExpression(stmt.expression) && stmt.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
			const { left } = stmt.expression;

			if(ts.isPropertyAccessExpression(left) && ts.isIdentifier(left.expression) && left.expression.text === 'module' && left.name.text === 'exports') {
				moduleExports = stmt;

				continue;
			}
		}

		statements.push(stmt);
	}

	return { imports, statements, exportDefault, moduleExports };
}
