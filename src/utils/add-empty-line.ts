import ts from 'typescript';

export function addEmptyLine(): ts.EmptyStatement {
	const emptyStmt = ts.factory.createEmptyStatement();
	ts.addSyntheticLeadingComment(emptyStmt, ts.SyntaxKind.MultiLineCommentTrivia, '', true);
	return emptyStmt;
}
