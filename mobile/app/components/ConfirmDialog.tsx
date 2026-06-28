import React from 'react';
import { Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useConfirmStore } from '../store/confirmStore';
import { useColors } from '../theme/useColors';

const ConfirmDialog = () => {
  const Colors = useColors();
  const { visible, options, close } = useConfirmStore();

  if (!options) return null;

  const handleConfirm = () => {
    close();
    options.onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <TouchableWithoutFeedback onPress={close}>
        <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" alignItems="center" justifyContent="center" paddingHorizontal={28}>
          <TouchableWithoutFeedback>
            <YStack backgroundColor={Colors.white} borderRadius={18} padding={22} width="100%" gap={14}
              style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 }}>
              <Text fontSize={17} fontWeight="700" color={Colors.black}>{options.title}</Text>
              <Text fontSize={14} color={Colors.grayDark} lineHeight={20}>{options.message}</Text>
              <XStack gap={10} marginTop={6}>
                <TouchableOpacity onPress={close}
                  style={{ flex: 1, height: 46, borderRadius: 12, backgroundColor: Colors.bg,
                    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
                  <Text color={Colors.grayDark} fontWeight="600" fontSize={14}>{options.cancelLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm}
                  style={{ flex: 1, height: 46, borderRadius: 12,
                    backgroundColor: options.destructive ? '#FFF0F0' : Colors.yellow,
                    alignItems: 'center', justifyContent: 'center' }}>
                  <Text color={options.destructive ? Colors.red : Colors.black} fontWeight="700" fontSize={14}>
                    {options.confirmLabel}
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </TouchableWithoutFeedback>
        </YStack>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ConfirmDialog;
