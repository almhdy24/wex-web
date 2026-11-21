#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as espree from 'espree';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const srcDir = join(rootDir, 'src');
const apiDir = join(srcDir, 'api');

console.log('=== Checking API Surface Integrity ===');

// 1. Discover all exported API objects and their methods in src/api
const apiExports = {};

// Default known api client methods
apiExports['api'] = new Set(['get', 'post', 'patch', 'delete', 'put']);

const apiFiles = readdirSync(apiDir).filter(f => f.endsWith('.js') || f.endsWith('.mjs'));

for (const file of apiFiles) {
  const filePath = join(apiDir, file);
  const code = readFileSync(filePath, 'utf8');

  let ast;
  try {
    ast = espree.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    });
  } catch (err) {
    console.error(`Failed to parse ${filePath}: ${err.message}`);
    continue;
  }

  // Find exported object declarations
  for (const node of ast.body) {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration && node.declaration.type === 'VariableDeclaration') {
        for (const decl of node.declaration.declarations) {
          if (decl.id && decl.id.type === 'Identifier' && decl.init) {
            const exportName = decl.id.name;
            if (decl.init.type === 'ObjectExpression') {
              const methods = new Set();
              for (const prop of decl.init.properties) {
                if (prop.type === 'Property' || prop.type === 'MethodDefinition') {
                  const propName = prop.key?.name || prop.key?.value;
                  if (propName) {
                    methods.add(propName);
                  }
                }
              }
              apiExports[exportName] = methods;
            }
          }
        }
      }
    }
  }
}

console.log('Discovered API modules and methods:');
for (const [name, methods] of Object.entries(apiExports)) {
  console.log(`  - ${name} (${methods.size} methods)`);
}

// 2. Scan all JS/JSX files in src (excluding src/api and test mocks)
function scanDir(dir, fileList = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && entry !== 'dist' && entry !== '.git' && entry !== 'api' && entry !== '__tests__' && entry !== 'tests') {
        scanDir(fullPath, fileList);
      }
    } else if (/\.(jsx?|mjs)$/.test(entry)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const sourceFiles = scanDir(srcDir);
const errors = [];
let totalCalls = 0;

for (const filePath of sourceFiles) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Match xxxApi.method( or api.method(
  const callRegex = /\b([a-zA-Z0-9_]*Api|api)\.([a-zA-Z0-9_]+)\s*\(/g;
  let match;

  lines.forEach((lineText, lineIdx) => {
    // Strip comments
    const stripped = lineText.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    while ((match = callRegex.exec(stripped)) !== null) {
      totalCalls++;
      const [_, objName, methodName] = match;
      const relPath = relative(rootDir, filePath);
      const lineNum = lineIdx + 1;

      if (!apiExports[objName]) {
        errors.push({
          file: relPath,
          line: lineNum,
          objName,
          methodName,
          reason: `API module "${objName}" is not exported by any module in src/api`,
        });
      } else if (!apiExports[objName].has(methodName)) {
        errors.push({
          file: relPath,
          line: lineNum,
          objName,
          methodName,
          reason: `Method "${methodName}" does not exist on "${objName}" (available: ${[...apiExports[objName]].join(', ')})`,
        });
      }
    }
  });
}

console.log(`Scanned ${sourceFiles.length} source files, checked ${totalCalls} API calls.`);

if (errors.length > 0) {
  console.error(`\n❌ FAIL: Found ${errors.length} API surface violation(s):`);
  for (const err of errors) {
    console.error(`  ${err.file}:${err.line} -> ${err.objName}.${err.methodName}()`);
    console.error(`     Reason: ${err.reason}`);
  }
  process.exit(1);
} else {
  console.log('✅ PASS: All API method calls match exported API surfaces.');
  process.exit(0);
}
