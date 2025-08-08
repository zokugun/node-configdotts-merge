[@zokugun/configdotts-merge](https://github.com/zokugun/node-configdotts-merge)
======================================================================

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@zokugun/configdotts-merge.svg?colorB=green)](https://www.npmjs.com/package/@zokugun/configdotts-merge)
[![Donation](https://img.shields.io/badge/donate-ko--fi-green)](https://ko-fi.com/daiyam)
[![Donation](https://img.shields.io/badge/donate-liberapay-green)](https://liberapay.com/daiyam/donate)
[![Donation](https://img.shields.io/badge/donate-paypal-green)](https://paypal.me/daiyam99)

**@zokugun/configdotts-merge** is a TypeScript library for merging multiple configuration files (such as Vite, ESLint, Prettier, etc.) written in `.ts`, **while preserving comments**.

- Supports `export default {...}`, `export default anyFunction({...})`, and function/arrow-based configs.
- Preserves comments.
- Uses TypeScript’s AST for safe, reliable merging.

Features
--------

- **Comment Preservation:** No more lost documentation in your config files!
- **Smart Merging:** Last value wins for conflicts; merges arrays and objects intelligently.
- **TypeScript Native:** Built on TypeScript’s AST for perfect `.ts` compatibility.
- **Supports Major Tools:** Vite, ESLint, Prettier, Tailwind, and more.

Getting Started
---------------

With [node](http://nodejs.org) previously installed:

	npm install @zokugun/configdotts-merge

```ts
import { readFileSync } from 'fs';
import { merge } from '@zokugun/configdotts-merge';

const baseConfig = readFileSync('vite.base.config.ts', 'utf-8');
const siteConfig = readFileSync('vite.site.config.ts', 'utf-8');
const mergedConfig = merge(baseConfig, siteConfig);
console.log(mergedConfig); // Merged config, comments intact!
```

Donations
---------

Support this project by becoming a financial contributor.

<table>
    <tr>
        <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_kofi.png" alt="Ko-fi" width="80px" height="80px"></td>
        <td><a href="https://ko-fi.com/daiyam" target="_blank">ko-fi.com/daiyam</a></td>
    </tr>
    <tr>
        <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_liberapay.png" alt="Liberapay" width="80px" height="80px"></td>
        <td><a href="https://liberapay.com/daiyam/donate" target="_blank">liberapay.com/daiyam/donate</a></td>
    </tr>
    <tr>
        <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_paypal.png" alt="PayPal" width="80px" height="80px"></td>
        <td><a href="https://paypal.me/daiyam99" target="_blank">paypal.me/daiyam99</a></td>
    </tr>
</table>

License
-------

Copyright &copy; 2025-present Baptiste Augrain

Licensed under the [MIT license](https://opensource.org/licenses/MIT).
