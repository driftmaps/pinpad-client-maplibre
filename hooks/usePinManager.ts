import { useState, useCallback, useMemo, useRef } from 'react';
import { Pin, PinCreateInput, PinAction, Coordinates } from '../types/pin';

const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface PinManagerState {
  pins: Pin[];
  actions: PinAction[];
  pendingPin: boolean;
}

export function usePinManager() {
  const [state, setState] = useState<PinManagerState>({
    pins: [],
    actions: [],
    pendingPin: false,
  });

  const pendingOperationRef = useRef<boolean>(false);


  const dispatchPinAction = useCallback((action: PinAction) => {

    if (pendingOperationRef.current) {
      console.log('Blocked by pending operation'); // Debug log
      return;
    }

    pendingOperationRef.current = true;

    setState(current => {
      try {
        switch (action.type) {
          case 'SET_PENDING_PIN': {
            const coordinates = action.payload as Coordinates;

            return {
              ...current,
              pendingPin: true,
              pins: [
                ...current.pins.filter(pin => pin.id !== 'pending-pin'),
                {
                  id: 'pending-pin',
                  coordinates,
                  emoji: '📍',
                  message: '',
                  timestamp: action.timestamp,
                }
              ],
              actions: [...current.actions, action],
            };
          }

          case 'FINALIZE_PENDING_PIN': {
            if (!current.pendingPin) return current;
            let updatedPin = current.pins.find(pin => pin.id === 'pending-pin');
            updatedPin = {
              ...updatedPin,
              ...(action.payload as Partial<Pin>),
            } as Pin;
            return {
              ...current,
              pendingPin: false,
              pins: [...current.pins.filter(pin => pin.id !== 'pending-pin'), updatedPin],
              actions: [...current.actions, action],
            };
          }

          case 'CLEAR_PENDING_PIN': {
            if (!current.pendingPin) return current;

            return {
              ...current,
              pendingPin: false,
              pins: current.pins.filter(pin => pin.id !== 'pending-pin'),
              actions: [...current.actions, action],
            };
          }

          case 'PIN_DELETE': {
            return {
              ...current,
              pins: current.pins.filter(pin => pin.id !== action.payload),
              actions: [...current.actions, action],
            };
          }

          default: {
            console.warn(`Unhandled action type: ${action.type}`);
            return current;
          }
        }
      } catch (error) {
        console.error('Error in dispatchPinAction:', error);
        return current;
      } finally {
        pendingOperationRef.current = false;
      }
    });
  }, []);

  const setPendingPin = useCallback((coordinates: Coordinates) => {
    dispatchPinAction({
      type: 'SET_PENDING_PIN',
      payload: coordinates,
      timestamp: Date.now(),
    });
  }, [dispatchPinAction]);

  const finalizePendingPin = useCallback((pinData: Partial<Pin>) => {
    dispatchPinAction({
      type: 'FINALIZE_PENDING_PIN',
      payload: {
        id: generateId(),
        ...pinData,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  }, [dispatchPinAction]);

  const deletePin = useCallback((id: string) => {
    dispatchPinAction({
      type: 'PIN_DELETE',
      payload: id,
      timestamp: Date.now(),
    });
  }, [dispatchPinAction]);

  const clearPendingPin = useCallback(() => {
    dispatchPinAction({
      type: 'CLEAR_PENDING_PIN',
      payload: null,
      timestamp: Date.now(),
    });
  }, [dispatchPinAction]);


  const exportData = useCallback(() => {
    return {
      pins: state.pins,
      actions: state.actions,
      exportedAt: Date.now(),
    };
  }, [state]);

  const isValidPin = (pin: Pin | null | undefined): pin is Pin => {
    return pin != null &&
      typeof pin.id === 'string' &&
      pin.coordinates != null;
  };

  const pins = useMemo(() =>
    state.pins.filter(isValidPin),
    [state.pins, state.pendingPin]
  );

  return {
    pins,
    actions: state.actions,
    setPendingPin,
    finalizePendingPin,
    deletePin,
    clearPendingPin,
    exportData,
  };
}
