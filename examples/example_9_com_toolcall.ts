const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
        model: 'gpt-4.1-nano',
        input: 'Qual é a versão do typescript?',
        tools: [
            {
                type: 'function',
                name: 'read_file',
                description: 'Lê o conteúdo de um arquivo do projeto',
                parameters: {
                    type: 'object',
                    properties: {
                        filename: {
                            type: 'string',
                            description: 'O nome do arquivo a ser lido'
                        }
                    },
                    required: ['filename']
                }
            }
        ]
    })
});

const output = await response.json();
console.log(JSON.stringify(output, undefined, "  "));
