import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * Flat config de ESLint 10: reglas base + typescript-eslint con
 * type-checking sobre src y eslint-config-prettier al final para ceder todo
 * el formato a Prettier.
 *
 * @remarks
 * Los ficheros JS de tooling (este config) quedan fuera del type-checking
 * porque no pertenecen al tsconfig del proyecto; vite.config.ts entra por
 * allowDefaultProject. require-await queda desactivada: los contratos de
 * Fastify (FastifyPluginAsync, hooks) exigen funciones async aunque el
 * cuerpo no tenga await. Los argumentos con prefijo _ son descartes
 * intencionados de firma.
 */
export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', 'certs/', '**/.*/'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier
);
