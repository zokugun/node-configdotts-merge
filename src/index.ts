import ts from 'typescript';
import { copyAllComments } from './utils/copy-all-comments.js';
import { extractConfigObject } from './utils/extract-config-object.js';
import { extractNodes } from './utils/extract-nodes.js';
import { getExportCallWrapper } from './utils/get-export-call-wrapper.js';
import { mergeImports } from './utils/merge-imports.js';
import { mergeObjectLiterals } from './utils/merge-object-literals.js';
import { parseSource } from './utils/parse-source.js';

export function merge(source1: string, source2: string): string {
	const sf1 = parseSource(source1);
	const sf2 = parseSource(source2);

	const { imports: imp1, statements: statements1, exportDefault: exportDefault1 } = extractNodes(sf1);
	const { imports: imp2, statements: statements2, exportDefault: exportDefault2 } = extractNodes(sf2);

	// Merge imports and variables
	const mergedImports = mergeImports(imp1, imp2, sf1, sf2);

	// Merge config objects
	const config1 = extractConfigObject(exportDefault1);
	const config2 = extractConfigObject(exportDefault2);

	if(!config1 || !config2) {
		throw new Error('Could not find config objects.');
	}

	const mergedConfig = mergeObjectLiterals(config1, config2, sf1, sf2);

	// Decide how to wrap the export default (call, function, or bare object)
	let exportAssignment: ts.ExportAssignment;

	const exportCall = getExportCallWrapper(exportDefault1) ?? getExportCallWrapper(exportDefault2);

	if(exportCall) {
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
		exportAssignment = ts.factory.createExportAssignment(
			undefined,
			false,
			newDefineConfigCall,
		);
	}
	else {
		exportAssignment = ts.factory.createExportAssignment(
			undefined,
			false,
			mergedConfig,
		);
	}

	exportAssignment = copyAllComments(exportDefault1!, exportAssignment, sf1);
	exportAssignment = copyAllComments(exportDefault2!, exportAssignment, sf2);

	// Assemble new source file
	const mergedStatements: ts.Statement[] = [];

	if(mergedImports.length > 0) {
		mergedStatements.push(...mergedImports, addEmptyLine());
	}

	if(statements1.length > 0 || statements2.length > 0) {
		mergedStatements.push(
			...statements1.map((stmt) => copyAllComments(stmt, stmt, sf1)),
			...statements2.map((stmt) => copyAllComments(stmt, stmt, sf2)),
			addEmptyLine(),
		);
	}

	mergedStatements.push(exportAssignment);

	const mergedSourceFile = ts.factory.createSourceFile(
		mergedStatements,
		ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
		ts.NodeFlags.None,
	);

	// Print with comments
	const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false });

	let output = printer.printFile(mergedSourceFile);

	output = output.replaceAll(/^\s*\/\*\s*\*\/\s*\n;\n/gm, '\n');

	return output;
}

function addEmptyLine(): ts.EmptyStatement {
	const emptyStmt = ts.factory.createEmptyStatement();
	ts.addSyntheticLeadingComment(emptyStmt, ts.SyntaxKind.MultiLineCommentTrivia, '', true);
	return emptyStmt;
}
