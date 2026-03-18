import { KEY_MAP } from "./enum";
import { safeEvaluate } from "./evaluator";
import { createElementByType } from "./domFactory";

export function createEngine(container) {
  let ctx = {
    handleClick: () => alert("버튼 클릭"),
  };

  let schema = null;
  let cleanup = [];
  let timer = null;

  function clear() {
    container.innerHTML = "";
    cleanup.forEach((fn) => fn());
    cleanup = [];
  }

  function debounceRender() {
    clearTimeout(timer);
    timer = setTimeout(() => render(schema), 30);
  }

  function bind(el, event, fn) {
    el.addEventListener(event, fn);
    cleanup.push(() => el.removeEventListener(event, fn));
  }

  function applyProps(el, props) {
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === "class") {
        el.className = v;
      } else {
        el.setAttribute(k, v);
      }
    });
  }

  function applyModel(el, node) {
    const key = node[KEY_MAP.MODEL];
    if (!key) return;

    if (el.type === "checkbox") {
      el.checked = ctx[key] || false;

      bind(el, "change", (e) => {
        ctx[key] = e.target.checked;
        debounceRender();
      });
    } else {
      el.value = ctx[key] || "";

      bind(el, "input", (e) => {
        ctx[key] = e.target.value;
        debounceRender();
      });
    }
  }

  function applyOptions(el, node) {
    if (node[KEY_MAP.TYPE] !== "select") return;

    const opts = safeEvaluate(node[KEY_MAP.OPTIONS], ctx) || [];

    opts.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.innerText = opt;
      el.appendChild(option);
    });
  }

  function applyEvents(el, node) {
    const events = node[KEY_MAP.EVENTS] || {};

    Object.entries(events).forEach(([event, handler]) => {
      bind(el, event, (e) => {
        ctx[handler]?.(e);
      });
    });
  }

  function renderNode(node, parent) {
    // condition
    if (node[KEY_MAP.CONDITION]) {
      if (!safeEvaluate(node[KEY_MAP.CONDITION], ctx)) return;
    }

    const el = createElementByType(node[KEY_MAP.TYPE]);

    applyProps(el, node[KEY_MAP.PROPS]);
    applyModel(el, node);

    // disabled
    if (node[KEY_MAP.DISABLED]) {
      el.disabled = safeEvaluate(node[KEY_MAP.DISABLED], ctx);
    }

    // text
    if (node[KEY_MAP.TEXT]) {
      el.innerText = node[KEY_MAP.TEXT];
    }

    applyOptions(el, node);
    applyEvents(el, node);

    parent.appendChild(el);

    // children
    const children = node[KEY_MAP.CHILDREN] || [];
    children.forEach((child) => renderNode(child, el));
  }

  function render(newSchema) {
    schema = newSchema;
    clear();
    renderNode(schema, container);
  }

  return {
    render,
    getState: () => ctx,
  };
}
