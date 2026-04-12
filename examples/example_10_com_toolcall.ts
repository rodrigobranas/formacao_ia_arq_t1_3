import { readFileSync } from "fs";

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

const toolCall = output.output?.find((item: any) => item.type === 'function_call');
if (toolCall) {
    console.log(`\nTool call detectado: ${toolCall.name}`);
    const args = JSON.parse(toolCall.call_id ? toolCall.arguments : '{}');
    console.log(`Argumentos: ${JSON.stringify(args)}`);
    const fileContent = readFileSync(args.filename, 'utf-8');
    console.log(`\nConteúdo do arquivo:\n${fileContent}`);
    console.log(args, fileContent);
}
