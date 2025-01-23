import { useState, useCallback, useMemo, useRef } from 'react';
import { Pin, PinAction, Coordinates } from '../types/pin';

// TODO: Use a more intentional ID generation method
const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface PinManagerState {
  pins: Pin[];
  actions: PinAction[];
  pendingPin: boolean;
}

const PIN_ACTIONS = {
  SET_PENDING_PIN: 'SET_PENDING_PIN',
  FINALIZE_PENDING_PIN: 'FINALIZE_PENDING_PIN',
  CLEAR_PENDING_PIN: 'CLEAR_PENDING_PIN',
  DELETE_PIN: 'DELETE_PIN',
  UPDATE_PENDING_PIN: 'UPDATE_PENDING_PIN',
} as const;

type PinActionType = typeof PIN_ACTIONS[keyof typeof PIN_ACTIONS];

export function usePinsState() {
  const [state, setState] = useState<PinManagerState>({
    pins: [],
    actions: [],
    pendingPin: false,
  });

  const pendingOperationRef = useRef<boolean>(false);


  const dispatchPinAction = useCallback((action: PinAction) => {
    if (pendingOperationRef.current) {
      const allowedActions = [PIN_ACTIONS.SET_PENDING_PIN, PIN_ACTIONS.CLEAR_PENDING_PIN] as Array<PinActionType>;
      if (!allowedActions.includes(action.type as PinActionType)) {
        console.warn('Blocked by pending operation');
        return;
      }
    }


    setState(current => {
      pendingOperationRef.current = true;
      try {
        switch (action.type) {
          case PIN_ACTIONS.SET_PENDING_PIN: {
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

          case PIN_ACTIONS.FINALIZE_PENDING_PIN: {
            if (!current.pendingPin) return current;
            const pendingPinIndex = current.pins.findIndex(pin => pin.id === 'pending-pin');
            if (pendingPinIndex === -1) return current;
            const updatedPins = [...current.pins];
            updatedPins[pendingPinIndex] = {
              ...updatedPins[pendingPinIndex],
              ...(action.payload as Partial<Pin>),
            };
            return {
              ...current,
              pendingPin: false,
              pins: updatedPins,
              actions: [...current.actions, action],
            };
          }

          case PIN_ACTIONS.CLEAR_PENDING_PIN: {
            if (!current.pendingPin) return current;
            return {
              ...current,
              pendingPin: false,
              pins: current.pins.filter(pin => pin.id !== 'pending-pin'),
              actions: [...current.actions, action],
            };
          }

          case PIN_ACTIONS.DELETE_PIN: {
            const pinToDelete = action.payload as Pin;
            const filteredPins = current.pins.filter(pin => pin.id !== pinToDelete.id);
            return {
              ...current,
              pins: filteredPins,
              actions: [...current.actions, action],
            };
          }

          case PIN_ACTIONS.UPDATE_PENDING_PIN: {
            if (!current.pendingPin) return current;
            const pendingPinIndex = current.pins.findIndex(pin => pin.id === 'pending-pin');
            if (pendingPinIndex === -1) return current;

            const updatedPins = [...current.pins];
            updatedPins[pendingPinIndex] = {
              ...updatedPins[pendingPinIndex],
              ...(action.payload as Partial<Pin>),
            };

            return {
              ...current,
              pins: updatedPins,
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
        // Use setTimeout to ensure the ref is reset after React has processed the state update
        setTimeout(() => {
          pendingOperationRef.current = false;
        }, 0);
      }
    });
  }, []);

  const setPendingPin = useCallback((coordinates: Coordinates) => {
    dispatchPinAction({
      type: PIN_ACTIONS.SET_PENDING_PIN,
      payload: coordinates,
      timestamp: Date.now(),
    });
  }, [dispatchPinAction]);

  const finalizePendingPin = useCallback((pinData: Partial<Pin>) => {
    dispatchPinAction({
      type: PIN_ACTIONS.FINALIZE_PENDING_PIN,
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
      type: PIN_ACTIONS.DELETE_PIN,
      payload: id,
      timestamp: Date.now(),
    });
  }, [dispatchPinAction]);

  const clearPendingPin = useCallback(() => {
    dispatchPinAction({
      type: PIN_ACTIONS.CLEAR_PENDING_PIN,
      payload: null,
      timestamp: Date.now(),
    });
  }, [dispatchPinAction]);

  const updatePendingPin = useCallback((updates: Partial<Pin>) => {
    dispatchPinAction({
      type: PIN_ACTIONS.UPDATE_PENDING_PIN,
      payload: updates,
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
    updatePendingPin,
  };
}
