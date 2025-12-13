# ChatGPT-like Layout (Vue 3 Option API + Webpack)

## Features
- ChatGPT-style layout: Sidebar + Header + Content(Chat) + Footer
- Theme select: `light / dim / dark` (saved to localStorage)
- Responsive: `sm` breakpoint -> sidebar becomes hamburger + slide-in drawer
- Bootstrap-like size utilities:
  - `.btn-sm .btn-md .btn-lg`
  - `.label-sm .label-md .label-lg`
  - `.btn-rsp/.label-rsp` auto scales via breakpoint (`html[data-bp]`)

## Run
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
```

## Customize breakpoints
`src/main.js`에서 responsiveManager의 breakpoints 값을 수정하세요.
