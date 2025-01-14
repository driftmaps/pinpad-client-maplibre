import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheetCore, { BottomSheetView } from '@gorhom/bottom-sheet';

export function BottomSheet({ 
  visible, 
  onClose, 
  children, 
  testID = 'bottom-sheet' 
}: BottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetCore>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      // Safely handle closing
      try {
        bottomSheetRef.current?.close();
      } catch (error) {
        console.log('BottomSheet close error:', error);
      }
    }
  }, [visible]);

  // Handle cleanup
  useEffect(() => {
    return () => {
      try {
        bottomSheetRef.current?.close();
      } catch (error) {
        console.log('BottomSheet cleanup error:', error);
      }
    };
  }, []);

  return (
    <BottomSheetCore
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      index={visible ? 0 : -1}
      testID={testID}
    >
      <BottomSheetView style={styles.contentContainer}>
        {children}
      </BottomSheetView>
    </BottomSheetCore>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
});
