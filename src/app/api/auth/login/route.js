// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { z } from "zod";

export const runtime = "nodejs"; // obbligatorio con bcrypt/jwt

// 1. Schema di validazione
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
});

export async function POST(request) {
  const client = await pool.connect();

  try {
    const { email, password } = await request.json();

    // 2. Validazione
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // 3. Query al DB
    const result = await client.query(
      'SELECT id, email, password FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
    }

    const user = result.rows[0];

    // 4. Verifica password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
    }

    // 5. Generazione JWT
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Cookie HTTP-only
    const cookie = serialize("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/"
    });

    // 7. Risposta
    return new NextResponse(
      JSON.stringify({ message: "Login riuscito" }),
      {
        status: 200,
        headers: { "Set-Cookie": cookie }
      }
    );
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  } finally {
    client.release();
  }
}
