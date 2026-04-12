const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
        model: 'gpt-5.4-nano',
        input: 'Qual é a melhor ferramenta de testes para JavaScript?'
    })
});

const output = await response.json();
console.log(JSON.stringify(output, undefined, "  "));
