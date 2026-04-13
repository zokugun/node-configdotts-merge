import ts from 'typescript';
import { copyAllComments } from './copy-all-comments.js';

export function mergeVariableStatements(variableStatement1: ts.VariableStatement, config1: ts.ObjectLiteralExpression, sourceFile1: ts.SourceFile, variableStatement2: ts.VariableStatement | undefined, sourceFile2: ts.SourceFile, mergedConfig: ts.ObjectLiteralExpression): ts.Statement {
	const declarations = variableStatement1.declarationList.declarations.map((declaration) => {
		if(declaration.initializer === config1) {
			return ts.factory.updateVariableDeclaration(
				declaration,
				declaration.name,
				declaration.exclamationToken,
				declaration.type,
				mergedConfig,
			);
		}

		return declaration;
	});

	let mergedVariableStatement = ts.factory.updateVariableStatement(
		variableStatement1,
		variableStatement1.modifiers,
		ts.factory.updateVariableDeclarationList(variableStatement1.declarationList, declarations),
	);

	mergedVariableStatement = copyAllComments(variableStatement1, mergedVariableStatement, sourceFile1);
	mergedVariableStatement = copyAllComments(variableStatement2!, mergedVariableStatement, sourceFile2);

	return mergedVariableStatement;
}
