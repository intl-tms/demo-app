import type {Metadata} from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Editors · Intl TMS demo'
};

// The login for Editors has pages of its own, outside the website's locale
// routing, the way an authentication library mounts its own.
export default function EditorsLayout({children}: LayoutProps<'/editors'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
        <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">{children}</main>
      </body>
    </html>
  );
}
