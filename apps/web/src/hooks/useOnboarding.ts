import { useState, useCallback } from 'react';

const TOUR_KEY = 'buzzr_tour_completed';

export function useOnboarding() {
  const [tourOpen, setTourOpen] = useState(() => {
    return !localStorage.getItem(TOUR_KEY);
  });

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true');
    setTourOpen(false);
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
    setTourOpen(true);
  }, []);

  return { tourOpen, completeTour, restartTour };
}
