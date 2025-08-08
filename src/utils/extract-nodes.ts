import { type ExportAssignment, type ImportDeclaration, isExportAssignment, isImportDeclaration, type SourceFile, type Statement } from 'typescript';

export function extractNodes(sf: SourceFile) {
	const imports: ImportDeclaration[] = [];
	const statements: Statement[] = [];
	let exportDefault: ExportAssignment | undefined;
	for(const stmt of sf.statements) {
		if(isImportDeclaration(stmt)) {
			imports.push(stmt);
		}
		else if(isExportAssignment(stmt)) {
			exportDefault = stmt;
		}
		else {
			statements.push(stmt);
		}
	}

	return { imports, statements, exportDefault };
}
