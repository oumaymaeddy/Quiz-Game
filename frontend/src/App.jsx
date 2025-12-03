import React, { useState, useEffect } from 'react';
import './App.css';
import { ToastContainer, toast } from 'react-toastify'; // afficher des notifications pop-up
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

// Connecte à l'URL du serveur Socket.IO
//Elle se connecte à l'URL du serveur backend (http://localhost:5000 dans ce cas), ce qui permet d'échanger des messages en temps réel entre le frontend (client) et le backend (serveur).
const socket = io("http://localhost:5000");

function App() {
  //useState() : Gère les états locaux dans le composant React (comme le nom du joueur, la salle, la question, etc.). permettent à React de mémoriser les informations 
  const [name, setName] = useState(null);
  const [room, setRoom] = useState(null);
  const [info, setInfo] = useState(false);//Si l'utilisateur a rejoint une salle
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [seconds, setSeconds] = useState();
  const [scores, setScores] = useState([]);
  const [winner, setWinner] = useState();
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);

  // Gère l'envoi des données lors du formulaire de connexion
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && room) {
      setInfo(true);// Indique que l'utilisateur a rejoint la salle
    }
  };

  // Quand le formulaire est soumis et que l'utilisateur rejoint la salle
  useEffect(() => {
    if (name) {
// Envoie l'événement "joinRoom" au serveur avec le nom et la salle
      socket.emit('joinRoom', room, name);
    }
  }, [info]);
  
  // Réception de messages de bienvenue quand un joueur rejoint
  useEffect(() => {
    socket.on('message', (message) => {
      toast(`${message} a rejoint la salle !`, {
        position: "top-right", // Position en haut à droite
        autoClose: 5000, // La notification se ferme automatiquement après 5 secondes
        hideProgressBar: false, // Garde la barre de progression visible
        closeOnClick: true, // Permet de fermer la notification en cliquant dessus
        pauseOnHover: true, // Pause le temps si on passe la souris dessus
        draggable: true, // Permet de faire glisser la notification
        progress: undefined, 
        theme: "dark", // Utilise le thème sombre

        // Customisation des styles
        style: {
          backgroundColor: "green", // Met le fond du toast en vert
          color: "white", // Le texte devient blanc
          borderRadius: "10px", // Rend les coins arrondis
          padding: "15px", // Ajoute de l'espace à l'intérieur du toast
        },
        progressStyle: {
          background: "dark", // Change la couleur de la barre de progression
        }
      });
    });

   // Nettoie les écouteurs d'événements lorsque le composant se démonte
    return () => {
      socket.off('message');
    };
  }, []);


  // Réception de nouvelles questions et de résultats de réponse
  useEffect(() => {
    socket.on('newQuestion', (data) => {
      setQuestion(data.question);
      setOptions(data.answers);
      setAnswered(false);
      setSeconds(data.timer);
      setSelectedAnswerIndex(null);
    });

    // Le client reçoit l'événement answerResult du serveur pour savoir si la réponse est correcte ou non.
    socket.on('answerResult', (data) => {
      if (data.isCorrect) {
      // Affiche un toast si la réponse est correcte
        toast(`Correct! ${data.playerName} a trouvé la bonne réponse.`, {
          position: "bottom-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
      setScores(data.scores);
    });

    socket.on('gameOver', (data) => {
      setWinner(data.winner);// Affiche le gagnant
    });

    return () => {
      socket.off('newQuestion');
      socket.off('answerResult');
      socket.off('gameOver');
    };
  }, []);


  // Quand un utilisateur répond à une question
  const handleAnswer = (answerIndex) => {
    if (!answered) {//l'utilisateur n'a pas repondu a la question 
      setSelectedAnswerIndex(answerIndex);// Sélectionne une réponse
      socket.emit('submitAnswer', room, answerIndex); // Envoie la réponse au serveur
      setAnswered(true);// l'utilisateur a répondu à la question
    }
  };

  if (winner) {
    return <h1>Le gagnant est {winner}</h1>;
  }

  return (
    <div className="App">
      {!info ? (
        <div className="join-div">
          <h1>Question Rapide</h1>
          <form onSubmit={handleSubmit}>
            <input
              required
              placeholder="Entrez votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              required
              placeholder="Entrez le numéro de la salle"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
            <button type="submit" className="join-btn">REJOINDRE</button>
          </form>
        </div>
      ) : (
        <div>
          <h1>Question Rapide</h1>
          <p className="room-id">ID de la salle : {room}</p>
          <ToastContainer />
          {question ? (
            <div className="quiz-div">
              <p>Temps restant : {seconds}</p>
              <div className="question">
                <p className="question-text">{question}</p>
              </div>
              <ul>
                {options.map((answer, index) => (
                  <li key={index}>
                    <button
                      className={`options ${selectedAnswerIndex === index ? 'selected' : ''}`}
                      onClick={() => handleAnswer(index)}
                      disabled={answered}
                    >
                      {answer}
                    </button>
                  </li>
                ))}
              </ul>
              {scores.map((player, index) => (
                <p key={index}>{player.name} : {player.score}</p>
              ))}
            </div>
          ) : (
            <p>Chargement de la question...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
