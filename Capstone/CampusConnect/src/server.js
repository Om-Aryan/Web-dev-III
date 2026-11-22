require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');
const eventBus = require('./events/eventBus');

async function start() {
  await connectDB();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true, credentials: true }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token required'));
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.sub).select('_id role isActive');
      if (!user || !user.isActive) return next(new Error('Unauthorized socket connection'));
      socket.user = { id: user._id.toString(), role: user.role };
      next();
    } catch { next(new Error('Invalid socket token')); }
  });

  io.on('connection', socket => {
    socket.join(`user:${socket.user.id}`);
    socket.emit('connected', { message: 'Connected to CampusConnect real-time service' });
    socket.on('join-course', async courseId => {
      if (typeof courseId === 'string' && courseId.length < 64) socket.join(`course:${courseId}`);
    });
  });

  eventBus.on('announcement-created', announcement => {
    const room = announcement.audience === 'course' ? `course:${announcement.course}` :
      announcement.audience === 'section' ? `section:${announcement.section}` : 'university';
    io.to(room).emit('announcement:new', announcement);
    io.emit('announcement:published', { id: announcement._id, title: announcement.title, audience: announcement.audience });
  });
  eventBus.on('attendance-marked', data => {
    io.to(`course:${data.course}`).emit('attendance:updated', data);
  });

  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`CampusConnect API listening on port ${port}`));
}
start().catch(err => { console.error('Startup failed:', err); process.exit(1); });
