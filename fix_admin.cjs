const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Find the index of BAN USER CONFIRMATION DIALOG MODAL
const banIndex = content.indexOf('{/* BAN USER CONFIRMATION DIALOG MODAL */}');

// Find the index of TAB: AUDIT LOGS
const auditIndex = content.indexOf('{/* TAB: AUDIT LOGS */}');

if (banIndex === -1 || auditIndex === -1) {
  console.log('Indexes not found', banIndex, auditIndex);
  process.exit(1);
}

// Slice out everything from auditIndex to the end, except the last 3 closing tags
const auditAndSettingsBlock = content.slice(auditIndex);

// We need to carefully remove the audit & settings block from the end
const contentBeforeAudit = content.slice(0, auditIndex);

// Now we need to insert the audit & settings block BEFORE the close of the tab body.
// We know that before `{/* BAN USER CONFIRMATION DIALOG MODAL */}` there is:
//         </div>
//       </div>
// We want to insert the Audit and Settings tabs just before `        </div>\n      </div>\n\n      {/* BAN USER CONFIRMATION`

const targetMarker = `        </div>
      </div>

      {/* BAN USER CONFIRMATION DIALOG MODAL */}`;

let cleanedAuditBlock = auditAndSettingsBlock
  .replace(/        <\/div>\n      <\/div>\n    <\/div>\n  \);\n};\n?/g, '')
  .trim();

// Insert the block back.
const newContent = contentBeforeAudit.replace(targetMarker, cleanedAuditBlock + '\n\n' + targetMarker) + `        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/AdminModal.tsx', newContent);
console.log('Fixed syntax error!');
