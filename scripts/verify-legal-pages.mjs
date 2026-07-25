#!/usr/bin/env node
/**
 * verify-legal-pages.mjs
 *
 * Verifies that the rendered NDA + Affiliate Agreement pages in
 * affiliate-portal/src/app/[locale]/legal/ contain the key clauses
 * that the user must agree to match the ESIGN content_hash recorded in
 * documents.templates (seed 20260718140000).
 *
 * Why structural (not hash): the seed content_md is markdown, the page
 * is JSX; hashes diverge even when semantics match. Instead we assert
 * the canonical phrases that an audit reviewer (or a court) would
 * expect to see in BOTH the user-visible page AND the seed.
 *
 * Canonical phrases sourced from supabase/migrations/20260718140000_seed_document_templates.sql
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGAL_DIR = path.join(__dirname, "..", "src", "app", "[locale]", "legal");

const checks = [
  {
    file: path.join(LEGAL_DIR, "nda", "page.tsx"),
    name: "NDA",
    lastUpdatedExpected: "2026-07-18",
    requiredPhrases: [
      "Patient names, contact details, health records, and insurance information",
      "three (3) years",
      "Patient Data, Personal Identifiable Information (PII), and Protected Health Information (PHI)",
      "SURVIVE the termination of this Agreement INDEFINITELY",
      "State of Wyoming",
    ],
    forbiddenPhrases: [
      "Whistleblower Immunity Notice",
      "18 U.S.C. § 1833(b)",
    ],
  },
  {
    file: path.join(LEGAL_DIR, "affiliate-agreement", "page.tsx"),
    name: "Affiliate Agreement",
    lastUpdatedExpected: "2026-07-13",
    requiredPhrases: [
      "Ten Thousand U.S. Dollars (10,000 USD)",
      "Small Claims Court of Laramie County, Wyoming",
      "American Arbitration Association (AAA)",
      "Ionverge LLC",
      "30 days",
    ],
    forbiddenPhrases: [
      "OFAC",
      "Sheridan County",
      "Six Thousand U.S. Dollars",
      "Class Action and Jury Trial Waiver",
      "Severability",
      "Assignment",
      "Force Majeure",
    ],
  },
];

function normalize(s) {
  // Collapse JSX whitespace: multiple newlines/spaces become a single space.
  return s.replace(/\s+/g, " ").trim();
}

function run() {
  let allOk = true;
  for (const c of checks) {
    const src = normalize(readFileSync(c.file, "utf8"));
    const okRequired = c.requiredPhrases.every((p) => {
      const needle = normalize(p);
      const present = src.includes(needle);
      if (!present) console.error(`  [MISSING] ${c.name}: "${needle}"`);
      return present;
    });
    const okForbidden = c.forbiddenPhrases.every((p) => {
      const needle = normalize(p);
      const present = src.includes(needle);
      if (present) console.error(`  [FORBIDDEN_PRESENT] ${c.name}: "${needle}"`);
      return !present;
    });
    const lastNeedle = normalize(`Last updated: ${c.lastUpdatedExpected}`);
    const lastOk = src.includes(lastNeedle);
    if (!lastOk) console.error(`  [STALE_DATE] ${c.name}: expected "Last updated: ${c.lastUpdatedExpected}"`);

    const ok = okRequired && okForbidden && lastOk;
    console.log(`${ok ? "PASS" : "FAIL"} ${c.name} (${path.basename(c.file)})`);
    if (!ok) allOk = false;
  }
  process.exit(allOk ? 0 : 1);
}

run();