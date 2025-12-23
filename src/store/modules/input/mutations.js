export default {
  SET_TEXT(state, v) { state.text = String(v ?? ""); },
  CLEAR(state) { state.text = ""; },
};
