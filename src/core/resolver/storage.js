/**
 * @file core/resolver/storage.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {isNativeApp} from "@/core/config";
import {callNative} from "@/platform/bridge/web/bridgeClient";
import {logWarn} from "@/utils/logger";
import {createId} from "@/utils/id";

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getLocalStorage() {
  try {
    // [SSR 안전 가드]: 서버 사이드 렌더링 환경에서는 window나 localStorage가 없으므로 즉시 null 반환하여 크래시 방지
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const testKey = "__storage_test__";

    // [시크릿 모드 가드]: 브라우저가 사생활 보호(시크릿) 모드일 때 getItem 등은 되지만 setItem에서 예외 폭발이 일어나는 특성을 캐치하기 위한 원자적 쓰기/지우기 테스트 진행
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);

    return storage; // 테스트 통과 시에만 유효한 스토리지 객체 반환
  } catch {
    return null; // 스토리지 차단 상태(쿠키 거부, 용량 초과 등) 시 예외를 삼키고 폴백 유도용 null 반환
  }
}

// 브라우저 로컬 스토리지가 완전 마비되었을 때 인앱 세션 동안 데이터를 임시 적재할 힙(Heap) 메모리 격리 맵 인스턴스 생성
const memoryStorage = new Map();

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getFallback(key) {
  // 인메모리 맵에 값이 적재되어 있다면 꺼내오고, 없다면 안전한 디폴트 값인 null 반환
  return memoryStorage.has(key) ? memoryStorage.get(key) : null;
}
/**
 * store, DOM CSS 변수 또는 reactive 상태에 값을 반영합니다.
 */
