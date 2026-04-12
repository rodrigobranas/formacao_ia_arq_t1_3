CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL PRIMARY KEY,
  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  admin BOOLEAN NOT NULL DEFAULT false,
  organization_id INTEGER NOT NULL REFERENCES organizations(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS ticket_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255)
);

ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id);

ALTER TABLE ticket_types
  ALTER COLUMN organization_id DROP DEFAULT;

DROP INDEX IF EXISTS ticket_types_name_lower_unique;

CREATE UNIQUE INDEX IF NOT EXISTS ticket_types_name_org_unique
  ON ticket_types (LOWER(name), organization_id);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  code VARCHAR(12) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  ticket_type_id INTEGER REFERENCES ticket_types(id),
  assigned_to_id INTEGER REFERENCES users(id),
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ticket sentiment (database/migrations/add_ticket_sentiment.sql)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) NULL;

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_sentiment_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_sentiment_check
  CHECK (sentiment IS NULL OR sentiment IN ('positive', 'neutral', 'negative'));

CREATE UNIQUE INDEX IF NOT EXISTS tickets_code_unique ON tickets (code);

CREATE INDEX IF NOT EXISTS idx_tickets_org_status ON tickets (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_org_created ON tickets (organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_org_status_created ON tickets (organization_id, status, created_at);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  ticket_comment_id INTEGER REFERENCES ticket_comments(id),
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_assignments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  assigned_to_id INTEGER NOT NULL REFERENCES users(id),
  assigned_by_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Organization
INSERT INTO organizations (id, name, slug) VALUES (1, 'ERP Magic', 'erp-magic')
ON CONFLICT DO NOTHING;

-- Users (password: asdQWE123)
-- rodrigo = admin, pedro/marcio/ciro = support agents
INSERT INTO users (id, name, email, password, admin, organization_id) VALUES
  (1, 'Rodrigo Branas',   'rodrigo@erp.magic', '$2b$10$IXnXlq4M2.poWo7Wbc3SMuuwlzyLgE04Ed5/f2Wvkpe75WV1xXfQC', true,  1),
  (2, 'Pedro Alvares',    'pedro@erp.magic',   '$2b$10$IXnXlq4M2.poWo7Wbc3SMuuwlzyLgE04Ed5/f2Wvkpe75WV1xXfQC', false, 1),
  (3, 'Marcio Fernandes', 'marcio@erp.magic',  '$2b$10$IXnXlq4M2.poWo7Wbc3SMuuwlzyLgE04Ed5/f2Wvkpe75WV1xXfQC', false, 1),
  (4, 'Ciro Menezes',     'ciro@erp.magic',    '$2b$10$IXnXlq4M2.poWo7Wbc3SMuuwlzyLgE04Ed5/f2Wvkpe75WV1xXfQC', false, 1)
ON CONFLICT DO NOTHING;

SELECT setval('users_id_seq', 4);

-- Ticket Types
INSERT INTO ticket_types (id, name, description, organization_id) VALUES
  (1, 'Dúvida',      'Chamados relacionados a dúvidas sobre o uso do ERP', 1),
  (2, 'Problema',    'Relatos de erros, falhas e comportamentos inesperados', 1),
  (3, 'Sugestão',    'Ideias e sugestões de melhoria para o sistema', 1)
ON CONFLICT DO NOTHING;

SELECT setval('ticket_types_id_seq', 3);

-- =============================================================================
-- TICKETS (100 tickets)
-- Status distribution: ~30 new, ~40 assigned, ~30 closed
-- Assigned tickets -> assigned_to_id = 2 (Pedro), 3 (Marcio), or 4 (Ciro)
-- Closed tickets -> also have assigned_to_id (the agent who closed)
-- New tickets -> assigned_to_id IS NULL
-- =============================================================================

INSERT INTO tickets (id, code, status, name, email, phone, description, ticket_type_id, assigned_to_id, organization_id, created_at, updated_at) VALUES
-- NEW tickets (1-30) - no assignment
(1,  'TK-A1B2C3D4', 'new', 'Fernanda Oliveira',   'fernanda.oliveira@gmail.com',   '(11) 98765-4321', 'Estou tentando emitir uma nota fiscal de serviço, mas o sistema não apresenta a opção de ISS. Como faço para habilitar essa tributação?', 1, NULL, 1, '2026-03-15 09:12:00', '2026-03-15 09:12:00'),
(2,  'TK-E5F6G7H8', 'new', 'Carlos Eduardo Silva', 'carlos.silva@hotmail.com',      '(21) 97654-3210', 'Ao tentar cadastrar um novo produto, o campo "NCM" aparece em branco e não consigo pesquisar. O erro acontece apenas no módulo de estoque.', 2, NULL, 1, '2026-03-15 10:45:00', '2026-03-15 10:45:00'),
(3,  'TK-I9J0K1L2', 'new', 'Mariana Costa',        'mariana.costa@empresa.com.br',  '(31) 96543-2109', 'Gostaria de saber se é possível configurar o ERP para enviar boletos automaticamente por e-mail após o faturamento.', 1, NULL, 1, '2026-03-16 08:30:00', '2026-03-16 08:30:00'),
(4,  'TK-M3N4O5P6', 'new', 'Roberto Almeida',      'roberto.almeida@yahoo.com.br',  '(41) 95432-1098', 'O relatório de contas a pagar está mostrando valores duplicados. Parece que os lançamentos de provisão estão sendo contados duas vezes.', 2, NULL, 1, '2026-03-16 11:20:00', '2026-03-16 11:20:00'),
(5,  'TK-Q7R8S9T0', 'new', 'Juliana Mendes',       'juliana.mendes@outlook.com',    '(51) 94321-0987', 'Sugiro a inclusão de um dashboard financeiro com indicadores de inadimplência e aging de recebíveis no módulo financeiro.', 3, NULL, 1, '2026-03-17 14:00:00', '2026-03-17 14:00:00'),
(6,  'TK-U1V2W3X4', 'new', 'Anderson Pereira',     'anderson.pereira@gmail.com',    '(61) 93210-9876', 'Como faço para configurar múltiplos almoxarifados no módulo de estoque? Temos filiais em três estados diferentes.', 1, NULL, 1, '2026-03-17 15:30:00', '2026-03-17 15:30:00'),
(7,  'TK-Y5Z6A7B8', 'new', 'Patricia Souza',       'patricia.souza@empresa.com.br', '(71) 92109-8765', 'O sistema está travando ao gerar o SPED Fiscal. O processo fica em 80% e não avança. Já tentei em diferentes navegadores.', 2, NULL, 1, '2026-03-18 09:00:00', '2026-03-18 09:00:00'),
(8,  'TK-C9D0E1F2', 'new', 'Lucas Ferreira',       'lucas.ferreira@hotmail.com',    '(81) 91098-7654', 'Gostaria de entender como funciona o rateio de custos indiretos entre centros de custo no módulo de contabilidade.', 1, NULL, 1, '2026-03-18 10:15:00', '2026-03-18 10:15:00'),
(9,  'TK-G3H4I5J6', 'new', 'Camila Rodrigues',     'camila.rodrigues@gmail.com',    '(85) 90987-6543', 'Seria interessante ter uma funcionalidade de aprovação em lote para ordens de compra, em vez de aprovar uma por uma.', 3, NULL, 1, '2026-03-19 08:45:00', '2026-03-19 08:45:00'),
(10, 'TK-K7L8M9N0', 'new', 'Thiago Barbosa',       'thiago.barbosa@yahoo.com.br',  '(91) 99876-5432', 'Ao importar a planilha de produtos via CSV, o sistema rejeita linhas com caracteres especiais no campo descrição. Preciso importar 2.000 itens.', 2, NULL, 1, '2026-03-19 13:00:00', '2026-03-19 13:00:00'),
(11, 'TK-O1P2Q3R4', 'new', 'Renata Lima',          'renata.lima@empresa.com.br',    '(11) 98765-1111', 'Qual é o procedimento para estornar uma nota fiscal que já foi transmitida para a SEFAZ?', 1, NULL, 1, '2026-03-20 09:30:00', '2026-03-20 09:30:00'),
(12, 'TK-S5T6U7V8', 'new', 'Felipe Santos',        'felipe.santos@gmail.com',       '(21) 97654-2222', 'O módulo de compras não está calculando corretamente o ICMS-ST na entrada de mercadorias vindas de outros estados.', 2, NULL, 1, '2026-03-20 11:00:00', '2026-03-20 11:00:00'),
(13, 'TK-W9X0Y1Z2', 'new', 'Daniela Martins',      'daniela.martins@hotmail.com',   '(31) 96543-3333', 'Sugiro que o sistema permita a criação de templates de pedidos de venda para clientes recorrentes, agilizando o processo comercial.', 3, NULL, 1, '2026-03-21 08:00:00', '2026-03-21 08:00:00'),
(14, 'TK-A3B4C5D6', 'new', 'Gustavo Nunes',        'gustavo.nunes@outlook.com',     '(41) 95432-4444', 'Estou recebendo o erro "Timeout na conexão com o servidor" ao tentar acessar o módulo fiscal nos horários de pico.', 2, NULL, 1, '2026-03-21 14:30:00', '2026-03-21 14:30:00'),
(15, 'TK-E7F8G9H0', 'new', 'Amanda Teixeira',      'amanda.teixeira@empresa.com.br','(51) 94321-5555', 'Como configurar a integração do ERP com o sistema bancário para conciliação automática de extratos?', 1, NULL, 1, '2026-03-22 10:00:00', '2026-03-22 10:00:00'),
(16, 'TK-I1J2K3L4', 'new', 'Rafael Cardoso',       'rafael.cardoso@gmail.com',      '(61) 93210-6666', 'O inventário rotativo está apresentando divergência entre o saldo físico e o saldo do sistema. Há alguma forma de auditar os movimentos?', 1, NULL, 1, '2026-03-22 15:45:00', '2026-03-22 15:45:00'),
(17, 'TK-M5N6O7P8', 'new', 'Isabela Moreira',      'isabela.moreira@yahoo.com.br',  '(71) 92109-7777', 'Ao fechar o caixa, o sistema não está considerando os pagamentos em PIX. O valor total fica divergente.', 2, NULL, 1, '2026-03-23 09:20:00', '2026-03-23 09:20:00'),
(18, 'TK-Q9R0S1T2', 'new', 'Bruno Nascimento',     'bruno.nascimento@hotmail.com',  '(81) 91098-8888', 'Seria útil ter um relatório de curva ABC de produtos para auxiliar na gestão de estoque e compras.', 3, NULL, 1, '2026-03-23 11:10:00', '2026-03-23 11:10:00'),
(19, 'TK-U3V4W5X6', 'new', 'Leticia Araujo',       'leticia.araujo@gmail.com',      '(85) 90987-9999', 'Não estou conseguindo gerar o arquivo SINTEGRA. O sistema apresenta erro de validação no registro tipo 50.', 2, NULL, 1, '2026-03-24 08:00:00', '2026-03-24 08:00:00'),
(20, 'TK-Y7Z8A9B0', 'new', 'Diego Ribeiro',        'diego.ribeiro@empresa.com.br',  '(91) 99876-0000', 'Como faço para configurar diferentes alíquotas de ICMS por estado no cadastro de produtos?', 1, NULL, 1, '2026-03-24 10:30:00', '2026-03-24 10:30:00'),
(21, 'TK-C1D2E3F4', 'new', 'Vanessa Gomes',        'vanessa.gomes@outlook.com',     '(11) 98111-2233', 'O relatório de DRE não está segregando corretamente as receitas por centro de resultado. Todos aparecem consolidados.', 2, NULL, 1, '2026-03-25 09:00:00', '2026-03-25 09:00:00'),
(22, 'TK-G5H6I7J8', 'new', 'Marcos Vieira',        'marcos.vieira@gmail.com',       '(21) 97222-3344', 'Gostaria de sugerir a implementação de controle de lotes e validade no módulo de estoque para produtos perecíveis.', 3, NULL, 1, '2026-03-25 14:00:00', '2026-03-25 14:00:00'),
(23, 'TK-K9L0M1N2', 'new', 'Tatiana Freitas',      'tatiana.freitas@hotmail.com',   '(31) 96333-4455', 'Qual o procedimento para emitir uma nota fiscal complementar de ICMS?', 1, NULL, 1, '2026-03-26 08:30:00', '2026-03-26 08:30:00'),
(24, 'TK-O3P4Q5R6', 'new', 'Eduardo Carvalho',     'eduardo.carvalho@yahoo.com.br', '(41) 95444-5566', 'O sistema está duplicando lançamentos contábeis quando faço o fechamento mensal. Já aconteceu nos últimos dois meses.', 2, NULL, 1, '2026-03-26 11:15:00', '2026-03-26 11:15:00'),
(25, 'TK-S7T8U9V0', 'new', 'Priscila Dias',        'priscila.dias@empresa.com.br',  '(51) 94555-6677', 'Sugiro adicionar um campo de observação interna nos pedidos de venda, visível apenas para o time comercial.', 3, NULL, 1, '2026-03-27 09:45:00', '2026-03-27 09:45:00'),
(26, 'TK-W1X2Y3Z4', 'new', 'Henrique Castro',      'henrique.castro@gmail.com',     '(61) 93666-7788', 'Preciso configurar regras de desconto progressivo no módulo comercial. Como faço isso?', 1, NULL, 1, '2026-03-27 13:30:00', '2026-03-27 13:30:00'),
(27, 'TK-A5B6C7D8', 'new', 'Carolina Machado',     'carolina.machado@outlook.com',  '(71) 92777-8899', 'O boleto gerado pelo sistema está com o código de barras inválido. O banco está rejeitando na compensação.', 2, NULL, 1, '2026-03-28 08:15:00', '2026-03-28 08:15:00'),
(28, 'TK-E9F0G1H2', 'new', 'Fábio Monteiro',       'fabio.monteiro@hotmail.com',    '(81) 91888-9900', 'Seria interessante integrar o módulo de vendas com WhatsApp Business para envio automático de confirmação de pedido.', 3, NULL, 1, '2026-03-28 10:00:00', '2026-03-28 10:00:00'),
(29, 'TK-I3J4K5L6', 'new', 'Aline Pinto',          'aline.pinto@gmail.com',         '(85) 90999-0011', 'Não consigo vincular um transportador ao pedido de venda. O campo de seleção está vazio mesmo com transportadores cadastrados.', 2, NULL, 1, '2026-03-29 09:00:00', '2026-03-29 09:00:00'),
(30, 'TK-M7N8O9P0', 'new', 'Ricardo Lopes',        'ricardo.lopes@empresa.com.br',  '(91) 99000-1122', 'Como faço para configurar o cálculo automático de comissão de vendedores com base nas metas atingidas?', 1, NULL, 1, '2026-03-29 11:30:00', '2026-03-29 11:30:00'),

-- ASSIGNED tickets (31-70) - assigned to Pedro(2), Marcio(3), or Ciro(4)
(31, 'TK-Q1R2S3T4', 'assigned', 'Sandra Correia',      'sandra.correia@gmail.com',      '(11) 98111-1001', 'O módulo de faturamento está gerando notas fiscais com a data de emissão errada. Está colocando a data do pedido em vez da data atual.', 2, 2, 1, '2026-03-10 09:00:00', '2026-03-11 10:00:00'),
(32, 'TK-U5V6W7X8', 'assigned', 'Jorge Andrade',       'jorge.andrade@hotmail.com',     '(21) 97222-1002', 'Como configuro a regra de crédito de ICMS para mercadorias destinadas ao ativo imobilizado (CIAP)?', 1, 3, 1, '2026-03-10 10:30:00', '2026-03-11 14:00:00'),
(33, 'TK-Y9Z0A1B2', 'assigned', 'Viviane Rocha',       'viviane.rocha@empresa.com.br',  '(31) 96333-1003', 'O relatório de fluxo de caixa projetado não está considerando os parcelamentos de vendas a prazo. Só mostra vendas à vista.', 2, 4, 1, '2026-03-10 14:00:00', '2026-03-12 09:00:00'),
(34, 'TK-C3D4E5F6', 'assigned', 'Leandro Melo',        'leandro.melo@yahoo.com.br',    '(41) 95444-1004', 'Gostaria de saber se é possível criar campos customizados no cadastro de clientes para armazenar informações específicas do nosso segmento.', 1, 2, 1, '2026-03-11 08:45:00', '2026-03-12 11:00:00'),
(35, 'TK-G7H8I9J0', 'assigned', 'Cristiane Batista',   'cristiane.batista@outlook.com', '(51) 94555-1005', 'Sugiro implementar um módulo de CRM integrado ao ERP para gestão de oportunidades e pipeline de vendas.', 3, 3, 1, '2026-03-11 11:20:00', '2026-03-13 09:00:00'),
(36, 'TK-K1L2M3N4', 'assigned', 'Paulo Cunha',         'paulo.cunha@gmail.com',         '(61) 93666-1006', 'Ao gerar o XML da NF-e, o sistema está preenchendo o campo de peso bruto com zero, mesmo quando informado no cadastro do produto.', 2, 4, 1, '2026-03-12 09:15:00', '2026-03-13 14:00:00'),
(37, 'TK-O5P6Q7R8', 'assigned', 'Elaine Duarte',       'elaine.duarte@hotmail.com',     '(71) 92777-1007', 'Como faço para configurar o envio automático de NF-e por e-mail para o destinatário após a autorização na SEFAZ?', 1, 2, 1, '2026-03-12 10:30:00', '2026-03-14 08:00:00'),
(38, 'TK-S9T0U1V2', 'assigned', 'Wagner Campos',       'wagner.campos@empresa.com.br',  '(81) 91888-1008', 'O cálculo do PIS e COFINS está incorreto para produtos monofásicos. O sistema está tributando normalmente.', 2, 3, 1, '2026-03-12 14:45:00', '2026-03-14 10:00:00'),
(39, 'TK-W3X4Y5Z6', 'assigned', 'Bianca Tavares',      'bianca.tavares@gmail.com',      '(85) 90999-1009', 'Seria útil ter a possibilidade de criar orçamentos diretamente no ERP e convertê-los em pedidos de venda com um clique.', 3, 4, 1, '2026-03-13 08:00:00', '2026-03-14 15:00:00'),
(40, 'TK-A7B8C9D0', 'assigned', 'Luciano Azevedo',     'luciano.azevedo@yahoo.com.br',  '(91) 99000-1010', 'O módulo de compras não permite vincular mais de um centro de custo a uma mesma ordem de compra. Precisamos dessa funcionalidade.', 2, 2, 1, '2026-03-13 11:30:00', '2026-03-15 09:00:00'),
(41, 'TK-E1F2G3H4', 'assigned', 'Simone Ramos',        'simone.ramos@outlook.com',      '(11) 98222-1011', 'Não consigo emitir NFC-e. O sistema retorna "Certificado digital não encontrado". Já instalei o certificado A1.', 2, 3, 1, '2026-03-14 09:00:00', '2026-03-15 11:00:00'),
(42, 'TK-I5J6K7L8', 'assigned', 'Alexandre Pires',     'alexandre.pires@gmail.com',     '(21) 97333-1012', 'Como funciona o processo de devolução de mercadoria no ERP? Preciso emitir nota de devolução para fornecedor.', 1, 4, 1, '2026-03-14 10:15:00', '2026-03-16 08:00:00'),
(43, 'TK-M9N0O1P2', 'assigned', 'Gabriela Fonseca',    'gabriela.fonseca@hotmail.com',  '(31) 96444-1013', 'O sistema está calculando o frete errado na nota fiscal. Está usando o peso volumétrico em vez do peso real.', 2, 2, 1, '2026-03-15 08:30:00', '2026-03-16 10:00:00'),
(44, 'TK-Q3R4S5T6', 'assigned', 'Otávio Sampaio',      'otavio.sampaio@empresa.com.br', '(41) 95555-1014', 'Sugiro adicionar filtros avançados no relatório de vendas: por vendedor, por região, por faixa de valor e por forma de pagamento.', 3, 3, 1, '2026-03-15 13:00:00', '2026-03-17 09:00:00'),
(45, 'TK-U7V8W9X0', 'assigned', 'Débora Santiago',     'debora.santiago@yahoo.com.br',  '(51) 94666-1015', 'Ao tentar conciliar os extratos bancários, o sistema apresenta erro de "saldo inicial divergente" mesmo estando correto.', 2, 4, 1, '2026-03-16 09:45:00', '2026-03-17 14:00:00'),
(46, 'TK-Y1Z2A3B4', 'assigned', 'Rodrigo Paiva',       'rodrigo.paiva@gmail.com',       '(61) 93777-1016', 'Como cadastrar uma operação de triangulação (venda com entrega futura) no módulo fiscal?', 1, 2, 1, '2026-03-16 11:00:00', '2026-03-18 08:00:00'),
(47, 'TK-C5D6E7F8', 'assigned', 'Natalia Xavier',      'natalia.xavier@outlook.com',    '(71) 92888-1017', 'O sistema não está gerando as parcelas corretamente quando a condição de pagamento é 30/60/90 dias.', 2, 3, 1, '2026-03-17 08:00:00', '2026-03-18 10:00:00'),
(48, 'TK-G9H0I1J2', 'assigned', 'Fernando Guimarães',  'fernando.guimaraes@hotmail.com','(81) 91999-1018', 'Seria interessante ter um painel de indicadores de performance (KPI) para a equipe de compras.', 3, 4, 1, '2026-03-17 10:30:00', '2026-03-19 09:00:00'),
(49, 'TK-K3L4M5N6', 'assigned', 'Adriana Borges',      'adriana.borges@gmail.com',      '(85) 90111-1019', 'O módulo de RH não está calculando corretamente as horas extras com adicional noturno.', 2, 2, 1, '2026-03-18 09:15:00', '2026-03-19 11:00:00'),
(50, 'TK-O7P8Q9R0', 'assigned', 'José Carlos Maia',    'josecarlos.maia@empresa.com.br','(91) 99111-1020', 'Preciso entender como configurar a apuração do Simples Nacional no módulo fiscal do ERP.', 1, 3, 1, '2026-03-18 14:00:00', '2026-03-20 08:00:00'),
(51, 'TK-S1T2U3V4', 'assigned', 'Michele Torres',      'michele.torres@yahoo.com.br',   '(11) 98333-1021', 'Ao cancelar uma nota fiscal, o estoque não está sendo devolvido automaticamente. Tenho que fazer o ajuste manual.', 2, 4, 1, '2026-03-19 08:45:00', '2026-03-20 10:00:00'),
(52, 'TK-W5X6Y7Z8', 'assigned', 'Sérgio Vasconcelos',  'sergio.vasconcelos@gmail.com',  '(21) 97444-1022', 'Como faço para configurar a integração contábil automática dos movimentos de estoque?', 1, 2, 1, '2026-03-19 11:30:00', '2026-03-21 09:00:00'),
(53, 'TK-A9B0C1D2', 'assigned', 'Cláudia Mendonça',    'claudia.mendonca@hotmail.com',  '(31) 96555-1023', 'O relatório de aging de contas a receber não está filtrando por filial. Mostra todos os títulos consolidados.', 2, 3, 1, '2026-03-20 09:00:00', '2026-03-21 14:00:00'),
(54, 'TK-E3F4G5H6', 'assigned', 'Vinicius Amorim',     'vinicius.amorim@outlook.com',   '(41) 95666-1024', 'Sugiro implementar a funcionalidade de split de pagamento para permitir múltiplas formas de pagamento em uma única venda.', 3, 4, 1, '2026-03-20 10:15:00', '2026-03-22 08:00:00'),
(55, 'TK-I7J8K9L0', 'assigned', 'Raquel Medeiros',     'raquel.medeiros@gmail.com',     '(51) 94777-1025', 'O módulo de produção não está baixando automaticamente as matérias-primas do estoque ao finalizar uma ordem de produção.', 2, 2, 1, '2026-03-21 08:00:00', '2026-03-22 10:00:00'),
(56, 'TK-M1N2O3P4', 'assigned', 'Leonardo Brito',      'leonardo.brito@empresa.com.br', '(61) 93888-1026', 'Qual é o procedimento correto para fazer a migração de dados de outro ERP para o ERP Magic?', 1, 3, 1, '2026-03-21 13:30:00', '2026-03-23 09:00:00'),
(57, 'TK-Q5R6S7T8', 'assigned', 'Rosana Figueiredo',   'rosana.figueiredo@yahoo.com.br','(71) 92999-1027', 'O sistema está travando quando tento gerar o relatório de inventário com mais de 5.000 itens.', 2, 4, 1, '2026-03-22 09:00:00', '2026-03-23 11:00:00'),
(58, 'TK-U9V0W1X2', 'assigned', 'Márcio Teles',        'marcio.teles@hotmail.com',      '(81) 91000-1028', 'Seria útil ter um módulo de gestão de contratos para controlar renovações, vencimentos e reajustes automaticamente.', 3, 2, 1, '2026-03-22 11:45:00', '2026-03-24 08:00:00'),
(59, 'TK-Y3Z4A5B6', 'assigned', 'Tatiane Rezende',     'tatiane.rezende@gmail.com',     '(85) 90222-1029', 'Não estou conseguindo emitir CT-e (Conhecimento de Transporte Eletrônico). O módulo fiscal não apresenta essa opção.', 2, 3, 1, '2026-03-23 08:30:00', '2026-03-24 10:00:00'),
(60, 'TK-C7D8E9F0', 'assigned', 'Rogério Cunha',       'rogerio.cunha@empresa.com.br',  '(91) 99222-1030', 'Como faço para parametrizar o cálculo do DIFAL (Diferencial de Alíquota) para vendas interestaduais a consumidor final?', 1, 4, 1, '2026-03-23 14:00:00', '2026-03-25 09:00:00'),
(61, 'TK-G1H2I3J4', 'assigned', 'Fernanda Leal',       'fernanda.leal@outlook.com',     '(11) 98444-1031', 'O módulo de contas a pagar está permitindo pagar o mesmo título duas vezes. Não há validação de duplicidade.', 2, 2, 1, '2026-03-24 09:00:00', '2026-03-25 11:00:00'),
(62, 'TK-K5L6M7N8', 'assigned', 'Marcelo Duarte',      'marcelo.duarte@gmail.com',      '(21) 97555-1032', 'Sugiro a implementação de workflow de aprovação para compras acima de determinado valor, com notificação por e-mail.', 3, 3, 1, '2026-03-24 10:30:00', '2026-03-26 08:00:00'),
(63, 'TK-O9P0Q1R2', 'assigned', 'Juliane Abreu',       'juliane.abreu@hotmail.com',     '(31) 96666-1033', 'O cálculo do custo médio ponderado está errado após a última atualização. O sistema não está considerando as devoluções.', 2, 4, 1, '2026-03-25 08:00:00', '2026-03-26 10:00:00'),
(64, 'TK-S3T4U5V6', 'assigned', 'Daniel Moura',        'daniel.moura@yahoo.com.br',    '(41) 95777-1034', 'Como faço para configurar diferentes tabelas de preço por região no módulo comercial?', 1, 2, 1, '2026-03-25 11:15:00', '2026-03-27 09:00:00'),
(65, 'TK-W7X8Y9Z0', 'assigned', 'Luciana Siqueira',    'luciana.siqueira@gmail.com',    '(51) 94888-1035', 'O módulo de expedição não está gerando a etiqueta de despacho com os dados corretos do transportador.', 2, 3, 1, '2026-03-26 09:30:00', '2026-03-27 14:00:00'),
(66, 'TK-A1C2E3G4', 'assigned', 'Hugo Novaes',         'hugo.novaes@empresa.com.br',    '(61) 93999-1036', 'Sugiro implementar a funcionalidade de pré-venda/orçamento com validade configurável e conversão automática.', 3, 4, 1, '2026-03-26 13:00:00', '2026-03-28 08:00:00'),
(67, 'TK-I5K6M7O8', 'assigned', 'Renato Faria',        'renato.faria@outlook.com',      '(71) 92000-1037', 'O sistema não está enviando as notificações de cobrança automática para clientes com títulos vencidos.', 2, 2, 1, '2026-03-27 08:45:00', '2026-03-28 10:00:00'),
(68, 'TK-Q9S0U1W2', 'assigned', 'Elisa Campelo',       'elisa.campelo@hotmail.com',     '(81) 91111-1038', 'Como faço para parametrizar o cálculo de retenção de IR, PIS, COFINS e CSLL nos pagamentos a prestadores de serviço?', 1, 3, 1, '2026-03-27 10:00:00', '2026-03-29 09:00:00'),
(69, 'TK-Y3A4C5E6', 'assigned', 'Tiago Salles',        'tiago.salles@gmail.com',        '(85) 90333-1039', 'Seria útil ter uma funcionalidade de importação de XML de NF-e recebidas para alimentar automaticamente o módulo de compras.', 3, 4, 1, '2026-03-28 09:00:00', '2026-03-29 11:00:00'),
(70, 'TK-G7I8K9M0', 'assigned', 'Paula Magalhães',     'paula.magalhaes@yahoo.com.br',  '(91) 99333-1040', 'O relatório de comissões está calculando sobre o valor bruto da venda e não sobre o valor líquido conforme configurado.', 2, 2, 1, '2026-03-28 14:30:00', '2026-03-30 08:00:00'),

-- CLOSED tickets (71-100) - have assigned_to_id (the agent who handled it)
(71, 'TK-O1Q2S3U4', 'closed', 'Marina Delgado',      'marina.delgado@gmail.com',      '(11) 98555-1041', 'O sistema não está permitindo cadastrar um fornecedor com CNPJ de MEI. Diz que o CNPJ é inválido.', 2, 3, 1, '2026-03-01 09:00:00', '2026-03-05 16:00:00'),
(72, 'TK-W5Y6A7C8', 'closed', 'Antônio Peçanha',     'antonio.pecanha@hotmail.com',   '(21) 97666-1042', 'Como configurar o e-mail de envio automático de notas fiscais para os clientes?', 1, 4, 1, '2026-03-01 10:30:00', '2026-03-04 14:00:00'),
(73, 'TK-E9G0I1K2', 'closed', 'Lúcia Monteiro',      'lucia.monteiro@empresa.com.br', '(31) 96777-1043', 'Sugiro que o módulo de compras envie alertas quando o estoque mínimo de um produto for atingido.', 3, 2, 1, '2026-03-02 08:00:00', '2026-03-06 10:00:00'),
(74, 'TK-M3O4Q5S6', 'closed', 'Fábio Domingues',     'fabio.domingues@yahoo.com.br',  '(41) 95888-1044', 'O módulo de faturamento está gerando XML com a versão 3.10 da NF-e em vez da versão 4.00.', 2, 3, 1, '2026-03-02 11:00:00', '2026-03-07 09:00:00'),
(75, 'TK-U7W8Y9A0', 'closed', 'Beatriz Magalhães',   'beatriz.magalhaes@outlook.com', '(51) 94999-1045', 'Preciso entender como funciona o regime de competência vs regime de caixa na contabilidade do ERP.', 1, 4, 1, '2026-03-03 09:30:00', '2026-03-06 15:00:00'),
(76, 'TK-C1E2G3I4', 'closed', 'Marcio Barbosa',      'marcio.barbosa@gmail.com',      '(61) 93000-1046', 'O sistema não permite excluir uma nota fiscal cancelada do painel. Fica aparecendo mesmo após o cancelamento.', 2, 2, 1, '2026-03-03 14:00:00', '2026-03-08 10:00:00'),
(77, 'TK-K5M6O7Q8', 'closed', 'Andreia Silveira',    'andreia.silveira@hotmail.com',  '(71) 92111-1047', 'Como faço para configurar o plano de contas contábil de acordo com as normas do CPC (Comitê de Pronunciamentos Contábeis)?', 1, 3, 1, '2026-03-04 08:15:00', '2026-03-07 14:00:00'),
(78, 'TK-S9U0W1Y2', 'closed', 'Douglas Lacerda',     'douglas.lacerda@empresa.com.br','(81) 91222-1048', 'Sugiro implementar relatórios gerenciais com gráficos interativos no módulo financeiro.', 3, 4, 1, '2026-03-04 10:00:00', '2026-03-09 09:00:00'),
(79, 'TK-A3C4E5G6', 'closed', 'Kelly Nascimento',    'kelly.nascimento@yahoo.com.br', '(85) 90444-1049', 'Ao emitir uma NF-e de devolução, o sistema não está preenchendo a chave de acesso da nota original automaticamente.', 2, 2, 1, '2026-03-05 09:00:00', '2026-03-09 14:00:00'),
(80, 'TK-I7K8M9O0', 'closed', 'Evandro Mendes',      'evandro.mendes@gmail.com',      '(91) 99444-1050', 'Preciso cadastrar um produto com variações (tamanho, cor). O sistema suporta grade de produtos?', 1, 3, 1, '2026-03-05 11:30:00', '2026-03-10 08:00:00'),
(81, 'TK-Q1S2U3W4', 'closed', 'Suelen Machado',      'suelen.machado@hotmail.com',    '(11) 98666-1051', 'O módulo de folha de pagamento não está calculando o desconto do vale-transporte corretamente.', 2, 4, 1, '2026-03-06 08:00:00', '2026-03-10 16:00:00'),
(82, 'TK-Y5A6C7E8', 'closed', 'Paulo Roberto Lima',  'pauloroberto.lima@outlook.com', '(21) 97777-1052', 'Seria útil ter a possibilidade de emitir NFS-e diretamente pelo ERP, integrado com a prefeitura.', 3, 2, 1, '2026-03-06 10:45:00', '2026-03-11 09:00:00'),
(83, 'TK-G9I0K1M2', 'closed', 'Mônica Cavalcante',   'monica.cavalcante@gmail.com',   '(31) 96888-1053', 'O relatório de balancete contábil está apresentando diferença de centavos no total do ativo e passivo.', 2, 3, 1, '2026-03-07 09:00:00', '2026-03-11 14:00:00'),
(84, 'TK-O3Q4S5U6', 'closed', 'Leandro Tavares',     'leandro.tavares@yahoo.com.br',  '(41) 95999-1054', 'Como configurar o cálculo de substituição tributária para operações interestaduais?', 1, 4, 1, '2026-03-07 14:30:00', '2026-03-12 10:00:00'),
(85, 'TK-W7Y8A9C0', 'closed', 'Cintia Neves',        'cintia.neves@empresa.com.br',   '(51) 94000-1055', 'O sistema apresenta erro 500 ao tentar imprimir o DANFE. Funciona apenas para notas emitidas antes de março.', 2, 2, 1, '2026-03-08 08:30:00', '2026-03-12 15:00:00'),
(86, 'TK-E1G2I3K4', 'closed', 'Ronaldo Barros',      'ronaldo.barros@hotmail.com',    '(61) 93111-1056', 'Sugiro adicionar a funcionalidade de agenda de compromissos integrada ao módulo comercial para acompanhamento de visitas.', 3, 3, 1, '2026-03-08 11:00:00', '2026-03-13 09:00:00'),
(87, 'TK-M5O6Q7S8', 'closed', 'Denise Aquino',       'denise.aquino@gmail.com',       '(71) 92222-1057', 'Não consigo gerar a guia do ICMS-ST para pagamento. O sistema diz que não há valores a recolher, mas existem notas com ST.', 2, 4, 1, '2026-03-09 09:00:00', '2026-03-13 14:00:00'),
(88, 'TK-U9W0Y1A2', 'closed', 'Flávio Moreira',      'flavio.moreira@outlook.com',    '(81) 91333-1058', 'Qual o procedimento para fazer o encerramento do exercício fiscal no ERP?', 1, 2, 1, '2026-03-09 10:15:00', '2026-03-14 08:00:00'),
(89, 'TK-C3E4G5I6', 'closed', 'Regina Passos',       'regina.passos@yahoo.com.br',    '(85) 90555-1059', 'O sistema está aceitando pedidos de venda com quantidade negativa. Não há validação no campo quantidade.', 2, 3, 1, '2026-03-10 08:00:00', '2026-03-14 10:00:00'),
(90, 'TK-K7M8O9Q0', 'closed', 'Cassio Andrade',      'cassio.andrade@gmail.com',      '(91) 99555-1060', 'Seria interessante integrar o ERP com marketplaces como Mercado Livre e Shopee para sincronização de pedidos e estoque.', 3, 4, 1, '2026-03-10 11:30:00', '2026-03-15 09:00:00'),
(91, 'TK-S1U2W3Y4', 'closed', 'Angela Teixeira',     'angela.teixeira@hotmail.com',   '(11) 98777-1061', 'O módulo de compras não está vinculando a cotação ao pedido de compra. Tenho que redigitar tudo.', 2, 2, 1, '2026-03-01 13:00:00', '2026-03-05 10:00:00'),
(92, 'TK-A5C6E7G8', 'closed', 'Gilberto Neto',       'gilberto.neto@empresa.com.br',  '(21) 97888-1062', 'Como funciona o módulo de multi-empresa? Temos três CNPJs e gostaríamos de consolidar os relatórios.', 1, 3, 1, '2026-03-02 14:00:00', '2026-03-06 11:00:00'),
(93, 'TK-I9K0M1O2', 'closed', 'Verônica Santos',     'veronica.santos@outlook.com',   '(31) 96999-1063', 'O campo "Desconto" no pedido de venda está aplicando o percentual sobre o valor total em vez de sobre cada item.', 2, 4, 1, '2026-03-03 08:45:00', '2026-03-07 16:00:00'),
(94, 'TK-Q3S4U5W6', 'closed', 'Edson Cavalcanti',    'edson.cavalcanti@gmail.com',    '(41) 95000-1064', 'Sugiro implementar log de auditoria para todas as alterações feitas em documentos fiscais.', 3, 2, 1, '2026-03-04 09:30:00', '2026-03-08 14:00:00'),
(95, 'TK-Y7A8C9E0', 'closed', 'Patrícia Braga',      'patricia.braga@yahoo.com.br',   '(51) 94111-1065', 'O relatório de estoque por localização não está mostrando os produtos que estão no almoxarifado secundário.', 2, 3, 1, '2026-03-05 10:00:00', '2026-03-09 09:00:00'),
(96, 'TK-G1I2K3M4', 'closed', 'Nelson Ferraz',       'nelson.ferraz@hotmail.com',     '(61) 93222-1066', 'Como faço para configurar a impressora fiscal no módulo de PDV do ERP?', 1, 4, 1, '2026-03-05 14:30:00', '2026-03-10 10:00:00'),
(97, 'TK-O5Q6S7U8', 'closed', 'Carla Figueira',      'carla.figueira@gmail.com',      '(71) 92333-1067', 'O sistema não está calculando a multa e juros para títulos vencidos no módulo de contas a receber.', 2, 2, 1, '2026-03-06 08:15:00', '2026-03-10 15:00:00'),
(98, 'TK-W9Y0A1C2', 'closed', 'Roberto Senna',       'roberto.senna@empresa.com.br',  '(81) 91444-1068', 'Seria útil ter a funcionalidade de assinatura digital de documentos dentro do ERP.', 3, 3, 1, '2026-03-07 11:00:00', '2026-03-12 09:00:00'),
(99, 'TK-E3G4I5K6', 'closed', 'Livia Campos',        'livia.campos@outlook.com',      '(85) 90666-1069', 'Ao tentar importar a tabela de NCM atualizada, o sistema rejeita o arquivo dizendo que o formato é incompatível.', 2, 4, 1, '2026-03-08 09:30:00', '2026-03-13 10:00:00'),
(100,'TK-M7O8Q9S0', 'closed', 'Willian Souza',       'willian.souza@yahoo.com.br',    '(91) 99666-1070', 'Preciso saber como emitir a Nota Fiscal de Consumidor Eletrônica (NFC-e) em contingência offline.', 1, 2, 1, '2026-03-09 08:00:00', '2026-03-14 14:00:00')
ON CONFLICT DO NOTHING;

SELECT setval('tickets_id_seq', 100);

-- =============================================================================
-- TICKET ASSIGNMENTS (for assigned and closed tickets)
-- assigned_by_id = 1 (Rodrigo, admin)
-- =============================================================================

INSERT INTO ticket_assignments (ticket_id, assigned_to_id, assigned_by_id, created_at)
SELECT ticket_id, assigned_to_id, assigned_by_id, created_at::timestamp
FROM (VALUES
-- Assigned tickets
(31, 2, 1, '2026-03-11 10:00:00'),
(32, 3, 1, '2026-03-11 14:00:00'),
(33, 4, 1, '2026-03-12 09:00:00'),
(34, 2, 1, '2026-03-12 11:00:00'),
(35, 3, 1, '2026-03-13 09:00:00'),
(36, 4, 1, '2026-03-13 14:00:00'),
(37, 2, 1, '2026-03-14 08:00:00'),
(38, 3, 1, '2026-03-14 10:00:00'),
(39, 4, 1, '2026-03-14 15:00:00'),
(40, 2, 1, '2026-03-15 09:00:00'),
(41, 3, 1, '2026-03-15 11:00:00'),
(42, 4, 1, '2026-03-16 08:00:00'),
(43, 2, 1, '2026-03-16 10:00:00'),
(44, 3, 1, '2026-03-17 09:00:00'),
(45, 4, 1, '2026-03-17 14:00:00'),
(46, 2, 1, '2026-03-18 08:00:00'),
(47, 3, 1, '2026-03-18 10:00:00'),
(48, 4, 1, '2026-03-19 09:00:00'),
(49, 2, 1, '2026-03-19 11:00:00'),
(50, 3, 1, '2026-03-20 08:00:00'),
(51, 4, 1, '2026-03-20 10:00:00'),
(52, 2, 1, '2026-03-21 09:00:00'),
(53, 3, 1, '2026-03-21 14:00:00'),
(54, 4, 1, '2026-03-22 08:00:00'),
(55, 2, 1, '2026-03-22 10:00:00'),
(56, 3, 1, '2026-03-23 09:00:00'),
(57, 4, 1, '2026-03-23 11:00:00'),
(58, 2, 1, '2026-03-24 08:00:00'),
(59, 3, 1, '2026-03-24 10:00:00'),
(60, 4, 1, '2026-03-25 09:00:00'),
(61, 2, 1, '2026-03-25 11:00:00'),
(62, 3, 1, '2026-03-26 08:00:00'),
(63, 4, 1, '2026-03-26 10:00:00'),
(64, 2, 1, '2026-03-27 09:00:00'),
(65, 3, 1, '2026-03-27 14:00:00'),
(66, 4, 1, '2026-03-28 08:00:00'),
(67, 2, 1, '2026-03-28 10:00:00'),
(68, 3, 1, '2026-03-29 09:00:00'),
(69, 4, 1, '2026-03-29 11:00:00'),
(70, 2, 1, '2026-03-30 08:00:00'),
-- Closed tickets
(71, 3, 1, '2026-03-02 09:00:00'),
(72, 4, 1, '2026-03-02 10:00:00'),
(73, 2, 1, '2026-03-03 08:00:00'),
(74, 3, 1, '2026-03-03 09:00:00'),
(75, 4, 1, '2026-03-04 08:00:00'),
(76, 2, 1, '2026-03-04 09:00:00'),
(77, 3, 1, '2026-03-05 08:00:00'),
(78, 4, 1, '2026-03-05 09:00:00'),
(79, 2, 1, '2026-03-06 08:00:00'),
(80, 3, 1, '2026-03-06 09:00:00'),
(81, 4, 1, '2026-03-07 08:00:00'),
(82, 2, 1, '2026-03-07 09:00:00'),
(83, 3, 1, '2026-03-08 08:00:00'),
(84, 4, 1, '2026-03-08 09:00:00'),
(85, 2, 1, '2026-03-09 08:00:00'),
(86, 3, 1, '2026-03-09 09:00:00'),
(87, 4, 1, '2026-03-10 08:00:00'),
(88, 2, 1, '2026-03-10 09:00:00'),
(89, 3, 1, '2026-03-11 08:00:00'),
(90, 4, 1, '2026-03-11 09:00:00'),
(91, 2, 1, '2026-03-02 08:00:00'),
(92, 3, 1, '2026-03-03 10:00:00'),
(93, 4, 1, '2026-03-04 10:00:00'),
(94, 2, 1, '2026-03-05 10:00:00'),
(95, 3, 1, '2026-03-06 10:00:00'),
(96, 4, 1, '2026-03-06 14:00:00'),
(97, 2, 1, '2026-03-07 10:00:00'),
(98, 3, 1, '2026-03-08 10:00:00'),
(99, 4, 1, '2026-03-09 10:00:00'),
(100, 2, 1, '2026-03-10 10:00:00')
) AS v(ticket_id, assigned_to_id, assigned_by_id, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_assignments a
  WHERE a.ticket_id = v.ticket_id
    AND a.assigned_to_id = v.assigned_to_id
    AND a.assigned_by_id = v.assigned_by_id
    AND a.created_at = v.created_at::timestamp
);

-- =============================================================================
-- TICKET COMMENTS
-- Realistic support interactions in pt-BR
-- =============================================================================

-- Comments on assigned tickets (active support)
INSERT INTO ticket_comments (ticket_id, user_id, content, created_at)
SELECT ticket_id, user_id, content, created_at::timestamp
FROM (VALUES
-- Ticket 31 - NF com data errada (Pedro)
(31, 2, 'Olá Sandra, estou analisando o problema com a data de emissão das notas fiscais. Consegue me informar qual versão do módulo de faturamento está utilizando?', '2026-03-11 10:30:00'),
(31, 2, 'Identifiquei que há uma configuração no módulo fiscal que define a data de emissão. Vou verificar se está apontando para a data do pedido em vez da data atual.', '2026-03-11 14:00:00'),

-- Ticket 32 - CIAP (Marcio)
(32, 3, 'Jorge, boa tarde! A configuração do CIAP envolve alguns passos. Primeiro, é necessário classificar o bem no cadastro de ativo imobilizado com a natureza correta.', '2026-03-11 14:30:00'),
(32, 3, 'Estou preparando um passo a passo detalhado para a configuração completa. O crédito é apropriado em 1/48 avos por mês, conforme legislação vigente.', '2026-03-12 09:00:00'),

-- Ticket 33 - Fluxo de caixa (Ciro)
(33, 4, 'Viviane, bom dia! Analisei o relatório de fluxo de caixa projetado e realmente as vendas parceladas não estão sendo consideradas. Vou escalar para o time de desenvolvimento.', '2026-03-12 09:30:00'),

-- Ticket 34 - Campos customizados (Pedro)
(34, 2, 'Leandro, sim, é possível criar campos customizados! No menu Configurações > Campos Personalizados, você pode adicionar campos texto, numérico, data e lista de seleção.', '2026-03-12 11:30:00'),
(34, 2, 'Lembre-se de que os campos customizados ficam disponíveis nas telas de cadastro e também podem ser incluídos nos relatórios. Qualquer dúvida, estou à disposição.', '2026-03-13 08:00:00'),

-- Ticket 38 - PIS/COFINS monofásico (Marcio)
(38, 3, 'Wagner, confirmei o problema. O sistema realmente não está aplicando a regra de tributação monofásica para PIS e COFINS. Isso afeta produtos como bebidas, autopeças e cosméticos.', '2026-03-14 10:30:00'),
(38, 3, 'Já abri um chamado interno para o time de desenvolvimento corrigir a regra tributária. Enquanto isso, recomendo fazer o ajuste manual na apuração.', '2026-03-15 09:00:00'),
(38, 3, 'Atualização: o time de desenvolvimento está trabalhando na correção. Previsão de entrega na próxima atualização do sistema.', '2026-03-17 10:00:00'),

-- Ticket 40 - Múltiplos centros de custo em OC (Pedro)
(40, 2, 'Luciano, atualmente o sistema permite vincular apenas um centro de custo por linha da ordem de compra. Para contornar, você pode dividir os itens em linhas separadas, cada uma com seu centro de custo.', '2026-03-15 09:30:00'),

-- Ticket 41 - Certificado digital NFC-e (Marcio)
(41, 3, 'Simone, o erro de "Certificado digital não encontrado" geralmente ocorre quando o certificado A1 não foi importado no formato correto (.pfx). Pode verificar se o arquivo tem a extensão .pfx?', '2026-03-15 11:30:00'),
(41, 3, 'Além disso, verifique se a senha do certificado está correta nas configurações do módulo fiscal. Às vezes, espaços extras na senha causam esse problema.', '2026-03-16 08:30:00'),

-- Ticket 43 - Frete com peso errado (Pedro)
(43, 2, 'Gabriela, identifiquei a causa do problema. Na configuração de frete, o sistema está priorizando o peso volumétrico. Vou ajustar para utilizar o maior entre peso real e volumétrico.', '2026-03-16 10:30:00'),

-- Ticket 45 - Saldo inicial conciliação (Ciro)
(45, 4, 'Débora, analisei o problema da conciliação bancária. O saldo inicial está sendo puxado do último fechamento, mas parece que o mês anterior não foi conciliado completamente.', '2026-03-17 14:30:00'),
(45, 4, 'Recomendo verificar se todos os lançamentos do mês anterior foram conciliados antes de iniciar o mês atual. Caso contrário, o saldo vai ficar divergente.', '2026-03-18 09:00:00'),

-- Ticket 47 - Parcelas 30/60/90 (Marcio)
(47, 3, 'Natalia, verifiquei a condição de pagamento 30/60/90. O problema está na configuração da condição: as datas base estão calculando a partir da data do pedido em vez da data de faturamento.', '2026-03-18 10:30:00'),

-- Ticket 49 - Horas extras noturno (Pedro)
(49, 2, 'Adriana, confirmei a inconsistência no cálculo. O adicional noturno de 20% não está sendo aplicado sobre a hora extra, apenas sobre a hora normal. Vou reportar como bug.', '2026-03-19 11:30:00'),

-- Ticket 51 - Estoque não devolvido no cancelamento (Ciro)
(51, 4, 'Michele, esse é um problema conhecido. Ao cancelar a NF, o sistema deveria estornar o movimento de estoque automaticamente. Estou verificando se há alguma configuração desabilitada.', '2026-03-20 10:30:00'),
(51, 4, 'Encontrei! Na configuração do módulo de estoque, a opção "Estornar movimentos ao cancelar NF" estava desabilitada. Já habilitei. Agora é necessário fazer o ajuste manual dos itens que foram cancelados anteriormente.', '2026-03-21 08:00:00'),

-- Ticket 55 - Baixa de matéria-prima na produção (Pedro)
(55, 2, 'Raquel, analisei o módulo de produção. A baixa automática de matérias-primas depende da configuração da lista de materiais (BOM) estar corretamente vinculada à ordem de produção.', '2026-03-22 10:30:00'),
(55, 2, 'Verifiquei que a BOM do produto está cadastrada, mas o flag "Baixa automática ao finalizar OP" não está habilitado. Vou ativar para você.', '2026-03-23 09:00:00'),

-- Ticket 57 - Relatório travando com 5000+ itens (Ciro)
(57, 4, 'Rosana, esse problema de performance está sendo investigado. Relatórios com grande volume de dados precisam de otimização na consulta ao banco.', '2026-03-23 11:30:00'),
(57, 4, 'Como paliativo, sugiro gerar o relatório por faixas de produtos (A-M e N-Z, por exemplo) enquanto trabalhamos na otimização.', '2026-03-24 08:00:00'),

-- Ticket 61 - Pagamento duplicado (Pedro)
(61, 2, 'Fernanda, esse é um problema sério. Identifiquei que a validação de duplicidade não está funcionando quando o pagamento é feito via integração bancária. Vou escalar com urgência.', '2026-03-25 11:30:00'),
(61, 2, 'Enquanto isso, recomendo conferir manualmente os pagamentos feitos via integração. Estamos priorizando a correção.', '2026-03-26 08:00:00'),

-- Ticket 65 - Etiqueta de despacho (Marcio)
(65, 3, 'Luciana, verifiquei o módulo de expedição. A etiqueta está puxando os dados do transportador padrão do cadastro do cliente, não do transportador selecionado no pedido.', '2026-03-27 14:30:00'),

-- Ticket 67 - Cobrança automática não enviando (Pedro)
(67, 2, 'Renato, verifiquei o módulo de cobrança. O serviço de envio automático está configurado, mas o template de e-mail de cobrança estava inativo. Reativei agora.', '2026-03-28 10:30:00'),
(67, 2, 'Faça um teste enviando uma cobrança manual para verificar se o e-mail está sendo entregue. Se funcionar, o automático também deve funcionar a partir de amanhã.', '2026-03-29 08:00:00'),

-- Ticket 70 - Comissão sobre valor bruto (Pedro)
(70, 2, 'Paula, confirmei o problema. O cálculo de comissão está usando o campo "valor total" em vez do "valor líquido" da venda. Estou analisando a regra de cálculo para corrigir.', '2026-03-30 08:30:00'),

-- Comments on closed tickets (resolved conversations)
-- Ticket 71 - CNPJ MEI (Marcio)
(71, 3, 'Marina, bom dia! Verifiquei o cadastro de fornecedores e identifiquei que a validação de CNPJ não estava considerando o range de CNPJs de MEI. Já corrigi.', '2026-03-02 14:00:00'),
(71, 3, 'A correção já está em produção. Pode tentar cadastrar novamente o fornecedor com CNPJ de MEI.', '2026-03-03 09:00:00'),
(71, 3, 'Marina confirmou que conseguiu cadastrar. Encerrando o chamado.', '2026-03-05 16:00:00'),

-- Ticket 72 - E-mail automático NF (Ciro)
(72, 4, 'Antônio, a configuração de envio automático de NF por e-mail fica em: Configurações > Módulo Fiscal > E-mail Automático. Lá você configura o servidor SMTP e o template.', '2026-03-02 14:00:00'),
(72, 4, 'Também é necessário preencher o e-mail do cliente no cadastro. Sem esse dado, o sistema não consegue enviar.', '2026-03-03 08:00:00'),
(72, 4, 'Cliente configurou com sucesso. Chamado encerrado.', '2026-03-04 14:00:00'),

-- Ticket 74 - XML versão NF-e (Marcio)
(74, 3, 'Fábio, identifiquei o problema. A versão do layout da NF-e estava configurada como 3.10 no cadastro da empresa. Atualizei para 4.00 conforme exigência da SEFAZ.', '2026-03-03 14:00:00'),
(74, 3, 'Testei a emissão e o XML está sendo gerado na versão 4.00 corretamente. Pode emitir normalmente.', '2026-03-05 09:00:00'),
(74, 3, 'Fábio confirmou que está funcionando. Encerrando.', '2026-03-07 09:00:00'),

-- Ticket 76 - NF cancelada no painel (Pedro)
(76, 2, 'Marcio, o comportamento está correto na verdade. Notas canceladas ficam visíveis no painel com status "Cancelada" para fins de auditoria. Porém, você pode filtrar para não exibi-las.', '2026-03-04 14:00:00'),
(76, 2, 'No filtro do painel, desmarque a opção "Incluir canceladas" para limpar a visualização.', '2026-03-05 09:00:00'),
(76, 2, 'Cliente satisfeito com a solução. Chamado encerrado.', '2026-03-08 10:00:00'),

-- Ticket 79 - Chave de acesso devolução (Pedro)
(79, 2, 'Kelly, corrigi a configuração da NF-e de devolução. O campo de referência à nota original agora é preenchido automaticamente ao selecionar a nota que está sendo devolvida.', '2026-03-06 14:00:00'),
(79, 2, 'Teste realizado com sucesso. A chave de acesso da nota original está sendo inserida no XML corretamente.', '2026-03-08 09:00:00'),
(79, 2, 'Kelly confirmou. Chamado resolvido.', '2026-03-09 14:00:00'),

-- Ticket 81 - Vale-transporte (Ciro)
(81, 4, 'Suelen, analisei o cálculo do vale-transporte. O desconto de 6% do salário base estava sendo aplicado sobre o salário bruto em vez do base. Corrigi a fórmula.', '2026-03-07 14:00:00'),
(81, 4, 'A correção será aplicada na próxima folha. Para o mês atual, recomendo fazer o ajuste manual no holerite.', '2026-03-08 09:00:00'),
(81, 4, 'Suelen verificou e confirmou a correção. Fechando chamado.', '2026-03-10 16:00:00'),

-- Ticket 83 - Balancete com centavos (Marcio)
(83, 3, 'Mônica, a diferença de centavos no balancete geralmente é causada por arredondamento nos rateios contábeis. Vou investigar os lançamentos do período.', '2026-03-08 10:00:00'),
(83, 3, 'Encontrei três lançamentos com arredondamento incorreto. Fiz os ajustes de centavos e o balancete agora fecha corretamente.', '2026-03-10 14:00:00'),
(83, 3, 'Balancete verificado e correto. Chamado encerrado.', '2026-03-11 14:00:00'),

-- Ticket 85 - Erro 500 DANFE (Pedro)
(85, 2, 'Cintia, identifiquei que o erro 500 ao imprimir o DANFE está relacionado a uma atualização que mudou o formato do campo "informações complementares". Notas emitidas após a atualização têm um campo que excede o limite.', '2026-03-09 14:00:00'),
(85, 2, 'Corrigi o template do DANFE para suportar o novo formato. Já pode testar a impressão.', '2026-03-11 09:00:00'),
(85, 2, 'Cintia testou e funcionou perfeitamente. Chamado encerrado.', '2026-03-12 15:00:00'),

-- Ticket 87 - Guia ICMS-ST (Ciro)
(87, 4, 'Denise, o problema é que as notas com ST não estavam vinculadas ao período de apuração correto. Fiz a vinculação manual e agora a guia está sendo gerada com os valores corretos.', '2026-03-10 14:00:00'),
(87, 4, 'Também configurei para que futuras notas sejam automaticamente vinculadas ao período. Verifique a guia gerada e me avise se os valores estão corretos.', '2026-03-12 09:00:00'),
(87, 4, 'Denise confirmou os valores. Encerrando.', '2026-03-13 14:00:00'),

-- Ticket 89 - Quantidade negativa (Marcio)
(89, 3, 'Regina, confirmei a falha de validação. Adicionei uma regra que impede a entrada de valores negativos ou zero no campo quantidade do pedido de venda.', '2026-03-11 10:00:00'),
(89, 3, 'A validação agora exibe a mensagem "Quantidade deve ser maior que zero" quando o usuário tenta inserir um valor inválido.', '2026-03-13 08:00:00'),
(89, 3, 'Regina testou e confirmou. Chamado fechado.', '2026-03-14 10:00:00'),

-- Ticket 91 - Cotação não vincula ao pedido (Pedro)
(91, 2, 'Angela, identifiquei o problema. Na tela de pedido de compra, o botão "Importar Cotação" não estava aparecendo porque faltava uma permissão no perfil do seu usuário.', '2026-03-02 14:00:00'),
(91, 2, 'Ajustei as permissões. Agora ao criar um novo pedido de compra, clique em "Importar Cotação" e selecione a cotação aprovada.', '2026-03-04 09:00:00'),
(91, 2, 'Angela confirmou que funcionou. Fechando.', '2026-03-05 10:00:00'),

-- Ticket 93 - Desconto por item vs total (Ciro)
(93, 4, 'Verônica, o campo "Desconto" no cabeçalho do pedido realmente aplica sobre o total. Para desconto por item, use o campo "Desc%" na linha de cada produto.', '2026-03-04 14:00:00'),
(93, 4, 'Se preferir aplicar um percentual geral mas que seja rateado por item, vá em Configurações > Vendas > "Ratear desconto por item" e habilite essa opção.', '2026-03-06 09:00:00'),
(93, 4, 'Verônica configurou e está satisfeita. Chamado encerrado.', '2026-03-07 16:00:00'),

-- Ticket 95 - Estoque por localização (Marcio)
(95, 3, 'Patrícia, o relatório de estoque por localização estava filtrando apenas o almoxarifado principal. Ajustei o filtro padrão para incluir todos os almoxarifados.', '2026-03-06 14:00:00'),
(95, 3, 'Agora o relatório exibe todos os almoxarifados com o saldo de cada produto em cada localização.', '2026-03-08 09:00:00'),
(95, 3, 'Patrícia verificou e confirmou. Chamado encerrado.', '2026-03-09 09:00:00'),

-- Ticket 97 - Multa e juros (Pedro)
(97, 2, 'Carla, o cálculo de multa e juros para títulos vencidos precisa ser configurado em: Configurações > Financeiro > Regras de Cobrança. Lá você define o percentual de multa e a taxa de juros diária.', '2026-03-07 10:00:00'),
(97, 2, 'Configurei as regras padrão: multa de 2% após vencimento e juros de 1% ao mês (pro rata die). Pode verificar se está de acordo.', '2026-03-09 14:00:00'),
(97, 2, 'Carla aprovou as configurações. Chamado resolvido.', '2026-03-10 15:00:00'),

-- Ticket 100 - NFC-e contingência (Pedro)
(100, 2, 'Willian, para emitir NFC-e em contingência offline, o sistema precisa estar configurado com o CSC (Código de Segurança do Contribuinte) obtido na SEFAZ do seu estado.', '2026-03-10 10:00:00'),
(100, 2, 'Vá em Configurações > Módulo Fiscal > NFC-e > Contingência e habilite o modo offline. O sistema vai armazenar as notas localmente e transmitir quando a conexão for restabelecida.', '2026-03-12 09:00:00'),
(100, 2, 'Willian configurou com sucesso e testou a emissão offline. Chamado encerrado.', '2026-03-14 14:00:00')
) AS v(ticket_id, user_id, content, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_comments c
  WHERE c.ticket_id = v.ticket_id
    AND c.user_id = v.user_id
    AND c.content = v.content
    AND c.created_at = v.created_at::timestamp
);
