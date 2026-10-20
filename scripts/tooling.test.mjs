import { Linter } from "eslint";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runSnippet, snippetPath } from "./chakra-snippet.mjs";
import filenameRule from "./filename-convention.mjs";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";

test("filename conventions retain root src scope and ignore middle extensions", () => {
  const linter = new Linter();
  const check = (filename) =>
    linter.verify(
      "",
      [
        {
          files: ["**/*.{js,ts,tsx}"],
          plugins: { project: { rules: { filename: filenameRule } } },
          rules: { "project/filename": "error" },
        },
      ],
      { filename },
    );
  for (const filename of [
    "src/App.tsx",
    "src/vite-env.d.ts",
    "src/main.ts",
    "src/nested/AnyName.ts",
  ])
    assert.equal(check(filename).length, 0, filename);
  for (const filename of ["src/app.tsx", "src/BadName.ts"])
    assert.equal(check(filename)[0].ruleId, "project/filename", filename);
});

test("snippet filenames cannot escape the output directory", () => {
  for (const filename of ["../bad.tsx", "C:/bad.tsx", "a/b.tsx", "a\\b.tsx"])
    assert.throws(() => snippetPath("ui", filename));
});

test("snippet installation resolves dependencies, preserves files, and supports dry run and force", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "datasyncher-snippets-"));
  const index = [
    {
      id: "provider",
      file: "provider.tsx",
      npmDependencies: ["react"],
      fileDependencies: ["compositions/ui/toaster"],
    },
    {
      id: "toaster",
      file: "toaster.tsx",
      npmDependencies: ["react"],
      fileDependencies: [],
    },
  ];
  const fetchJson = async (url) =>
    url.endsWith("index.json")
      ? index
      : {
          file: {
            name: `${url.split("/").at(-1).replace(".json", "")}.tsx`,
            content: 'import "compositions/ui/toaster";',
          },
        };
  let installs = 0;
  const install = () => {
    installs++;
  };
  try {
    await writeFile(
      path.join(cwd, "package.json"),
      JSON.stringify({ dependencies: { react: "18" } }),
    );
    const out = path.join(cwd, "src/components/ui");
    await runSnippet(["provider", "--dry-run"], { cwd, fetchJson, install });
    await assert.rejects(readFile(path.join(out, "provider.tsx")));
    await mkdir(out, { recursive: true });
    await writeFile(path.join(out, "provider.tsx"), "existing");
    await runSnippet(["provider"], { cwd, fetchJson, install });
    assert.equal(
      await readFile(path.join(out, "provider.tsx"), "utf8"),
      "existing",
    );
    assert.equal(
      await readFile(path.join(out, "toaster.tsx"), "utf8"),
      'import "./toaster";',
    );
    await runSnippet(["provider", "--force"], { cwd, fetchJson, install });
    assert.equal(
      await readFile(path.join(out, "provider.tsx"), "utf8"),
      'import "./toaster";',
    );
    assert.equal(installs, 0);
    await assert.rejects(
      runSnippet(["missing"], { cwd, fetchJson, install }),
      /Unknown snippet/,
    );
  } finally {
    assert.equal(path.dirname(path.resolve(cwd)), path.resolve(tmpdir()));
    assert.ok(path.basename(cwd).startsWith("datasyncher-snippets-"));
    await rm(cwd, { recursive: true, force: true });
  }
});
