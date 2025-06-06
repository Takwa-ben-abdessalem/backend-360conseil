// backend-360conseil/server.js

const express = require("express");
const cors = require("cors"); // Importe le module cors
const app = express();
const PORT = process.env.PORT || 5000; // Le port sur lequel le serveur écoutera
const mongoose = require("mongoose");

// Connexion à MongoDB (remplacez l'URL par la vôtre, ex: 'mongodb://localhost:27017/ma_base_de_donnees')
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/360conseil_db")
  .then(() => console.log("Connecté à MongoDB"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Middleware pour gérer les requêtes CORS
// Permet à votre frontend (sur un autre port) de communiquer avec ce backend
app.use(cors());

// Définir un schéma pour les demandes de devis
const devisSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  telephone: String,
  mail: String,
  ville: String,
  codePostal: String,
  typeProjet: String,
  dateSoumission: { type: Date, default: Date.now },
});

// Créer un modèle à partir du schéma
const Devis = mongoose.model("Devis", devisSchema);

// Route POST pour le formulaire de demande de devis (Hero Section)

// Ici, vous feriez généralement des choses comme :
// 1. Valider les données reçues
// 2. Enregistrer les données dans une base de données (MongoDB, PostgreSQL, etc.)
// 3. Envoyer un email de confirmation ou de notification (avec Nodemailer par exemple)
// 4. Intégrer un CRM ou un autre service

// Réponse au client
app.post("/api/devis", async (req, res) => {
  const { nom, prenom, telephone, mail, ville, codePostal, typeProjet } =
    req.body;
  console.log("Nouvelle demande de devis reçue :");
  console.log(`Nom: ${nom}`);
  console.log(`Prénom: ${prenom}`);
  console.log(`Téléphone: ${telephone}`);
  console.log(`Email: ${mail}`);
  console.log(`Ville: ${ville}`);
  console.log(`Code Postal: ${codePostal}`);
  console.log(`Type de Projet: ${typeProjet}`);

  try {
    const newDevis = new Devis(req.body); // Crée une nouvelle instance du modèle avec les données du formulaire
    await newDevis.save(); // Sauvegarde l'instance dans la base de données
    console.log(
      "Nouvelle demande de devis enregistrée en base de données :",
      newDevis
    );
    res.status(200).json({
      message: "Demande de devis reçue et enregistrée avec succès !",
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du devis :", error);
    res.status(500).json({
      message: "Erreur lors de l'enregistrement de la demande de devis.",
    });
  }
});

// Route POST pour le formulaire de contact (Contact Section)
app.post("/api/contact", (req, res) => {
  const {
    nomPrenom,
    telephone,
    email,
    ville,
    codePostal,
    typeProjet,
    receiveUpdates,
  } = req.body;

  // Ici, vous feriez les mêmes types d'opérations que pour le devis
  console.log("Nouveau message de contact reçu :");
  console.log(`Nom et Prénom: ${nomPrenom}`);
  console.log(`Téléphone: ${telephone}`);
  console.log(`Email: ${email}`);
  console.log(`Ville: ${ville}`);
  console.log(`Code Postal: ${codePostal}`);
  console.log(`Type de Projet: ${typeProjet}`);
  console.log(`Recevoir des mises à jour: ${receiveUpdates}`);

  // Réponse au client
  res.status(200).json({ message: "Message de contact reçu avec succès !" });
});

// Route pour le formulaire d'inscription aux actualités (Footer Section - si vous l'ajoutez)
app.post("/api/newsletter", (req, res) => {
  const { nomPrenom, email, receiveUpdates } = req.body;

  console.log("Nouvelle inscription à la newsletter :");
  console.log(`Nom et Prénom: ${nomPrenom}`);
  console.log(`Email: ${email}`);
  console.log(`Recevoir des mises à jour: ${receiveUpdates}`);

  res.status(200).json({ message: "Inscription à la newsletter réussie !" });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
  console.log(`Accès aux routes :`);
  console.log(`  - POST http://localhost:${PORT}/api/devis`);
  console.log(`  - POST http://localhost:${PORT}/api/contact`);
  console.log(`  - POST http://localhost:${PORT}/api/newsletter`);
});
