export function safeEvaluate(expr, ctx) {
  try {
    if (!expr) return null;

    // 위험 키워드 차단 (간단 방어)
    const blocked = ["window", "document", "eval", "Function"];
    if (blocked.some((b) => expr.includes(b))) {
      console.warn("blocked expression:", expr);
      return null;
    }

    return new Function("ctx", `with(ctx){ return ${expr} }`)(ctx);
  } catch (e) {
    console.warn("evaluate error:", expr);
    return null;
  }
}
