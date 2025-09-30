require('dotenv').config();
const http = require('http');
const app = require('./app');
const { startWsMetrics } = require('./services/wsMetrics');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
startWsMetrics(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = server;


