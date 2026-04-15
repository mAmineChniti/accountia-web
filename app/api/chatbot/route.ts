import { type NextRequest, NextResponse } from 'next/server';

// Groq API — free, blazing fast (< 500ms), no billing required
// Model: llama-3.3-70b-versatile — best quality on free tier
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are Accountia Assistant, a professional and friendly AI support agent for Accountia — a modern invoicing and business management platform.

## Your Role
You help CLIENTS (individuals who receive invoices from businesses) with:

### 💳 Invoice & Payment Help
- How to view their invoices on the dashboard
- How to pay an invoice (Stripe payment or mock payment)
- How to check payment status: ISSUED, VIEWED, PAID, PARTIAL, OVERDUE, DISPUTED
- What each invoice status means
- How to find invoice confirmation emails in their inbox
- What to do if an invoice is OVERDUE
- How to dispute an invoice

### 📧 Email & Notifications
- How invoice notifications are sent to their registered email
- How to check their email inbox for invoice receipts
- What emails to expect from Accountia (invoice received, payment confirmation)

### 🏢 Becoming a Business Owner
- How to apply for a Business Owner account on Accountia
- Application process: submit application → review by admin → approval
- Required info: business name, description, website, phone
- Timeline: 2–3 business days for review
- After approval: access to business dashboard, products, invoices, statistics

### 🔐 Account & Platform
- How to register or log in to Accountia
- How to confirm email address
- How to reset password
- How to enable 2-factor authentication (2FA)

### ℹ️ General Info
- Accountia: B2B invoicing platform, multi-currency (TND), multi-language (Arabic, French, English)
- Real-time invoice tracking and payment processing

## Rules
- Respond in the SAME LANGUAGE the user writes in (French, English, or Arabic)
- Be concise, warm, and professional
- Never make up invoice numbers, amounts, or account details
- For account-specific info, tell users where to find it on the dashboard
- Keep responses under 200 words unless detailed steps are needed`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: Array<{ role: 'user' | 'model'; content: string }>;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'PASTE_YOUR_GROQ_KEY_HERE') {
      return NextResponse.json({
        message:
          "⚠️ Le service AI n'est pas encore configuré.\n\n" +
          "Pour l'activer :\n" +
          '1. Allez sur https://console.groq.com\n' +
          '2. Créez un compte gratuit\n' +
          '3. Générez une API key (gsk_...)\n' +
          '4. Ajoutez-la dans `.env.local` : GROQ_API_KEY="gsk_..."',
      });
    }

    // Groq uses OpenAI-compatible format — map 'model' role to 'assistant'
    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg) => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content,
      })),
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 400,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const errBody = (await response.json()) as {
        error?: { message?: string; type?: string };
      };
      console.error('Groq API error:', JSON.stringify(errBody));

      const isQuota = response.status === 429;
      const friendlyMessage = isQuota
        ? '⚠️ Je suis temporairement surchargé. Réessayez dans quelques secondes.'
        : `❌ Erreur du service AI (${response.status}). Réessayez dans un moment.`;

      return NextResponse.json({ message: friendlyMessage });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const aiText =
      data.choices?.[0]?.message?.content ??
      "Je n'ai pas pu générer une réponse. Veuillez réessayer.";

    return NextResponse.json({ message: aiText });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({
      message:
        '❌ Erreur de connexion. Vérifiez votre connexion internet et réessayez.',
    });
  }
}
