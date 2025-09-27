import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'

// Initialize the app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
