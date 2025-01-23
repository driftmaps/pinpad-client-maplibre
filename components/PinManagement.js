import React from 'react';
import { BottomSheet } from './BottomSheet';
import { PinDetailsView } from './PinDetailsView';
import { PinCreationForm } from './PinCreationForm';

export function PinManagement({
  selectedLocation,
  selectedPin,
  onClose,
  onPinCreate,
  onPinDelete,
  onUpdatePendingPin
}) {
  return (
    <BottomSheet
      visible={!!selectedLocation}
      onClose={onClose}
    >
      {selectedPin ? (
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
