/**
 * @file api/mock/data/studios.raw.js
 * @description 개발/데모용 mock API 또는 mock 데이터입니다. 실제 API 비활성화 시 화면 동작을 보장합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {DEFAULT_ASSISTANT_IMAGE} from "@/constants/assistantImages";

const defaultImage = DEFAULT_ASSISTANT_IMAGE.Image48Src;

export const STUDIOS_RAW = [
  {
    Image48Src: defaultImage,
    studioCatCode: ["MKT"],
    fixYN: false,
    image20Src: defaultImage,
    delYN: false,
    authYN: true,
    likeCnt: 12,
    shardStudioYN: false,
    assistName: "마케팅 스튜디오",
    image16Src: defaultImage,
    studioYN: true,
    regUserId: "user-1234",
    fileYN: false,
    assistId: "studio-marketing",
  },
  {
    Image48Src: defaultImage,
    studioCatCode: ["DEV", "OPS"],
    fixYN: false,
    image20Src: defaultImage,
    delYN: false,
    authYN: true,
    likeCnt: 8,
    shardStudioYN: true,
    assistName: "운영 장애 분석 스튜디오",
    image16Src: defaultImage,
    studioYN: true,
    regUserId: "user-1234",
    fileYN: true,
    assistId: "studio-ops",
  },
];
