<template>
    <div class="chat-message">
        <span class="text-muted small">{{ message.time }}</span>
        <p class="mb-1">{{ message.text }}</p>
    </div>
</template>

<script>
export default {
    props: ["message"],
}
</script>

<style>

</style>