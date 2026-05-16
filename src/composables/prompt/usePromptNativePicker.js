/**
 * @file usePromptNativePicker.js
 * @description Native Android picker bridge and browser file input fallback for PromptComposer.
 */

import {computed, ref} from 'vue';
import {usePlatformStore} from '@/stores/platformStore';
import {openNativeFilePicker} from '@/services/platformBridge';
import {logWarn} from '@/utils/logger';

/** @param {string} type Picker type. @returns {{source: string, multiple: boolean, accept: string, capture: string|null}} */
function getPickerConfig(type) {
  const isCamera = type === 'camera';
  const isImage = type === 'image' || isCamera;
  return {
    source: isCamera ? 'camera' : isImage ? 'image' : 'all',
    multiple: !isCamera,
    accept: isImage ? 'image/*' : '',
    capture: isCamera ? 'environment' : null,
  };
}

/**
 * @param {object} props Prompt props.
 * @param {Function} closeAttachMenu Closes attachment menu.
 * @returns {object} Native picker controller.
 */
export function usePromptNativePicker(props, closeAttachMenu) {
  const platformStore = usePlatformStore();
  const fileInputRef = ref(null);
  const fileAccept = ref('');
  const captureMode = ref(null);
  const showCameraMenu = computed(() => platformStore.info.isAndroidApp);

  /** @param {string} type Picker type. @returns {Promise<void>} */
  async function openFilePicker(type) {
    if (props.disabled) return;
    closeAttachMenu?.();

    const config = getPickerConfig(type);
    if (platformStore.info.isAndroidApp) {
      try {
        await openNativeFilePicker({
          source: config.source,
          multiple: config.multiple,
          accept: config.accept,
        });
        return;
      } catch (error) {
        logWarn('Android file picker failed. Falling back to web input.', error);
      }
    }

    const input = fileInputRef.value;
    if (!input) return;
    fileAccept.value = config.accept;
    captureMode.value = config.capture;
    input.setAttribute('accept', config.accept);
    if (config.capture) input.setAttribute('capture', config.capture);
    else input.removeAttribute('capture');
    input.value = '';
    input.click();
  }

  return {
    fileInputRef,
    fileAccept,
    captureMode,
    showCameraMenu,
    openFilePicker,
  };
}
