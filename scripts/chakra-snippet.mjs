import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { mkdir, readFile, writeFile } from "node:fs/promises";

export function snippetPath(directory, filename) {
  if (!/^[a-z0-9-]+\.(tsx|ts)$/.test(filename))
    throw new Error(`Invalid snippet filename: ${filename}`);
  return path.join(directory, filename);
}

export async function runSnippet(
  args,
  {
    cwd = process.cwd(),
    fetchJson = async (url) => {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Snippet registry returned ${response.status}`);
      return response.json();
    },
    install = (dependencies) => {
      if (!process.env.npm_execpath)
        throw new Error("Run this script through npm run chakra:snippet");
      const result = spawnSync(
        process.execPath,
        [process.env.npm_execpath, "install", ...dependencies],
        { cwd, stdio: "inherit" },
      );
      if (result.error || result.status !== 0)
        throw result.error || new Error("Dependency installation failed");
    },
  } = {},
) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      all: { type: "boolean" },
      force: { type: "boolean", short: "f" },
      "dry-run": { type: "boolean", short: "d" },
      outdir: { type: "string" },
      tsx: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(
      "npm run chakra:snippet -- [add|list] [names...] [--all] [--dry-run] [--force] [--outdir dir]",
    );
    return;
  }
  const registry = "https://chakra-v3-docs.vercel.app/compositions";
  const index = await fetchJson(`${registry}/index.json`);
  if (!Array.isArray(index)) throw new Error("Invalid snippet index");
  const byId = new Map(index.map((item) => [item.id, item]));
  if (positionals[0] === "list") {
    console.log(index.map((item) => item.id).join("\n"));
    return;
  }
  if (positionals[0] === "add") positionals.shift();
  const requested = values.all
    ? [...byId.keys()]
    : positionals.length
      ? positionals
      : ["provider", "toaster", "tooltip"];
  const selected = new Map();
  function collect(name) {
    const id = name.replace(/^compositions\/ui\//, "").replace(/\.tsx?$/, "");
    if (selected.has(id)) return;
    const item = byId.get(id);
    if (!item || !/^[a-z0-9-]+$/.test(id))
      throw new Error(`Unknown snippet: ${id}`);
    selected.set(id, item);
    for (const dependency of item.fileDependencies ?? []) collect(dependency);
  }
  requested.forEach(collect);
  const directory = path.resolve(cwd, values.outdir || "src/components/ui");
  const files = [];
  for (const id of selected.keys()) {
    const item = await fetchJson(`${registry}/${id}.json`);
    if (typeof item.file?.content !== "string")
      throw new Error(`Invalid snippet: ${id}`);
    files.push({
      path: snippetPath(directory, item.file.name),
      content: item.file.content.replaceAll("compositions/ui", "."),
    });
  }
  if (values["dry-run"]) {
    for (const file of files) console.log(`Would write ${file.path}`);
    return;
  }
  const pkg = JSON.parse(
    await readFile(path.join(cwd, "package.json"), "utf8"),
  );
  const dependencies = [
    ...new Set(
      [...selected.values()].flatMap((item) => item.npmDependencies ?? []),
    ),
  ];
  if (
    dependencies.some(
      (name) => !/^(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/.test(name),
    )
  )
    throw new Error("Invalid snippet dependency name");
  const missing = dependencies.filter(
    (name) => !pkg.dependencies?.[name] && !pkg.devDependencies?.[name],
  );
  if (missing.length) install(missing);
  await mkdir(directory, { recursive: true });
  for (const file of files) {
    try {
      await writeFile(file.path, file.content, {
        encoding: "utf8",
        flag: values.force ? "w" : "wx",
      });
      console.log(`Added ${file.path}`);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      console.log(`Skipped existing ${file.path} (use --force to replace)`);
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runSnippet(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
