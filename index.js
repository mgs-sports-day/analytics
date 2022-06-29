const http = require('http');
const server = http.createServer();

const parseUA = require('ua-parser-js')
const _ = require('lodash')

const { Server } = require("socket.io");
const io = new Server(server, {
  pingInterval: 15000,
  pingTimeout: 10000,
  cors: {
    origin: ["https://06072022.xyz", "https://mgs-sportsday.net", "http://localhost:3000"],
    credentials: true,
  }
});

const sessions = []
const setSessionPage = (id, page) => {
  const index = _.findIndex(sessions, {id})
  if (index === -1) {
    return
  }

  sessions[index].page = page
}

const removeSession = (id) => {
  const index = _.findIndex(sessions, {id})
  if (index === -1) {
    return
  }

  sessions.splice(index, 1)
}

io.on('connection', (socket) => {
  const details = parseUA(socket.handshake.headers["user-agent"])
  sessions.push({
    id: socket.id,
    os: details.os.name,
    browser: details.browser.name,
  })

  socket.on('pageview', (data) => {
    setSessionPage(socket.id, data.path)
  })
  
  socket.on('disconnect', () => {
    removeSession(socket.id)
  });
});

const logGroups = (key) => {
  const grouped = _.groupBy(sessions, key)
  for (const key of Object.keys(grouped)) {
    console.log(`\t${key}: ${grouped[key].length}`)
  }
}

setInterval(() => {
  const userCount = Object.keys(sessions).length
  
  console.clear()
  console.log(`Current user count: ${userCount}`)

  console.log("=== BROWSERS ===")
  logGroups('browser')
  console.log("=== OPERATING SYSTEMS ===")
  logGroups('os')
  console.log("=== PAGE ===")
  logGroups('page')
}, 3000)

server.listen();