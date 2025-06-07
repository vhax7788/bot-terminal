const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const pty = require('node-pty');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

let botProcess = null;

io.on('connection', socket => {
  // Buat terminal shell interaktif
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: process.env
  });

  ptyProcess.on('data', data => socket.emit('output', data));
  socket.on('input', input => ptyProcess.write(input));
  socket.on('resize', size => ptyProcess.resize(size.cols, size.rows));
  socket.on('disconnect', () => ptyProcess.kill());

  // Kontrol bot WA
  socket.on('bot-start', () => {
    if (!botProcess) {
      botProcess = spawn('node', ['bot.js']);
      io.emit('bot-status', 'online');

      botProcess.stdout.on('data', data => io.emit('bot-log', data.toString()));
      botProcess.stderr.on('data', data => io.emit('bot-log', data.toString()));

      botProcess.on('close', () => {
        io.emit('bot-status', 'offline');
        botProcess = null;
      });
    }
  });

  socket.on('bot-stop', () => {
    if (botProcess) {
      botProcess.kill();
      botProcess = null;
      io.emit('bot-status', 'offline');
    }
  });

  // Kirim status awal bot
  socket.emit('bot-status', botProcess ? 'online' : 'offline');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});