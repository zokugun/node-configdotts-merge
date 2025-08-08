import type * as ts from 'typescript';
import { copyLeadingComments } from './copy-leading-comments.js';
import { copyTrailingComments } from './copy-trailing-comments.js';

export function copyAllComments<T extends ts.Node>(from: ts.Node, to: T, sourceFile: ts.SourceFile): T {
	copyLeadingComments(from, to, sourceFile);
	copyTrailingComments(from, to, sourceFile);
	return to;
}
