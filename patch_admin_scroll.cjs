const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// 1. Dashboard Stat Cards Grid
content = content.replace(
  '<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">',
  '<div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: \'touch\' }}>\n                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-[500px] sm:min-w-0">'
);
content = content.replace(
  '                  <div className="flex items-center justify-between text-indigo-400">\n                    <span className="text-xs font-semibold uppercase font-mono">Pending Review</span>\n                    <Clock className="w-4 h-4 text-indigo-400" />\n                  </div>\n                  <p className="text-2xl font-black text-indigo-300">{pendingRequestsCount}</p>\n                  <p className="text-[10px] text-indigo-500/80">Awaiting owner approval</p>\n                </div>\n              </div>',
  '                  <div className="flex items-center justify-between text-indigo-400">\n                    <span className="text-xs font-semibold uppercase font-mono">Pending Review</span>\n                    <Clock className="w-4 h-4 text-indigo-400" />\n                  </div>\n                  <p className="text-2xl font-black text-indigo-300">{pendingRequestsCount}</p>\n                  <p className="text-[10px] text-indigo-500/80">Awaiting owner approval</p>\n                </div>\n              </div>\n              </div>'
);

// 2. Users List
content = content.replace(
  '              {filteredUsers.length === 0 ? (',
  '              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: \'touch\' }}>\n                <div className="min-w-[650px] sm:min-w-0">\n              {filteredUsers.length === 0 ? ('
);

// We need to close this div where the users list ends.
// Let's find the end of users list
const usersListEndTarget = `                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}`;
const usersListEndReplacement = `                      </div>
                    );
                  })}
                </div>
              )}
              </div>
              </div>
            </div>
          )}`;
content = content.replace(usersListEndTarget, usersListEndReplacement);


// 3. Requests List
content = content.replace(
  '                <div className="space-y-4">',
  '                <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: \'touch\' }}>\n                  <div className="space-y-4 min-w-[600px] sm:min-w-0">'
);
// Requests list closes at the end of the requests tab
const reqListEndTarget = `                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}`;
const reqListEndReplacement = `                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              )}
              </div>
            </div>
          )}`;
content = content.replace(reqListEndTarget, reqListEndReplacement);


// 4. Banned List
content = content.replace(
  '              {banRecords.length === 0 ? (',
  '              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: \'touch\' }}>\n                <div className="min-w-[600px] sm:min-w-0">\n              {banRecords.length === 0 ? ('
);

const bannedListEndTarget = `                  </div>
                </div>
              )}
            </div>
          )}`;
const bannedListEndReplacement = `                  </div>
                </div>
                </div>
              )}
              </div>
            </div>
          )}`;
content = content.replace(bannedListEndTarget, bannedListEndReplacement);


fs.writeFileSync('src/components/AdminModal.tsx', content);
console.log('Scroll behavior injected');
