import * as ts from 'typescript';
import { copyLeadingComments } from './copy-leading-comments.js';

function addImport(imp: ts.ImportDeclaration, sourceFile: ts.SourceFile, merged: Record<string, ts.ImportDeclaration>, sf1: ts.SourceFile) {
	const key = (imp.moduleSpecifier as ts.StringLiteral).text;
	const moduleSpecifier = ts.isStringLiteral(imp.moduleSpecifier) ? ts.factory.createStringLiteral(imp.moduleSpecifier.text) : imp.moduleSpecifier;

	if(!merged[key]) {
		const newImport = ts.factory.createImportDeclaration(
			imp.modifiers,
			imp.importClause,
			moduleSpecifier,
		);

		merged[key] = copyLeadingComments(imp, newImport, sourceFile);

		return;
	}

	// Merge named bindings if needed
	const existing = merged[key];
	if(
		imp.importClause?.namedBindings
		&& ts.isNamedImports(imp.importClause.namedBindings)
		&& existing.importClause?.namedBindings
		&& ts.isNamedImports(existing.importClause.namedBindings)
	) {
		// Merge named imports
		const allElements = [
			...existing.importClause.namedBindings.elements,
			...imp.importClause.namedBindings.elements,
		];

		// Remove duplicates by property name
		const uniqueMap = new Map<string, ts.ImportSpecifier>();
		for(const element of allElements) {
			uniqueMap.set(element.name.text, element);
		}

		const mergedNamedImports = ts.factory.createNamedImports([...uniqueMap.values()]);
		const newImport = ts.factory.updateImportDeclaration(
			existing,
			existing.modifiers,
			ts.factory.updateImportClause(
				existing.importClause,
				existing.importClause.isTypeOnly,
				existing.importClause.name,
				mergedNamedImports,
			),
			existing.moduleSpecifier,
			existing.assertClause,
		);

		// Merge comments from both
		copyLeadingComments(imp, newImport, sourceFile);
		copyLeadingComments(existing, newImport, sf1);
		merged[key] = newImport;
	}
	// else: keep the first occurrence (for default, namespace, or type-only imports)
}

export function mergeImports(imports1: ts.ImportDeclaration[], imports2: ts.ImportDeclaration[], sf1: ts.SourceFile, sf2: ts.SourceFile): ts.ImportDeclaration[] {
	const merged: Record<string, ts.ImportDeclaration> = {};

	for(const imp of imports1) {
		addImport(imp, sf1, merged, sf1);
	}

	for(const imp of imports2) {
		addImport(imp, sf2, merged, sf1);
	}

	return Object.values(merged);
}
