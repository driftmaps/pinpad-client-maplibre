import React from 'react';
import { StyleSheet, View, Modal, Pressable } from 'react-native';

export function BottomSheet({ 
  visible, 
  onClose, 
  children, 
  testID = 'bottom-sheet' 
}: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={onClose}
      >
        <View 
          style={styles.contentContainer}
          // Prevent taps on the content from closing the modal
          onStartShouldSetResponder={() => true}
        >
          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
