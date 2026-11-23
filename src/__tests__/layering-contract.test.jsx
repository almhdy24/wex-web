import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import StickyActionBar from '../components/admin/StickyActionBar';
import Modal from '../components/common/Modal';

function getAllCssFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllCssFiles(fullPath));
    } else if (file.endsWith('.css') && !file.endsWith('tokens.css')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Layering & Clearance Contract (Section 1)', () => {
  it('tokens.css defines the canonical z-index scale and admin clearance tokens', () => {
    const tokensPath = path.resolve(process.cwd(), 'src/styles/tokens.css');
    const tokensContent = fs.readFileSync(tokensPath, 'utf8');

    const expectedTokens = [
      '--z-base: 0;',
      '--z-sticky: 50;',
      '--z-topbar: 90;',
      '--z-sidebar: 100;',
      '--z-tabbar: 300;',
      '--z-sticky-action: 350;',
      '--z-sheet-backdrop: 400;',
      '--z-sheet: 450;',
      '--z-modal: 500;',
      '--z-toast: 600;',
      '--z-popover: 550;',
      '--admin-topbar-h: 56px;',
      '--admin-tabbar-h:',
      '--admin-sticky-action-h: 64px;',
      '--admin-bottom-clearance:',
    ];

    for (const token of expectedTokens) {
      expect(tokensContent).toContain(token);
    }
  });

  it('no fixed element in src/**/*.css uses raw bottom: <number>px', () => {
    const cssFiles = getAllCssFiles(path.resolve(process.cwd(), 'src'));
    const violations = [];

    for (const filePath of cssFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const rules = content.split('}');
      for (const rule of rules) {
        if (rule.includes('position: fixed') || rule.includes('position:fixed')) {
          const match = rule.match(/bottom:\s*([0-9]+)px/);
          if (match) {
            violations.push(`${path.relative(process.cwd(), filePath)} -> ${match[0]}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('no CSS file outside tokens.css contains raw numeric z-index >= 10', () => {
    const cssFiles = getAllCssFiles(path.resolve(process.cwd(), 'src'));
    const violations = [];

    for (const filePath of cssFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, lineNum) => {
        const match = line.match(/z-index:\s*([0-9]{2,})\s*;/);
        if (match) {
          violations.push(
            `${path.relative(process.cwd(), filePath)}:${lineNum + 1} -> ${line.trim()}`
          );
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('StickyActionBar renders as a region with primary and secondary action slots', () => {
    const html = renderToStaticMarkup(
      <StickyActionBar
        primary={<button type="button">حفظ التغييرات</button>}
        secondary={[<button key="1" type="button">إلغاء</button>]}
      />
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('حفظ التغييرات');
    expect(html).toContain('إلغاء');
  });

  it('Modal renders dialog with title, close button and content', () => {
    const html = renderToStaticMarkup(
      <Modal isOpen={true} onClose={() => {}} title="عنوان النافذة">
        <p>محتوى النافذة</p>
      </Modal>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('عنوان النافذة');
    expect(html).toContain('محتوى النافذة');
  });
});
