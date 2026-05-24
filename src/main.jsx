import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './storage-shim.js';

createRoot(document.getElementById('root')).render(<App />);
