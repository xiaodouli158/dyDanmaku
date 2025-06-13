import React, { useEffect, useRef } from 'react';
import './LiveRoomSettings.scss';

interface LiveRoomSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  voiceBroadcastEnabled: boolean;
  onVoiceBroadcastChange: (enabled: boolean) => void;
}

const LiveRoomSettings: React.FC<LiveRoomSettingsProps> = ({
  isOpen,
  onClose,
  voiceBroadcastEnabled,
  onVoiceBroadcastChange
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 阻止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVoiceBroadcastToggle = () => {
    onVoiceBroadcastChange(!voiceBroadcastEnabled);
  };

  return (
    <div className="live-room-settings-overlay">
      <div className="live-room-settings-modal" ref={modalRef}>
        <div className="settings-header">
          <h2 className="settings-title">直播间设置</h2>
          <button className="close-btn" onClick={onClose} title="关闭">
            ×
          </button>
        </div>
        
        <div className="settings-content">
          <div className="setting-section">
            <h3 className="section-title">语音播报</h3>
            <div className="setting-item">
              <div className="setting-info">
                <label className="setting-label">启用语音播报</label>
                <p className="setting-desc">开启后将自动播报直播间的聊天内容</p>
              </div>
              <div className="setting-control">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={voiceBroadcastEnabled}
                    onChange={handleVoiceBroadcastToggle}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="settings-footer">
          <button className="btn btn-primary" onClick={onClose}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveRoomSettings;
