import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmojiPicker from 'react-native-emoji-selector';

interface EmojiSelectorProps {
  selected?: string;
  onSelect: (emoji: string) => void;
  testID?: string;
}

export function EmojiSelector({ onSelect, testID }: EmojiSelectorProps) {
  return (
    <View style={styles.container} testID={testID}>
      <EmojiPicker
        onEmojiSelected={onSelect}
        showSearchBar={true}
        showHistory={true}
        columns={8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: '#fff',
  },
});
