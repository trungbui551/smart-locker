import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Đăng ký Service Worker cho PWA (chỉ chạy ở môi trường hỗ trợ)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Bỏ qua nếu trình duyệt chặn SW ở môi trường thử nghiệm
    });
  });
}