function setFallback(key, value) {
  // 데이터 정합성 통일을 위해 어떤 원시 타입이 인입되든 무조건 문자열(String) 포맷으로 형변환하여 맵에 보관
  memoryStorage.set(key, String(value));
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function removeFallback(key) {
  memoryStorage.delete(key); // 인메모리 맵에 적재된 특정 캐시 키 삭제 소멸
}
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createRequest(payload = {}) {
  return {
    // 앱과 네이티브 간 비동기 메시징 및 로깅 추적을 고유하게 식별할 임의 유니크 ID 스트링 생성
    requestId: createId(),
    requestDate: new Date().toISOString(), // ISO 표준 타임스탬프 스탬핑
    ...payload, // 전송할 실제 데이터 본문 결합
  };
}
/**
 * 문자열 또는 stream buffer를 의미 있는 frame/object로 파싱합니다.
 */
function parseEnvelope(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw; // 이미 객체화되어 들어온 데이터라면 가공 없이 우회 패스
  try {
    return JSON.parse(raw); // 스트링 형태로 수신된 데이터 패킷을 JSON 객체 구조로 리파싱 완료
  } catch (error) {
    // 파싱 파괴 국면 발생 시 시스템 가드를 위해 경고 덤프를 남기고 안전하게 null 반환
    logWarn("[storage] invalid native response", error);

    return null;
  }
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function callDirectStorage(bridge, methodName, payload) {
  const method = bridge?.[methodName];
  if (typeof method !== "function") return null; // 실행할 브릿지 내부의 네이티브 메서드가 인터페이스 상에 없으면 조기 차단
  try {
    // [중요 동기화 직렬화]: 안드로이드 자바 인터페이스 인터셉터를 호출하기 위해 요청 프레임을 문자열화하여 다이렉트 인보크 실행
    return parseEnvelope(
      method.call(bridge, JSON.stringify(createRequest(payload)))
    );
  } catch (error) {
    // 브릿지 통신선 붕괴 시 경고를 기록하고 폴백 레이어로 넘어가도록 유도
    logWarn(`[storage] AndroidBridge.${methodName} failed`, error);

    return null;
  }
}
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createLocalStorageAdapter() {
  const local = getLocalStorage(); // 최초 1회 브라우저 스토리지 무결성 검증 수행

  return {
    // 로컬 스토리지에 데이터가 있으면 꺼내고, 차단/유실 상태라면 최종 인메모리 맵(`getFallback`)에서 조회
    get: (key) => local?.getItem(key) ?? getFallback(key),
    set: (key, value) => {
      if (local) local.setItem(key, String(value)); // 영속성 저장 공간이 살아있다면 물리 적재
      setFallback(key, value); // 메모리 캐시 맵에도 동시 업데이트하여 이중 동기화 체결
    },
    remove: (key) => {
      local?.removeItem(key); // 영속성 물리 키 제거
      removeFallback(key); // 인메모리 맵 캐시 키 제거
    },
  };
}

/**
 * @description 하이브리드 앱 환경과 일반 웹 브라우저 환경에 최적화된 동기/비동기 통합 스토리지 인프라 조작 객체를 동적 조합 및 배출합니다.
 * @param {object} appInfo - core/config 단에서 분석 완료되어 인입된 앱 실행 환경 메타 스냅샷
 * @param {object} bridge - core/resolver/bridge 단에서 리졸브된 가용 네이티브/더미 브릿지 인스턴스
 * @returns {object} 동기(`get/set/remove`) 및 비동기(`getAsync/setAsync/removeAsync`) 규격이 완비된 스토리지 컨트롤러 팩
 */
export function resolveStorage(appInfo, bridge) {
  const localStorageAdapter = createLocalStorageAdapter(); // 웹용 기본 어댑터 인프라 가동

  // ==========================================
  // [분기 A]: 안드로이드/iOS 네이티브 앱 환경인 경우
  // ==========================================
  if (isNativeApp(appInfo)) {
    return {
      get(key) {
        // 앱 네이티브 파일 시스템/SharedPreferences 영역에서 동기식 데이터 동적 수색 호출
        const response = callDirectStorage(bridge, "getStorage", {key});
        // 네이티브에서 성공 신호가 오면 해당 값을 채택하되, 내부에 실질 데이터 밸류가 비어있다면 웹 로컬 스토리지 어댑터 보정값으로 세컨드 폴백
        if (response?.isSuccess)
          return response.data?.value ?? localStorageAdapter.get(key);

        return localStorageAdapter.get(key); // 네이티브 조회 실패 시 웹 로컬 스토리지로 서드 폴백
      },
      set(key, value) {
        // 기기 영속 저장소에 동기식 데이터 쓰기 명령 전송
        const response = callDirectStorage(bridge, "setStorage", {
          key,
          value: String(value),
        });
        if (!response?.isSuccess)
          logWarn(
            "[storage] native setStorage fallback used",
            response?.message
          );
        localStorageAdapter.set(key, value); // 네이티브 성공 여부와 무관하게 프론트엔드 자체 영속 메모리 레이어도 철저히 동시 동기화 마감
      },
      remove(key) {
        // 기기 영속 저장소 내부의 물리 캐시 키 삭제 명령 전송
        const response = callDirectStorage(bridge, "removeStorage", {key});
        if (!response?.isSuccess && response)
          logWarn(
            "[storage] native removeStorage fallback used",
            response?.message
          );
        localStorageAdapter.remove(key); // 프론트엔드 자체 영속 메모리 레이어도 클린 청소
      },

      // [대용량/IO 병목 방지 비동기 메서드 라인]: 메인 UI 스레드 렌더링 프레임 저하를 차단하는 프라미스(Promise) 채널 기반 인터랙션
      async getAsync(key) {
        try {
          // 비동기 전용 커스텀 기기 통신 라이브러리(`callNative`)를 통해 백그라운드 스레드에서 안전하게 데이터 로드
          const response = await callNative("GET_STORAGE", {key});

          return response?.data?.value ?? localStorageAdapter.get(key); // 밸류 부재 시 웹 로컬 어댑터 값으로 안전 보정 폴백
        } catch (error) {
          logWarn("[storage] native getAsync fallback used", error);

          return localStorageAdapter.get(key); // 채널 크래시 발생 시 웹 로컬 어댑터로 강제 원상 복귀
        }
      },
      async setAsync(key, value) {
        try {
          // 백그라운드 스레드 비동기 적재 채널 개통
          await callNative("SET_STORAGE", {key, value: String(value)});
        } catch (error) {
          logWarn("[storage] native setAsync fallback used", error);
        }
        localStorageAdapter.set(key, value); // 프론트엔드 인메모리 및 웹뷰 물리 공간 동시 정착 완수
      },
      async removeAsync(key) {
        try {
          // 백그라운드 스레드 비동기 키 소멸 채널 개통
          await callNative("REMOVE_STORAGE", {key});
        } catch (error) {
          logWarn("[storage] native removeAsync fallback used", error);
        }
        localStorageAdapter.remove(key); // 프론트엔드 샌드박스 청소
      },
    };
  }

  // ==========================================
  // [분기 B]: 일반 PC/모바일 웹 브라우저 환경인 경우 (기본값 폴백)
  // ==========================================
  return {
    ...localStorageAdapter, // 기본 동기식 조작계(`get, set, remove`)를 어댑터 사양 그대로 일원화 전개 바인딩

    // 일반 웹은 네이티브 비동기 하드웨어 채널이 없으므로, 다형성 인터페이스 규격을 맞추기 위해 동기 어댑터 동작 결과를 프라미스 구조(`Promise.resolve`)로 포장 가공하여 즉시 반환
    getAsync: (key) => Promise.resolve(localStorageAdapter.get(key)),
    setAsync: (key, value) => {
      localStorageAdapter.set(key, value);

      return Promise.resolve(); // 인터페이스 동기화를 위한 빈 성공 프로미스 방출 마감
    },
    removeAsync: (key) => {
      localStorageAdapter.remove(key);

      return Promise.resolve();
    },
  };
}
