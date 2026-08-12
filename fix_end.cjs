const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = `            </div>
          </div>
        </div>
      )}

                  </div>
      </div>
    </div>
  );
};`;

const replacement = `            </div>
          </div>
        </div>
      )}
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
  console.log(normalizedContent.slice(-200));
}
