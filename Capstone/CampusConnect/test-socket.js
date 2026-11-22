
const { io } = require('socket.io-client');

const socket = io('http://localhost:5000', {
  auth: {
    token: process.env.TEST_TOKEN
  }
});

socket.on('connect', () => {
  console.log('Socket.IO connected successfully!');
});

socket.on('connected', (data) => {
  console.log(data.message);
});

socket.on('connect_error', (error) => {
  console.log('Connection failed:', error.message);
});

socket.on('announcement:published', (data) => {
  console.log('New announcement:', data);
});
