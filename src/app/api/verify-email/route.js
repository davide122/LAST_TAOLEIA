import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Email non valida" },
        { status: 400 }
      );
    }

    // Genera token e resetta is_verified
    const token = randomUUID();
    const existing = await sql`SELECT * FROM emailnova WHERE email = ${email}`;

    if (existing.length === 0) {
      await sql`
        INSERT INTO emailnova (email, token, questions_left)
        VALUES (${email}, ${token}, 5)
      `;
    } else {
      await sql`
        UPDATE emailnova
        SET token = ${token}, is_verified = false
        WHERE email = ${email}
      `;
    }

    // Link al front-end (non all'API)
    const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL}/newsletter?token=${token}`;

    // Invio email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Taoleila Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Conferma la tua Email e attiva il tuo assistente AI 🤖",
      html: `
      <div style="background-color:#FEF5E7;padding:40px;font-family:sans-serif;color:#1E4E68;text-align:center">
        <img src="${process.env.NEXT_PUBLIC_BASE_URL}/icon.png" alt="Taoleila Logo" width="60" height="60" style="margin-bottom:20px;" />
        <h1 style="font-size:30px;color:#1E4E68;margin-bottom:10px;">Verifica il tuo indirizzo email</h1>
        <p style="font-size:16px;color:#1E4E68;margin-bottom:30px;">
          Benvenuto in <strong style="color:#79424f;">Taoleila</strong>, il tuo assistente con voce, video e intelligenza.
        </p>
        <a href="${verifyLink}" style="display:inline-block;padding:16px 32px;background-color:#79424f;color:#FEF5E7;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;transition:0.3s;">
          🔐 Verifica la tua Email
        </a>
        <p style="font-size:13px;color:#1E4E68;margin-top:40px;">
          Se non sei stato tu a richiedere l'accesso, ignora questa email.
        </p>
        <div style="margin-top:40px;font-size:12px;color:#1E4E68;">
          Powered by <strong style="color:#79424f">Taoleila</strong>
        </div>
      </div>
      `,
    });

    return NextResponse.json(
      { message: "Email inviata. Controlla la tua casella!" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Errore nella verifica email:", error);
    return NextResponse.json(
      { message: "Errore interno del server" },
      { status: 500 }
    );
  }
}
