const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const renamedFiles = [
  ['src/assets/styles/03-runtime/_mobile-cascade-hotfix.scss', 'src/assets/styles/03-runtime/_mobile-cascade-guards.scss'],
  ['src/assets/styles/05-layout/chat/_assistant-empty-bottom-sheet-legacy.scss', 'src/assets/styles/05-layout/chat/_assistant-empty-bottom-sheet.scss'],
  ['src/assets/styles/studio/_overlay-pagination-fixes.scss', 'src/assets/styles/studio/_overlay-pagination.scss'],
];

for (const [oldPath, newPath] of renamedFiles) {
  assert(!exists(oldPath), `${oldPath} must stay removed after SCSS file rename cleanup`);
  assert(exists(newPath), `${newPath} must exist after SCSS file rename cleanup`);
}

const indexScss = read('src/assets/styles/index.scss');
assert(indexScss.includes('@use "./03-runtime/mobile-cascade-guards" as *;'), 'index.scss must import renamed mobile cascade guards file');
assert(!indexScss.includes('mobile-cascade-hotfix'), 'index.scss must not import old mobile cascade hotfix filename');

const chatCore = read('src/assets/styles/05-layout/_chat-core.scss');
assert(chatCore.includes('@use "chat/assistant-empty-bottom-sheet" as *;'), 'chat core must import renamed assistant empty bottom sheet file');
assert(!chatCore.includes('assistant-empty-bottom-sheet-legacy'), 'chat core must not import old assistant bottom sheet legacy filename');

const studioWorkspace = read('src/assets/styles/studio/_studio-workspace.scss');
assert(studioWorkspace.includes('@use "./overlay-pagination" as *;'), 'studio workspace must import renamed overlay pagination file');
assert(!studioWorkspace.includes('overlay-pagination-fixes'), 'studio workspace must not import old overlay pagination fixes filename');

const runtimeImportIndex = indexScss.indexOf('@use "./03-runtime/mobile-cascade-guards" as *;');
const promptDesktopImportIndex = indexScss.indexOf('@use "./06-components/prompt/prompt-desktop" as *;');
assert(runtimeImportIndex > -1 && promptDesktopImportIndex > -1 && runtimeImportIndex < promptDesktopImportIndex, 'mobile cascade guard import must keep its cascade position before prompt desktop guard');

console.log('renamed-scss-files-static checks passed');
