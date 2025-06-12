import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import CastItem from './CastItem';
import { CastMethod, type DyMessage } from '../core/dycast';
import { getId } from '../utils/idUtil';
import { throttle } from '../utils/loashUtil';
import { CastTypeBtn } from './CastTypeBtn';
import './CastList.scss';

type CastType = 'chat' | 'gift' | 'like' | 'social' | 'member';

interface CastListProps {
  title?: string;
  theme?: 'light' | 'dark';
  types?: CastType[];
  pos?: 'center' | 'left';
}

export interface CastListRef {
  appendCasts: (msgs: DyMessage[]) => void;
  clearCasts: () => void;
}

const CastList = forwardRef<CastListRef, CastListProps>(({
  title = '弹幕信息',
  theme = 'light',
  types = [],
  pos = 'center'
}, ref) => {
  // 类型控制器
  const typeMapRef = useRef<Map<CastMethod, boolean>>(new Map());
  // 类型显示状态
  const [typeVisibility, setTypeVisibility] = useState<Map<CastType, boolean>>(new Map());
  // 初始化标志
  const initializedRef = useRef<boolean>(false);

  // 显示弹幕
  const [casts, setCasts] = useState<DyMessage[]>([]);
  // 所有弹幕
  const allCastsRef = useRef<DyMessage[]>([]);

  // 列表引用
  const listRef = useRef<List>(null);
  const isAtBottomRef = useRef(true);

  // 容器引用和高度状态
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(300);

  // 判断是否滚动到底部的容差值
  const SCROLL_BTH = 50;

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
  }, [casts.length, title]);

  /**
   * 设置弹幕类型显隐状态
   */
  const setCastType = useCallback((type: CastType, flag?: boolean) => {
    const isVisible = !!flag;

    console.log(`⚙️ setCastType ${type} = ${isVisible} for ${title}`);

    // 更新类型显示状态
    setTypeVisibility(prev => {
      const newMap = new Map(prev);
      newMap.set(type, isVisible);
      return newMap;
    });

    switch (type) {
      case 'chat':
        typeMapRef.current.set(CastMethod.CHAT, isVisible);
        typeMapRef.current.set(CastMethod.EMOJI_CHAT, isVisible);
        break;
      case 'gift':
        typeMapRef.current.set(CastMethod.GIFT, isVisible);
        break;
      case 'like':
        typeMapRef.current.set(CastMethod.LIKE, isVisible);
        break;
      case 'social':
        typeMapRef.current.set(CastMethod.SOCIAL, isVisible);
        break;
      case 'member':
        typeMapRef.current.set(CastMethod.MEMBER, isVisible);
        break;
    }
  }, [title]);

  // 当类型显示状态改变时，重新过滤弹幕
  useEffect(() => {
    const list: DyMessage[] = allCastsRef.current.filter(item => {
      const allowed = item.method ? !!typeMapRef.current.get(item.method) : false;
      return allowed;
    });

    console.log(`🔍 Filtering ${title}: ${allCastsRef.current.length} -> ${list.length} messages`);
    console.log(`📊 Type map:`, Array.from(typeMapRef.current.entries()));

    setCasts(list);

    // 自动滚动到底部
    setTimeout(() => {
      if (isAtBottomRef.current && listRef.current && list.length > 0) {
        listRef.current.scrollToItem(Math.max(0, list.length - 1), 'end');
      }
    }, 0);
  }, [typeVisibility, title]);

  /**
   * 切换类型显示状态 - 完全自由多选模式
   */
  const toggleCastType = useCallback((type: CastType) => {
    const isCurrentlyActive = typeVisibility.get(type) ?? false;
    const newState = !isCurrentlyActive;

    console.log(`☑️ Toggle checkbox ${type}: ${isCurrentlyActive} -> ${newState} for ${title}`);

    // 更新勾选框状态
    setTypeVisibility(prev => {
      const newMap = new Map(prev);
      newMap.set(type, newState);
      return newMap;
    });

    // 更新过滤状态
    setCastType(type, newState);

    // 如果这是第一次勾选任何类型，需要先隐藏所有其他类型
    const checkedTypes = types.filter(t => typeVisibility.get(t) ?? false);
    if (newState && checkedTypes.length === 0) {
      // 这是第一次勾选，隐藏其他所有类型
      console.log(`☑️ First selection, hiding other types for ${title}`);
      types.forEach(t => {
        if (t !== type) {
          setCastType(t, false);
        }
      });
    }

    console.log(`📊 Type ${type} is now ${newState ? 'visible' : 'hidden'} for ${title}`);
  }, [typeVisibility, setCastType, types, title]);



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

  // 监听容器高度变化
  useEffect(() => {
    const updateHeight = () => {
      const mainElement = mainRef.current;
      if (!mainElement) return;

      // 获取main容器的实际高度，减去padding(24px)
      const rect = mainElement.getBoundingClientRect();
      const availableHeight = Math.max(200, rect.height - 24);
      setContainerHeight(availableHeight);
    };

    // 初始设置
    updateHeight();

    // 监听窗口大小变化
    window.addEventListener('resize', updateHeight);

    // 使用MutationObserver监听DOM变化
    const observer = new MutationObserver(updateHeight);
    if (mainRef.current) {
      observer.observe(mainRef.current, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }

    // 定时更新，确保高度正确
    const interval = setInterval(updateHeight, 1000);

    return () => {
      window.removeEventListener('resize', updateHeight);
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // 初始化 - 只在首次有types时执行一次
  useEffect(() => {
    if (initializedRef.current || !types || types.length === 0) return;

    console.log(`🎯 CastList (${title}) initializing with types:`, types);

    // 直接设置typeMap，不调用setCastType避免触发状态更新
    for (const key of types) {
      switch (key) {
        case 'chat':
          typeMapRef.current.set(CastMethod.CHAT, true);
          typeMapRef.current.set(CastMethod.EMOJI_CHAT, true);
          break;
        case 'gift':
          typeMapRef.current.set(CastMethod.GIFT, true);
          break;
        case 'like':
          typeMapRef.current.set(CastMethod.LIKE, true);
          break;
        case 'social':
          typeMapRef.current.set(CastMethod.SOCIAL, true);
          break;
        case 'member':
          typeMapRef.current.set(CastMethod.MEMBER, true);
          typeMapRef.current.set(CastMethod.CUSTOM, true);
          typeMapRef.current.set(CastMethod.CONTROL, true);
          break;
      }
    }

    // 设置初始的typeVisibility状态（所有类型都不勾选）
    const initialVisibility = new Map<CastType, boolean>();
    types.forEach(type => initialVisibility.set(type, false));
    setTypeVisibility(initialVisibility);

    // 标记为已初始化
    initializedRef.current = true;

    console.log(`📋 CastList (${title}) initialized - type map:`, Array.from(typeMapRef.current.entries()));
  }, [types, title]);

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
    if (theme === 'dark') classes.push('theme-dark');
    if (theme === 'light') classes.push('theme-light');

    return classes.join(' ');
  };

  return (
    <div className={getClassName()} ref={containerRef}>
      <div className="cast-list-header">
        {/* 标题 */}
        <div className="title">
          <label>{title}</label>
        </div>
        <div className="type-icons">
          {types.map(type => (
            <CastTypeBtn
              key={type}
              type={type}
              active={typeVisibility.get(type) ?? false}
              onClick={toggleCastType}
            />
          ))}
        </div>
      </div>
      <div className="cast-list-main" ref={mainRef}>
        <List
          ref={listRef}
          height={containerHeight}
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
