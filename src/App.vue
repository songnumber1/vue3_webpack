<template>
  <label><input type="checkbox" v-model="useTemml" /> Temml</label>
  <label><input type="checkbox" v-model="useKatex" /> KaTeX</label>
  <label><input type="checkbox" v-model="useMathjax" /> MathJax</label>
  <label><input type="checkbox" v-model="useFallback" /> Fallback</label>

  <hr />
  <MathMarkdown
    :source="markdown"
    :useTemml="useTemml"
    :useKatex="useKatex"
    :useMathjax="useMathjax"
    :useFallback="useFallback"
  />
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

### ✅ TEMML

- 인라인 수식: $x^2 + y^2$
- 블럭 수식:

$$$
x^2 + y^2 = z^2
$$$

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

## KaTeX

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

## Mermaid 예시

### sequenceDiagram 예시
\`\`\`mermaid
sequenceDiagram
  participant A
  participant B
  A->>B: Hello B, how are you?
  B-->>A: I am fine, thanks!
\`\`\`

### classDiagram 예시 1
\`\`\`mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }
\`\`\`

### classDiagram 예시 2
\`\`\`mermaid
classDiagram
  class User {
    +Long id
    +String username
    +String email
    +login(): boolean
    +logout(): void
  }

  class Post {
    +Long id
    +String title
    +String content
    +Date createdAt
    +publish(): void
    +edit(): void
  }

  class Comment {
    +Long id
    +String content
    +Date createdAt
    +edit(): void
    +delete(): void
  }

  User "1" --> "*" Post : writes
  User "1" --> "*" Comment : writes
  Post "1" --> "*" Comment : has
\`\`\`

### erDiagram 예시 2
\`\`\`mermaid
erDiagram
  CUSTOMER }|..|{ DELIVERY_ADDRESS : has
  CUSTOMER ||--o{ ORDER : places
  CUSTOMER ||--o{ INVOICE : "liable for"
  DELIVERY_ADDRESS ||--o{ ORDER : receives
  INVOICE ||--|{ ORDER : covers
  ORDER ||--|{ ORDER_ITEM : includes
  PRODUCT_CATEGORY ||--|{ PRODUCT : contains
  PRODUCT ||--o{ ORDER_ITEM : "ordered in"
\`\`\`

### flowchart 예시
\`\`\`mermaid
flowchart TD
  A[Christmas] -->|Get money| B(Go shopping)
  B --> C{Let me think}
  C -->|One| D[Laptop]
  C -->|Two| E[iPhone]
  C -->|Three| F[fa:fa-car Car]
\`\`\`

### stateDiagram 예시
\`\`\`mermaid
stateDiagram-v2
  [*] --> Still
  Still --> [*]
  Still --> Moving
  Moving --> Still
  Moving --> Crash
  Crash --> [*]
\`\`\`

### gitGraph 예시
\`\`\`mermaid
gitGraph
  commit
  commit
  branch develop
  checkout develop
  commit
  commit
  checkout main
  merge develop
  commit
  commit
\`\`\`

### gantt 예시
\`\`\`mermaid
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d
\`\`\`

### journey 예시
\`\`\`mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 3: Me
\`\`\`

### pie 예시
\`\`\`mermaid
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
\`\`\`
      `.trim(),
      useTemml: true,
      useKatex: true,
      useMathjax: true,
      useFallback: false,
    };
  },
  watch: {
    // fallback이 true일 경우 나머지 3개 false로 강제
    useFallback(val) {
      if (val) {
        this.useTemml = false;
        this.useKatex = false;
        this.useMathjax = false;
      }
    },
    // 개별 수학 엔진이 모두 true일 경우 fallback을 꺼야 함
    useTemml: "syncFallbackState",
    useKatex: "syncFallbackState",
    useMathjax: "syncFallbackState",
  },
  methods: {
    syncFallbackState() {
      if (this.useTemml && this.useKatex && this.useMathjax) {
        this.useFallback = false;
      }
    },
  },
};
</script>
