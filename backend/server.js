const express = require("express");// créer un serveur web
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");//different domaine
const mongoose = require("mongoose");
const Question = require("./Question");
const app = express();

// Connexion à MongoDB
mongoose.connect('mongodb://localhost/Questions', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connecté à MongoDB !");
}).catch((error) => {
  console.error("Erreur de connexion à MongoDB :", error);
});

// Crée un serveur HTTP.
const server = http.createServer(app);

app.use(cors());
// Initialise Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
//port sur lequel le serveur va écouter 
const PORT = process.env.PORT || 5000;

const rooms = {};

io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté");


 // Quand un joueur rejoint une salle
  socket.on("joinRoom", (room, name) => {
    socket.join(room);// Ajoute l'utilisateur à la salle
    io.to(room).emit("message", `${name} a rejoint le jeu !`);

    //Si la salle n'existe pas encore
    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        currentQuestion: null,
        correctAnswer: null,
        questionTimeout: null,
        shouldAskNewQuestion: true,
      };
    }

    //On ajoute le joueur à la liste des joueurs de cette salle
    rooms[room].players.push({ id: socket.id, name });
    // Si aucune question n'a encore été posée dans la salle, la fonction
    if (!rooms[room].currentQuestion) {
      //est appelée pour poser une nouvelle questio
      askNewQuestion(room);
    }
  });



  // Quand un joueur soumet une réponse
  socket.on("submitAnswer", (room, answerIndex) => {
    //  // Trouver le joueur qui a soumis la réponse dans la salle
    const currentPlayer = rooms[room].players.find(
      (player) => player.id === socket.id
    );

    if (currentPlayer) {
      //  // Vérifier si la réponse soumise correspond à la réponse correcte
      const correctAnswer = rooms[room].correctAnswer;
      const isCorrect = correctAnswer !== null && correctAnswer === answerIndex;
        // Mettre à jour le score du joueur
      currentPlayer.score = isCorrect
        ? (currentPlayer.score || 0) + 1// Si la réponse est correcte, augmenter le score
        : (currentPlayer.score || 0) - 1; // Sinon, diminuer le score

        ///Annuler le temporisateur pour la question
      clearTimeout(rooms[room].questionTimeout);

        // Envoyer le résultat à tous les joueurs de la salle
      io.to(room).emit("answerResult", {
        playerName: currentPlayer.name,// Nom du joueur qui a répondu
        isCorrect,
        correctAnswer, // La bonne réponse
        scores: rooms[room].players.map((player) => ({
          name: player.name,
          score: player.score || 0,
        })),
      });




  // Vérifier si un joueur a atteint le score de victoire (par exemple, 5 points)
      const winningThreshold = 5;
      const winner = rooms[room].players.find(
        (player) => (player.score || 0) >= winningThreshold
      );

        // Si un joueur a gagné, terminer la partie

      if (winner) {
        io.to(room).emit("gameOver", { winner: winner.name });
        delete rooms[room]; // Supprimer la salle après la fin du jeu
      } else {
        askNewQuestion(room); // Sinon, poser une nouvelle question
      }
    }
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room].players = rooms[room].players.filter(
        (player) => player.id !== socket.id
      );
    }

    console.log("Un utilisateur s'est déconnecté");
  });
});


  // Vérifie si la salle est vide (aucun joueur dans la salle)
async function askNewQuestion(room) {
  if (rooms[room].players.length === 0) {
        // Si la salle est vide, annule tout temporisateur en cours
    clearTimeout(rooms[room].questionTimeout);
    delete rooms[room];
    return;
  }

  
  // Récupérer une question aléatoire depuis MongoDB
  const questionCount = await Question.countDocuments();  // Compter le nombre de questions
  const randomIndex = Math.floor(Math.random() * questionCount);
  const question = await Question.findOne().skip(randomIndex);  // Prendre une question aléatoire

  if (!question) {
    console.log("Aucune question trouvée dans la base de données !");
    return;
  }

  // Stocke la question actuelle dans l'objet `rooms` pour cette salle
  rooms[room].currentQuestion = question;

    // Trouve l'index de la bonne réponse parmi les options
  const correctAnswerIndex = question.answers.findIndex(
    (answer) => answer.correct
  );

  rooms[room].correctAnswer = correctAnswerIndex;
  rooms[room].shouldAskNewQuestion = true;


//Le serveur envoie la question à tous les joueurs de la salle avec io.to(room).emit("newQuestion").
  io.to(room).emit("newQuestion", {
    question: question.question,
    answers: question.answers.map((answer) => answer.text), 
  });

  
  // Définit un temporisateur de 10 secondes. Une fois ce délai écoulé, une nouvelle question sera envoyée.
  rooms[room].questionTimeout = setTimeout(() => {
        // Si aucun joueur n'a répondu ou si la question a expiré, le serveur envoie un résultat par défaut (aucun joueur n'a répondu)
    io.to(room).emit("answerResult", {
      playerName: "Personne",
      isCorrect: false,
      correctAnswer: rooms[room].correctAnswer,
      scores: rooms[room].players.map((player) => ({
        name: player.name,
        score: player.score || 0,
      })),
    });


    askNewQuestion(room);
  }, 10000);
}

server.listen(PORT, () => {
  console.log(`Le serveur fonctionne sur le port ${PORT}`);
});
