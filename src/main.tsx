import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css'; // or './App.css' depending on your setup

// Ensure React 18 root rendering with BrowserRouter for routing
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <Router>
    <App />
  </Router>
);
