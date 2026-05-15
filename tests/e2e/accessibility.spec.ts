/**
 * @a11y
 * Accessibility tests using axe-core via @axe-core/playwright.
 * Tag: @a11y — run with: npm run test:a11y
 *
 * Generates a11y-report.json and fails CI on critical violations.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const A11Y_REPORT_PATH = join(__dirname, '..', '..', 'a11y-report.json');

interface ViolationSummary {
  url: string;
  violations: {
    id: string;
    impact: string | null;
    description: string;
    help: string;
    helpUrl: string;
    nodes: number;
  }[];
  pass: boolean;
}

const CRITICAL_IMPACTS = new Set(['critical', 'serious']);

interface ViolationLike {
  id: string;
  impact?: string | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: unknown[];
}

function writeA11yReport(results: { violations: ViolationLike[] }, url: string): boolean {
  mkdirSync(join(__dirname, '..', '..'), { recursive: true });

  const summary: ViolationSummary = {
    url,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? null,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    })),
    pass: results.violations.length === 0,
  };

  let existing: ViolationSummary[] = [];
  try {
    existing = JSON.parse(readFileSync(A11Y_REPORT_PATH, 'utf-8'));
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }
  existing.push(summary);
  writeFileSync(A11Y_REPORT_PATH, JSON.stringify(existing, null, 2));

  const criticalViolations = results.violations.filter((v) =>
    v.impact ? CRITICAL_IMPACTS.has(v.impact) : false,
  );
  return criticalViolations.length === 0;
}

test.describe('Accessibility @a11y', () => {
  test('home page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const passed = writeA11yReport(results, page.url());
    expect(passed, axeFailMessage(results.violations)).toBe(true);
  });

  test('studio page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForSelector('[role="toolbar"]');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const passed = writeA11yReport(results, page.url());
    expect(passed, axeFailMessage(results.violations)).toBe(true);
  });
});

function axeFailMessage(
  violations: { id: string; impact?: string | null; help: string }[],
): string {
  const critical = violations.filter(
    (v) => v.impact && CRITICAL_IMPACTS.has(v.impact),
  );
  if (critical.length === 0) return '';
  const lines = critical.map((v) => `  • ${v.id} (${v.impact}): ${v.help}`);
  return `Critical accessibility violations found:\n${lines.join('\n')}`;
}
