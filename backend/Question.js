const mongoose = require('mongoose');

// Définir le schéma pour les questions
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answers: [
    {
      text: { type: String, required: true },
      correct: { type: Boolean, required: true }
    }
  ]
});

// Créer le modèle Question basé sur le schéma
const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
