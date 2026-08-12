const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = `            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;

const replacement = `            </div>
          </div>
        </div>
      )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Admin Activity & Audit Logs</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-4">A record of recent administrative actions.</p>
              
              <div className="space-y-2">
                {[
                  { time: '10 mins ago', action: 'Subscription Modified', details: 'Admin extended PRO for sko134329@gmail.com', type: 'sub' },
                  { time: '1 hour ago', action: 'User Banned', details: 'Banned hwid 8a7c6f5... for ToS violation', type: 'ban' },
                  { time: '3 hours ago', action: 'Permissions Updated', details: 'Restricted custom links for User ID XYZ123', type: 'perm' },
                  { time: '1 day ago', action: 'Global Setting Changed', details: 'Maintenance mode toggled OFF', type: 'sys' }
                ].map((log, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-neutral-900/60 border border-white/5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 \${
                        log.type === 'sub' ? 'bg-emerald-500/20 text-emerald-400' : 
                        log.type === 'ban' ? 'bg-rose-500/20 text-rose-400' :
                        log.type === 'sys' ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-amber-500/20 text-amber-400'
                      }\`}>
                        {log.type === 'sub' ? <Crown className="w-4 h-4" /> :
                         log.type === 'ban' ? <UserX className="w-4 h-4" /> :
                         log.type === 'sys' ? <Sliders className="w-4 h-4" /> :
                         <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white">{log.action}</h4>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{log.details}</p>
                      </div>
                    </div>
                    <div className="text-[10px] text-neutral-500 whitespace-nowrap shrink-0 pt-1">
                      {log.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">System Settings & Branding</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Application Core</h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400 font-medium">Platform Name</label>
                    <input type="text" defaultValue="Sur Music" disabled className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white opacity-70 cursor-not-allowed" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400 font-medium">Support Email</label>
                    <input type="text" defaultValue="support@surmusic.com" disabled className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white opacity-70 cursor-not-allowed" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Features & Limits</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-semibold text-white">Maintenance Mode</h5>
                      <p className="text-xs text-neutral-400">Lock the platform for updates. Only admins can log in.</p>
                    </div>
                    <div className="w-10 h-6 bg-neutral-700 rounded-full relative cursor-not-allowed opacity-70">
                      <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div>
                      <h5 className="text-sm font-semibold text-white">Require Email Verification</h5>
                      <p className="text-xs text-neutral-400">Users must verify their email before streaming.</p>
                    </div>
                    <div className="w-10 h-6 bg-amber-500 rounded-full relative cursor-not-allowed opacity-70">
                      <div className="w-4 h-4 bg-black rounded-full absolute right-1 top-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};`;

// Replace ignoring line ending differences
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  fs.writeFileSync('src/components/AdminModal.tsx', normalizedContent.replace(normalizedTarget, replacement));
  console.log('Success');
} else {
  console.log('Target not found.');
}
