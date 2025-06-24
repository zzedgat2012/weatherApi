export default [
	{
		files: ['src/**/*.ts'],
		ignores: ['dist/', 'node_modules/'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module'
		},
		rules: {
			'no-unused-vars': 'off',
			'no-undef': 'off'
		}
	}
];
