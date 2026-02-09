// Singleton wrapper around the Web Speech API (SpeechRecognition)
// - Shared singleton instance across components
// - Options override per start()
// - Google Chrome demo-style result handling (final + interim)
// - Adds mobile/Android-friendly behavior:
//   * continuous defaults to false
//   * optional autoRestart on onend
//   * optional silence-based finalize

let _instance = null;

function _getCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function createInstance() {
  const Ctor = _getCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();

  const state = {
    recognition,
    defaults: {
      lang: "ko-KR",
      // IMPORTANT: Android Chrome is more stable with continuous=false
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,

      // optional behavior (can be overridden per start)
      autoRestart: true,          // restart onend while active (best effort)
      finalizeSilenceMs: 1200,    // finalize after silence (ms); set 0 to disable
    },

    active: false,

    // runtime
    _handlers: null,
    _sessionId: 0,
    _stopRequested: false,

    // transcript buffers (google demo pattern)
    _finalText: "",
    _interimText: "",

    // optional baseText (caller-supplied prefix)
    _baseText: "",

    // silence timer
    _silenceTimer: null,
  };

  const clearSilenceTimer = () => {
    if (state._silenceTimer) {
      clearTimeout(state._silenceTimer);
      state._silenceTimer = null;
    }
  };

  const applyOptions = (opts = {}) => {
    const o = { ...state.defaults, ...(opts || {}) };

    recognition.lang = o.lang;
    recognition.continuous = !!o.continuous;
    recognition.interimResults = !!o.interimResults;
    recognition.maxAlternatives = Number(o.maxAlternatives || 1);

    // store behavior options (not native properties)
    state._autoRestart = !!o.autoRestart;
    state._finalizeSilenceMs = Math.max(0, Number(o.finalizeSilenceMs || 0));
  };

  const stop = () => {
    state._stopRequested = true;
    state._handlers = null;
    state.active = false;
    clearSilenceTimer();
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  };

  const start = (handlers = {}, opts = {}) => {
    if (!recognition) return { ok: false, reason: "unsupported" };

    // If already active, stop first
    if (state.active) stop();

    state._sessionId += 1;
    state._stopRequested = false;

    state._handlers = handlers || {};
    // Keep backward compatibility: allow baseText, but DO NOT mix into recognition buffers
    state._baseText = String(handlers?.baseText ?? "").trim();

    // reset buffers
    state._finalText = "";
    state._interimText = "";
    clearSilenceTimer();

    applyOptions(opts);

    state.active = true;

    try {
      recognition.start();
      return { ok: true, sessionId: state._sessionId };
    } catch (e) {
      state.active = false;
      return { ok: false, reason: "start_failed", error: e };
    }
  };

  const isActive = () => !!state.active;
  const isSupported = () => !!_getCtor();

  const emitText = (coreText) => {
    const h = state._handlers;
    if (!h) return;

    const core = String(coreText || "").trim();
    const base = String(state._baseText || "").trim();
    const merged = base ? (core ? `${base} ${core}` : base) : core;

    if (typeof h.onText === "function") {
      h.onText(merged, {
        final: state._finalText,
        interim: state._interimText,
        raw: core,
        base,
      });
    }
  };

  const emitFinal = (coreText) => {
    const h = state._handlers;
    if (!h) return;

    const core = String(coreText || "").trim();
    const base = String(state._baseText || "").trim();
    const merged = base ? (core ? `${base} ${core}` : base) : core;

    if (typeof h.onFinal === "function") {
      h.onFinal(merged, {
        final: state._finalText,
        interim: state._interimText,
        raw: core,
        base,
      });
    }
  };

  // --- events (google demo-style) ---
  recognition.onresult = (event) => {
    const h = state._handlers;
    if (!state.active || !h) return;

    let interim = "";

    // IMPORTANT: process only from resultIndex (google demo pattern)
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const res = event.results[i];
      const text = res?.[0]?.transcript || "";
      if (!text) continue;

      if (res.isFinal) {
        state._finalText += text;
      } else {
        interim += text;
      }
    }

    state._interimText = interim;

    const coreOut = `${state._finalText}${state._interimText}`.trim();
    emitText(coreOut);

    // silence-based finalize (optional)
    clearSilenceTimer();
    if (state._finalizeSilenceMs > 0) {
      state._silenceTimer = setTimeout(() => {
        if (!state.active) return;
        // promote interim -> final
        state._finalText = `${state._finalText}${state._interimText}`;
        state._interimText = "";
        const finalOut = String(state._finalText || "").trim();
        emitFinal(finalOut);
      }, state._finalizeSilenceMs);
    }
  };

  recognition.onerror = (event) => {
    const h = state._handlers;
    clearSilenceTimer();
    state.active = false;
    state._handlers = null;
    if (typeof h?.onError === "function") h.onError(event);
  };

  recognition.onend = () => {
    const h = state._handlers;
    const wasActive = state.active;
    clearSilenceTimer();

    // If stop() was called, don't restart
    if (state._stopRequested) {
      state.active = false;
      state._handlers = null;
      state._stopRequested = false;
      if (wasActive && typeof h?.onEnd === "function") h.onEnd();
      return;
    }

    // Best-effort: some environments end frequently; optionally restart while active
    if (wasActive && state._autoRestart) {
      try {
        recognition.start();
        state.active = true;
        return;
      } catch {
        // fall through to end
      }
    }

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
