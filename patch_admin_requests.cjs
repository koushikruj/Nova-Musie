const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Wrap the requests list mapping
const reqListTarget = `              {subscriptionRequests.length === 0 ? (`;
const reqListReplacement = `              <div className="overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="min-w-[600px] sm:min-w-0">
              {subscriptionRequests.length === 0 ? (`;
content = content.replace(reqListTarget, reqListReplacement);

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
              )}
                </div>
              </div>
            </div>
          )}`;
content = content.replace(reqListEndTarget, reqListEndReplacement);

fs.writeFileSync('src/components/AdminModal.tsx', content);
console.log('Patched Requests List');
