# 🎮 Real-Time Multiplayer Quiz Game

A distributed real-time quiz game built with React, Node.js, Socket.IO, and MongoDB. 
Multiple players compete simultaneously, answering True/False questions as fast as possible.

## ✨ Features

- 🔴 **Real-time multiplayer** — multiple players connect simultaneously via WebSockets
- ⚡ **Reaction time tracking** — server calculates each player's response time
- 🏆 **Live winner detection** — fastest correct answer wins each round
- 📊 **MongoDB persistence** — questions and scores stored in database
- 🔄 **Distributed architecture** — scalable client-server design

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| Node.js | Backend server |
| Socket.IO | Real-time WebSocket communication |
| MongoDB | Database for questions and scores |
| JavaScript (ES6+) | Full Stack logic |

## ⚙️ Installation

```bash
# Clone the repo
git clone https://github.com/oumaymaeddy/Quiz-Game.git
cd Quiz-Game

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install

# Start the app
npm run dev
```

## 🎯 How It Works

1. Players connect to the game room via their browser
2. Server sends True/False questions to all players simultaneously
3. Players answer as fast as possible
4. Server calculates reaction times and identifies the fastest correct answer
5. Winner is announced in real time to all connected players

## 👩‍💻 Author

**Oumayma [Nom]**  
GitHub: [@oumaymaeddy](https://github.com/oumaymaeddy)
