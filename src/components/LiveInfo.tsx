import React, { useState, useEffect, useMemo } from 'react';
import LiveInfoItem from './LiveInfoItem';
import './LiveInfo.scss';

interface LiveInfoProps {
  cover?: string;
  title?: string;
  avatar?: string;
  nickname?: string;
  followCount?: string | number;
  memberCount?: string | number;
  userCount?: string | number;
  likeCount?: string | number;
}

const LiveInfo: React.FC<LiveInfoProps> = ({
  cover,
  title = '直播间标题',
  avatar,
  nickname = '***',
  followCount = '*****',
  memberCount = '*****',
  userCount = '*****',
  likeCount = '*****'
}) => {
  // 封面加载状态: 尚未设置|加载中|加载完成|加载失败
  const [coverLoadingStatus, setCoverLoadingStatus] = useState<0 | 1 | 2 | 3>(0);

  const coverLoadingTip = useMemo(() => {
    switch (coverLoadingStatus) {
      case 0:
        return '暂无封面';
      case 1:
        return '加载中···';
      case 3:
        return '加载失败';
      default:
        return '';
    }
  }, [coverLoadingStatus]);

  useEffect(() => {
    if (cover) {
      setCoverLoadingStatus(1);
    }
  }, [cover]);

  const handleCoverLoaded = () => {
    if (cover) setCoverLoadingStatus(2);
  };

  const handleCoverError = () => {
    if (cover) setCoverLoadingStatus(3);
  };

  const getCoverClassName = () => {
    const baseClass = 'live-info-cover_main';
    const statusClasses = {
      0: 'unload',
      1: 'loading',
      2: 'loaded',
      3: 'error'
    };
    return `${baseClass} ${statusClasses[coverLoadingStatus]}`;
  };

  return (
    <div className="live-info">
      {/* 封面 */}
      <div className="live-info-cover">
        <div className={getCoverClassName()}>
          <img src={cover} alt="封面" onLoad={handleCoverLoaded} onError={handleCoverError} />
          <span>{coverLoadingTip}</span>
        </div>
        <label className="live-info-title">{title}</label>
      </div>
      {/* 信息 */}
      <div className="live-info-list">
        <LiveInfoItem title="主播" cover={avatar} text={nickname} />
        <LiveInfoItem title="主播粉丝数" text={followCount} />
        <LiveInfoItem title="在线观众数" text={memberCount} />
        <LiveInfoItem title="累计观看人数" text={userCount} />
        <LiveInfoItem title="本场点赞数" text={likeCount} />
      </div>
    </div>
  );
};

export default LiveInfo;
