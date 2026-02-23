import { useEffect, useRef, useState, useCallback } from 'react';
import { getAblyClient } from '../services/apiClient';
import { Racer, Track } from '../gameTypes';
import { API_URL, headers } from '../services/apiClient';

const CLIENT_ID_KEY = 'drby-client-id';
const LAST_RACE_ID_KEY = 'drby-last-race-id';
const LAST_PROCESSED_TICK_KEY = 'drby-last-processed-tick';

function getOrCreateClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

interface UseRaceCoordinatorProps {
  raceId: string | null;
  racers: Racer[];
  track: Track | null;
  isActive: boolean;
}

interface UseRaceCoordinatorResult {
  isCoordinator: boolean;
  isConnected: boolean;
}

export const useRaceCoordinator = ({
  raceId,
  racers,
  track,
  isActive,
}: UseRaceCoordinatorProps): UseRaceCoordinatorResult => {
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const clientIdRef = useRef(getOrCreateClientId());
  const channelRef = useRef<any>(null);
  const presenceRef = useRef<any>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const isCoordinatorRef = useRef(false);
  const lastProcessedTickRef = useRef<number>(-1);
  const pendingContinuationRef = useRef<boolean>(false);

  // Keep ref in sync with state
  useEffect(() => {
    isCoordinatorRef.current = isCoordinator;
  }, [isCoordinator]);

  const determineCoordinator = useCallback((members: any[]): string | null => {
    if (members.length === 0) return null;
    
    const sorted = [...members].sort((a, b) => {
      const aId = a.clientId || '';
      const bId = b.clientId || '';
      return aId.localeCompare(bId);
    });
    
    return sorted[0]?.clientId || null;
  }, []);

  const triggerRace = useCallback(async () => {
    if (!raceId || !track || racers.length === 0) {
      console.log('[Coordinator] Cannot trigger race: missing raceId, track, or racers');
      return;
    }

    console.log(`[Coordinator] Triggering race ${raceId} with ${racers.length} racers`);

    try {
      const response = await fetch(`${API_URL}/race-manager`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          raceId,
          racers,
          track,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Race manager returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[Coordinator] Race triggered successfully:`, result);
    } catch (err) {
      console.error('[Coordinator] Failed to trigger race:', err);
    }
  }, [raceId, racers, track]);

  const triggerContinuation = useCallback(async (contRaceId: string) => {
    console.log(`[Coordinator] Triggering continuation for race ${contRaceId}`);

    try {
      const response = await fetch(`${API_URL}/race-manager`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          raceId: contRaceId,
          continue: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Continuation returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[Coordinator] Continuation triggered:`, result);
    } catch (err) {
      console.error('[Coordinator] Failed to trigger continuation:', err);
    }
  }, []);

  useEffect(() => {
    if (!raceId || !isActive) {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
        presenceRef.current = null;
      }
      setIsCoordinator(false);
      setIsConnected(false);
      return;
    }

    const client = getAblyClient();
    if (!client) {
      console.error('[Coordinator] Ably client not initialized');
      return;
    }

    const channelName = `race:${raceId}:control`;
    const channel = client.channels.get(channelName);
    channelRef.current = channel;

    const enterPresence = async () => {
      try {
        await channel.presence.enter(clientIdRef.current);
        console.log(`[Coordinator] Entered presence on ${channelName} as ${clientIdRef.current}`);
      } catch (err) {
        console.error('[Coordinator] Failed to enter presence:', err);
      }
    };

    const setupPresence = async () => {
      await enterPresence();

      channel.subscribe('presence-sync', () => {
        console.log('[Coordinator] Presence sync received');
      });

      channel.presence.subscribe('enter', (member: any) => {
        console.log('[Coordinator] Member entered:', member.clientId);
      });

      channel.presence.subscribe('leave', async (member: any) => {
        console.log('[Coordinator] Member left:', member.clientId);
        
        if (member.clientId === clientIdRef.current) {
          return;
        }

        // Add delay to allow presence to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const members = await channel.presence.get();
        const newCoordinator = determineCoordinator(members);
        console.log('[Coordinator] Member left, new coordinator:', newCoordinator, 'myId:', clientIdRef.current);
        
        if (newCoordinator === clientIdRef.current) {
          setIsCoordinator(true);
          console.log('[Coordinator] I am now the coordinator!');
        }
      });

      channel.presence.subscribe('update', async () => {
        const members = await channel.presence.get();
        const coordinator = determineCoordinator(members);
        const amICoordinator = coordinator === clientIdRef.current;
        setIsCoordinator(amICoordinator);
        console.log('[Coordinator] Presence updated, am I coordinator:', amICoordinator);
      });

      const members = await channel.presence.get();
      const coordinator = determineCoordinator(members);
      const amICoordinator = coordinator === clientIdRef.current;
      setIsCoordinator(amICoordinator);
      setIsConnected(true);
      console.log('[Coordinator] Initial state - am I coordinator:', amICoordinator, 'coordinator:', coordinator);
    };

    setupPresence().catch((err) => {
      console.error('[Coordinator] Failed to setup presence:', err);
    });

    cleanupRef.current = () => {
      if (channelRef.current) {
        channel.presence.leave().catch(() => {});
        channelRef.current = null;
      }
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [raceId, isActive, determineCoordinator]);

  useEffect(() => {
    if (!raceId || !isActive) return;

    const channel = channelRef.current;
    if (!channel) return;

    const handleRaceTrigger = (message: any) => {
      const data = message.data;
      console.log('[Coordinator] Received race-trigger message:', data);

      if (data.raceId === raceId && isCoordinatorRef.current) {
        triggerRace();
      }
    };

    const handleContinuation = (message: any) => {
      const data = message.data;
      const messageTick = data.tickCount || 0;
      console.log('[Coordinator] Received continuation message:', data, 'my last processed:', lastProcessedTickRef.current);

      // Only process if this is a new tick we haven't handled yet
      if (data.raceId === raceId && isCoordinatorRef.current && messageTick > lastProcessedTickRef.current) {
        // Prevent multiple concurrent continuation triggers
        if (pendingContinuationRef.current) {
          console.log('[Coordinator] Continuation already pending, skipping duplicate');
          return;
        }
        
        pendingContinuationRef.current = true;
        lastProcessedTickRef.current = messageTick;
        
        triggerContinuation(data.raceId).finally(() => {
          pendingContinuationRef.current = false;
        });
      } else {
        console.log('[Coordinator] Skipping old continuation tick:', messageTick, 'our last:', lastProcessedTickRef.current);
      }
    };

    const handleRaceStopped = (message: any) => {
      const data = message.data;
      console.log('[Coordinator] Received race-stopped message:', data);

      if (data.raceId === raceId) {
        localStorage.removeItem(LAST_RACE_ID_KEY);
        lastProcessedTickRef.current = -1;
        pendingContinuationRef.current = false;
        console.log('[Coordinator] Cleared state due to race-stopped');
      }
    };

    channel.subscribe('race-trigger', handleRaceTrigger);
    channel.subscribe('continuation', handleContinuation);
    channel.subscribe('race-stopped', handleRaceStopped);

    return () => {
      if (channel) {
        channel.unsubscribe('race-trigger', handleRaceTrigger);
        channel.unsubscribe('continuation', handleContinuation);
        channel.unsubscribe('race-stopped', handleRaceStopped);
      }
    };
  }, [raceId, isActive, triggerRace, triggerContinuation]);

  useEffect(() => {
    if (!isCoordinator || !raceId || !track || racers.length === 0 || !isActive) {
      return;
    }

    const lastTriggeredRaceId = localStorage.getItem(LAST_RACE_ID_KEY);
    
    // Don't re-trigger the same race that was already triggered
    if (lastTriggeredRaceId === raceId) {
      console.log('[Coordinator] Race already triggered previously, skipping:', raceId);
      return;
    }

    const checkAndTriggerRace = async () => {
      // Add small random delay to reduce chance of race condition between multiple coordinators
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      // Double-check coordinator status after delay
      const members = await channelRef.current?.presence.get();
      if (!members) return;
      
      const coordinator = determineCoordinator(members);
      if (coordinator !== clientIdRef.current) {
        console.log('[Coordinator] Lost coordinator status during delay, aborting');
        return;
      }
      
      console.log('[Coordinator] Checking if race should be triggered:', raceId);
      try {
        const response = await fetch(`${API_URL}/race-manager?action=status&raceId=${raceId}`, {
          method: 'GET',
          headers,
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('[Coordinator] Race status check:', result);
          
          // Double-check: don't trigger if localStorage says this race was already triggered
          const lastTriggered = localStorage.getItem(LAST_RACE_ID_KEY);
          if (lastTriggered === raceId) {
            console.log('[Coordinator] Race already triggered (localStorage check), skipping');
            return;
          }
          
          // Final coordinator check before triggering
          const currentMembers = await channelRef.current?.presence.get();
          const currentCoordinator = determineCoordinator(currentMembers || []);
          if (currentCoordinator !== clientIdRef.current) {
            console.log('[Coordinator] Lost coordinator status before triggering, aborting');
            return;
          }
          
          if (!result.exists) {
            console.log('[Coordinator] Race not in progress, triggering...');
            localStorage.setItem(LAST_RACE_ID_KEY, raceId);
            lastProcessedTickRef.current = -1;
            triggerRace();
          } else if (result.isFinished) {
            console.log('[Coordinator] Race already finished, not re-triggering');
          } else {
            console.log('[Coordinator] Race already in progress, skipping trigger');
            // Sync tick count from server state
            if (result.tickCount !== undefined) {
              lastProcessedTickRef.current = result.tickCount;
            }
          }
        }
      } catch (err) {
        console.error('[Coordinator] Failed to check race status:', err);
      }
    };

    checkAndTriggerRace();
  }, [isCoordinator, raceId, track, racers, isActive, triggerRace]);

  return { isCoordinator, isConnected };
};
