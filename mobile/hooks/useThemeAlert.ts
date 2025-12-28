import { useState, useRef, useCallback } from 'react';

interface AlertConfig {
  title: string;
  message: string;
  buttons?: {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'destructive' | 'cancel';
  }[];
}

export function useThemeAlert() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    buttons: [],
  });

  const show = useCallback((alertConfig: AlertConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const alert = useCallback(
    (title: string, message: string, buttons?: AlertConfig['buttons']) => {
      show({
        title,
        message,
        buttons: buttons || [{ text: 'OK', onPress: () => {} }],
      });
    },
    [show]
  );

  return {
    visible,
    config,
    show,
    hide,
    alert,
  };
}
