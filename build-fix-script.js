#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Comprehensive build fix script for TypeScript errors
const FIXES = [
  // Fix missing imports for theme utilities
  {
    pattern: /^(.*)(useMantineTheme\} from '@mantine\/core')(.*)$/gm,
    replacement: (match, before, importLine, after) => {
      const content = before + importLine + after;
      // Check if getEntityThemeColor is used but not imported
      if (content.includes('getEntityThemeColor') && !content.includes('import { getEntityThemeColor')) {
        // Find the best place to add the import
        const mantineImportEnd = content.indexOf("} from '@mantine/core'") + "} from '@mantine/core'".length;
        const themeImport = "\nimport { getEntityThemeColor, semanticColors, textColors } from '../../../lib/mantine-theme'";
        return content.slice(0, mantineImportEnd) + themeImport + content.slice(mantineImportEnd);
      }
      return content;
    }
  },

  // Fix relative path issues for some components
  {
    pattern: /from '\.\.\/\.\.\/\.\.\/lib\/mantine-theme'/g,
    replacement: (match, ...args) => {
      const filePath = args[args.length - 1]; // Last argument is the file path
      if (filePath.includes('src/components/')) {
        return "from '../lib/mantine-theme'";
      }
      return match;
    }
  },

  // Fix duplicate style props - combine them
  {
    pattern: /(\w+)\s+([^>]*?)style=\{([^}]+)\}([^>]*?)style=\{([^}]+)\}/g,
    replacement: '$1 $2$4style={{ ...$3, ...$5 }}'
  },

  // Fix duplicate color props - keep the second one
  {
    pattern: /(\w+)\s+([^>]*?)color=["']([^"']+)["']([^>]*?)color=["']([^"']+)["']/g,
    replacement: '$1 $2$4color="$5"'
  },

  // Fix missing theme parameter in some function calls
  {
    pattern: /getEntityThemeColor\(([^,)]+)\)/g,
    replacement: 'getEntityThemeColor(theme, $1)'
  },

  // Add missing order property to Arc interface usage
  {
    pattern: /Arc {arc\.order}/g,
    replacement: 'Arc {arc.order ?? "N/A"}'
  }
];

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;

    // Apply fixes
    for (const fix of FIXES) {
      const originalContent = content;
      if (typeof fix.replacement === 'function') {
        content = fix.pattern.test ? content.replace(fix.pattern, (...args) => {
          return fix.replacement(args[0], ...args.slice(1, -2), filePath);
        }) : content;
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }

      if (content !== originalContent) {
        modified = true;
      }
    }

    // Special fixes for specific patterns

    // Fix missing imports
    if (content.includes('getEntityThemeColor') && !content.includes('import { getEntityThemeColor')) {
      const mantineImportMatch = content.match(/import \{[^}]+\} from '@mantine\/core'/);
      if (mantineImportMatch) {
        const insertPoint = mantineImportMatch.index + mantineImportMatch[0].length;
        const themeImport = "\nimport { getEntityThemeColor, semanticColors, textColors } from '../../../lib/mantine-theme'";
        content = content.slice(0, insertPoint) + themeImport + content.slice(insertPoint);
        modified = true;
      }
    }

    // Fix semanticColors usage
    if (content.includes('semanticColors') && !content.includes('import { semanticColors')) {
      const existingThemeImport = content.match(/import \{([^}]+)\} from ['"](\.\.\/)+lib\/mantine-theme['"]/);
      if (existingThemeImport) {
        const imports = existingThemeImport[1];
        if (!imports.includes('semanticColors')) {
          const newImports = imports + ', semanticColors';
          content = content.replace(existingThemeImport[0], existingThemeImport[0].replace(imports, newImports));
          modified = true;
        }
      }
    }

    // Fix textColors usage
    if (content.includes('textColors') && !content.includes('import { textColors')) {
      const existingThemeImport = content.match(/import \{([^}]+)\} from ['"](\.\.\/)+lib\/mantine-theme['"]/);
      if (existingThemeImport) {
        const imports = existingThemeImport[1];
        if (!imports.includes('textColors')) {
          const newImports = imports + ', textColors';
          content = content.replace(existingThemeImport[0], existingThemeImport[0].replace(imports, newImports));
          modified = true;
        }
      }
    }

    // Fix specific component issues
    if (filePath.includes('ErrorBoundary.tsx')) {
      // Fix duplicate color props
      content = content.replace(/color="red"\s+([^>]*?)style=\{[^}]+\}/g, '$1style={{ color: "red" }}');
      modified = true;
    }

    // Fix component-specific path issues
    if (filePath.includes('src/components/')) {
      content = content.replace(/from '\.\.\/\.\.\/\.\.\/lib\/mantine-theme'/g, "from '../lib/mantine-theme'");
      if (content !== content) modified = true;
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function findTsxFiles(basePath) {
  const files = [];

  async function walk(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip admin directories and node_modules
        if (fullPath.includes('/admin/') || fullPath.includes('node_modules')) {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }
  }

  await walk(basePath);
  return files;
}

async function main() {
  console.log('🔧 Starting build issue fixes...\n');

  const files = await findTsxFiles('client/src');
  console.log(`Found ${files.length} TypeScript files to process\n`);

  let fixedCount = 0;

  for (const file of files) {
    if (await fixFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n🎉 Build fixes complete!`);
  console.log(`📊 Fixed ${fixedCount} out of ${files.length} files`);
}

if (require.main === module) {
  main().catch(console.error);
}