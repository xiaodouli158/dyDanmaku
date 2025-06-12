import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { ConnectStatus } from '../core/dycast';
import useTimeCounter from '../hooks/useTimeCounter';
import './LiveStatusPanel.scss';

interface LiveStatusPanelProps {
  status: ConnectStatus;
}

export interface LiveStatusPanelRef {
  getDuration: () => string;
}

const LiveStatusPanel = forwardRef<LiveStatusPanelRef, LiveStatusPanelProps>(({ status = 0 }, ref) => {
  // 计时器
  const counter = useTimeCounter();
  // 状态文本
  const [text, setText] = useState('未连接');

  // 监听状态变化
  useEffect(() => {
    switch (status) {
      case 0:
        setText('未连接');
        counter.stop();
        break;
      case 1:
        setText('连接中');
        counter.reset();
        counter.start();
        break;
      case 2:
        setText('连接失败');
        counter.stop();
        break;
      case 3:
        setText('已断开');
        counter.stop();
        break;
    }
  }, [status, counter]);

  /**
   * 获取连接时长
   */
  const getDuration = () => {
    return counter.text;
  };

  useImperativeHandle(ref, () => ({
    getDuration
  }), [counter.text]);

  const getStatusClassName = () => {
    const baseClass = 'live-status-panel';
    if (status === 0 || status === 3) return `${baseClass} status-default`;
    if (status === 2) return `${baseClass} status-fail`;
    if (status === 1) return `${baseClass} status-ok`;
    return baseClass;
  };

  return (
    <div className={getStatusClassName()}>
      <div className="panel-dur">{counter.text}</div>
      <div className="panel-main">
        <div className="icon"></div>
        <label className="text">{text}</label>
      </div>
    </div>
  );
});

LiveStatusPanel.displayName = 'LiveStatusPanel';

export default LiveStatusPanel;
