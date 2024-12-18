import commonjs from '@rollup/plugin-commonjs';

export default {
	input: 'lib/lightstreamer-adapter-module.js',
	output: {
		file: 'index.mjs',
		format: 'es'
	},
	external: ['events', 'util', 'stream'],
	plugins: [commonjs()]
};