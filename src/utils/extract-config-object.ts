import ts from 'typescript';

export function extractConfigObject(exportExpression: ts.Expression | undefined, statements: ts.Statement[]): { config?: ts.ObjectLiteralExpression; exportCall?: ts.CallExpression; variableStatement?: ts.VariableStatement } {
	if(!exportExpression) {
		return {};
	}

	// export default { ... }
	if(ts.isObjectLiteralExpression(exportExpression)) {
		return { config: exportExpression };
	}

	// export default defineConfig(...)
	if(ts.isCallExpression(exportExpression) && ts.isIdentifier(exportExpression.expression) && exportExpression.expression.text === 'defineConfig') {
		const argument = exportExpression.arguments[0];
		if(!argument) {
			return {};
		}

		// If argument is object literal
		if(ts.isObjectLiteralExpression(argument)) {
			return { config: argument, exportCall: exportExpression };
		}

		// If argument is an arrow function or function expression
		if(ts.isArrowFunction(argument)	|| ts.isFunctionExpression(argument)) {
			// If concise: () => ({ ... }) or async () => ({ ... })
			if(ts.isObjectLiteralExpression(argument.body)) {
				return { config: argument.body, exportCall: exportExpression };
			}

			// If concise: () => ({ ... }) or async () => ({ ... }) with parentheses
			if(ts.isParenthesizedExpression(argument.body) && ts.isObjectLiteralExpression(argument.body.expression)) {
				return { config: argument.body.expression, exportCall: exportExpression };
			}

			// If function body is a block: look for return ...
			if(ts.isBlock(argument.body)) {
				for(const stmt of argument.body.statements) {
					if(ts.isReturnStatement(stmt) && stmt.expression) {
						// Direct return { ... }
						if(ts.isObjectLiteralExpression(stmt.expression)) {
							return { config: stmt.expression, exportCall: exportExpression };
						}

						// Return Promise.resolve({ ... })
						if(
							ts.isCallExpression(stmt.expression)
							&& ts.isPropertyAccessExpression(stmt.expression.expression)
							&& stmt.expression.expression.name.text === 'resolve'
							&& stmt.expression.arguments.length === 1
							&& ts.isObjectLiteralExpression(stmt.expression.arguments[0])
						) {
							return { config: stmt.expression.arguments[0], exportCall: exportExpression };
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
							return { config: stmt.expression.expression.arguments[0], exportCall: exportExpression };
						}
					}
				}
			}
		}
	}

	if(ts.isIdentifier(exportExpression)) {
		const name = exportExpression.escapedText;

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
