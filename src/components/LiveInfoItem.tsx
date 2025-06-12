import React from 'react';
import './LiveInfoItem.scss';

interface LiveInfoItemProps {
  title?: string;
  text?: string | number;
  cover?: string;
}

const LiveInfoItem: React.FC<LiveInfoItemProps> = ({
  title,
  text = '*****',
  cover
}) => {
  return (
    <div className="live-info-item">
      <label className="title">{title}：</label>
      <div className="live-info-item-main">
        {cover && <img src={cover} alt="avatar" className="avatar" />}
        <span className="text" title={String(text)}>{text}</span>
      </div>
    </div>
  );
};

export default LiveInfoItem;
