import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmojiSelector from './EmojiSelector';

interface EmojiSelectionForm {
  selected?: string;
  onSelect: (emoji: string) => void;
  testID?: string;
}

export function EmojiSelectionForm({ onSelect }: EmojiSelectionForm) {
  return (
    <View style={styles.container} testID={"emoji-selector"} accessible={false}>
      <EmojiSelector
        onEmojiSelected={onSelect}
        showSearchBar={false}
        showHistory={true}
        showSectionTitles={false}
        columns={6}
        showTabs={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabBar: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 8,
  },
});
