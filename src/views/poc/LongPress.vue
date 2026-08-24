<template>
    <div class="card" :class="{ 'card--selected': isSelected }" @pointerdown="onPointerDown"
        @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerCancel">
        <div class="card__title">
            카드 제목
        </div>

        <div class="card__content">
            Long Press 테스트용 카드입니다.
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';

const LONG_PRESS_TIME = 700;
const MOVE_THRESHOLD = 10;

const isSelected = ref(false);

let longPressTimer = null;
let startX = 0;
let startY = 0;
let isMoved = false;
let isLongPressed = false;

const clearLongPressTimer = () => {
    if (longPressTimer !== null) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
};

const onPointerDown = (event) => {
    clearLongPressTimer();

    startX = event.clientX;
    startY = event.clientY;

    isMoved = false;
    isLongPressed = false;

    longPressTimer = setTimeout(() => {
        if (isMoved) {
            return;
        }

        isLongPressed = true;

        // Long Press 동작
        isSelected.value = !isSelected.value;

        console.log('Long Press 실행');

        longPressTimer = null;
    }, LONG_PRESS_TIME);
};

const onPointerMove = (event) => {
    if (longPressTimer === null) {
        return;
    }

    const moveX = Math.abs(event.clientX - startX);
    const moveY = Math.abs(event.clientY - startY);

    if (
        moveX > MOVE_THRESHOLD ||
        moveY > MOVE_THRESHOLD
    ) {
        isMoved = true;

        clearLongPressTimer();
    }
};

const onPointerUp = () => {
    clearLongPressTimer();

    // 스크롤을 위해 움직인 경우
    if (isMoved) {
        return;
    }

    // Long Press가 이미 실행된 경우
    if (isLongPressed) {
        return;
    }

    // 일반 클릭 처리
    console.log('일반 클릭');
};

const onPointerCancel = () => {
    clearLongPressTimer();

    isMoved = false;
    isLongPressed = false;
};

onBeforeUnmount(() => {
    clearLongPressTimer();
});
</script>

<style scoped>
.card {
    width: 100%;
    padding: 16px;

    border: 2px solid #ddd;
    border-radius: 10px;

    box-sizing: border-box;

    background: #fff;

    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;

    transition: border-color 0.15s ease;
}

.card--selected {
    border-color: #3b82f6;
}

.card__title {
    font-size: 16px;
    font-weight: 600;
}

.card__content {
    margin-top: 8px;

    font-size: 14px;
}
</style>