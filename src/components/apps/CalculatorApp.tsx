import React, { useState, useEffect } from 'react';
import { Delete, History, RotateCcw } from 'lucide-react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewVal, setWaitingForNewVal] = useState(false);
  const [historyList, setHistoryList] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleDigit = (digit: string) => {
    if (waitingForNewVal) {
      setDisplay(digit);
      setWaitingForNewVal(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleDecimal = () => {
    if (waitingForNewVal) {
      setDisplay('0.');
      setWaitingForNewVal(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setPrevVal(null);
    setOperator(null);
    setWaitingForNewVal(false);
  };

  const handleClearEntry = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (waitingForNewVal) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleToggleSign = () => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay(String(-val));
    }
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleOperator = (nextOp: string) => {
    const currentVal = parseFloat(display);

    if (prevVal === null) {
      setPrevVal(currentVal);
      setEquation(`${currentVal} ${nextOp}`);
    } else if (operator) {
      if (!waitingForNewVal) {
        const result = calculate(prevVal, currentVal, operator);
        setPrevVal(result);
        setDisplay(String(result));
        setEquation(`${result} ${nextOp}`);
      } else {
        setEquation(`${prevVal} ${nextOp}`);
      }
    }

    setOperator(nextOp);
    setWaitingForNewVal(true);
  };

  const handleEqual = () => {
    if (operator && prevVal !== null) {
      const currentVal = parseFloat(display);
      const result = calculate(prevVal, currentVal, operator);
      const histItem = `${prevVal} ${operator} ${currentVal} = ${result}`;
      setHistoryList(prev => [histItem, ...prev.slice(0, 9)]);
      setDisplay(String(result));
      setEquation('');
      setPrevVal(null);
      setOperator(null);
      setWaitingForNewVal(true);
    }
  };

  const handleSquare = () => {
    const val = parseFloat(display);
    const res = val * val;
    setEquation(`sqr(${val})`);
    setDisplay(String(res));
    setWaitingForNewVal(true);
  };

  const handleSqrt = () => {
    const val = parseFloat(display);
    if (val >= 0) {
      const res = Math.sqrt(val);
      setEquation(`√(${val})`);
      setDisplay(String(res));
      setWaitingForNewVal(true);
    }
  };

  const handleInvert = () => {
    const val = parseFloat(display);
    if (val !== 0) {
      const res = 1 / val;
      setEquation(`1/(${val})`);
      setDisplay(String(res));
      setWaitingForNewVal(true);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleDigit(e.key);
      } else if (e.key === '.') {
        handleDecimal();
      } else if (e.key === '+') {
        handleOperator('+');
      } else if (e.key === '-') {
        handleOperator('-');
      } else if (e.key === '*') {
        handleOperator('×');
      } else if (e.key === '/') {
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        handleEqual();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans select-none text-xs">
      {/* Calculator Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="font-semibold text-xs text-slate-900 dark:text-white">
          قياسية (Standard)
        </div>
        <button
          onClick={() => setShowHistory(prev => !prev)}
          className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer ${showHistory ? 'text-blue-600' : 'text-slate-500'}`}
          title="سجل العمليات"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {showHistory ? (
        <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-bold text-slate-400">سجل الحسابات الأخيرة</div>
          {historyList.length === 0 ? (
            <div className="text-slate-400 text-center py-6">لا توجد عمليات سابقة بعد</div>
          ) : (
            <div className="space-y-1.5 font-mono text-xs">
              {historyList.map((item, idx) => (
                <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200/50 dark:border-slate-700/50">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Display Output */}
          <div className="px-4 py-3 text-left dir-ltr bg-white dark:bg-slate-900/60 flex flex-col justify-end min-h-[90px]">
            <div className="text-xs font-mono text-slate-400 h-4 truncate">
              {equation || '\u00A0'}
            </div>
            <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white truncate">
              {display}
            </div>
          </div>

          {/* Calculator Keypad */}
          <div className="flex-1 p-1.5 grid grid-cols-4 gap-1 bg-slate-100/70 dark:bg-slate-900/90 text-sm">
            {/* Row 1 */}
            <button onClick={handleClearEntry} className="calc-btn text-xs">CE</button>
            <button onClick={handleClear} className="calc-btn text-xs">C</button>
            <button onClick={handleBackspace} className="calc-btn flex items-center justify-center">
              <Delete className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <button onClick={() => handleOperator('÷')} className="calc-btn text-blue-600 dark:text-blue-400 font-bold">÷</button>

            {/* Row 2 */}
            <button onClick={handleInvert} className="calc-btn text-xs font-mono">1/x</button>
            <button onClick={handleSquare} className="calc-btn text-xs font-mono">x²</button>
            <button onClick={handleSqrt} className="calc-btn text-xs font-mono">√x</button>
            <button onClick={() => handleOperator('×')} className="calc-btn text-blue-600 dark:text-blue-400 font-bold">×</button>

            {/* Row 3 */}
            <button onClick={() => handleDigit('7')} className="calc-btn-num">7</button>
            <button onClick={() => handleDigit('8')} className="calc-btn-num">8</button>
            <button onClick={() => handleDigit('9')} className="calc-btn-num">9</button>
            <button onClick={() => handleOperator('-')} className="calc-btn text-blue-600 dark:text-blue-400 font-bold">-</button>

            {/* Row 4 */}
            <button onClick={() => handleDigit('4')} className="calc-btn-num">4</button>
            <button onClick={() => handleDigit('5')} className="calc-btn-num">5</button>
            <button onClick={() => handleDigit('6')} className="calc-btn-num">6</button>
            <button onClick={() => handleOperator('+')} className="calc-btn text-blue-600 dark:text-blue-400 font-bold">+</button>

            {/* Row 5 */}
            <button onClick={() => handleDigit('1')} className="calc-btn-num">1</button>
            <button onClick={() => handleDigit('2')} className="calc-btn-num">2</button>
            <button onClick={() => handleDigit('3')} className="calc-btn-num">3</button>
            <button onClick={handleEqual} className="row-span-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded font-bold text-lg flex items-center justify-center transition-all shadow-sm cursor-pointer">=</button>

            {/* Row 6 */}
            <button onClick={handleToggleSign} className="calc-btn text-xs">+/-</button>
            <button onClick={() => handleDigit('0')} className="calc-btn-num">0</button>
            <button onClick={handleDecimal} className="calc-btn font-bold">.</button>
          </div>
        </>
      )}
    </div>
  );
};
