import { addSyntheticTrailingComment, getTrailingCommentRanges, type Node, type SourceFile } from 'typescript';

export function copyTrailingComments<T extends Node>(from: Node, to: T, sourceFile: SourceFile): T {
	const comments = getTrailingCommentRanges(sourceFile.getFullText(), from.end);
	if(comments) {
		for(const c of comments) {
			const commentText = sourceFile.getFullText().slice(c.pos, c.end);
			const text = commentText.replace(/^\/\//, '').replace(/^\/\*/, '').replace(/\*\/$/, '');

			addSyntheticTrailingComment(to, c.kind, text, c.hasTrailingNewLine);
		}
	}

	return to;
}
