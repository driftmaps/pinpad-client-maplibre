import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { EmojiSelector } from './EmojiSelector';

interface PinCreationFormProps {
  onSubmit: (emoji: string, message: string) => void;
  onCancel: () => void;
}

export function PinCreationForm({ onSubmit, onCancel }: PinCreationFormProps) {
  const [emoji, setEmoji] = useState('📍');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    onSubmit(emoji, message);
    setMessage('');
    setEmoji('📍');
  };

  return (
    <View style={styles.container}>
      <EmojiSelector
        selected={emoji}
        onSelect={setEmoji}
        testID="emoji-selector"
      />
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Enter your message"
        testID="message-input"
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          testID="cancel-button"
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          testID="submit-button"
        >
          <Text style={styles.buttonText}>Add Pin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
