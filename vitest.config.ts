import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['packages/**/*.{test,spec}.{ts,tsx}', 'packages/**/*.property.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
            exclude: [
                'packages/*/src/**/*.test.ts',
                'packages/*/src/**/*.test.tsx',
                'packages/*/src/**/*.property.ts',
                'packages/*/src/**/index.ts',
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
            },
        },
    },
});
