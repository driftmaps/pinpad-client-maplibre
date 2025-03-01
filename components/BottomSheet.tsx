import React from 'react';
import { StyleSheet, View, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';

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
  testID = 'bottom-sheet',
}: BottomSheetProps) {
  return visible ? (
    <View
      style={[StyleSheet.absoluteFill, styles.container]}
      pointerEvents="box-none"
      testID={testID}
      accessible={false}
      focusable={false}
    >
      <View
        style={styles.contentContainer}
        pointerEvents="box-none"
        accessible={false}
        focusable={false}
      >
        {children}
      </View>
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
