import * as ts from 'typescript';

export function extractConfigObject(exportDefault: ts.ExportAssignment | undefined, statements: ts.Statement[]): { config?: ts.ObjectLiteralExpression; exportCall?: ts.CallExpression; variableStatement?: ts.VariableStatement } {
	if(!exportDefault) {
		return {};
	}

	// export default { ... }
	if(ts.isObjectLiteralExpression(exportDefault.expression)) {
		return { config: exportDefault.expression };
	}

	// export default defineConfig(...)
	if(ts.isCallExpression(exportDefault.expression) && ts.isIdentifier(exportDefault.expression.expression) && exportDefault.expression.expression.text === 'defineConfig') {
		const argument = exportDefault.expression.arguments[0];
		if(!argument) {
			return {};
		}

		// If argument is object literal
		if(ts.isObjectLiteralExpression(argument)) {
			return { config: argument, exportCall: exportDefault.expression };
		}

		// If argument is an arrow function or function expression
		if(ts.isArrowFunction(argument)	|| ts.isFunctionExpression(argument)) {
			// If concise: () => ({ ... }) or async () => ({ ... })
			if(ts.isObjectLiteralExpression(argument.body)) {
				return { config: argument.body, exportCall: exportDefault.expression };
			}

			// If concise: () => ({ ... }) or async () => ({ ... }) with parentheses
			if(ts.isParenthesizedExpression(argument.body) && ts.isObjectLiteralExpression(argument.body.expression)) {
				return { config: argument.body.expression, exportCall: exportDefault.expression };
			}

			// If function body is a block: look for return ...
			if(ts.isBlock(argument.body)) {
				for(const stmt of argument.body.statements) {
					if(ts.isReturnStatement(stmt) && stmt.expression) {
						// Direct return { ... }
						if(ts.isObjectLiteralExpression(stmt.expression)) {
							return { config: stmt.expression, exportCall: exportDefault.expression };
						}

						// Return Promise.resolve({ ... })
						if(
							ts.isCallExpression(stmt.expression)
							&& ts.isPropertyAccessExpression(stmt.expression.expression)
							&& stmt.expression.expression.name.text === 'resolve'
							&& stmt.expression.arguments.length === 1
							&& ts.isObjectLiteralExpression(stmt.expression.arguments[0])
						) {
							return { config: stmt.expression.arguments[0], exportCall: exportDefault.expression };
						}

						// Return await Promise.resolve({ ... })
						if(
							ts.isAwaitExpression(stmt.expression)
							&& ts.isCallExpression(stmt.expression.expression)
							&& ts.isPropertyAccessExpression(stmt.expression.expression.expression)
							&& stmt.expression.expression.expression.name.text === 'resolve'
							&& stmt.expression.expression.arguments.length === 1
							&& ts.isObjectLiteralExpression(stmt.expression.expression.arguments[0])
						) {
							return { config: stmt.expression.expression.arguments[0], exportCall: exportDefault.expression };
						}
					}
				}
			}
		}
	}

	if(ts.isIdentifier(exportDefault.expression)) {
		const name = exportDefault.expression.escapedText;

		for(const statement of statements) {
			if(ts.isVariableStatement(statement) && ts.isVariableDeclarationList(statement.declarationList)) {
				for(const declaration of statement.declarationList.declarations) {
					if(
						ts.isVariableDeclaration(declaration)
						&& ts.isIdentifier(declaration.name)
						&& declaration.name.escapedText === name
						&& declaration.initializer
						&& ts.isObjectLiteralExpression(declaration.initializer)
					) {
						return { config: declaration.initializer, variableStatement: statement };
					}
				}
			}
		}
	}

	return {};
}
