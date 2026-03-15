import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!user || !pass) {
    console.error("CRITICAL: GMAIL_USER or GMAIL_APP_PASSWORD environment variables are missing.");
    console.error("Please set them in the AI Studio Secrets menu (Settings > Secrets).");
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use SSL
      auth: { user, pass }
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP Connection Error:", error);
      } else {
        console.log("SMTP Server is ready to take our messages");
      }
    });
  }
  return transporter;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", async (req, res) => {
    const mailTransporter = getTransporter();
    let emailStatus = "not_configured";
    
    if (mailTransporter) {
      try {
        await mailTransporter.verify();
        emailStatus = "ready";
      } catch (e) {
        emailStatus = "error";
      }
    }
    
    res.json({ 
      status: "ok", 
      emailService: emailStatus 
    });
  });

  app.post("/api/book-hotel", async (req, res) => {
    const bookingData = req.body;
    const adminEmail = "RNIHARRANJANSAHOO@GMAIL.COM";

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: adminEmail,
      subject: `New Hotel Booking Request: ${bookingData.hotelName}`,
      text: `
Customer Name: ${bookingData.fullName}
Customer Email: ${bookingData.email}
Phone Number: ${bookingData.phone}
Destination: ${bookingData.destination}
Hotel Selected: ${bookingData.hotelName}
Check-in Date: ${bookingData.checkIn}
Check-out Date: ${bookingData.checkOut}
Guests: ${bookingData.guests}
Special Requests: ${bookingData.specialRequests || "None"}
      `,
    };

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      return res.status(500).json({ error: "Email service not configured" });
    }

    try {
      await mailTransporter.sendMail(mailOptions);
      res.json({ success: true, message: "Your booking request has been sent. Our team will confirm your hotel shortly." });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send booking request" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
