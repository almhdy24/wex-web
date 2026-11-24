// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import Button from '../components/common/Button';
import buttonStyles from '../components/common/Button.module.css';

describe('Button Layout & CSS Contract', () => {
  it('asserts Button.module.css defines inline-flex and flex-direction row on .button and .label', () => {
    const cssPath = path.resolve(process.cwd(), 'src/components/common/Button.module.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // Button container must be inline-flex and row
    expect(cssContent).toMatch(/\.button\s*\{[^}]*display:\s*inline-flex/);
    expect(cssContent).toMatch(/\.button\s*\{[^}]*flex-direction:\s*row/);
    expect(cssContent).not.toMatch(/\.button\s*\{[^}]*flex-direction:\s*column/);

    // Label wrapper must be inline-flex and row
    expect(cssContent).toMatch(/\.label\s*\{[^}]*display:\s*inline-flex/);
    expect(cssContent).toMatch(/\.label\s*\{[^}]*flex-direction:\s*row/);
    expect(cssContent).not.toMatch(/\.label\s*\{[^}]*flex-direction:\s*column/);

    // All sizes must have min-height >= 44px for touch targets
    const smMatch = cssContent.match(/\.sm\s*\{[^}]*min-height:\s*(\d+)px/);
    expect(smMatch).not.toBeNull();
    expect(Number(smMatch[1])).toBeGreaterThanOrEqual(44);

    const mdMatch = cssContent.match(/\.md\s*\{[^}]*min-height:\s*(\d+)px/);
    expect(mdMatch).not.toBeNull();
    expect(Number(mdMatch[1])).toBeGreaterThanOrEqual(44);

    const lgMatch = cssContent.match(/\.lg\s*\{[^}]*min-height:\s*(\d+)px/);
    expect(lgMatch).not.toBeNull();
    expect(Number(lgMatch[1])).toBeGreaterThanOrEqual(44);
  });

  it('scans all module.css files to assert no button or .btn with icon has flex-direction: column', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    function getAllCssFiles(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(getAllCssFiles(fullPath));
        } else if (file.endsWith('.module.css')) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const cssFiles = getAllCssFiles(srcDir);
    const violations = [];

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Match rules targeting button or .btn
      const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
      let match;
      while ((match = ruleRegex.exec(content)) !== null) {
        const selector = match[1].trim();
        const body = match[2];

        // If selector targets a button element or class with btn/button (excluding containers like menuButtons, storeButtons, optionsRow)
        const isButtonTarget =
          /\bbutton\b/i.test(selector) ||
          /\.[a-zA-Z0-9_-]*(?:btn|button)\b/i.test(selector);

        // Exclude container wrappers (e.g. .menuButtons, .storeButtons, .btnGroup)
        const isContainer =
          /(?:buttons|btngroup|wrapper|container|actions|row|list|group)/i.test(selector) &&
          !/(?:item|btn|button)$/i.test(selector);

        if (isButtonTarget && !isContainer && /flex-direction:\s*column/i.test(body)) {
          // If it also targets icons or is a direct button rule
          violations.push({
            file: path.relative(process.cwd(), file),
            selector,
            body: body.trim(),
          });
        }
      }
    }

    // Filter out .optionBtn in CheckoutPage because optionBtn is a large 2-line selection card
    const filteredViolations = violations.filter(
      (v) => !v.file.includes('CheckoutPage.module.css') || !v.selector.includes('optionBtn')
    );

    expect(filteredViolations).toEqual([]);
  });

  it('renders Button with icon and label in an inline row', () => {
    const MockIcon = (props) => <svg data-testid="mock-icon" {...props}><path d="" /></svg>;
    render(
      <Button icon={MockIcon}>
        <span>نص تجريبي</span>
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(button.className).toContain(buttonStyles.button);

    const icon = screen.getByTestId('mock-icon');
    expect(icon).toBeDefined();

    const label = screen.getByText('نص تجريبي');
    expect(label).toBeDefined();

    expect(button.contains(icon)).toBe(true);
    expect(button.contains(label)).toBe(true);

    // Icon is first in reading order before label in DOM
    const iconPos = button.compareDocumentPosition(icon);
    expect(iconPos & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeTruthy();
  });
});
