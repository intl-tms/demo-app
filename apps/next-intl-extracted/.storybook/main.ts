import {fileURLToPath} from 'node:url';
import type {StorybookConfig} from '@storybook/nextjs-vite';
import tailwindcss from '@tailwindcss/vite';
import extractionLoader from 'next-intl/extractor/extractionLoader';
import type {Plugin, TransformResult} from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));

// `next dev` and `next build` compile `useExtracted` calls to message ids
// through the next-intl plugin. Storybook builds with Vite, so the same
// loader runs here; without it a story would render no stored message at all.
function nextIntlExtracted(): Plugin {
  return {
    name: 'next-intl-extracted',
    enforce: 'pre',
    transform(source, id) {
      const file = id.split('?')[0];
      if (!/\.tsx?$/.test(file) || file.includes('/node_modules/')) return null;
      if (!source.includes('useExtracted')) return null;
      return new Promise<TransformResult>((resolve, reject) => {
        extractionLoader.call(
          {
            rootContext: root,
            resourcePath: file,
            sourceMap: true,
            async: () => (error: Error | null, code: string, map?: object) =>
              error ? reject(error) : resolve({code, map: map ?? null} as TransformResult)
          } as never,
          source
        );
      });
    }
  };
}

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  staticDirs: ['../public'],
  viteFinal: (vite) => ({
    ...vite,
    plugins: [...(vite.plugins ?? []), nextIntlExtracted(), tailwindcss()],
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
        allow: [
          ...(vite.server?.fs?.allow ?? []),
          fileURLToPath(new URL('../../..', import.meta.url))
        ]
      }
    }
  })
};

export default config;
