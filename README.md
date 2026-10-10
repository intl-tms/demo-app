# demo-app

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
