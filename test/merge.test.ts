import fs from 'fs';
import path from 'path';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import klaw from 'klaw-sync';
import YAML from 'yaml';
import { merge } from '../src/index.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
chai.use(chaiAsPromised);

describe('merge', async () => {
	function prepare(file: string) {
		const name = path.basename(file).slice(0, path.basename(file).lastIndexOf('.'));

		it(name, () => {
			const { file1, file2, output } = YAML.parse(fs.readFileSync(path.join(path.dirname(file), `${name}.yml`), 'utf8')) as { file1: string; file2: string; output: string };
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

	const files = klaw(path.join(__dirname, '..', '..', 'test', 'fixtures'), {
		nodir: true,
		traverseAll: true,
		filter: (item) => item.path.endsWith('.yml'),
	});

	for(const file of files) {
		prepare(file.path);
	}
});
