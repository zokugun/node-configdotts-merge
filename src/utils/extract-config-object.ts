import * as ts from 'typescript';

export function extractConfigObject(exportDefault: ts.ExportAssignment | undefined): ts.ObjectLiteralExpression | undefined {
	if(!exportDefault) {
		return undefined;
	}

	// export default { ... }
	if(ts.isObjectLiteralExpression(exportDefault.expression)) {
		return exportDefault.expression;
	}

	// export default defineConfig(...)
	if(
		ts.isCallExpression(exportDefault.expression)
		&& ts.isIdentifier(exportDefault.expression.expression)
		&& exportDefault.expression.expression.text === 'defineConfig'
	) {
		const argument = exportDefault.expression.arguments[0];
		if(!argument) {
			return undefined;
		}

		// If argument is object literal
		if(ts.isObjectLiteralExpression(argument)) {
			return argument;
		}

		// If argument is an arrow function or function expression
		if(
			ts.isArrowFunction(argument)
			|| ts.isFunctionExpression(argument)
		) {
			// If concise: () => ({ ... }) or async () => ({ ... })
			if(ts.isObjectLiteralExpression(argument.body)) {
				return argument.body;
			}

			// If concise: () => ({ ... }) or async () => ({ ... }) with parentheses
			if(ts.isParenthesizedExpression(argument.body) && ts.isObjectLiteralExpression(argument.body.expression)) {
				return argument.body.expression;
			}

			// If function body is a block: look for return ...
			if(ts.isBlock(argument.body)) {
				for(const stmt of argument.body.statements) {
					if(
						ts.isReturnStatement(stmt)
						&& stmt.expression
					) {
						// Direct return { ... }
						if(ts.isObjectLiteralExpression(stmt.expression)) {
							return stmt.expression;
						}

						// Return Promise.resolve({ ... })
						if(
							ts.isCallExpression(stmt.expression)
							&& ts.isPropertyAccessExpression(stmt.expression.expression)
							&& stmt.expression.expression.name.text === 'resolve'
							&& stmt.expression.arguments.length === 1
							&& ts.isObjectLiteralExpression(stmt.expression.arguments[0])
						) {
							return stmt.expression.arguments[0];
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
							return stmt.expression.expression.arguments[0];
						}
					}
				}
			}
		}
	}

	return undefined;
}
