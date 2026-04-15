// Lê uma variável obrigatória do ambiente. Falhar cedo evita erros obscuros mais tarde
// (ex.: chamada à API sem API key).
export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Copy packages/backend/.env.example to packages/backend/.env and fill in the keys.`
    );
  }

  return value;
}
