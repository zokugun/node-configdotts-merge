import type ts from 'typescript';

export function isSingleQuoted(node: ts.StringLiteral, sf: ts.SourceFile): boolean {
	const singleQuote = (node as ts.StringLiteral & { singleQuote?: boolean }).singleQuote;

	if(typeof singleQuote === 'boolean') {
		return singleQuote;
	}

	const text = sf.text.slice(node.getStart(sf), node.getEnd());

	return text.startsWith('\'');
}
