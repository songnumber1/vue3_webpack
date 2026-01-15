export function rehypeWrapTables() {
  return (tree) => {
    visitElements(tree, (node, index, parent) => {
      if (!parent || node.type !== "element") return;
      if (node.tagName !== "table") return;

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrap"] },
        children: [node],
      };
    });
  };
}

export function rehypeTableClasses() {
  return (tree) => {
    visitElements(tree, (node) => {
      if (node.type !== "element") return;
      if (node.tagName === "table") addClass(node, "md-table");
      if (node.tagName === "th") addClass(node, "md-th");
      if (node.tagName === "td") addClass(node, "md-td");
    });
  };
}

function addClass(node, cls) {
  node.properties = node.properties || {};
  const cur = node.properties.className || [];
  const arr = Array.isArray(cur) ? cur : [cur];
  if (!arr.includes(cls)) arr.push(cls);
  node.properties.className = arr;
}

function visitElements(tree, fn) {
  const stack = [{ node: tree, parent: null }];
  while (stack.length) {
    const { node, parent } = stack.pop();
    if (!node) continue;

    if (Array.isArray(node.children)) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({ node: node.children[i], parent: node });
      }
    }

    if (node.type === "element" && parent) {
      const idx = parent.children ? parent.children.indexOf(node) : -1;
      fn(node, idx, parent);
    }
  }
}
