const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

async function testGroqVision() {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Hello, can you see? (Testing vision model capability)' },
          ],
        },
      ],
    });
    console.log('Success:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGroqVision();
