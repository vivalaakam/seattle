import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import './index.scss';

declare global {
  interface Window {
    PUBLIC_HOST: string;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root') as Element);
root.render(
  <React.StrictMode>
    <App publicHost={window.PUBLIC_HOST} />
  </React.StrictMode>
);
