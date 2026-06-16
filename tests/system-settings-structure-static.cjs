const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const systemSettingsPath = path.join(root, 'src/constants/systemSettings.js');
const source = fs.readFileSync(systemSettingsPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const requiredSections = [
  'Responsive breakpoint ranges',
  'Runtime mode options',
  'Environment value readers',
  'Select option metadata',
  'Setting keys',
  'Default settings',
  'Normalization lookup tables',
  'Setting normalizers',
];

let previousIndex = -1;
requiredSections.forEach((section) => {
  const index = source.indexOf(section);
  assert(index >= 0, `systemSettings.js is missing section marker: ${section}`);
  assert(index > previousIndex, `systemSettings.js section order is invalid near: ${section}`);
  previousIndex = index;
});

assert(
  source.includes('const STRING_URL_SETTING_KEYS = Object.freeze(['),
  'systemSettings.js should keep string URL setting keys in a lookup table.'
);

assert(
  source.includes('if (STRING_URL_SETTING_KEYS.includes(key))'),
  'normalizeSystemSettings should use STRING_URL_SETTING_KEYS instead of an inline URL key array.'
);

assert(
  source.includes('const HISTORY_LAZY_COUNT_RANGES = Object.freeze({'),
  'systemSettings.js should keep history lazy count ranges in a lookup table.'
);

assert(
  source.includes('const range = HISTORY_LAZY_COUNT_RANGES[key];'),
  'normalizeSystemSettings should use HISTORY_LAZY_COUNT_RANGES instead of recreating the range map.'
);

assert(
  !source.includes('VUE_APP_SYSTEM_CONVERSATION_URL_MODE') &&
    !source.includes('CONVERSATION_URL_MODES') &&
    !source.includes('conversationUrlMode'),
  'systemSettings.js should not reintroduce visible/hidden conversation URL mode settings.'
);
