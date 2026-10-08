import { existsSync } from "node:fs";
import path from "node:path";
import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("next-app", {
    description: "Creates a new Next.js app in apps/ (TypeScript, Tailwind CSS, ESLint)",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the new app?",
        validate: (input: string) => {
          const name = plop.getHelper("dashCase")(input.trim());
          if (!name) {
            return "app name is required";
          }
          if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
            return "app name must be a valid package name (letters, numbers and dashes)";
          }
          if (existsSync(path.join(plop.getDestBasePath(), "apps", name))) {
            return `apps/${name} already exists`;
          }
          return true;
        }
      }
    ],
    actions: [
      {
        type: "addMany",
        destination: "{{ turbo.paths.root }}/apps/{{ dashCase name }}",
        base: "templates/next-app",
        templateFiles: "templates/next-app/**/*",
        globOptions: { dot: true }
      },
      (answers) => {
        const name = plop.getHelper("dashCase")((answers as { name: string }).name);
        return `Run \`pnpm install\` and then \`pnpm --filter ${name} dev\` to start the app`;
      }
    ]
  });
}
