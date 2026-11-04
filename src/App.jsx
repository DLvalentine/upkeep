// Libs
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Static
import './styles/tokens.css';
import './styles/index.css';

// Components
import Main from './components/Main';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Main/>
  </StrictMode>,
);
