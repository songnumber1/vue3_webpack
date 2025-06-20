<template>
  <MathMarkdown :source="markdown" />
</template>

<script>
import MathMarkdown from "./components/MathMarkdown.vue";

export default {
  components: {MathMarkdown},
  data() {
    return {
      /* eslint-disable */
      markdown: `
## 수학 공식 렌더링 테스트

### ✅ TEMML에서도 되는 수식

- 인라인 수식: $x^2 + y^2$
- 블럭 수식:

$$$
x^2 + y^2 = z^2
$$$

---

### ❌ TEMML은 실패할 가능성이 있는 수식 (fallback 테스트용)

- 복잡한 정규분포 함수:

$$
\\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x - \\mu)^2}{2\\sigma^2}}
$$

- 복잡한 행렬:

$$
\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6
\\end{bmatrix}
$$

- 넓은 덧셈기호:

$$
\\sum_{i=1}^{\\infty} \\frac{1}{i^2} = \\frac{\\pi^2}{6}
$$

## KaTeX도 실패하는 예제

$$
\\eqalign{
  a &= b + c \\cr
  x &= y + z \\cr
}
$$

$$
\\begin{align}
f(x) &= x^2 + 1 \\
f'(x) &= 2x
\\end{align}
$$
      `.trim(),
    };
  },
};
</script>
