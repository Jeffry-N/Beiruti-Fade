import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';

interface ThemeModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'destructive' | 'cancel';
  }[];
  onDismiss?: () => void;
}

export default function ThemeModal({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', onPress: () => {} }],
  onDismiss,
}: ThemeModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = {
    bg: isDark ? '#0F0F0F' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#B5B5B5' : '#666',
    modalBg: isDark ? '#1E1E1E' : '#F7F7F7',
    border: isDark ? '#2F2F2F' : '#E0E0E0',
    primary: '#ED1C24',
    destructive: '#FF4D4F',
  };

  const handleButtonPress = (onPress?: () => void) => {
    // Close first so UX is snappy even if onPress is async
    if (onDismiss) onDismiss();
    if (onPress) {
      onPress();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.modalBg, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.subtext }]}>{message}</Text>

          <View style={[styles.buttonContainer, { backgroundColor: theme.modalBg, borderColor: theme.border }] }>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel;

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  style={[
                    styles.button,
                    {
                      borderTopWidth: index > 0 ? 1 : 0,
                      borderColor: theme.border,
                      backgroundColor: isPrimary ? theme.primary : theme.modalBg,
                    },
                  ]}
                  onPress={() => handleButtonPress(button.onPress)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: isDestructive
                          ? theme.destructive
                          : isCancel
                            ? theme.subtext
                            : '#FFFFFF',
                      },
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    borderWidth: 1,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  destructiveButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
