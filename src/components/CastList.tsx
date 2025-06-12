import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import CastItem from './CastItem';
import { CastMethod, type DyMessage } from '../core/dycast';
import { getId } from '../utils/idUtil';
import { throttle } from '../utils/loashUtil';
import './CastList.scss';

type CastType = 'chat' | 'gift' | 'like' | 'social' | 'member';

interface CastListProps {
  title?: string;
  theme?: 'light' | 'dark';
  types?: CastType[];
  pos?: 'center' | 'left';
  noPrefix?: boolean;
}

export interface CastListRef {
  appendCasts: (msgs: DyMessage[]) => void;
  clearCasts: () => void;
}

const CastList = forwardRef<CastListRef, CastListProps>(({
  title = '弹幕信息',
  theme = 'light',
  types = [],
  pos = 'center',
  noPrefix = false
}, ref) => {
  // 类型控制器
  const typeMapRef = useRef<Map<CastMethod, boolean>>(new Map());

  // 显示弹幕
  const [casts, setCasts] = useState<DyMessage[]>([]);
  // 所有弹幕
  const allCastsRef = useRef<DyMessage[]>([]);

  // 列表引用
  const listRef = useRef<List>(null);
  const isAtBottomRef = useRef(true);

  // 判断是否滚动到底部的容差值
  const SCROLL_BTH = 50;

  /**
   * 设置弹幕类型显隐状态
   */
  const setCastType = useCallback((type: CastType, flag?: boolean) => {
    switch (type) {
      case 'chat':
        typeMapRef.current.set(CastMethod.CHAT, !!flag);
        typeMapRef.current.set(CastMethod.EMOJI_CHAT, !!flag);
        break;
      case 'gift':
        typeMapRef.current.set(CastMethod.GIFT, !!flag);
        break;
      case 'like':
        typeMapRef.current.set(CastMethod.LIKE, !!flag);
        break;
      case 'social':
        typeMapRef.current.set(CastMethod.SOCIAL, !!flag);
        break;
      case 'member':
        typeMapRef.current.set(CastMethod.MEMBER, !!flag);
        break;
    }
  }, []);

  /**
   * 设置弹幕显示
   */
  const addCasts = useCallback((msgs: DyMessage[], isClear: boolean = false) => {
    const list: DyMessage[] = msgs.filter(item => {
      const allowed = item.method ? !!typeMapRef.current.get(item.method) : false;
      return allowed;
    });

    if (list.length > 0) {
      console.log(`📨 CastList (${title}) displaying ${list.length} messages:`, list.map(m => `${m.method}:${m.user?.name}`));
    }

    if (isClear) {
      setCasts(list);
    } else {
      setCasts(prev => [...prev, ...list]);
    }

    // 自动滚动到底部
    setTimeout(() => {
      if (isAtBottomRef.current && listRef.current && list.length > 0) {
        const newLength = (isClear ? list.length : casts.length + list.length);
        listRef.current.scrollToItem(Math.max(0, newLength - 1), 'end');
      }
    }, 0);
  }, [casts.length, types]);

  // 添加弹幕
  const appendCasts = useCallback((msgs: DyMessage[]) => {
    if (!msgs || !msgs.length) return;
    console.log(`CastList (${types.join(',')}) received ${msgs.length} messages:`, msgs);
    allCastsRef.current.push(...msgs);
    addCasts(msgs);
  }, [addCasts, types]);

  /**
   * 清空弹幕
   */
  const clearCasts = useCallback(() => {
    allCastsRef.current.length = 0;
    setCasts([]);
  }, []);

  // 滚动处理
  const handleScroll = useCallback(throttle(({ scrollOffset, scrollDirection }: any) => {
    if (listRef.current) {
      const { height } = listRef.current.props;
      const totalHeight = casts.length * 50; // 假设每项高度为50px
      isAtBottomRef.current = scrollOffset + height >= totalHeight - SCROLL_BTH;
    }
  }, 200), [casts.length]);

  useImperativeHandle(ref, () => ({
    appendCasts,
    clearCasts
  }), [appendCasts, clearCasts]);

  // 初始化
  useEffect(() => {
    console.log(`🎯 CastList (${title}) initializing with types:`, types);
    if (types) {
      for (const key of types) {
        setCastType(key, true);
        if (key === 'member') {
          typeMapRef.current.set(CastMethod.CUSTOM, true);
          typeMapRef.current.set(CastMethod.CONTROL, true);
        }
      }
      console.log(`📋 CastList (${title}) type map:`, Array.from(typeMapRef.current.entries()));
    }
  }, [types, setCastType, title]);

  // 渲染单个弹幕项
  const renderItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = casts[index];
    return (
      <div style={style}>
        <CastItem
          method={item.method}
          user={item.user}
          gift={item.gift}
          content={item.content}
          rtfContent={item.rtfContent}
        />
      </div>
    );
  };

  const getClassName = () => {
    const baseClass = 'cast-list';
    const classes = [baseClass];
    
    if (pos === 'left') classes.push('pos-left');
    if (pos === 'center') classes.push('pos-center');
    if (noPrefix) classes.push('no-prefix');
    if (theme === 'dark') classes.push('theme-dark');
    if (theme === 'light') classes.push('theme-light');
    
    return classes.join(' ');
  };

  return (
    <div className={getClassName()}>
      <div className="cast-list-header">
        {/* MAC 前缀 */}
        <div className="mac-prefix">
          <div className="cir red"></div>
          <div className="cir yellow"></div>
          <div className="cir green"></div>
        </div>
        {/* 标题 */}
        <div className="title">
          <label>{title}</label>
        </div>
        <div className="type-icons">
          {/* 这里可以添加类型控制按钮 */}
        </div>
      </div>
      <div className="cast-list-main">
        <List
          ref={listRef}
          height={Math.max(300, window.innerHeight * 0.4)}
          itemCount={casts.length}
          itemSize={50} // 每项的估计高度
          onScroll={handleScroll}
          className="scroller"
        >
          {renderItem}
        </List>
      </div>
    </div>
  );
});

CastList.displayName = 'CastList';

export default CastList;
