import ts from 'typescript';
import { addEmptyLine } from './utils/add-empty-line.js';
import { copyAllComments } from './utils/copy-all-comments.js';
import { extractConfigObject } from './utils/extract-config-object.js';
import { extractNodes } from './utils/extract-nodes.js';
import { mergeExportCall } from './utils/merge-export-call.js';
import { mergeImports } from './utils/merge-imports.js';
import { mergeObjectLiterals } from './utils/merge-object-literals.js';
import { mergeVariableStatements } from './utils/merge-variable-statements.js';
import { parseSource } from './utils/parse-source.js';

export function merge(source1: string, source2: string): string {
	const sf1 = parseSource(source1);
	const sf2 = parseSource(source2);

	const { imports: imp1, statements: statements1, exportDefault: exportDefault1 } = extractNodes(sf1);
	const { imports: imp2, statements: statements2, exportDefault: exportDefault2 } = extractNodes(sf2);

	// Merge imports and variables
	const mergedImports = mergeImports(imp1, imp2, sf1, sf2);

	// Merge config objects
	const { config: config1, exportCall: exportCall1, variableStatement: variableStatement1 } = extractConfigObject(exportDefault1, statements1);
	const { config: config2, exportCall: exportCall2, variableStatement: variableStatement2 } = extractConfigObject(exportDefault2, statements2);

	if(!config1 || !config2) {
		throw new Error('Could not find config objects.');
	}

	const mergedConfig = mergeObjectLiterals(config1, config2, sf1, sf2);

	// Decide how to wrap the export default (call, function, or bare object)
	let exportAssignment: ts.ExportAssignment;

	const exportCall = exportCall1 ?? exportCall2;

	if(exportCall) {
		const newDefineConfigCall = mergeExportCall(exportCall, mergedConfig);

		exportAssignment = ts.factory.createExportAssignment(
			undefined,
			false,
			newDefineConfigCall,
		);
	}
	else if(variableStatement1) {
		exportAssignment = exportDefault1!;
	}
	else if(variableStatement2) {
		exportAssignment = exportDefault2!;
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
		if(exportAssignment === exportDefault1) {
			for(const statement of statements1) {
				if(statement === variableStatement1) {
					mergedStatements.push(mergeVariableStatements(variableStatement1, config1, sf1, variableStatement2, sf2, mergedConfig));
				}
				else {
					mergedStatements.push(copyAllComments(statement, statement, sf1));
				}
			}
		}
		else {
			for(const statement of statements1) {
				if(statement !== variableStatement1) {
					mergedStatements.push(copyAllComments(statement, statement, sf1));
				}
			}
		}

		if(exportAssignment === exportDefault2) {
			for(const statement of statements2) {
				if(statement === variableStatement2) {
					mergedStatements.push(mergeVariableStatements(variableStatement2, config2, sf2, variableStatement1, sf1, mergedConfig));
				}
				else {
					mergedStatements.push(copyAllComments(statement, statement, sf2));
				}
			}
		}
		else {
			for(const statement of statements2) {
				if(statement !== variableStatement2) {
					mergedStatements.push(copyAllComments(statement, statement, sf2));
				}
			}
		}

		mergedStatements.push(addEmptyLine());
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
