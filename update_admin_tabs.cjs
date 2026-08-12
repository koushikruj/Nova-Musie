const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const tabsTarget = `<button
            onClick={() => setActiveTab('banned')}
            className={\`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap \${
              activeTab === 'banned'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }\`}
          >
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span>Banned ({banRecords.length})</span>
          </button>
        </div>`;

const tabsReplacement = `<button
            onClick={() => setActiveTab('banned')}
            className={\`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap \${
              activeTab === 'banned'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }\`}
          >
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span>Banned ({banRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={\`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap \${
              activeTab === 'activity'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }\`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={\`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap \${
              activeTab === 'settings'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }\`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>System Settings</span>
          </button>
        </div>`;

// Update state definition
const stateTarget = `const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'permissions' | 'banned'>('dashboard');`;
const stateReplacement = `const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'permissions' | 'banned' | 'activity' | 'settings'>('dashboard');`;

content = content.replace(stateTarget, stateReplacement);

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTabsTarget = tabsTarget.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTabsTarget)) {
  content = normalizedContent.replace(normalizedTabsTarget, tabsReplacement);
  fs.writeFileSync('src/components/AdminModal.tsx', content);
  console.log('Success');
} else {
  console.log('Target not found for tabs');
}
