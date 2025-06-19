import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './pages/Home'; // Make sure this path is valid
import './styles/globals.css';   // Make sure this matches your actual CSS file

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);
