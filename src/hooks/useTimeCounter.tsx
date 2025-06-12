import { useState, useRef, useCallback } from 'react';

interface TimeCounterOptions {
  /**
   * 初始时间(s)
   */
  initValue?: number;
  /**
   * 计时模式
   *  - 0 => 正计时
   *  - 1 => 倒计时
   */
  mode?: 0 | 1;
  /**
   * 时间格式字符串
   *  - h => 时 | m => 分 | s => 秒
   *  - 默认：hh:mm:ss
   */
  fmt?: string;
}

const S_UNIT = 1000;

/**
 * 将秒数转换为格式字符串
 */
function convertTime(seconds: number, fmt: string = 'hh:mm:ss') {
  const map: Record<string, number> = {
    'h+': Math.floor(seconds / 3600),
    'm+': Math.floor((seconds % 3600) / 60),
    's+': seconds % 60
  };
  
  for (const item in map) {
    const reg = new RegExp(`(${item})`);
    if (reg.test(fmt)) {
      const t = reg.exec(fmt)?.[1];
      if (t) {
        fmt = fmt.replace(t, t.length === 1 ? `${map[item]}` : `00${map[item]}`.slice(t.length * -1));
      }
    }
  }
  return fmt;
}

const useTimeCounter = (opt: TimeCounterOptions = {}) => {
  const { initValue = 0, mode = 0, fmt = 'hh:mm:ss' } = opt;
  
  const secondsRef = useRef(initValue);
  const timerRef = useRef<number | null>(null);
  const [text, setText] = useState(convertTime(initValue, fmt));

  // 计时
  const turn = useCallback((mode: 0 | 1 = 0) => {
    if (mode === 1) {
      // 倒计时
      if (secondsRef.current > 0) {
        secondsRef.current = secondsRef.current - 1;
      }
    } else {
      // 正计时
      secondsRef.current = secondsRef.current + 1;
    }
  }, []);

  // 刷新文本
  const refreshText = useCallback(() => {
    setText(convertTime(secondsRef.current, fmt));
  }, [fmt]);

  /**
   * 开始计时
   */
  const start = useCallback(() => {
    timerRef.current = window.setInterval(() => {
      // 每秒计时一次
      turn(mode);
      refreshText();
    }, S_UNIT);
  }, [mode, turn, refreshText]);

  /**
   * 停止计时
   */
  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * 重置计时
   */
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    secondsRef.current = initValue;
    refreshText();
  }, [initValue, refreshText]);

  return {
    text,
    start,
    stop,
    reset
  };
};

export default useTimeCounter;
