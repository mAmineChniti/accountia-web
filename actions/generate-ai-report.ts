'use server';

import type { Product } from '@/types/services';

export async function generateAiReport(
  products: Product[],
  lang: string = 'fr'
): Promise<{ summary: string }> {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const groqKey = process.env.GROQ_API_KEY || '';
    const apiKey = geminiKey || groqKey;

    if (!apiKey) {
      return {
        summary:
          '⚠️ Clé API IA manquante. (Veuillez configurer GEMINI_API_KEY ou GROQ_API_KEY dans votre fichier .env)',
      };
    }

    const isGroq = !geminiKey && !!groqKey;

    const sanitizedProducts = products.map((p) => ({
      n: p.name,
      p: p.unitPrice,
      c: p.cost,
      q: p.quantity,
    }));

    const targetLang =
      lang === 'fr' ? 'French' : lang === 'ar' ? 'Arabic' : 'English';
    const prompt = `
You are a brilliant financial/business analyst for Accountia, an ERP system.
Analyze this product inventory data for a strategic report.
Inventory (JSON subset):
${JSON.stringify(sanitizedProducts)}

Output language MUST BE: ${targetLang}

Format rules:
- Pure markdown strings with standard bold/italic/lists.
- Return ONLY the raw markdown content, do NOT return JSON format.
- Do NOT wrap in \`\`\`markdown or \`\`\`.
- **CRITICAL**: Use "TND" (Tunisian Dinar) as the only currency for all prices and stock values. Absolutely DO NOT use $ or €. 

Required Structure:
### Overall Inventory Health
(Short analysis)

### Most Valuable Items
(By unit price or total stock value)

### Low Stock / Insights
(Warn if quantity is low or if margins are weirdly small)
`;

    const models = isGroq
      ? ['llama-3.3-70b-versatile', 'llama3-70b-8192']
      : ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

    let responseText = '';

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15_000);

        const url = isGroq
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const bodyArrayOrObject = isGroq
          ? {
              model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.3,
            }
          : {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
              },
            };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(isGroq ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          signal: controller.signal,
          body: JSON.stringify(bodyArrayOrObject),
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const text = isGroq
            ? data.choices?.[0]?.message?.content
            : data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (text) {
            responseText = text;
            break;
          }
        }
      } catch (error) {
        console.warn(`[AI-Report] Model ${model} failed`, error);
      }
    }

    if (!responseText) {
      return {
        summary:
          "❌ L'analyse par l'IA est indisponible ou a échoué. Le quota pourrait être dépassé ou le réseau instable.",
      };
    }

    return { summary: responseText.trim() };
  } catch (error) {
    console.error('Error generating AI Report:', error);
    return {
      summary: "❌ Une erreur s'est produite lors de la génération du rapport.",
    };
  }
}
