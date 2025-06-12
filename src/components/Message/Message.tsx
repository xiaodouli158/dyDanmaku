import React, { useEffect, useState } from 'react';
import { MessageType } from './index';

interface MessageProps {
  message?: string;
  type?: MessageType;
  duration?: number;
  onClose?: () => void;
}

const Message: React.FC<MessageProps> = ({
  message = '',
  type = 'default',
  duration = 3000,
  onClose
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 显示动画
    setTimeout(() => setVisible(true), 10);

    // 自动关闭
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setVisible(false);
    // 等待动画完成后调用关闭回调
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'help':
        return '?';
      default:
        return '';
    }
  };

  return (
    <div className={`sk-message ${type} ${visible ? 'visible' : ''}`}>
      <div className="sk-message-content">
        {getIcon() && <span className="sk-message-icon">{getIcon()}</span>}
        <span className="sk-message-text">{message}</span>
      </div>
    </div>
  );
};

export default Message;
