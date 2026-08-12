const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = `              {playlists.length === 0 ? (
                <div className="py-8 text-center border border-white/5 rounded-2xl bg-neutral-900/30">`;

const replacement = `              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="min-w-[600px] sm:min-w-0">
              {playlists.length === 0 ? (
                <div className="py-8 text-center border border-white/5 rounded-2xl bg-neutral-900/30">`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/AdminModal.tsx', content);
    console.log("Playlists start wrapper added successfully");
} else {
    console.log("Could not find playlists start");
}
