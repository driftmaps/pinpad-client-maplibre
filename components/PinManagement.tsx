import React from 'react';
import { BottomSheet } from './BottomSheet';
import { PinDetailsView } from './PinDetailsView';
import { PinCreationForm } from './PinCreationForm';
import { Pin } from '../types/pin';


interface Location {
  latitude: number;
  longitude: number;
}

interface PinManagementProps {
  selectedLocation: Location | null;
  selectedPin: Pin | null;
  onClose: () => void;
  onPinCreate: (emoji: string, message: string) => void;
  onPinDelete: (pin: Pin) => void;
  onUpdatePendingPin: (updates: Partial<Pin>) => void;
}

export function PinManagement({
  selectedLocation,
  selectedPin,
  onClose,
  onPinCreate,
  onPinDelete,
  onUpdatePendingPin
}: PinManagementProps) {
  return (
    <BottomSheet
      visible={!!selectedLocation}
      onClose={onClose}>
      {
        selectedPin ? (
          <PinDetailsView
            pin={selectedPin}
            onClose={onClose}
            onDelete={onPinDelete}
          />
        ) : (
          <PinCreationForm
            onSubmit={onPinCreate}
            onCancel={onClose}
            onEmojiSelect={(emoji) => onUpdatePendingPin({ emoji })}
          />
        )}
    </BottomSheet>
  );
} 
