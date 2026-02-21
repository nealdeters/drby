import { useState, useEffect } from 'react';

export type ViewState = 
  | 'race' 
  | 'standings' 
  | 'profile' 
  | 'seasons' 
  | 'historical-standings' 
  | 'historical-racer-profile' 
  | 'tracks';

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
    
    const view = params.get('view') as ViewState;
    if (view && ['race', 'standings', 'profile', 'seasons', 'historical-standings', 'historical-racer-profile', 'tracks'].includes(view)) {
      newState.view = view;
      console.log('🔍 Restored view:', view);
    }
    
    const racerId = params.get('racer');
    if (racerId) {
      newState.selectedRacerId = racerId;
      newState.view = 'profile';
      console.log('🔍 Restored racerId:', racerId);
    }
    
    const seasonId = params.get('season');
    if (seasonId) {
      // This would need to be resolved with actual season data
      newState.selectedHistoricalSeason = { id: seasonId };
      newState.view = 'historical-standings';
    }
    
    const historicalRacerId = params.get('historicalRacer');
    if (historicalRacerId) {
      newState.selectedHistoricalRacerId = historicalRacerId;
      newState.view = 'historical-racer-profile';
    }
    
    if (Object.keys(newState).length > 0) {
      console.log('🔍 Restoring state:', newState);
      setState(prev => ({ ...prev, ...newState }));
    } else {
      console.log('🔍 No URL params to restore, using default state');
    }
    setInitialized(true);
  }, []);

  const navigate = (updates: Partial<RouterState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const goBack = () => {
    if (state.selectedHistoricalRacerId) {
      navigate({ selectedHistoricalRacerId: null, view: 'historical-standings' });
    } else if (state.selectedHistoricalSeason) {
      navigate({ selectedHistoricalSeason: null, view: 'seasons' });
    } else if (state.selectedRacerId) {
      navigate({ selectedRacerId: null, view: 'standings' });
    } else {
      navigate({ view: 'race' });
    }
  };

  return {
    ...state,
    navigate,
    goBack,
  };
};