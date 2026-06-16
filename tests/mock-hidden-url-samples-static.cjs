const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const chatMessages = read('src/api/mock/data/chatMessages.raw.js');
const generationSamples = read('src/api/mock/data/generationSamples.raw.js');
const mockData = `${chatMessages}\n${generationSamples}`;

assert(
  !mockData.includes("router.push({ name: 'chat', params: { id: chatId } })") &&
    !mockData.includes('router.push({ name: "chat", params: { id: chatId } })'),
  'mock markdown samples must not show visible /chat/:id navigation examples'
);

assert(
  !mockData.includes('/chat/:id 기반') && !mockData.includes('/chat/:id based'),
  'mock markdown samples must not describe normal chat navigation as /chat/:id based'
);

assert(
  chatMessages.includes('navigateToConversation(chatId);'),
  'mock chat code samples should demonstrate hidden-only navigation through navigateToConversation(chatId)'
);

assert(
  generationSamples.includes('hidden-only /chat entry 기반 화면 전환'),
  'generation table sample should describe hidden-only /chat entry navigation'
);
