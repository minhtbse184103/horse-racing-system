import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import API_BASE_URL from '../../../../configs/apiConfig';

/**
 * Subscribes to /topic/races/{raceId} (see backend RaceLiveBroadcastService)
 * only while `enabled` is true, so admin rows that aren't expanded don't
 * each hold open a socket. One envelope shape, distinguished by `type`:
 * TICK carries Unity's raw per-tick payload (backend treats it as an
 * opaque relay, so we don't assume a shape here either), RESULT carries
 * RaceResultIngestResponse (raceId/status/recordedAt only — no
 * placements, since that endpoint doesn't return them).
 */
export default function useRaceLiveView(raceId, enabled) {
  const [connectionState, setConnectionState] = useState('idle');
  const [error, setError] = useState('');
  const [lastTick, setLastTick] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!enabled || raceId == null) {
      setConnectionState('idle');
      setError('');
      setLastTick(null);
      setResult(null);
      return;
    }

    setConnectionState('connecting');
    setError('');
    setLastTick(null);
    setResult(null);

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-race`),
      reconnectDelay: 4000,
      onConnect: () => {
        setConnectionState('connected');
        client.subscribe(`/topic/races/${raceId}`, (message) => {
          let envelope;
          try {
            envelope = JSON.parse(message.body);
          } catch {
            return;
          }
          if (envelope.type === 'TICK') setLastTick(envelope.data);
          else if (envelope.type === 'RESULT') setResult(envelope.data);
        });
      },
      onStompError: (frame) => {
        setConnectionState('error');
        setError(frame.headers?.message || 'Mất kết nối realtime.');
      },
      onWebSocketClose: () => {
        setConnectionState((current) => (current === 'error' ? current : 'connecting'));
      }
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [raceId, enabled]);

  return { connectionState, error, lastTick, result };
}
