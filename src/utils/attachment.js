import {createId} from '@/utils/id';

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description inferMimeType 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} name - name 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function inferMimeType(name = '') {
  const normalized = name.toLowerCase();
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/\.png$/.test(normalized)) return 'image/png';
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/\.(jpg|jpeg)$/.test(normalized)) return 'image/jpeg';
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/\.gif$/.test(normalized)) return 'image/gif';
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/\.webp$/.test(normalized)) return 'image/webp';
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/\.bmp$/.test(normalized)) return 'image/bmp';
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/\.(heic|heif)$/.test(normalized)) return 'image/heic';
  // 계산된 결과를 호출부로 반환합니다.
  return '';
}

/**
 * @description isImageFile 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} file - file 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function isImageFile(file) {
  // 계산된 결과를 호출부로 반환합니다.
  return Boolean(
    file?.type?.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file?.name || '')
  );
}

/**
 * @description createBrowserAttachment 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} file - file 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function createBrowserAttachment(file) {
  const image = isImageFile(file);
  const objectUrl = URL.createObjectURL(file);
  // 계산된 결과를 호출부로 반환합니다.
  return {
    id: createId('attachment'),
    name: file.name || '첨부 파일',
    size: file.size || 0,
    type: file.type || inferMimeType(file.name) || 'application/octet-stream',
    kind: image ? 'image' : 'file',
    url: objectUrl,
    previewUrl: objectUrl,
    dataUrl: '',
    previewError: false,
    file,
  };
}

/**
 * @description createNativeAttachment 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} file - file 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function createNativeAttachment(file) {
  const type = file.type || inferMimeType(file.name) || 'application/octet-stream';
  // 계산된 결과를 호출부로 반환합니다.
  return {
    id: createId('attachment'),
    name: file.name || '네이티브 첨부 파일',
    size: file.size || 0,
    type,
    kind: type.startsWith('image/') ? 'image' : 'file',
    url: file.uri || '',
    previewUrl: file.uri || '',
    dataUrl: '',
    previewError: false,
    nativeFile: file,
  };
}

/**
 * @description revokeAttachmentUrl 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} attachment - attachment 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function revokeAttachmentUrl(attachment) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (attachment?.url?.startsWith?.('blob:')) URL.revokeObjectURL(attachment.url);
}

/**
 * @description hydrateImageAttachment 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} attachment - attachment 입력값입니다.
 * @param {*} onHydrated - onHydrated 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function hydrateImageAttachment(attachment, onHydrated) {
  const sourceFile = attachment?.file;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!sourceFile || typeof FileReader === 'undefined') return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = typeof reader.result === 'string' ? reader.result : '';
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (dataUrl) onHydrated?.(dataUrl);
  };
  reader.onerror = () => {
    attachment.previewError = true;
  };
  reader.readAsDataURL(sourceFile);
}


/**
 * @description formatFileSize 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} size - size 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function formatFileSize(size) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!size) return '0 B';
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (size < 1024) return `${size} B`;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  // 계산된 결과를 호출부로 반환합니다.
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
