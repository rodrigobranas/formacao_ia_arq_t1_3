const response1 = await fetch('https://api.openai.com/v1/responses', {
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

const output1 = (await response1.json()) as any;
console.log(JSON.stringify(output1, undefined, "  "));


const response2 = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
        model: 'gpt-5.4-nano',
        previous_response_id: output1.id,
        input: 'Como faço para instalar?'
    })
});

const output2 = await response2.json();
console.log(JSON.stringify(output2, undefined, "  "));
