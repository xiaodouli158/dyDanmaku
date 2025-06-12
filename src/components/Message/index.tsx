import React from 'react';
import ReactDOM from 'react-dom/client';
import MessageComponent from './Message';
import './Message.scss';

export type MessageType = 'info' | 'success' | 'warning' | 'error' | 'help' | 'default';

export interface MessageOptions {
  message?: string;
  type?: MessageType;
  duration?: number;
  onClose?: () => void;
}

interface MessageInstance {
  id: string;
  root: ReactDOM.Root;
  container: HTMLElement;
  close: () => void;
}

class MessageManager {
  private instances: MessageInstance[] = [];
  private seed = 1;

  private createMessage(options: MessageOptions) {
    const id = `message_${this.seed++}`;
    const container = document.createElement('div');
    container.className = 'sk-message-container';
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);

    const close = () => {
      const index = this.instances.findIndex(instance => instance.id === id);
      if (index > -1) {
        this.instances.splice(index, 1);
      }
      
      root.unmount();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      options.onClose?.();
    };

    const instance: MessageInstance = {
      id,
      root,
      container,
      close
    };

    this.instances.push(instance);

    root.render(
      <MessageComponent
        {...options}
        onClose={close}
      />
    );

    return { close };
  }

  info(message: string, options?: Omit<MessageOptions, 'message' | 'type'>) {
    return this.createMessage({ ...options, message, type: 'info' });
  }

  success(message: string, options?: Omit<MessageOptions, 'message' | 'type'>) {
    return this.createMessage({ ...options, message, type: 'success' });
  }

  warning(message: string, options?: Omit<MessageOptions, 'message' | 'type'>) {
    return this.createMessage({ ...options, message, type: 'warning' });
  }

  error(message: string, options?: Omit<MessageOptions, 'message' | 'type'>) {
    return this.createMessage({ ...options, message, type: 'error' });
  }

  help(message: string, options?: Omit<MessageOptions, 'message' | 'type'>) {
    return this.createMessage({ ...options, message, type: 'help' });
  }

  closeAll(type?: MessageType) {
    const instancesToClose = [...this.instances];
    for (const instance of instancesToClose) {
      if (!type) {
        instance.close();
      }
    }
  }
}

const messageManager = new MessageManager();

export default messageManager;
