import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { EmojiSelector } from './EmojiSelector';

interface PinCreationFormProps {
  onSubmit: (emoji: string, message: string) => void;
  onCancel: () => void;
  onEmojiSelect: (emoji: string) => void;
}

export function PinCreationForm({ onSubmit, onCancel, onEmojiSelect }: PinCreationFormProps) {
  const [emoji, setEmoji] = useState('📍');
  const [message, setMessage] = useState('');

  const handleEmojiSelect = useCallback((selectedEmoji: string) => {
    setEmoji(selectedEmoji);
    onEmojiSelect(selectedEmoji);
  }, [onEmojiSelect]);

  const handleSubmit = useCallback(() => {
    if (!emoji) return;
    onSubmit(emoji, message);
    
    // Delay the reset until after submission is processed
    requestAnimationFrame(() => {
      setMessage('');
      setEmoji('📍');
    });
  }, [emoji, message, onSubmit]);

  return (
    <View style={styles.container}>
      <EmojiSelector
        selected={emoji}
        onSelect={handleEmojiSelect}
        testID="emoji-selector"
      />
      <View style={styles.inputContainer}>
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
            disabled={!emoji}
          >
            <Text style={styles.buttonText}>Add Pin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  inputContainer: {
    justifyContent: 'flex-end',
    marginTop: 'auto',
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
