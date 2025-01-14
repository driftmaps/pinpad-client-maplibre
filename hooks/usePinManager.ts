import { useState, useCallback } from 'react';
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

  const dispatchPinAction = useCallback((action: PinAction) => {
    setState(current => {
      switch (action.type) {

        case 'SET_PENDING_PIN': {
          const coordinates = action.payload as Coordinates;
          return {
            pins: [...current.pins, {
              id: 'pending-pin',
              coordinates,
              emoji: '📍',
              message: '',
              timestamp: action.timestamp,
            }],
            actions: [...current.actions, action],
            pendingPin: true,
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

  return {
    pins: state.pins,
    actions: state.actions,
    setPendingPin,
    finalizePendingPin,
    deletePin,
    clearPendingPin,
    exportData,
  };
}
