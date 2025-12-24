import * as ts from 'typescript';

export function mergeExportCall(exportCall: ts.CallExpression, mergedConfig: ts.ObjectLiteralExpression): ts.CallExpression {
	// If a function was called with an object, replace with merged object
	const argument = exportCall.arguments[0];

	let newArgument: ts.Expression;

	if(ts.isObjectLiteralExpression(argument)) {
		newArgument = mergedConfig;
	}
	else if(ts.isArrowFunction(argument)) {
		if(ts.isBlock(argument.body)) {
			// Replace return object
			const newStatements = argument.body.statements.map((stmt) => {
				if(
					ts.isReturnStatement(stmt)
					&& stmt.expression
					&& ts.isObjectLiteralExpression(stmt.expression)
				) {
					return ts.factory.createReturnStatement(mergedConfig);
				}

				return stmt;
			});
			newArgument = ts.factory.createArrowFunction(
				argument.modifiers,
				argument.typeParameters,
				argument.parameters,
				argument.type,
				argument.equalsGreaterThanToken,
				ts.factory.createBlock(newStatements, true),
			);
		}
		else if(ts.isObjectLiteralExpression(argument.body)) {
			newArgument = ts.factory.createArrowFunction(
				argument.modifiers,
				argument.typeParameters,
				argument.parameters,
				argument.type,
				argument.equalsGreaterThanToken,
				mergedConfig,
			);
		}
		else if(ts.isParenthesizedExpression(argument.body) && ts.isObjectLiteralExpression(argument.body.expression)) {
			newArgument = ts.factory.createArrowFunction(
				argument.modifiers,
				argument.typeParameters,
				argument.parameters,
				argument.type,
				argument.equalsGreaterThanToken,
				mergedConfig,
			);
		}
		else {
			newArgument = argument;
		}
	}
	else if(ts.isFunctionExpression(argument)) {
		if(ts.isBlock(argument.body)) {
			const newStatements = argument.body.statements.map((stmt) => {
				if(
					ts.isReturnStatement(stmt)
					&& stmt.expression
					&& ts.isObjectLiteralExpression(stmt.expression)
				) {
					return ts.factory.createReturnStatement(mergedConfig);
				}

				return stmt;
			});
			newArgument = ts.factory.createFunctionExpression(
				argument.modifiers,
				argument.asteriskToken,
				argument.name,
				argument.typeParameters,
				argument.parameters,
				argument.type,
				ts.factory.createBlock(newStatements, true),
			);
		}
		else {
			newArgument = argument;
		}
	}
	else {
		newArgument = mergedConfig;
	}

	const newDefineConfigCall = ts.factory.createCallExpression(
		exportCall.expression,
		exportCall.typeArguments,
		[newArgument],
	);

	return newDefineConfigCall;
}
