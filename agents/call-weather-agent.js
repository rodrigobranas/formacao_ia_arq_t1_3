const response = await fetch('http://localhost:4111/api/agents/weatherAgent/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Qual é a temperatura no Rio de Janeiro?' },
    ],
    structuredOutput: {
      schema: {
        type: 'object',
        properties: {
          temperature: {
            type: 'number',
            description: 'Temperatura atual em graus Celsius',
          },
        },
        required: ['temperature'],
      },
    },
  }),
});

if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${await response.text()}`);
}

const data = await response.json();
console.log(JSON.stringify(data.object, null, 2));
