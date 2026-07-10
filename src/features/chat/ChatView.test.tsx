import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { startCall, subscribeIncomingCalls } from './callService';
import { useCallStore } from './callStore';
import {
  loadChatPartnerProfiles,
  sendTextMessage,
  subscribeMessages,
  subscribeMyChats,
} from './chatApi';
import { ChatView } from './ChatView';

import type { ChatDocument, MessageDocument, PublicProfileDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

vi.mock('./chatApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./chatApi')>()),
  subscribeMyChats: vi.fn(),
  subscribeMessages: vi.fn(),
  sendTextMessage: vi.fn(),
  sendVideoMessage: vi.fn(),
  loadChatPartnerProfiles: vi.fn(),
  resolveMediaUrl: vi.fn(async () => 'https://x/video.webm'),
  markChatRead: vi.fn(async () => undefined),
}));

vi.mock('./callService', () => ({
  startCall: vi.fn(),
  answerCall: vi.fn(),
  declineCall: vi.fn(),
  subscribeIncomingCalls: vi.fn(),
}));

const chat = (chatId: string, partnerUid: string): ChatDocument =>
  ({
    chatId,
    matchId: chatId,
    participants: ['me', partnerUid],
    userA: 'me',
    userB: partnerUid,
    gameId: 'warzone',
    gameName: 'Call of Duty: Warzone',
    lastMessage: 'הודעה אחרונה',
    isActive: true,
  }) as unknown as ChatDocument;

const partnerProfile = (uid: string, displayName: string): PublicProfileDocument =>
  ({ uid, displayName, age: 25 }) as unknown as PublicProfileDocument;

const message = (id: string, senderId: string, text: string): MessageDocument =>
  ({ messageId: id, chatId: 'chat1', senderId, type: 'text', text, status: 'sent' }) as unknown as MessageDocument;

const renderView = () =>
  render(
    <MemoryRouter initialEntries={['/chat']}>
      <ChatView />
    </MemoryRouter>,
  );

describe('ChatView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ userDoc: { uid: 'me', isPro: false } as never, status: 'ready' });
    useCallStore.setState({ activeCall: null, partnerName: '' });
    (subscribeMyChats as Mock).mockImplementation((_uid, onChats) => {
      onChats([chat('chat1', 'u2')]);
      return () => undefined;
    });
    (subscribeMessages as Mock).mockImplementation((_chatId, onMessages) => {
      onMessages([message('m1', 'u2', 'היי!'), message('m2', 'me', 'מה קורה?')]);
      return () => undefined;
    });
    (subscribeIncomingCalls as Mock).mockImplementation(() => () => undefined);
    (loadChatPartnerProfiles as Mock).mockResolvedValue({ u2: partnerProfile('u2', 'יעל') });
    (sendTextMessage as Mock).mockResolvedValue(undefined);
  });

  it('renders the chat list with partner name and last message', async () => {
    renderView();
    expect(await screen.findByText('יעל')).toBeInTheDocument();
    expect(screen.getByText('הודעה אחרונה')).toBeInTheDocument();
  });

  it('opens a conversation and shows realtime messages', async () => {
    renderView();
    fireEvent.click(await screen.findByText('הודעה אחרונה'));
    expect(await screen.findByText('היי!')).toBeInTheDocument();
    expect(screen.getByText('מה קורה?')).toBeInTheDocument();
    expect(subscribeMessages).toHaveBeenCalledWith('chat1', expect.any(Function), expect.any(Function));
  });

  it('sends a text message', async () => {
    renderView();
    fireEvent.click(await screen.findByText('הודעה אחרונה'));
    const input = await screen.findByPlaceholderText('כתוב הודעה...');
    fireEvent.change(input, { target: { value: 'בוא נשחק' } });
    fireEvent.click(screen.getByRole('button', { name: 'שלח' }));
    await waitFor(() => expect(sendTextMessage).toHaveBeenCalledWith('chat1', 'me', 'בוא נשחק'));
  });

  it('starts a video call from the conversation header', async () => {
    (startCall as Mock).mockResolvedValue({
      callId: 'call1',
      chatId: 'chat1',
      type: 'video',
      localStream: { getTracks: () => [], getAudioTracks: () => [], getVideoTracks: () => [] },
      remoteStream: {},
      hangUp: vi.fn(),
    });
    renderView();
    fireEvent.click(await screen.findByText('הודעה אחרונה'));
    fireEvent.click(await screen.findByRole('button', { name: 'שיחת וידאו' }));
    await waitFor(() =>
      expect(startCall).toHaveBeenCalledWith('chat1', 'me', 'u2', 'video', expect.any(Function)),
    );
    await waitFor(() => expect(useCallStore.getState().activeCall).toBeTruthy());
    expect(useCallStore.getState().partnerName).toBe('יעל');
  });

  it('shows the Pro upsell when a Basic user taps the video-message button', async () => {
    renderView();
    fireEvent.click(await screen.findByText('הודעה אחרונה'));
    fireEvent.click(await screen.findByRole('button', { name: 'הקלט הודעת וידאו' }));
    expect(await screen.findByText('תמונות והודעות וידאו בצ׳אט הן הטבת Pro — שדרגו כדי לשלוח!')).toBeInTheDocument();
  });

  it('opens the recorder for a Pro user', async () => {
    useUserStore.setState({ userDoc: { uid: 'me', isPro: true } as never, status: 'ready' });
    renderView();
    fireEvent.click(await screen.findByText('הודעה אחרונה'));
    fireEvent.click(await screen.findByRole('button', { name: 'הקלט הודעת וידאו' }));
    expect(await screen.findByRole('dialog', { name: 'הודעת וידאו' })).toBeInTheDocument();
  });

  it('renders a video message bubble with a player', async () => {
    (subscribeMessages as Mock).mockImplementation((_chatId, onMessages) => {
      onMessages([
        { messageId: 'm3', chatId: 'chat1', senderId: 'u2', type: 'video', fileUrl: 'https://x/video.webm', status: 'sent' },
      ]);
      return () => undefined;
    });
    renderView();
    fireEvent.click(await screen.findByText('הודעה אחרונה'));
    await waitFor(() => expect(document.querySelector('video[src="https://x/video.webm"]')).toBeTruthy());
  });

  it('shows the empty state when there are no chats', async () => {
    (subscribeMyChats as Mock).mockImplementation((_uid, onChats) => {
      onChats([]);
      return () => undefined;
    });
    renderView();
    expect(await screen.findByText('אין עדיין שיחות — מאץ׳ חדש פותח שיחה!')).toBeInTheDocument();
  });
});
