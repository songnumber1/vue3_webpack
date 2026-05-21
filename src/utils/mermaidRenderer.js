import {logWarn} from "@/utils/logger";

let mermaidLoader = null;

const MERMAID_CDN =
  "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}
function getMermaidConfig() {
  const dark = isDarkTheme();

  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeVariables: dark
      ? {
          background: "#212121",
          mainBkg: "#2f2f2f",
          secondBkg: "#343541",
          tertiaryBkg: "#111827",
          primaryColor: "#2f2f2f",
          primaryTextColor: "#f4f4f4",
          primaryBorderColor: "#9ca3af",
          secondaryColor: "#343541",
          secondaryTextColor: "#f4f4f4",
          secondaryBorderColor: "#9ca3af",
          tertiaryColor: "#111827",
          tertiaryTextColor: "#f4f4f4",
          tertiaryBorderColor: "#9ca3af",
          lineColor: "#e5e7eb",
          arrowheadColor: "#e5e7eb",
          edgeLabelBackground: "#111827",
          clusterBkg: "#262626",
          clusterBorder: "#9ca3af",
          nodeBorder: "#9ca3af",
          titleColor: "#f4f4f4",
          textColor: "#f4f4f4",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        }
      : {
          background: "#ffffff",
          mainBkg: "#ffffff",
          secondBkg: "#f7f7f8",
          tertiaryBkg: "#f3f4f6",
          primaryColor: "#ffffff",
          primaryTextColor: "#202123",
          primaryBorderColor: "#374151",
          secondaryColor: "#f7f7f8",
          secondaryTextColor: "#202123",
          secondaryBorderColor: "#374151",
          tertiaryColor: "#f3f4f6",
          tertiaryTextColor: "#202123",
          tertiaryBorderColor: "#374151",
          lineColor: "#374151",
          arrowheadColor: "#374151",
          edgeLabelBackground: "#ffffff",
          clusterBkg: "#f7f7f8",
          clusterBorder: "#374151",
          nodeBorder: "#374151",
          titleColor: "#202123",
          textColor: "#202123",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        },
  };
}
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.mermaid) {
        resolve();
        return;
      }
      existing.addEventListener("load", resolve, {once: true});
      existing.addEventListener("error", reject, {once: true});
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
async function ensureMermaid() {
  if (window.mermaid) {
    window.mermaid.initialize(getMermaidConfig());

    return window.mermaid;
  }

  if (!mermaidLoader) {
    mermaidLoader = loadScript(MERMAID_CDN)
      .then(() => window.mermaid)
      .catch((error) => {
        logWarn(
          "Mermaid could not be loaded. The source code block will remain visible.",
          error
        );

        return null;
      });
  }

  const mermaid = await mermaidLoader;
  mermaid?.initialize?.(getMermaidConfig());

  return mermaid;
}
function setMermaidSvgActionVisibility(target, visible) {
  const svgAction = target
    ?.closest(".md-mermaid-card")
    ?.querySelector(".md-mermaid-action--svg");

  if (!svgAction) return;

  svgAction.hidden = !visible;
  svgAction.classList.toggle("md-mermaid-action--hidden", !visible);
  if (visible) {
    svgAction.style.removeProperty("display");
  } else {
    svgAction.style.setProperty("display", "none");
  }
}

function resetRenderedMermaid(root) {
  const rendered = Array.from(
    root.querySelectorAll(".md-mermaid[data-processed]")
  );

  rendered.forEach((target) => {
    const source = target.getAttribute("data-mermaid-source");
    if (!source) return;

    target.removeAttribute("data-processed");
    target.removeAttribute("data-mermaid-error");
    target.setAttribute("data-mermaid-pending", "true");
    target.textContent = source;
    setMermaidSvgActionVisibility(target, false);
  });
}
export async function renderMermaidInElement(root, options = {}) {
  if (!root) return;

  if (options.force) {
    resetRenderedMermaid(root);
  }

  const targets = Array.from(
    root.querySelectorAll('.md-mermaid[data-mermaid-pending="true"]')
  );
  if (targets.length === 0) return;

  targets.forEach((target) => {
    if (!target.getAttribute("data-mermaid-source")) {
      target.setAttribute("data-mermaid-source", target.textContent || "");
    }
  });

  targets.forEach((target) => {
    setMermaidSvgActionVisibility(target, false);
  });

  const mermaid = await ensureMermaid();
  if (!mermaid?.run) return;

  targets.forEach((target) => {
    target.removeAttribute("data-mermaid-pending");
    target.removeAttribute("data-mermaid-error");
  });

  try {
    await mermaid.run({nodes: targets});
    targets.forEach((target) => {
      setMermaidSvgActionVisibility(
        target,
        Boolean(target.querySelector("svg"))
      );
    });
  } catch (error) {
    logWarn("Mermaid rendering failed.", error);
    targets.forEach((target) => {
      const source =
        target.getAttribute("data-mermaid-source") || target.textContent || "";
      target.setAttribute("data-mermaid-error", "true");
      target.textContent = source;
      setMermaidSvgActionVisibility(target, false);
    });
  }
}
