# demo-app

> [!WARNING]
> **Under active development. Do not use in production.**
> The demo app has no authentication: while editing is switched on, anyone who
> can reach it can read and change its translations
> (`authorize: () => editingEnabled`). Run it locally only.

A Next.js website that integrates [Intl TMS](https://intl-tms.github.io/docs/),
so you can see in-context translation editing working end to end: a website
that marks its text, the endpoints that save an edit, a storage adapter, and
the Extension editing it.

Internationalization is done by [next-intl](https://next-intl.dev). The app to
run is `apps/web`: English and Danish, storing edits in MongoDB.

It is one example of an integration, not the reference for one. Its storage
choice and the way it reads saved values are its own. To integrate your own
website, follow the
[getting started guide](https://intl-tms.github.io/docs/developers/getting-started).

## Running it

You need:

- Node.js 24 or newer, and pnpm.
- A MongoDB database (a local instance or a hosted one) and its connection
  string.
- Chrome, for the Extension.

### 1. Clone the repositories side by side

The demo app and the Extension link the Core from a sibling folder, so all
three must sit next to each other.

```bash
mkdir intl-tms && cd intl-tms
git clone https://github.com/intl-tms/core.git
git clone https://github.com/intl-tms/extension.git
git clone https://github.com/intl-tms/demo-app.git
```

### 2. Build the Core

```bash
cd core
npm install
npm run build
cd ..
```

### 3. Run the app

```bash
cd demo-app
pnpm install
echo 'MONGODB_URI=mongodb://localhost:27017' > apps/web/.env.local
pnpm --filter web dev
```

Open `http://localhost:3000`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | none, required | Where edits and usage are stored. |
| `MONGODB_DB` | `intl-tms` | The database name. |
| `SITE_URL` | `http://localhost:3000` | The origin the endpoints are published under. |
| `TMS_EDITING` | off | Set to `1` to enable editing outside `next dev`. Editing is always on in development. |

### 4. Build and load the Extension

```bash
cd ../extension
pnpm install
pnpm build
```

Open `chrome://extensions`, switch on **Developer mode**, choose **Load
unpacked** and pick the `extension/dist` folder.

### 5. Edit something

1. On `http://localhost:3000`, click the **Intl TMS** icon.
2. Paste the Config URL: `http://localhost:3000/api/tms/config`
3. Click **On** and allow access when Chrome asks.
4. Hold **Alt** and click any outlined text, change it, and click **Save all**.

The rest is in the
[Editor guide](https://intl-tms.github.io/docs/editors/editing).

## Where the integration lives

In `apps/web/src/`:

| File | What it does |
| --- | --- |
| `tms/config.ts` | `resolveConfig` with the next-intl locales, and the `editingEnabled` deployment switch. |
| `tms/messages.ts` | Reads the Toggle cookie, overlays stored values on the bundled messages, and calls `markCatalog`. |
| `tms/adapter.ts` | The MongoDB storage adapter. |
| `tms/bundled.ts` | Looks up a key's bundled message so the panel edits the real pattern. |
| `i18n/request.ts` | Hands next-intl marked messages during an editing session, plain ones otherwise. |
| `app/api/tms/[...path]/route.ts` | Mounts `createHandler`. |

> **Demo authorization.** The `authorize` function allows anyone to read and
> write while editing is enabled. Replace it with a real check before using
> this pattern for real content.

## Storybook

`apps/web` and `apps/next-intl-extracted` each have a Storybook, with the
`@intl-tms/core/storybook` addon set up so translations can be edited on a
story.

```bash
pnpm --filter web dev          # the app: Storybook saves through its /api/tms endpoints
pnpm --filter web storybook    # http://localhost:6006
```

Use `--filter next-intl-extracted` for the other app. Both use port 3000 and
6006, so run one app at a time.

In Storybook's toolbar choose **Edit translations: on**, then hold Alt and
click an outlined text. The addon is configured in `.storybook/preview.tsx`;
the app allows Storybook's origin in `src/app/api/tms/[...path]/route.ts`
(`STORYBOOK_URL`, default `http://localhost:6006`).

`.storybook/navigation.mock.ts` replaces `src/i18n/navigation` in stories:
Storybook 10.6's App Router mock does not support Next.js 16.4 yet. Remove it,
and its alias in `.storybook/main.ts`, once it does.

## Generating a new Next.js app

The repo ships a `next-app` Turborepo generator that scaffolds a Next.js app (TypeScript, Tailwind CSS, ESLint) into `apps/`.

Run it from anywhere in the repo:

```bash
pnpm turbo gen next-app
```

You'll be prompted for the app name. To skip the prompt, pass the name with `--args`:

```bash
pnpm turbo gen next-app --args my-app
```

The name is dash-cased (`My App` becomes `my-app`) and used as both the folder name (`apps/my-app`) and the `name` in the new `package.json`. It may only contain letters, numbers and dashes, and the generator refuses to overwrite an existing `apps/<name>`.

Then install dependencies and start the app:

```bash
pnpm install
pnpm --filter my-app dev
```

The new app is picked up automatically by the `apps/*` workspace glob, and its `turbo.json` extends the root config, so `pnpm build`, `pnpm lint` and `pnpm check-types` include it without further setup.

### Changing what gets generated

The generator lives in `turbo/generators`:

- `config.ts` defines the prompt, validation and actions.
- `templates/next-app/` holds the files copied into the new app. Files ending in `.hbs` are rendered with Handlebars (for example `{{ dashCase name }}`) and have the extension stripped; everything else is copied as is.

## License

[MIT](./LICENSE)
