import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SRC = process.argv[2];
const OUT = process.argv[3];

const GROUP_SLUG = {
  "Foundation": "foundation",
  "Data layer": "data",
  "Identity & isolation": "identity",
  "Resources": "resources",
  "The domain core": "domain-core",
  "Performance": "performance",
  "Confidence": "confidence",
  "Production": "production",
  "The interview": "interview",
};

const RISK_LABEL = { 1: "low", 2: "medium", 3: "high" };

// ---- 1. pull the PHASES data block out of each HTML file -------------------

function extractPhases(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === "const PHASES = [];");
  if (start === -1) throw new Error(`no PHASES declaration in ${file}`);

  let end = -1;
  for (let i = lines.length - 1; i > start; i--) {
    if (lines[i].startsWith("});")) { end = i; break; }
  }
  if (end === -1) throw new Error(`no closing }); in ${file}`);

  const src = lines.slice(start, end + 1).join("\n");
  // `const PHASES` is a lexical binding, so it never lands on the context
  // object -- take the completion value of the script instead.
  const ctx = vm.createContext({});
  const phases = vm.runInContext(src + ";PHASES;", ctx, { filename: path.basename(file) });
  if (!Array.isArray(phases)) throw new Error(`PHASES did not evaluate to an array in ${file}`);
  return phases;
}

// ---- 2. HTML inline markup -> markdown -------------------------------------

const ENTITIES = {
  "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"',
  "&#39;": "'", "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–",
};

function inline(s) {
  if (s == null) return "";
  return String(s)
    .replace(/<\/?b>|<\/?strong>/g, "**")
    .replace(/<\/?i>|<\/?em>/g, "*")
    .replace(/<code>(.*?)<\/code>/gs, (_, c) => "`" + c.replace(/`/g, "") + "`")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;|&gt;|&amp;|&quot;|&#39;|&nbsp;|&mdash;|&ndash;/g, (m) => ENTITIES[m])
    .trim();
}

// code blocks keep their layout: strip tags but never collapse whitespace
function codeText(s) {
  return String(s)
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;|&gt;|&amp;|&quot;|&#39;|&nbsp;|&mdash;|&ndash;/g, (m) => ENTITIES[m])
    .replace(/^\n+|\s+$/g, "");
}

// ---- 3. one phase -> one markdown file -------------------------------------

function render(p) {
  const out = [];
  const risk = RISK_LABEL[p.risk] ?? String(p.risk);

  out.push(`# Phase ${p.n} — ${inline(p.title)}`, "");
  out.push(`> **Group** ${p.grp} · **Side** ${p.side} · **Risk** ${risk} (${p.risk}/3) · **Depends on** ${inline(p.deps)}`, "");
  out.push(`**Goal.** ${inline(p.goal)}`, "");

  for (const s of p.sections ?? []) {
    out.push(`## ${inline(s.h)}`, "");
    if (s.type === "text") {
      out.push(inline(s.body), "");
    } else if (s.type === "code") {
      out.push("```", codeText(s.body), "```", "");
    } else if (s.type === "list") {
      for (const it of s.items ?? []) out.push(`- ${inline(it)}`);
      out.push("");
    } else {
      throw new Error(`unknown section type "${s.type}" in phase ${p.n}`);
    }
  }

  if (p.warn) out.push("## Warning", "", `> ${inline(p.warn).replace(/\n/g, "\n> ")}`, "");

  if (p.tasks?.length) {
    out.push("## Tasks", "");
    for (const t of p.tasks) out.push(`- [ ] ${inline(t)}`);
    out.push("");
  }

  if (p.done) out.push("## Done when", "", inline(p.done), "");

  if (p.learn?.length) {
    out.push("## What this teaches", "");
    out.push("| Area | Skill |", "| --- | --- |");
    for (const [area, skill] of p.learn) {
      out.push(`| ${inline(area)} | ${inline(skill).replace(/\|/g, "\|")} |`);
    }
    out.push("");
  }

  if (p.interview?.length) {
    out.push("## Interview questions", "");
    for (const [q, a] of p.interview) {
      out.push(`**Q. ${inline(q)}**`, "", inline(a), "");
    }
  }

  if (p.yt?.length) {
    out.push("## Search terms", "");
    for (const y of p.yt) out.push(`- ${inline(y)}`);
    out.push("");
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// ---- 4. run ----------------------------------------------------------------

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".html")).sort();
const all = [];
for (const f of files) all.push(...extractPhases(path.join(SRC, f)));
all.sort((a, b) => Number(a.n) - Number(b.n));

fs.mkdirSync(OUT, { recursive: true });

const index = [
  "# Build specification",
  "",
  `Car Rental SaaS — multi-tenant, production-grade. ${all.length} phases in ${new Set(all.map((p) => p.grp)).size} groups.`,
  "Generated from the HTML build spec. The HTML files stay in `docs/spec/html/` as the",
  "readable dashboard with progress tracking; these markdown files are the same content",
  "in a form that is cheap to read and greppable.",
  "",
  "Regenerate after editing the HTML:",
  "",
  "```sh",
  "node tools/spec-to-markdown.mjs docs/spec/html docs/spec",
  "```",
  "",
  "| Phase | Title | Group | Side | Risk | Depends on |",
  "| --- | --- | --- | --- | --- | --- |",
];

for (const p of all) {
  const slug = GROUP_SLUG[p.grp] ?? p.grp.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const name = `phase-${p.n}-${slug}.md`;
  fs.writeFileSync(path.join(OUT, name), render(p), "utf8");
  index.push(
    `| ${p.n} | [${inline(p.title)}](${name}) | ${p.grp} | ${p.side} | ${RISK_LABEL[p.risk]} | ${inline(p.deps)} |`
  );
}

index.push("");
fs.writeFileSync(path.join(OUT, "README.md"), index.join("\n") + "\n", "utf8");
console.log(`wrote ${all.length} phases + README.md to ${OUT}`);
