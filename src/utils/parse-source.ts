import { createSourceFile, ScriptKind, ScriptTarget, type SourceFile } from 'typescript';

export function parseSource(source: string): SourceFile {
	return createSourceFile('main.ts', source, ScriptTarget.Latest, true, ScriptKind.TS);
}
