const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.loadURL('http://localhost:5173');
}

// --- Backend Express ---
const api = express();
api.use(cors());
api.use(express.json());

const db = mysql.createConnection({
  host: '192.140.56.40',
  user: 'invers26_claudio_m1',
  password: 'Ni.co0189',
  database: 'invers26_ERP',
  port: 3306
});

api.get('/api/ping', (req, res) => {
  db.ping(err => {
    if (err) {
      return res.status(500).json({ message: '❌ Error de conexión a la base de datos', error: err.message });
    }
    res.json({ message: '✅ Conexión exitosa a la base de datos' });
  });
});

api.listen(3001, () => {
  console.log('API local corriendo en http://localhost:3001');
});

// --- Electron lifecycle ---
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
}); 