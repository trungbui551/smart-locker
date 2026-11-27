const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Bảng kiểu tệp (MIME types) cho máy chủ tĩnh nội bộ phục vụ bản build React
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

let staticServer = null;

/**
 * Khởi chạy máy chủ tĩnh siêu gọn ngay bên trong Electron để phục vụ thư mục renderer/.
 * Ưu tiên cổng 5173 (đã có sẵn trong CORS_ALLOWED_ORIGINS của Backend Render & Local).
 */
function startRendererServer() {
  const rendererDir = path.join(__dirname, 'renderer');

  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || '/').split('?')[0];
    const requestedPath = cleanUrl === '/' ? '/index.html' : cleanUrl;
    let filePath = path.join(rendererDir, requestedPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(rendererDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Nếu cổng 5173 đang bận (ví dụ Vite dev đang mở), chuyển sang cổng ngẫu nhiên
        server.listen(0, '127.0.0.1', () => {
          const { port } = server.address();
          resolve({ server, url: `http://localhost:${port}` });
        });
      } else {
        reject(err);
      }
    });

    server.listen(5173, '127.0.0.1', () => {
      resolve({ server, url: 'http://localhost:5173' });
    });
  });
}

async function createMainWindow() {
  const { server, url } = await startRendererServer();
  staticServer = server;

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 680,
    title: 'Smart Locker Desktop — Vận hành & Quản trị',
    icon: path.join(__dirname, 'assets', 'logo.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Mở các liên kết ngoài (nếu có) bằng trình duyệt mặc định
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  await mainWindow.loadURL(url);
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (staticServer) {
    staticServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
