'use server';

export interface AnalysisError {
  type: 'missing_column' | 'wrong_format' | 'misplaced_data' | 'other';
  message: string;
  column?: string;
  suggestion?: string;
}

export interface AnalysisResult {
  isValid: boolean;
  errors: AnalysisError[];
  columnMapping: Record<string, string>;
  suggestions: string[];
  aiError?: string;
}

const PRODUCT_COLUMNS = [
  'name',
  'description',
  'unitPrice',
  'cost',
  'quantity',
];
const INVOICE_COLUMNS = [
  'invoiceNumber',
  'recipientType',
  'recipientPlatformId',
  'recipientEmail',
  'recipientDisplayName',
  'productIds',
  'productNames',
  'quantities',
  'unitPrices',
  'issuedDate',
  'dueDate',
  'description',
  'paymentTerms',
  'currency',
];

export async function analyzeImportFile(
  headers: string[],
  sampleRows: Record<string, unknown>[],
  type: 'products' | 'invoices'
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return {
      isValid: false,
      errors: [],
      columnMapping: {},
      suggestions: [],
      aiError: 'Gemini API Key is not configured in .env.local',
    };
  }

  const expectedColumns =
    type === 'products' ? PRODUCT_COLUMNS : INVOICE_COLUMNS;

  const prompt = `
    You are an expert data validator for an ERP system. 
    Analyze the structure of a file to be imported.
    
    Type of import: ${type}
    Expected columns: ${expectedColumns.join(', ')}
    
    Found headers in the file: [${headers.join(', ')}]
    Sample data (first 3 rows):
    ${JSON.stringify(sampleRows, undefined, 2)}
    
    Your task:
    1. Identify if any expected columns are missing or named differently (e.g., 'nom' instead of 'name').
    2. Check if the data format seems correct for the sample rows.
    3. Propose a mapping between the found headers and the expected columns.
    
    Return a JSON object only (no markdown, no extra text) with this structure:
    {
      "isValid": boolean,
      "errors": [
        { "type": "missing_column" | "wrong_format" | "misplaced_data", "message": "string", "column": "string", "suggestion": "string" }
      ],
      "columnMapping": { "found_header": "expected_column_name" },
      "suggestions": ["string"]
    }
    
    Rules for mapping:
    - If a header is close to an expected column (e.g. 'Price' to 'unitPrice'), include it in the mapping.
    - If a header is in another language (French/Arabic) like 'Description' or 'الكمية', map it correctly.
    - Treat "isValid" as true only if all required columns are present and correctly named.
  `;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  let responseText = '';
  let modelUsed = '';
  let lastError: unknown = undefined;

  for (const model of models) {
    let attempts = 0;
    const maxAttempts = 2; // Allow one retry for 429s

    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(
          `[AI-Analysis] Attempting with model: ${model} (Attempt ${attempts})`
        );
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                response_mime_type: 'application/json',
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            responseText = text;
            modelUsed = model;
            break; // Success!
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          lastError = errorData;

          const isQuotaError =
            response.status === 429 ||
            JSON.stringify(errorData).includes('quota');

          if (isQuotaError && attempts < maxAttempts) {
            console.warn(
              `[AI-Analysis] Quota reached for ${model}. Waiting 2s before retry...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue; // Retry same model
          }

          console.warn(
            `[AI-Analysis] Model ${model} failed with status ${response.status}.`
          );
          break; // Try next model in the list
        }
      } catch (error) {
        lastError = error;
        console.error(`[AI-Analysis] Unexpected error with ${model}:`, error);
        break; // Try next model
      }
    }

    if (responseText) break; // Exit model loop if we got a response
  }

  if (!responseText) {
    const errorToReport = lastError;
    console.error('AI Request failed. Error to report:', errorToReport);
    let errorMsg =
      'Les modèles Gemini sont indisponibles. Veuillez vérifier votre connexion ou utiliser une autre clé API.';

    const errString = JSON.stringify(errorToReport);
    if (
      errString.includes('429') ||
      errString.includes('quota') ||
      errString.includes('RESOURCE_EXHAUSTED')
    ) {
      errorMsg =
        "Quota de l'API dépassé. Vous avez fait trop de requêtes aujourd'hui ou dans la minute (Google Free Tier Limite). Patientez quelques minutes et ne cliquez qu'une seule fois.";
    } else if (
      errString.includes('API_KEY_INVALID') ||
      errString.includes('Forbidden') ||
      errString.includes('API key expired')
    ) {
      errorMsg =
        'La clé API Gemini est invalide ou désactivée. Veuillez configurer une clé valide.';
    } else if (
      errorToReport &&
      typeof errorToReport === 'object' &&
      'error' in errorToReport
    ) {
      errorMsg = `Erreur API: ${(errorToReport as { error?: { message?: string } }).error?.message || 'Erreur inconnue'}`;
    }

    return {
      isValid: false,
      errors: [],
      columnMapping: {},
      suggestions: [],
      aiError: errorMsg,
    };
  }

  console.log(`Successfully used model: ${modelUsed}`);

  try {
    let cleanedText = responseText;
    if (responseText.includes('\`\`\`')) {
      const match = responseText.match(/```(?:json)?\s*([\S\s]*?)\s*```/);
      if (match) {
        cleanedText = match[1];
      }
    }

    const jsonMatch = cleanedText.match(/{[\S\s]*}/);
    if (!jsonMatch) {
      throw new Error('Could not find valid JSON in AI response');
    }

    return JSON.parse(jsonMatch[0]) as AnalysisResult;
  } catch (error: unknown) {
    console.error('Error parsing AI response:', error);
    return {
      isValid: false,
      errors: [],
      columnMapping: {},
      suggestions: [],
      aiError: `Erreur lors du traitement de la réponse de l'IA (modèle ${modelUsed}).`,
    };
  }
}
