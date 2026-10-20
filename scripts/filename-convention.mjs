import path from "node:path";

// Preserve the former check-file rule's src/* scope and ignoreMiddleExtensions.
export default {
  meta: {
    type: "suggestion",
    schema: [],
    messages: { name: "Use {{style}} for this filename." },
  },
  create(context) {
    const relative = path
      .relative(context.cwd, context.filename)
      .replaceAll("\\", "/");
    const match = relative.match(/^src\/([^/]+)\.(tsx|ts|js)$/);
    if (!match) return {};
    const stem = match[1].split(".")[0];
    const pascal = match[2] === "tsx";
    const valid = pascal
      ? /^[A-Z][A-Za-z0-9]*$/.test(stem)
      : /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(stem);
    return valid
      ? {}
      : {
          Program(node) {
            context.report({
              node,
              messageId: "name",
              data: { style: pascal ? "PascalCase" : "kebab-case" },
            });
          },
        };
  },
};
