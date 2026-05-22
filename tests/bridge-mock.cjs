const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const client = read('src/bridge/web/bridgeClient.js');
const registry = read('src/bridge/runtime/bridgeCallbackRegistry.js');
const runtime = read('src/bridge/runtime/bridgeRuntime.js');
const nativeRuntime = read('src/bridge/native/bridgeNativeRuntime.js');
const androidTransport = read('src/bridge/native/bridgeAndroidTransport.js');

assert(
  client.includes('export {callNative}') && client.includes('executeContract'),
  'bridge public facade exports must remain stable'
);
assert(
  registry.includes('setBridgeCallback') &&
    registry.includes('completeBridgeResponse') &&
    registry.includes('deleteBridgeCallback'),
  'bridge callback registry must keep set/complete/delete operations'
);
assert(
  runtime.includes('window.__bridgeResponse = completeBridgeResponse'),
  'bridge runtime must keep Android callback global entry point'
);
assert(
  nativeRuntime.includes('requestId,') &&
    nativeRuntime.includes('type,') &&
    nativeRuntime.includes('payload: validPayload'),
  'native bridge request payload shape must remain { requestId, type, payload }'
);
assert(
  androidTransport.includes('window.AndroidBridge || null') &&
    androidTransport.includes('bridge[methodName](JSON.stringify(payload))'),
  'Android transport must preserve window.AndroidBridge method call contract'
);

console.log('bridge mock checks passed');
