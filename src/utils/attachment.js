import {createId} from '@/utils/id';

export function inferMimeType(name = '') {
  const normalized = name.toLowerCase();
  if (/\.png$/.test(normalized)) return 'image/png';
  if (/\.(jpg|jpeg)$/.test(normalized)) return 'image/jpeg';
  if (/\.gif$/.test(normalized)) return 'image/gif';
  if (/\.webp$/.test(normalized)) return 'image/webp';
  if (/\.bmp$/.test(normalized)) return 'image/bmp';
  if (/\.(heic|heif)$/.test(normalized)) return 'image/heic';
  return '';
}

export function isImageFile(file) {
  return Boolean(
    file?.type?.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file?.name || '')
  );
}

export function createBrowserAttachment(file) {
  const image = isImageFile(file);
  const objectUrl = URL.createObjectURL(file);
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

export function createNativeAttachment(file) {
  const type = file.type || inferMimeType(file.name) || 'application/octet-stream';
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

export function revokeAttachmentUrl(attachment) {
  if (attachment?.url?.startsWith?.('blob:')) URL.revokeObjectURL(attachment.url);
}

export function hydrateImageAttachment(attachment, onHydrated) {
  const sourceFile = attachment?.file;
  if (!sourceFile || typeof FileReader === 'undefined') return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = typeof reader.result === 'string' ? reader.result : '';
    if (dataUrl) onHydrated?.(dataUrl);
  };
  reader.onerror = () => {
    attachment.previewError = true;
  };
  reader.readAsDataURL(sourceFile);
}
