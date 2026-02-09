// Singleton wrapper around the Web Speech API (SpeechRecognition)
// - Other components can import and reuse the same instance
// - Supports options override per start()

let _instance = null;

function _getCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function createInstance() {
  const Ctor = _getCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();

  // default options
  const defaults = {
    lang: "ko-KR",
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
  };

  const state = {
    recognition,
    defaults,
    active: false,
    // runtime
    _baseText: "",
    _handlers: null,
    _sessionId: 0,
  };

  const applyOptions = (opts = {}) => {
    const o = { ...state.defaults, ...(opts || {}) };
    recognition.lang = o.lang;
    recognition.continuous = !!o.continuous;
    recognition.interimResults = !!o.interimResults;
    recognition.maxAlternatives = Number(o.maxAlternatives || 1);
  };

  const stop = () => {
    state._handlers = null;
    state.active = false;
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  };

  const start = (handlers = {}, opts = {}) => {
    if (!recognition) return { ok: false, reason: "unsupported" };

    // If already active, restart cleanly
    if (state.active) stop();

    state._sessionId += 1;
    const mySession = state._sessionId;
    state._handlers = handlers || {};
    state._baseText = String(handlers?.baseText ?? "");

    applyOptions(opts);

    state.active = true;

    try {
      recognition.start();
      return { ok: true, sessionId: mySession };
    } catch (e) {
      state.active = false;
      return { ok: false, reason: "start_failed", error: e };
    }
  };

  const isActive = () => !!state.active;
  const isSupported = () => !!_getCtor();

  // --- events ---
  recognition.onresult = (event) => {
    const h = state._handlers;
    if (!state.active || !h) return;

    // Build a transcript for all results (interim 포함)
    let transcript = "";
    for (let i = 0; i < event.results.length; i += 1) {
      const r = event.results[i];
      const t = r?.[0]?.transcript;
      if (t) transcript += t;
    }
    transcript = transcript.trim();

    const base = String(state._baseText || "").trim();
    const merged = base ? (transcript ? `${base} ${transcript}` : base) : transcript;
    if (typeof h.onText === "function") h.onText(merged, { raw: transcript, base });

    // If final, let caller know too
    const last = event.results[event.results.length - 1];
    if (last?.isFinal && typeof h.onFinal === "function") {
      h.onFinal(merged, { raw: transcript, base });
    }
  };

  recognition.onerror = (event) => {
    const h = state._handlers;
    state.active = false;
    if (typeof h?.onError === "function") h.onError(event);
  };

  recognition.onend = () => {
    const h = state._handlers;
    const wasActive = state.active;
    state.active = false;
    state._handlers = null;
    if (wasActive && typeof h?.onEnd === "function") h.onEnd();
  };

  return {
    start,
    stop,
    isActive,
    isSupported,
    setDefaults(next = {}) {
      state.defaults = { ...state.defaults, ...(next || {}) };
    },
  };
}

export function getSpeech() {
  if (_instance) return _instance;
  _instance = createInstance();
  return _instance;
}
