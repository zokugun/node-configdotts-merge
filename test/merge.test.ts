import path from 'node:path';
import fse from '@zokugun/fs-extra-plus/async';
import { expect, it } from 'vitest';
import YAML from 'yaml';
import { merge } from '../src/index.js';

function prepare(file: string) {
	const name = path.basename(file).slice(0, path.basename(file).lastIndexOf('.'));

	it(name, async () => {
		const filePath = path.join(path.dirname(file), `${name}.yml`);
		const readResult = await fse.readFile(filePath, 'utf8');
		expect(readResult.fails).to.be.false;

		const { file1, file2, output } = YAML.parse(readResult.value!) as { file1: string; file2: string; output: string };
		const result = merge(file1, file2);

		try {
			expect(output).to.eql(result);
		}
		catch (error: unknown) {
			console.log(result);

			throw error;
		}
	});
}

const walkResult = await fse.walk(path.join(__dirname, 'fixtures'), {
	absolute: true,
	onlyFiles: true,
	filter: (item) => item.path.endsWith('.yml'),
});

if(walkResult.fails) {
	throw walkResult.error;
}
else {
	for await (const file of walkResult.value) {
		if(file.fails) {
			throw file.error;
		}
		else {
			prepare(file.value.path);
		}
	}
}
