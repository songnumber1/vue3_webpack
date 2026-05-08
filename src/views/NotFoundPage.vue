<template>
  <main class="exception-page">
    <section class="exception-card">

      <p class="exception-code">
        404 NOT FOUND
      </p>

      <h1 class="exception-title">
        페이지를 찾을 수 없습니다.
      </h1>

      <p class="exception-description">
        요청한 페이지가 존재하지 않거나<br />
        주소가 변경되었습니다.
      </p>

      <div class="exception-actions">

        <RouterLink to="/" class="exception-button">
          홈으로 이동
        </RouterLink>

        <button type="button" class="exception-button exception-button--secondary" @click="goBack">
          이전 페이지
        </button>

      </div>

    </section>
  </main>
</template>

<script setup>
function goBack() {
  if (window.history.length > 1) {
    window.history.back()
    return
  }

  window.location.assign('/')
}
</script>