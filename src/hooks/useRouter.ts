import { useState, useEffect, useCallback } from 'react';

export type ViewState = 
  | 'race' 
  | 'schedule'
  | 'standings' 
  | 'profile' 
  | 'racer-races'
  | 'seasons' 
  | 'historical-standings' 
  | 'historical-racer-profile' 
  | 'tracks'
  | 'admin';

export interface RouterState {
  view: ViewState;
  selectedRacerId: string | null;
  selectedHistoricalSeason: any | null;
  selectedHistoricalRacerId: string | null;
}

export const useRouter = () => {
  const [initialized, setInitialized] = useState(false);
  const [state, setState] = useState<RouterState>({
    view: 'race',
    selectedRacerId: null,
    selectedHistoricalSeason: null,
    selectedHistoricalRacerId: null,
  });
  
  const [history, setHistory] = useState<RouterState[]>([]);
  const [forwardStack, setForwardStack] = useState<RouterState[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Skip URL updates until initialized
  useEffect(() => {
    if (!initialized) return;
    
    const params = new URLSearchParams();
    
    if (state.view !== 'race') {
      params.set('view', state.view);
    }
    
    if (state.selectedRacerId) {
      params.set('racer', state.selectedRacerId);
    }
    
    if (state.selectedHistoricalSeason) {
      params.set('season', state.selectedHistoricalSeason.id);
    }
    
    if (state.selectedHistoricalRacerId) {
      params.set('historicalRacer', state.selectedHistoricalRacerId);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    
    console.log('🔍 Updating URL to:', newUrl);
    window.history.replaceState(state, '', newUrl);
  }, [state, initialized]);

  // Parse URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newState: Partial<RouterState> = {};
    
    console.log('🔍 Parsing URL:', window.location.search);
    
    // Get the view from URL
    const view = params.get('view') as ViewState;
    const validViews: ViewState[] = ['race', 'schedule', 'standings', 'profile', 'seasons', 'historical-standings', 'historical-racer-profile', 'tracks', 'admin'];
    
    if (view && validViews.includes(view)) {
      newState.view = view;
      console.log('🔍 Restored view:', view);
    }
    
    const racerId = params.get('racer');
    if (racerId) {
      newState.selectedRacerId = racerId;
      // If we have a racer but no view or invalid view, default to profile
      if (!newState.view) {
        newState.view = 'profile';
      }
      console.log('🔍 Restored racerId:', racerId);
    }
    
    const seasonId = params.get('season');
    if (seasonId) {
      newState.selectedHistoricalSeason = { id: seasonId };
      if (!newState.view) {
        newState.view = 'historical-standings';
      }
      console.log('🔍 Restored seasonId:', seasonId);
    }
    
    const historicalRacerId = params.get('historicalRacer');
    if (historicalRacerId) {
      newState.selectedHistoricalRacerId = historicalRacerId;
      if (!newState.view) {
        newState.view = 'historical-racer-profile';
      }
      console.log('🔍 Restored historicalRacerId:', historicalRacerId);
    }
    
    // Always set initialized first
    setInitialized(true);
    
    // Only apply the state if there's a valid view to show
    if (newState.view) {
      console.log('🔍 Restoring state:', newState);
      setState(prev => ({ ...prev, ...newState }));
    } else {
      console.log('🔍 No valid view in URL, staying on default race view');
    }
  }, []);

  const navigate = (updates: Partial<RouterState>, addToHistory = true) => {
    if (addToHistory) {
      setHistory(prev => [...prev, state]);
      setForwardStack([]); // Clear forward stack on new navigation
    }

    const newView = updates.view;
    let clearedState: Partial<RouterState> = {};
    
    if (newView && newView !== state.view) {
      if (newView === 'standings' || newView === 'schedule' || newView === 'race' || newView === 'tracks' || newView === 'seasons' || newView === 'admin') {
        clearedState = {
          selectedRacerId: null,
          selectedHistoricalSeason: null,
          selectedHistoricalRacerId: null,
        };
      } else if (newView === 'profile') {
        clearedState = {
          selectedHistoricalSeason: null,
          selectedHistoricalRacerId: null,
        };
      } else if (newView === 'historical-standings') {
        clearedState = {
          selectedRacerId: null,
          selectedHistoricalRacerId: null,
        };
      } else if (newView === 'historical-racer-profile') {
        clearedState = {
          selectedRacerId: null,
        };
      }
    }

    setState(prev => ({ ...prev, ...clearedState, ...updates }));
  };

  const goBack = () => {
    if (history.length === 0) return;
    
    const previous = history[history.length - 1];
    setForwardStack(prev => [...prev, state]);
    setHistory(prev => prev.slice(0, -1));
    setState(previous);
  };

  const goForward = () => {
    if (forwardStack.length === 0) return;
    
    const next = forwardStack[forwardStack.length - 1];
    setHistory(prev => [...prev, state]);
    setForwardStack(prev => prev.slice(0, -1));
    setState(next);
  };

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const canGoBack = history.length > 0;
  const canGoForward = forwardStack.length > 0;

  return {
    ...state,
    navigate,
    goBack,
    goForward,
    refresh,
    canGoBack,
    canGoForward,
    refreshKey,
  };
};