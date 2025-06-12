import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { debounce } from '../utils/loashUtil';
import './ConnectInput.scss';

interface TestRV {
  flag: boolean;
  message?: string;
}

interface ConnectInputProps {
  label?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  testTime?: 'blur' | 'change';
  test?: (value: string) => TestRV;
  value?: string;
  onChange?: (value: string) => void;
  onConfirm?: (value?: string) => void;
  onCancel?: (value?: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

export interface ConnectInputRef {
  setStatus: (flag?: boolean) => void;
}

const ConnectInput = forwardRef<ConnectInputRef, ConnectInputProps>(({
  label,
  placeholder,
  confirmText = '连接',
  cancelText = '断开',
  testTime = 'blur',
  test,
  value = '',
  onChange,
  onConfirm,
  onCancel,
  onBlur,
  onFocus
}, ref) => {
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);
  const [btnDisabled, setBtnDisabled] = useState<boolean>(false);
  const [connectStatus, setConnectStatus] = useState<boolean>(false);
  const [testTip, setTestTip] = useState<string | undefined>(undefined);

  // 处理验证
  const handleTest = useCallback(debounce((value?: string) => {
    if (test) {
      const valid = test(value || '');
      if (valid.flag) {
        setBtnDisabled(false);
        setTestTip(undefined);
      } else {
        setBtnDisabled(true);
        setTestTip(valid.message);
      }
    }
  }, 200), [test]);

  const handleClick = useCallback(() => {
    setInputDisabled(true);
    setBtnDisabled(true);
    if (connectStatus) {
      onCancel?.(value);
    } else {
      onConfirm?.(value);
    }
  }, [connectStatus, value, onCancel, onConfirm]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (testTime === 'blur') {
      handleTest(value);
    }
    onBlur?.(e);
  }, [testTime, value, handleTest, onBlur]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e);
  }, [onFocus]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    if (testTime === 'change') {
      handleTest(newValue);
    }
  }, [onChange, testTime, handleTest]);

  const setStatus = useCallback((flag?: boolean) => {
    if (flag) {
      setInputDisabled(true);
      setConnectStatus(true);
    } else {
      setInputDisabled(false);
      setConnectStatus(false);
    }
    setBtnDisabled(false);
  }, []);

  useImperativeHandle(ref, () => ({
    setStatus
  }), [setStatus]);

  useEffect(() => {
    if (test) {
      setBtnDisabled(true);
    }
  }, [test]);

  return (
    <div className="connect-input">
      <div className="connect-input-main">
        {label && <label className="label">{`${label}:`}</label>}
        <input
          className="input-inner"
          disabled={inputDisabled}
          placeholder={placeholder}
          value={value}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onChange={handleChange}
        />
        <div
          className={`btns ${connectStatus ? 'active' : ''} ${btnDisabled ? 'disabled' : ''}`}
          onClick={handleClick}
        >
          <span className="confirm-text">{confirmText}</span>
          <span className="cancel-text">{cancelText}</span>
        </div>
      </div>
      {test && (
        <div className="connect-input-test">
          {testTip && <span>{testTip}</span>}
        </div>
      )}
    </div>
  );
});

ConnectInput.displayName = 'ConnectInput';

export default ConnectInput;
