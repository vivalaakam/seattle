import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AppConfig, AppProps } from './types';
import { Logs } from './pages/logs';
import { api } from './api';

export function App({ publicHost }: AppProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetch(`${publicHost}/config`)
      .then(res => res.json())
      .then(config => {
        api.init(config);
        setConfig(config);
      });
  }, [publicHost]);

  if (!config) {
    return <div>Loading config</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Logs />} />
      </Routes>
    </Router>
  );
}
