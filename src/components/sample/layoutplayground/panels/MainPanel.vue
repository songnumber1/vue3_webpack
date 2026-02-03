
<template>
  <div class="p">
    <p class="hint">
      Main은 실제 앱에서 router-view가 들어가는 영역입니다.<br/>
      Preview에서는 'Main' 탭에서 UI 가이드만 제공합니다.
    </p>
  </div>
</template>
<script>export default {};</script>
<style scoped>
.p { display:flex; flex-direction: column; gap: 12px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
