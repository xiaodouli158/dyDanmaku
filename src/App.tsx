import React, { useEffect } from 'react';
import IndexView from './views/IndexView';
import { printInfo, printSKMCJ } from './utils/logUtil';

const App: React.FC = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      console?.clear();
      printSKMCJ();
      printInfo();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app">
      <IndexView />
    </div>
  );
};

export default App;
