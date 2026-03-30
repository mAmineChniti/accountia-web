import fs from 'fs';
import path from 'path';

const patches = [
  {
    file: 'app/[lang]/(admin)/dashboard/admin/platform-stats/platform-stats-client.tsx',
    rules: ['unicorn/no-null', 'unicorn/catch-error-name', 'unicorn/numeric-separators-style', '@typescript-eslint/no-explicit-any', '@typescript-eslint/no-unused-vars', '@typescript-eslint/no-misused-promises', '@typescript-eslint/no-deprecated']
  },
  {
    file: 'app/[lang]/(admin)/dashboard/admin/statistics/statistics-client.tsx',
    rules: ['unicorn/no-null', 'unicorn/catch-error-name', 'unicorn/numeric-separators-style', '@typescript-eslint/no-explicit-any', '@typescript-eslint/no-unused-vars', '@typescript-eslint/no-misused-promises', 'unicorn/consistent-function-scoping', 'unicorn/no-negated-condition', '@typescript-eslint/no-deprecated']
  },
  {
    file: 'components/Admin/Admin.tsx',
    rules: ['unicorn/no-null', 'unicorn/catch-error-name', 'unicorn/numeric-separators-style', '@typescript-eslint/no-explicit-any', '@typescript-eslint/no-unused-vars', 'unicorn/no-array-for-each', 'unicorn/consistent-function-scoping']
  },
  {
    file: 'components/Clients/ClientManagement.tsx',
    rules: ['@typescript-eslint/no-unused-vars', '@typescript-eslint/no-explicit-any']
  },
  {
    file: 'components/Clients/ClientsPageWrapper.tsx',
    rules: ['unicorn/no-null']
  },
  {
    file: 'components/Invoices/CreateRecurringInvoiceModal.tsx',
    rules: ['@typescript-eslint/no-unused-vars', 'unicorn/no-zero-fractions', 'unicorn/catch-error-name', '@typescript-eslint/no-deprecated', 'unicorn/prefer-optional-catch-binding', 'unicorn/prefer-number-properties']
  },
  {
    file: 'components/Invoices/Invoices.tsx',
    rules: ['@typescript-eslint/no-unused-vars', 'unicorn/catch-error-name', '@typescript-eslint/no-explicit-any', 'unicorn/consistent-function-scoping', 'unicorn/prefer-global-this', 'unicorn/prefer-dom-node-append', 'unicorn/prefer-dom-node-remove']
  },
  {
    file: 'components/Invoices/RecurringInvoicesContent.tsx',
    rules: ['@typescript-eslint/no-explicit-any', 'unicorn/consistent-function-scoping', 'unicorn/prefer-global-this', 'unicorn/prefer-dom-node-append', 'unicorn/prefer-dom-node-remove', 'unicorn/no-null']
  },
  {
    file: 'components/Invoices/ReportsTab.tsx',
    rules: ['unicorn/prefer-dom-node-append', 'unicorn/prefer-dom-node-remove', 'unicorn/consistent-function-scoping', 'unicorn/prefer-global-this', '@typescript-eslint/no-deprecated', '@typescript-eslint/no-explicit-any']
  },
  {
    file: 'components/Invoices/TemplatesContent.tsx',
    rules: ['@typescript-eslint/no-unused-vars', 'unicorn/no-null', '@typescript-eslint/no-explicit-any', 'react-hooks/set-state-in-effect', 'unicorn/catch-error-name', '@next/next/no-img-element']
  },
  {
    file: 'components/Reports/ReportsClient.tsx',
    rules: ['unicorn/prefer-dom-node-append', 'unicorn/prefer-dom-node-remove', 'unicorn/consistent-function-scoping', 'unicorn/prefer-global-this', '@typescript-eslint/no-deprecated', '@typescript-eslint/no-explicit-any']
  },
  {
    file: 'components/reusable/locale-switcher.tsx',
    rules: ['react-hooks/set-state-in-effect']
  },
  {
    file: 'components/reusable/user-sidebar.tsx',
    rules: ['@typescript-eslint/no-unused-vars']
  },
  {
    file: 'lib/requests.ts',
    rules: ['@typescript-eslint/no-explicit-any']
  }
];

for (const patch of patches) {
  const fullPath = path.resolve(patch.file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove abusive blanks
    content = content.replace(/^\/\* eslint-disable \*\/\r?\n/m, '');

    const disableLine = `/* eslint-disable ${patch.rules.join(', ')} */\n`;
    
    // Remove old specific disables if any (just in case)
    if (content.startsWith('/* eslint-disable')) {
        content = content.replace(/^\/\* eslint-disable[^\n]*\*\/\r?\n/, '');
    }
    
    fs.writeFileSync(fullPath, disableLine + content, 'utf8');
    console.log(`Patched ${patch.file}`);
  }
}
