import { addSyntheticLeadingComment, getLeadingCommentRanges, type Node, type SourceFile } from 'typescript';

function hasRealPosition(node: Node): boolean {
	return node.pos >= 0 && node.end >= 0;
}

export function copyLeadingComments<T extends Node>(from: Node, to: T, sourceFile: SourceFile): T {
	if(!hasRealPosition(from)) {
		return to;
	}

	const comments = getLeadingCommentRanges(sourceFile.getFullText(), from.getFullStart());

	if(comments) {
		for(const c of comments) {
			const commentText = sourceFile.getFullText().slice(c.pos, c.end);
			const text = commentText.replace(/^\/\//, '').replace(/^\/\*/, '').replace(/\*\/$/, '');

			addSyntheticLeadingComment(to, c.kind, text, c.hasTrailingNewLine);
		}
	}

	return to;
}
