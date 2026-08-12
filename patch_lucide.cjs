const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

if (!content.includes('Save,')) {
  content = content.replace('X,', 'X,\n  Save,');
}

fs.writeFileSync('src/components/AdminModal.tsx', content);
console.log('Added Save to imports');
