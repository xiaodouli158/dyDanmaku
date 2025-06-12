import { useEffect, useRef } from 'react';

/** React useResizeObserver hook */

export interface UseResizeObserverOptions {
  /*
   * 指定一个自定义的 window 实例，例如使用 iframe 或在测试环境中
   */
  window?: Window;
  /**
   * 观察者观察的框模型
   * @default 'content-box'
   */
  box?: ResizeObserverBoxOptions;
}

export const useResizeObserver = function (
  target: React.RefObject<Element>,
  callback: ResizeObserverCallback,
  options: UseResizeObserverOptions = {}
) {
  const { window = globalThis.window, ...observerOptions } = options;
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const element = target.current;
    if (!element) return;

    // 清理之前的观察者
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 创建新的观察者
    observerRef.current = new ResizeObserver(callback);
    observerRef.current.observe(element, observerOptions);

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [target, callback, options]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);
};
