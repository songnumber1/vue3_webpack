import {createId} from '@/utils/id';
import {i18n} from '@/i18n';

export async function loadSharedConversation(shareId) {
  const normalizedShareId = String(shareId || '').trim();
  const t = i18n.global.t;
  return [
    {
      id: createId('message'),
      role: 'user',
      content: t('chat.sharedMock.user', {
        shareId: normalizedShareId || 'unknown',
      }),
    },
    {
      id: createId('message'),
      role: 'assistant',
      content: t('chat.sharedMock.assistant'),
    },
  ];
}
