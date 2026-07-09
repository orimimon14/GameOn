import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { CallManager } from './CallManager';
import { answerCall, declineCall, subscribeIncomingCalls } from './callService';
import { useCallStore } from './callStore';

import { useUserStore } from '@/shared/store/userStore';

// App-level call host — the overlay/banner must live outside the chat screen
// so navigating never drops a live call.
vi.mock('./callService', () => ({
  answerCall: vi.fn(),
  declineCall: vi.fn(),
  subscribeIncomingCalls: vi.fn(),
}));

vi.mock('@/config/firebase', () => ({
  getFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({ data: () => ({ displayName: 'יעל' }) })),
}));

const incoming = {
  callId: 'call1',
  chatId: 'chat1',
  callerUid: 'u2',
  calleeUid: 'me',
  type: 'voice',
  status: 'ringing',
};

describe('CallManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ userDoc: { uid: 'me' } as never, status: 'ready' });
    useCallStore.setState({ activeCall: null, partnerName: '' });
    (subscribeIncomingCalls as Mock).mockImplementation((_uid, onIncoming) => {
      onIncoming(incoming);
      return () => undefined;
    });
  });

  it('shows the incoming banner with the caller name and answers', async () => {
    (answerCall as Mock).mockResolvedValue({
      callId: 'call1',
      chatId: 'chat1',
      type: 'voice',
      localStream: { getTracks: () => [], getAudioTracks: () => [], getVideoTracks: () => [] },
      remoteStream: {},
      hangUp: vi.fn(),
    });
    render(<CallManager />);
    expect(await screen.findByRole('dialog', { name: 'שיחה נכנסת' })).toBeInTheDocument();
    expect(await screen.findByText('יעל')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ענה' }));
    await waitFor(() => expect(answerCall).toHaveBeenCalled());
    expect(await screen.findByRole('dialog', { name: 'בשיחה' })).toBeInTheDocument();
    expect(useCallStore.getState().activeCall).toBeTruthy();
  });

  it('declines an incoming call', async () => {
    (declineCall as Mock).mockResolvedValue(undefined);
    render(<CallManager />);
    fireEvent.click(await screen.findByRole('button', { name: 'דחה' }));
    await waitFor(() => expect(declineCall).toHaveBeenCalled());
  });

  it('renders an active call from the store even with no incoming call', async () => {
    (subscribeIncomingCalls as Mock).mockImplementation(() => () => undefined);
    useCallStore.setState({
      activeCall: {
        callId: 'c9',
        chatId: 'chat1',
        type: 'video',
        localStream: { getTracks: () => [], getAudioTracks: () => [], getVideoTracks: () => [] },
        remoteStream: {},
        hangUp: vi.fn(),
      } as never,
      partnerName: 'אורן',
    });
    render(<CallManager />);
    expect(await screen.findByRole('dialog', { name: 'בשיחה' })).toBeInTheDocument();
    expect(screen.getByText('אורן')).toBeInTheDocument();
  });
});
