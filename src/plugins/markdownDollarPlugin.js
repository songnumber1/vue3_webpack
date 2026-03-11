export function createMarkdownDollarPlugin(userOptions = {}) {
  const options = {
    mathOddApply: true,
    skipCodeBlock: true,
    skipInlineCode: true,
    skipMathBlock: true,
    skipTable: true,
    skipMermaid: true,
    extraSkipPatterns: [],
    ...userOptions,
  };

  function protectPatterns(text, store) {
    const patterns = [];

    if (options.skipCodeBlock) patterns.push(/```[\s\S]*?```/g);

    if (options.skipInlineCode) patterns.push(/`[^`\n]*`/g);

    if (options.skipMathBlock) patterns.push(/\$\$[\s\S]*?\$\$/g);

    if (options.skipTable)
      patterns.push(/(\|.*\|\n\|[-:| ]+\|[\s\S]*?)(\n\n|$)/g);

    if (options.skipMermaid) patterns.push(/```mermaid[\s\S]*?```/g);

    patterns.push(...options.extraSkipPatterns);

    patterns.forEach((regex) => {
      text = text.replace(regex, (match) => {
        const key = `__MD_SKIP_${store.length}__`;
        store.push({ key, value: match });
        return key;
      });
    });

    return text;
  }

  function restorePatterns(text, store) {
    store.forEach(({ key, value }) => {
      text = text.split(key).join(value);
    });

    return text;
  }

  // 실제 normalize 로직
  function normalizeDollarCore(text) {
    if (!text) return text;

    let result = "";
    let i = 0;

    while (i < text.length) {
      if (text[i] !== "$") {
        result += text[i];
        i++;
        continue;
      }

      // $$ skip
      if (text[i + 1] === "$") {
        result += "$$";
        i += 2;
        continue;
      }

      i++;

      let content = "";

      while (i < text.length && text[i] !== "$") {
        content += text[i];
        i++;
      }

      // closing $ 없음
      if (i >= text.length) {
        result += "$" + content;
        break;
      }

      i++;

      // close 앞 공백 추출
      const spaceMatch = content.match(/(\s+)$/);
      const closeSpaces = spaceMatch ? spaceMatch[1] : "";

      const trimmed = content.trim();

      let normalized = trimmed;

      if (closeSpaces) {
        normalized = closeSpaces + trimmed + closeSpaces;
      }

      result += "$" + normalized + "$";
    }

    return result;
  }

  function normalizeDollar(text) {
    if (!options.mathOddApply) return text;

    // placeholder 기준 분리
    const parts = text.split(/(__MD_SKIP_\d+__)/g);

    const normalizedParts = parts.map((part) => {
      if (/__MD_SKIP_\d+__/.test(part)) {
        return part;
      }

      return normalizeDollarCore(part);
    });

    return normalizedParts.join("");
  }

  function process(markdown) {
    if (!markdown) return markdown;

    const store = [];

    markdown = protectPatterns(markdown, store);

    markdown = normalizeDollar(markdown);

    markdown = restorePatterns(markdown, store);

    return markdown;
  }

  return {
    process,
  };
}
