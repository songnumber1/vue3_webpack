/**
 * @file composables/prompt/usePromptAttachment.js
 * @description 프롬프트 입력 도메인 composable입니다. 텍스트/첨부/도구/모델 선택 상태와 submit emit을 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, nextTick, onBeforeUnmount, ref} from "vue";
import {useEventListener} from "@vueuse/core";
import {usePlatformStore} from "@/stores/platformStore";
import {openNativeFilePicker} from "@/platform/bridge/platformBridge";
import {
  createBrowserAttachment,
  createNativeAttachment,
  imageAttachment,
  revokeAttachmentUrl,
} from "@/utils/attachment";
import {logWarn} from "@/utils/logger";
import {
  ANDROID_TO_JS_EVENT,
  ATTACH_MENU_OPTIONS,
  FILE_PICKER_TYPE,
  IMAGE_PREVIEW_EVENT,
  NATIVE_FILE_SELECTED_TYPE,
  PROMPT_MENU_TYPE,
} from "@/constants/promptComposer";
import {useI18n} from "vue-i18n";

/**
 * @function usePromptAttachment
 * @description 웹(Web)과 네이티브 하이브리드 앱(Android WebView) 소스를 관통하여 채팅 첨부파일을 수렴, 정형화 및 메모리 관리하는 컴포저블입니다.
 * @param {Object} context - 부모 입력창 컴포넌트 등 외부와 인터랙션하기 위한 인터페이스 메서드 셋
 * @param {Ref<boolean>} context.attachMenuOpen - 첨부 옵션 레이어 팝업의 개폐 상태 상태 값
 * @param {Function} context.resize - 파일 칩 추가/제거 시 입력창의 유동적 높이를 재계산하는 보정 함수
 * @param {Function} context.getLastHeight - 변경 완료된 최종 입력 텍스트박스 높이 게터 함수
 * @param {Function} context.emit - 컴포넌트 아웃풋 이벤트를 상위 레이어로 송출하기 위한 상속 함수
 * @param {Ref<boolean>} context.disabled - 현재 스트리밍 중이거나 전송 불능 상태인 경우 클릭을 막는 가드 플래그
 * @param {Function} context.toggleMenu - 메뉴바 오버레이 컴포넌트들의 개폐 포커스를 전환 제어하는 라우팅 함수
 */
