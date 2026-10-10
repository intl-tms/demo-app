// Stands in for `src/i18n/navigation` in stories. A story has no route, and
// Storybook 10.6's App Router mock does not support Next.js 16.4 yet
// (`useRouter` reads a layout context field the mock does not provide), so
// components get these instead of the real next-intl navigation.
export const usePathname = () => '/';

export const useRouter = () => ({
  push() {},
  replace() {},
  prefetch() {},
  back() {},
  forward() {},
  refresh() {}
});

export const getPathname = ({href}: {href: string}) => href;

export function redirect(): never {
  throw new Error('redirect() is not available in a story');
}

export const Link = 'a';
