#!/usr/bin/env node
/**
 * check-i18n.mjs — affiliate-portal i18n 防漂移检查
 *
 * 三项断言（见 docs/affiliate-portal-i18n-plan.md §8）：
 *   1. 5 个 message 文件 key 集合完全一致
 *   2. 值与 en 相同的 key（= 未翻译）必须在白名单内 —— 仅对 ENFORCED 中的
 *      locale 生效，其余只报告。校对完一个语言就把它加进白名单的 enforced。
 *   3. 代码里 t("x") 引用的 key 必须存在于 en.json（orphan 检测）
 *
 * 用法：
 *   node scripts/check-i18n.mjs            # 检查
 *   node scripts/check-i18n.mjs --report   # 额外打印全部未翻译 key（供补译）
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MESSAGES_DIR = path.join(ROOT, "src", "i18n", "messages");
const SRC_DIR = path.join(ROOT, "src");
const ALLOWLIST_PATH = path.join(__dirname, "i18n-allow-identical.json");
const BASE_LOCALE = "en";

// 值与 en 相同不算错的最短长度阈值以下的短词（"OK"、"—"）不检查，
// 它们在多数语言里本来就同形。
const MIN_TRANSLATABLE_LENGTH = 3;

const showReport = process.argv.includes("--report");

const flatten = (obj, prefix = "", out = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, fullKey, out);
    } else {
      out[fullKey] = value;
    }
  }
  return out;
};

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
};

const allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"));
const locales = readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

const messages = Object.fromEntries(
  locales.map((locale) => [
    locale,
    flatten(JSON.parse(readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8"))),
  ]),
);

const baseKeys = Object.keys(messages[BASE_LOCALE]);
const failures = [];

// ---- 1. key 集合一致性 ----------------------------------------------------
for (const locale of locales) {
  if (locale === BASE_LOCALE) continue;
  const keys = messages[locale];
  const missing = baseKeys.filter((k) => !(k in keys));
  const extra = Object.keys(keys).filter((k) => !(k in messages[BASE_LOCALE]));
  if (missing.length) failures.push(`${locale}.json 缺少 ${missing.length} 个 key: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? " …" : ""}`);
  if (extra.length) failures.push(`${locale}.json 多出 ${extra.length} 个 key: ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? " …" : ""}`);
}

// ---- 2. 未翻译值（与 en 相同） --------------------------------------------
const untranslated = {};
for (const locale of locales) {
  if (locale === BASE_LOCALE) continue;
  const allowed = new Set(allowlist.allow[locale] ?? []);
  untranslated[locale] = baseKeys.filter((key) => {
    const base = messages[BASE_LOCALE][key];
    return (
      typeof base === "string" &&
      base.length >= MIN_TRANSLATABLE_LENGTH &&
      messages[locale][key] === base &&
      !allowed.has(key)
    );
  });
}

for (const [locale, keys] of Object.entries(untranslated)) {
  const enforced = allowlist.enforced.includes(locale);
  const line = `${locale}: ${keys.length} 个值与 en 相同（未翻译）`;
  if (!keys.length) continue;
  if (enforced) failures.push(`${line} —— 该语言已启用强制检查，需补译或加入白名单`);
  else console.log(`  ⚠️  ${line}（未强制，仅报告）`);
}

// ---- 3. 代码里引用了但 en.json 不存在的 key（orphan） ----------------------
const orphans = [];
let dynamicCallCount = 0;

for (const file of walk(SRC_DIR)) {
  const source = readFileSync(file, "utf8");

  // 同一文件里同名变量可能绑定多个命名空间（不同函数作用域），
  // 因此把变量映射到"它在本文件中出现过的所有命名空间"，任一命中即通过。
  // ponytail: 不上 AST parser，代价是跨作用域串用不会被发现；
  // 真正要抓的 —— key 在所有候选命名空间里都不存在 —— 依然抓得到。
  const varToNamespaces = new Map();
  for (const match of source.matchAll(
    /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:use|get)Translations\(\s*["']([\w.]+)["']/g,
  )) {
    const [, varName, namespace] = match;
    if (!varToNamespaces.has(varName)) varToNamespaces.set(varName, new Set());
    varToNamespaces.get(varName).add(namespace);
  }

  for (const [varName, namespaces] of varToNamespaces) {
    const callPattern = new RegExp(
      `\\b${varName}(?:\\.rich|\\.markup)?\\(\\s*(["'\`])([^"'\`]*)\\1`,
      "g",
    );
    for (const match of source.matchAll(callPattern)) {
      const [, quote, key] = match;
      if (quote === "`") {
        dynamicCallCount += 1;
        continue;
      }
      const resolvable = [...namespaces].some((ns) => `${ns}.${key}` in messages[BASE_LOCALE]);
      if (!resolvable) {
        orphans.push(
          `${path.relative(ROOT, file)} — ${varName}("${key}") 在 ${[...namespaces].join("/")} 中不存在`,
        );
      }
    }
  }
}

if (orphans.length) {
  failures.push(`代码引用了 ${orphans.length} 个 en.json 中不存在的 key`);
}

// ---- 输出 ------------------------------------------------------------------
console.log(`\ni18n 检查：${locales.length} 个 locale，${baseKeys.length} 个 key`);
if (dynamicCallCount) console.log(`  ℹ️  ${dynamicCallCount} 处动态 key（模板字符串），未做静态检查`);

if (showReport) {
  for (const [locale, keys] of Object.entries(untranslated)) {
    if (!keys.length) continue;
    console.log(`\n--- ${locale} 未翻译 (${keys.length}) ---`);
    const byNamespace = {};
    for (const key of keys) {
      const ns = key.split(".")[0];
      (byNamespace[ns] ??= []).push(key);
    }
    for (const [ns, nsKeys] of Object.entries(byNamespace)) {
      console.log(`  ${ns} (${nsKeys.length}): ${nsKeys.map((k) => k.slice(ns.length + 1)).join(", ")}`);
    }
  }
  if (orphans.length) {
    console.log(`\n--- orphan key (${orphans.length}) ---`);
    orphans.forEach((o) => console.log(`  ${o}`));
  }
}

if (failures.length) {
  console.error("\n❌ i18n 检查失败：");
  failures.forEach((f) => console.error(`  - ${f}`));
  console.error("\n（加 --report 查看完整清单）");
  process.exit(1);
}

console.log("✅ i18n 检查通过\n");
