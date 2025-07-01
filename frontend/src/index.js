import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { TrackProvider } from './context/TrackContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <SubscriptionProvider>
      <TrackProvider>
        <App />
      </TrackProvider>
    </SubscriptionProvider>
  </AuthProvider>
); 