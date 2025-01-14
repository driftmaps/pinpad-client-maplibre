import { useState, useCallback } from 'react';
import { Pin, PinCreateInput, PinAction } from '../types/pin';

const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface PinManagerState {
  pins: Pin[];
  actions: PinAction[];
}

export function usePinManager() {
  const [state, setState] = useState<PinManagerState>({
    pins: [],
    actions: [],
  });

  const dispatchPinAction = useCallback((action: PinAction) => {
    setState(current => {
      const newState = { ...current };

      switch (action.type) {
        case 'PIN_CREATE': {
          const newPin = {
            ...(action.payload as PinCreateInput),
            id: generateId(),
            timestamp: Date.now(),
          };
          const nonPlaceholderPins = current.pins.filter(pin => !pin.isPlaceholder);
          return {
            ...current,
            pins: [...nonPlaceholderPins, newPin],
            actions: [...current.actions, action],
          };
        }

        case 'SET_PLACEHOLDER': {
          const coordinates = action.payload as Coordinates;
          return {
            ...current,
            pins: [
              ...current.pins.filter(pin => !pin.isPlaceholder),
              {
                id: 'placeholder',
                coordinates,
                emoji: '📍',
                message: '',
                isPlaceholder: true,
                timestamp: action.timestamp,
              }
            ]
          };
        }

        case 'PIN_UPDATE':
          const { id, ...updates } = action.payload as Partial<Pin> & { id: string };
          newState.pins = current.pins.map(pin =>
            pin.id === id ? { ...pin, ...updates } : pin
          );
          break;

        case 'PIN_DELETE':
          newState.pins = current.pins.filter(
            pin => pin.id !== action.payload
          );
          break;

        case 'CLEAR_PLACEHOLDERS': {
          return {
            ...current,
            pins: current.pins.filter(pin => !pin.isPlaceholder),
          };
        }

        default:
          console.warn(`Unhandled action type: ${action.type}`);
          return current;
      }

      // Record the action in history
      newState.actions = [...current.actions, action];
      return newState;
    });
  }, []);

  const createPin = useCallback((input: PinCreateInput) => {
    dispatchPinAction({
      type: 'PIN_CREATE',
      payload: input,
      timestamp: Date.now(),
    });
  }, [dispatchPinAction]);

  const updatePin = useCallback((id: string, updates: Partial<Omit<Pin, 'id'>>) => {
    dispatchPinAction({
      type: 'PIN_UPDATE',
      payload: { id, ...updates },
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

  const setPlaceholderPin = useCallback((coordinates: Coordinates) => {
    dispatchPinAction({
      type: 'SET_PLACEHOLDER',
      payload: coordinates,
      timestamp: Date.now(),
    });
  }, [dispatchPinAction]);

  const clearPlaceholderPins = useCallback(() => {
    dispatchPinAction({
      type: 'CLEAR_PLACEHOLDERS',
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
    createPin,
    updatePin,
    deletePin,
    exportData,
    setPlaceholderPin,
    clearPlaceholderPins,
  };
}
