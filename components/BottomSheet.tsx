import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  testID?: string;
}

export function BottomSheet({ 
  visible, 
  onClose, 
  children, 
  testID = 'bottom-sheet' 
}: BottomSheetProps) {
  return visible ? (
    <View 
      style={[StyleSheet.absoluteFill, styles.container]} 
      pointerEvents="box-none"
      testID={testID}
    >
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
  },
  contentContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
    minHeight: '50%',
  },
});