export function usePromptAttachment({
  attachMenuOpen,
  resize,
  getLastHeight,
  emit,
  disabled,
  toggleMenu,
}) {
  const {t} = useI18n();
  const platformStore = usePlatformStore();

  // 숨겨진 원시 파일 업로드 마크업 돔 요소 레퍼런스 (<input type="file" ref="fileInputRef" />)
  const fileInputRef = ref(null);
  // 현재 입력 대기 상태인 파일 객체들이 정형화되어 누적 적치되는 메인 배열
  const attachments = ref([]);
  const fileAccept = ref("");
  const captureMode = ref(null);

  // 안드로이드 하이브리드 앱 환경일 때만 카메라/갤러리 전용 다이렉트 팝업 메뉴를 개통시킵니다.
  const showCameraMenu = computed(() => platformStore.info.isAndroidApp);

  // 디바이스 사양에 맞게 노출할 첨부 메뉴 옵션 가치를 필터링하고 다국어 라벨을 맵핑 가공합니다.
  const attachOptions = computed(() =>
    ATTACH_MENU_OPTIONS.filter(
      (option) => !option.requiresCamera || showCameraMenu.value
    ).map((option) => ({
      ...option,
      label: t(option.labelKey),
    }))
  );

  /**
   * 첨부 팝업 옵션 메뉴창(클립 아이콘 클릭 시점)을 토글하여 전격 화면에 바인딩합니다.
   */
  function openAttachSelector() {
    if (disabled.value) return;

    toggleMenu(PROMPT_MENU_TYPE.attach);
  }

  /**
   * @function openFilePicker
   * @description [하이브리드 브릿지 분기] 실제 파일 선택기나 카메라 연동 트랜잭션을 실행합니다.
   * @param {string} type - 선택할 미디어 카테고리 규격 (all, image, document 등)
   */
  async function openFilePicker(type = FILE_PICKER_TYPE.all) {
    if (disabled.value) return;
    attachMenuOpen.value = false; // 타깃 피커가 가동되므로 열려있던 단순 메뉴 팝업은 닫아줍니다.

    const option =
      ATTACH_MENU_OPTIONS.find((item) => item.id === type) ||
      ATTACH_MENU_OPTIONS.find((item) => item.id === FILE_PICKER_TYPE.all);

    // 코어 루트 A: 안드로이드 네이티브 앱 환경인 경우 자바스크립트 브릿지 통신 관로를 개통합니다.
    if (platformStore.info.isAndroidApp) {
      try {
        await openNativeFilePicker({
          source: option.nativeSource,
          multiple: option.multiple,
          accept: option.accept,
        });
        return; // 성공 시 자바스크립트 고유 인풋 클릭 처리를 생략하고 탈출합니다.
      } catch (error) {
        logWarn(
          "Android file picker failed. Falling back to web input.",
          error
        );
        // 안드로이드 코어 연동 결함 시 일반 웹 표준 인풋 방식으로 아래서 자동 폴백 복구 처리됩니다.
      }
    }

    // 코어 루트 B: 데스크톱/일반 모바일 웹 브라우저 환경인 경우 표준 DOM 트리거 가동
    const input = fileInputRef.value;
    if (!input) return;

    fileAccept.value = option.accept;
    captureMode.value = option.capture;

    // HTML5 표준 속성을 타깃 사양에 맞게 동적으로 마운트 바인딩 변환합니다.
    input.setAttribute("accept", option.accept);
    if (option.capture) input.setAttribute("capture", option.capture);
    else input.removeAttribute("capture");

    input.value = ""; // 동일 파일 연속 재업로드 인식을 위한 인풋 버퍼 초기화 리셋
    input.click(); // 브라우저 파일 선택 다이얼로그 강제 팝업 트리거
  }

  /**
   * @function handleNativeFileSelected
   * @description [안드로이드 전용 콜백 버스 리스너] 하이브리드 브릿지 파이프라인을 거쳐
   * 안드로이드 OS 원격지에서 가공 반환된 파일 데이터 패킷 주소를 수신하여 정형화 리스트에 큐잉합니다.
   */
  function handleNativeFileSelected(event) {
    const detail = event?.detail || {};
    if (detail.type !== NATIVE_FILE_SELECTED_TYPE) return;

    const nativeFiles = detail.payload?.files || [];
    const mapped = nativeFiles.map(createNativeAttachment);

    if (mapped.length) attachments.value = [...attachments.value, ...mapped];
  }

  /**
   * 일반 표준 웹 브라우저 인풋 폼의 파일 선택이 완료되었을 때 진입하는 리스너 엔드포인트입니다.
   */
  function handleFileChange(event) {
    addFiles(event.target.files);
    event.target.value = ""; // 파일 할당 이벤트를 청소 리셋합니다.
  }

  /**
   * @function addFiles
   * @description 업로드 타깃으로 수임된 로우(Raw) 미디어 파일 파일 객체 리스트를 가공하여
   * 프론트엔드 말풍선 첨부용 데이터 모델로 변환 빌드 및 이미지 하이드레이션(섬네일 추출)을 전개합니다.
   */
  function addFiles(fileList) {
    const mapped = Array.from(fileList || []).map(createBrowserAttachment);
    if (!mapped.length) return;

    // 반응형 배열의 불변성을 보존하며 신규 첨부 자원을 기존 배열 꼬리에 결합 주입합니다.
    attachments.value = [...attachments.value, ...mapped];

    // 주입 완료된 파일 중 이미지 규격인 자원만 추려내어 화면 썸네일 노출용 Base64 DataURL을 동적 정밀 비동기 복원합니다.
    mapped
      .filter((file) => file.kind === "image")
      .forEach((attachment) => {
        imageAttachment(attachment, (dataUrl) => {
          const target = attachments.value.find(
            (file) => file.id === attachment.id
          );
          if (!target) return;
          target.dataUrl = dataUrl;
          target.previewUrl = dataUrl;
          target.previewError = false; // 이미지 복원 완결 청신호
        });
      });

    // 파일 칩 리스트 박스가 생성되며 입력창 하단 공간이 확장되므로, 넥스트 틱 주기에 마추어 바깥 레이아웃 높이를 재계산 전파합니다.
    nextTick(() => {
      resize();
      emit("height-change", getLastHeight());
    });
  }

  /**
   * 업로드된 이미지 파일이 깨졌거나 브라우저 권한 보안 오류로 썸네일 표현에 실패했을 때 유저 에러 처리를 마킹합니다.
   */
  function markPreviewError(file) {
    if (file) file.previewError = true;
  }

  /**
   * 첨부 칩 리스트 중 특정 썸네일 카드를 클릭했을 때, 글로벌 이미지 뷰어 팝업 컴포넌트 쪽으로 이벤트를 브로드캐스팅합니다.
   */
  function previewImage(file) {
    if (!file) return;
    const previewUrl = file.dataUrl || file.previewUrl || file.url || "";
    window.dispatchEvent(
      new CustomEvent(IMAGE_PREVIEW_EVENT, {
        detail: {...file, url: file.url || previewUrl, previewUrl},
      })
    );
  }

  /**
   * @function removeAttachment
   * @description 사용자가 특정 첨부 파일 칩의 'X' 마크를 눌러 개별 소거할 때 기동됩니다.
   * 브라우저 인메모리에 박제되어 좀비화된 오브젝트 주소(`Blob URL`) 자원을 영구 파괴 소멸하여 가비지 컬렉션을 즉시 유도합니다.
   */
  function removeAttachment(id) {
    const target = attachments.value.find((file) => file.id === id);
    revokeAttachmentUrl(target); // 인메모리 Blob 파괴 가드 작동

    attachments.value = attachments.value.filter((file) => file.id !== id);
    nextTick(resize); // 파일 칩 소멸에 따른 입력창 레이아웃 높이 동적 재축소 정렬
  }

  /**
   * [마스터 리셋] 질문 전송 성공 시점 혹은 취소 시점에 현재 쌓여있는 모든 대화창 첨부 자원 메모리를 영구 소거 청소합니다.
   */
  function clearAttachments() {
    attachments.value.forEach((file) => {
      revokeAttachmentUrl(file);
    });
    attachments.value = [];
  }

  // 안드로이드 자바 및 코틀린 레이어에서 웹뷰 인프라를 향해 쏴주는 원격 커스텀 파일 선택 완결 이벤트 버스 리스너 개통
  useEventListener(window, ANDROID_TO_JS_EVENT, handleNativeFileSelected);

  // 🧹 [메모리 누수 방어 가드]
  // 사용자가 질문 입력을 도중에 포기하고 뒤로가기를 누르거나 다른 메뉴방으로 라우터를 갈아타는 컴포넌트 소멸 파괴(`onBeforeUnmount`) 시점에,
  // 잔존 파일들의 인메모리 주소 할당량을 영구 박멸 청소함으로써 프론트엔드 메모리 적체 파열(Memory Leak) 현상을 전격 차단 가드합니다.
  onBeforeUnmount(() => {
    attachments.value.forEach((file) => {
      revokeAttachmentUrl(file);
    });
  });

  // 하위 마크업 템플릿 바인딩 뷰 및 버튼 컴포넌트 주입용 자원 팩 허브 분출
  return {
    fileInputRef,
    attachments,
    fileAccept,
    captureMode,
    attachOptions,
    openAttachSelector,
    openFilePicker,
    handleFileChange,
    addFiles,
    markPreviewError,
    previewImage,
    removeAttachment,
    clearAttachments,
  };
}
