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
    serverSelectionTimeoutMS: 30000, // 30s au lieu de 10s
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

// Schéma Mongoose pour les messages de contact
const contactSchema = new mongoose.Schema({
  nomPrenom: String,
  telephone: String,
  email: String,
  ville: String,
  codePostal: String,
  typeProjet: String,
  receiveUpdates: Boolean,
  dateSoumission: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema);

const Devis = mongoose.model("Devis", devisSchema);

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",

  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT), // s'assurer que c'est bien un nombre
  secure: false, // false pour port 587, true pour 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
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
      subject: "📩 Nouveau message de contact",
      replyTo: mail, // user's email from the form

      html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #0066cc;">Nouveau message reçu via le formulaire de contact</h2>
        <p><strong>Nom :</strong> ${nom || "-"}</p>
        <p><strong>Prénom :</strong> ${prenom || "-"}</p>
        <p><strong>Email :</strong> ${mail || "-"}</p>
        <p><strong>Téléphone :</strong> ${telephone || "-"}</p>
        <p><strong>Ville :</strong> ${ville || "-"}</p>
        <p><strong>Code postal :</strong> ${codePostal || "-"}</p>
        <p><strong>Type de projet :</strong> ${typeProjet || "-"}</p>
        <hr style="margin-top: 20px;" />
        <p style="font-size: 0.9em; color: #888;">Ce message a été envoyé automatiquement depuis le site 360Conseil.</p>
      </div>
    `,
    };

    // Envoyer l'email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur envoi email :", error);
        // Tu peux décider d'envoyer quand même la réponse 200 ou 500 selon ton choix
      } else {
        console.log("Email envoyé :", info.response);
        console.log("✉️ Tentative d'envoi :", mailOptions);
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

app.post("/api/contact", async (req, res) => {
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

  try {
    const newContact = new Contact({
      nomPrenom,
      telephone,
      email,
      ville,
      codePostal,
      typeProjet,
      receiveUpdates,
    });

    await newContact.save();

    // Préparer et envoyer l’email
    const mailOptions = {
      from: `"360 Conseil" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_RECEIVER || process.env.MAIL_USER,
      subject: "📩 Nouveau message de contact",
      replyTo: email, // user's email from the form

      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="color: #0066cc;">Nouveau message reçu via le formulaire de contact</h2>
          <p><strong>Nom :</strong> ${nom || "-"}</p>
          <p><strong>Prénom :</strong> ${prenom || "-"}</p>
          <p><strong>Email :</strong> ${email || "-"}</p>
          <p><strong>Téléphone :</strong> ${telephone || "-"}</p>
          <p><strong>Ville :</strong> ${ville || "-"}</p>
          <p><strong>Code postal :</strong> ${codePostal || "-"}</p>
          <p><strong>Type de projet :</strong> ${typeProjet || "-"}</p>
          <hr style="margin-top: 20px;" />
          <p style="font-size: 0.9em; color: #888;">Ce message a été envoyé automatiquement depuis le site 360Conseil.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur envoi email contact :", error);
      } else {
        console.log("Email contact envoyé :", info.response);
      }
    });

    res
      .status(200)
      .json({ message: "Message de contact reçu et enregistré avec succès !" });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du contact :", error);
    res
      .status(500)
      .json({ message: "Erreur lors du traitement du message de contact." });
  }
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
