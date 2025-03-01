import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pin } from '@/types/pin';

interface PinDetailsViewProps {
  pin: Pin;
  onClose: () => void;
  onDelete: (pin: Pin) => void;
}

export function PinDetailsView({ pin, onClose, onDelete }: PinDetailsViewProps) {
  return (
    <View style={styles.container} accessible={false}>
      <Text style={styles.emoji}>{pin.emoji}</Text>
      <Text
        // Force iOS to render the text
        style={[styles.message, { opacity: 1 }]}
        onLayout={e => {
          console.log(e.nativeEvent.layout);
        }}
        accessibilityLabel={pin.message}
        accessible={true}
        testID="pin-message"
        importantForAccessibility="no-hide-descendants"
        allowFontScaling={false}
        suppressHighlighting={true}
      >
        {pin.message}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.closeButton]}
          onPress={onClose}
          testID="close-button"
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => onDelete(pin)}
          testID="delete-button"
        >
          <Text style={styles.buttonText}>Delete Pin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
