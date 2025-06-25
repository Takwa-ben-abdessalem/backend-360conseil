const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Atlas connecté"))
  .catch((err) => console.error("Erreur MongoDB :", err));

console.log("URI MongoDB :", process.env.MONGO_URI);
app.use(express.json());

const allowedOrigins = ["http://localhost:8080", "https://www.360conseil.fr"];

app.use(
  cors({
    origin: function (origin, callback) {
      // autoriser les requêtes sans origin (ex: curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `L'origine CORS ${origin} n'est pas autorisée.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

// Route racine
app.get("/", (req, res) => {
  res
    .status(200)
    .send(
      "Bienvenue sur l'API Backend de 360 conseil ! Le serveur est en ligne."
    );
});

// Schéma Mongoose pour demandes de devis
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

const Devis = mongoose.model("Devis", devisSchema);

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, // ex: smtp.gmail.com
  port: process.env.MAIL_PORT, // ex: 587
  secure: false, // true si port 465, sinon false
  auth: {
    user: process.env.MAIL_USER, // ton email
    pass: process.env.MAIL_PASS, // ton mot de passe/app password
  },
});

// Vérification configuration mail
transporter.verify(function (error, success) {
  if (error) {
    console.log("Erreur configuration mail :", error);
  } else {
    console.log("Serveur mail prêt à envoyer des emails");
  }
});

// Route POST /api/devis
app.post("/api/devis", async (req, res) => {
  const { nom, prenom, telephone, mail, ville, codePostal, typeProjet } =
    req.body;

  console.log("Nouvelle demande de devis reçue :");
  console.log({ nom, prenom, telephone, mail, ville, codePostal, typeProjet });

  try {
    const newDevis = new Devis(req.body);
    await newDevis.save();

    // Préparer l'email
    const mailOptions = {
      from: `"360 Conseil" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_RECEIVER || process.env.MAIL_USER, // email qui reçoit la notif
      subject: "Nouvelle demande de devis",
      text: `Vous avez reçu une nouvelle demande de devis :
Nom: ${nom}
Prénom: ${prenom}
Téléphone: ${telephone}
Email: ${mail}
Ville: ${ville}
Code Postal: ${codePostal}
Type de Projet: ${typeProjet}
      `,
    };

    // Envoyer l'email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur envoi email :", error);
        // Tu peux décider d'envoyer quand même la réponse 200 ou 500 selon ton choix
      } else {
        console.log("Email envoyé :", info.response);
      }
    });

    res.status(200).json({
      message:
        "Demande de devis reçue, enregistrée et email envoyé avec succès !",
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du devis :", error);
    res.status(500).json({
      message: "Erreur lors de l'enregistrement de la demande de devis.",
    });
  }
});

// Route POST /api/contact
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

  console.log("Nouveau message de contact reçu :");
  console.log({
    nomPrenom,
    telephone,
    email,
    ville,
    codePostal,
    typeProjet,
    receiveUpdates,
  });

  // Préparer et envoyer email contact (optionnel, tu peux ajouter comme pour devis)
  const mailOptions = {
    from: `"360 Conseil" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_RECEIVER || process.env.MAIL_USER,
    subject: "Nouveau message de contact",
    text: `Vous avez reçu un nouveau message de contact :
Nom et Prénom: ${nomPrenom}
Téléphone: ${telephone}
Email: ${email}
Ville: ${ville}
Code Postal: ${codePostal}
Type de Projet: ${typeProjet}
Recevoir des mises à jour: ${receiveUpdates}
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Erreur envoi email contact :", error);
    } else {
      console.log("Email contact envoyé :", info.response);
    }
  });

  res.status(200).json({ message: "Message de contact reçu avec succès !" });
});

// Route POST /api/newsletter
app.post("/api/newsletter", (req, res) => {
  const { nomPrenom, email, receiveUpdates } = req.body;

  console.log("Nouvelle inscription à la newsletter :");
  console.log({ nomPrenom, email, receiveUpdates });

  // Tu peux aussi envoyer un mail de notification ici si besoin

  res.status(200).json({ message: "Inscription à la newsletter réussie !" });
});

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
  console.log(`Routes disponibles :`);
  console.log(`  - POST http://localhost:${PORT}/api/devis`);
  console.log(`  - POST http://localhost:${PORT}/api/contact`);
  console.log(`  - POST http://localhost:${PORT}/api/newsletter`);
});
