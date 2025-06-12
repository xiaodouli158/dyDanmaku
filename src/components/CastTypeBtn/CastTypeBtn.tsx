import React from 'react';
import { CastType } from './type';
import './CastTypeBtn.scss';

interface CastTypeBtnProps {
  type: CastType;
  active: boolean;
  onClick: (type: CastType) => void;
}

const CastTypeBtn: React.FC<CastTypeBtnProps> = ({ type, active, onClick }) => {
  const getTypeInfo = (type: CastType) => {
    switch (type) {
      case 'chat':
        return { label: '聊天', icon: '💬' };
      case 'gift':
        return { label: '礼物', icon: '🎁' };
      case 'like':
        return { label: '点赞', icon: '👍' };
      case 'member':
        return { label: '进入', icon: '👤' };
      case 'social':
        return { label: '关注', icon: '❤️' };
      default:
        return { label: '未知', icon: '❓' };
    }
  };

  const { label, icon } = getTypeInfo(type);

  return (
    <label
      className={`cast-type-btn ${active ? 'active' : ''}`}
      title={`${active ? '取消过滤' : '仅显示'}${label}`}
    >
      <input
        type="checkbox"
        checked={active}
        onChange={() => onClick(type)}
        className="checkbox"
      />
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
    </label>
  );
};

export default CastTypeBtn;
