import {fileURLToPath} from 'node:url';
import type {StorybookConfig} from '@storybook/nextjs-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  staticDirs: ['../public'],
  viteFinal: (vite) => ({
    ...vite,
    plugins: [...(vite.plugins ?? []), tailwindcss()],
    resolve: {
      ...vite.resolve,
      alias: [
        // See navigation.mock.ts
        {
          find: '@/i18n/navigation',
          replacement: fileURLToPath(new URL('./navigation.mock.ts', import.meta.url))
        },
        ...(Array.isArray(vite.resolve?.alias)
          ? vite.resolve.alias
          : Object.entries(vite.resolve?.alias ?? {}).map(([find, replacement]) => ({
              find,
              replacement
            })))
      ]
    },
    server: {
      ...vite.server,
      fs: {
        ...vite.server?.fs,
        // @intl-tms/core is linked from outside the repository root
        allow: [
          ...(vite.server?.fs?.allow ?? []),
          fileURLToPath(new URL('../../..', import.meta.url)),
          fileURLToPath(new URL('../../../../core', import.meta.url))
        ]
      }
    }
  })
};

export default config;
