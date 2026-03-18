export function createElementByType(type) {
  if (type === "checkbox") {
    const el = document.createElement("input");
    el.type = "checkbox";
    return el;
  }

  return document.createElement(type);
}
