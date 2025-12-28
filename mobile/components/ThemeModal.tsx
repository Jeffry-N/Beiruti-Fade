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
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#AAA' : '#666',
    modalBg: isDark ? '#2A2A2A' : '#F5F5F5',
    border: isDark ? '#3A3A3A' : '#E0E0E0',
  };

  const handleButtonPress = (onPress?: () => void) => {
    if (onPress) {
      onPress();
    }
    if (onDismiss) onDismiss();
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

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  {
                    borderColor: theme.border,
                    borderTopWidth: index > 0 ? 1 : 0,
                    flex: 1,
                  },
                  button.style === 'destructive' && styles.destructiveButton,
                ]}
                onPress={() => handleButtonPress(button.onPress)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color:
                        button.style === 'destructive'
                          ? '#FF4444'
                          : button.style === 'cancel'
                            ? theme.text
                            : '#ED1C24',
                    },
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
