-- Dados fictícios para demonstração. Para não carregá-los, defina
-- FLYWAY_LOCATIONS=classpath:db/migration antes do primeiro start.

INSERT INTO ongs (nome, cnpj, email, telefone, descricao, endereco, cidade, uf, latitude, longitude) VALUES
('Instituto Mãos que Alimentam', '11.111.111/0001-11', 'contato@maosquealimentam.org', '(11) 3000-1001', 'Distribui cestas básicas e refeições para famílias em situação de vulnerabilidade no centro de São Paulo.', 'Rua da Esperança, 120 - Sé', 'São Paulo', 'SP', -23.5505, -46.6333),
('Casa Abrigo Recomeço', '22.222.222/0001-22', 'ola@casarecomeco.org', '(11) 3000-2002', 'Acolhe pessoas em situação de rua com abrigo noturno, banho e roupas limpas.', 'Av. Leste, 900 - Itaquera', 'São Paulo', 'SP', -23.5429, -46.4747),
('Rede Solidária Campinas', '33.333.333/0001-33', 'rede@solidariacampinas.org', '(19) 3000-3003', 'Banco de alimentos que atende 40 entidades parceiras na região de Campinas.', 'Rua das Flores, 45 - Centro', 'Campinas', 'SP', -22.9056, -47.0608),
('Projeto Aquecer Rio', '44.444.444/0001-44', 'aquecer@projetoaquecer.org', '(21) 3000-4004', 'Campanhas de agasalho e kits de higiene para comunidades do Rio de Janeiro.', 'Rua do Sol, 300 - Lapa', 'Rio de Janeiro', 'RJ', -22.9068, -43.1729),
('Lar das Crianças Sementes', '55.555.555/0001-55', 'sementes@larsementes.org', '(31) 3000-5005', 'Casa-lar para 35 crianças e adolescentes, com reforço escolar e atividades culturais.', 'Rua Ipê Amarelo, 77 - Floresta', 'Belo Horizonte', 'MG', -19.9167, -43.9345),
('Cozinha Comunitária Pinhão', '66.666.666/0001-66', 'pinhao@cozinhapinhao.org', '(41) 3000-6006', 'Serve 300 marmitas por dia preparadas por voluntários.', 'Rua XV, 1500 - Centro', 'Curitiba', 'PR', -25.4284, -49.2733),
('Associação Abraço Gaúcho', '77.777.777/0001-77', 'abraco@abracogaucho.org', '(51) 3000-7007', 'Apoio a famílias atingidas por enchentes: roupas, cobertores e itens de higiene.', 'Av. Guaíba, 210 - Menino Deus', 'Porto Alegre', 'RS', -30.0346, -51.2177),
('Instituto Maré Cheia', '88.888.888/0001-88', 'contato@marecheia.org', '(81) 3000-8008', 'Segurança alimentar e geração de renda em comunidades ribeirinhas do Recife.', 'Rua da Aurora, 50 - Boa Vista', 'Recife', 'PE', -8.0476, -34.8770),
('Casa do Bem Salvador', '99.999.999/0001-99', 'casadobem@casadobemssa.org', '(71) 3000-9009', 'Atendimento a idosos com refeições, fraldas geriátricas e acompanhamento.', 'Ladeira do Carmo, 12 - Pelourinho', 'Salvador', 'BA', -12.9777, -38.5016),
('Movimento Partilha DF', '10.101.010/0001-10', 'partilha@partilhadf.org', '(61) 3000-1010', 'Arrecada e distribui alimentos e roupas em regiões administrativas do DF.', 'SCS Quadra 2 - Asa Sul', 'Brasília', 'DF', -15.7939, -47.8828);

INSERT INTO necessidades (ong_id, titulo, descricao, categoria, quantidade, quantidade_recebida, unidade, urgencia, status) VALUES
((SELECT id FROM ongs WHERE cnpj = '11.111.111/0001-11'), 'Arroz 5 kg', 'Arroz tipo 1 para montagem de cestas básicas.', 'ALIMENTO', 120, 45, 'pacotes', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '11.111.111/0001-11'), 'Feijão carioca 1 kg', 'Feijão para cestas básicas do mês.', 'ALIMENTO', 150, 60, 'pacotes', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '11.111.111/0001-11'), 'Leite em pó', 'Para famílias com crianças pequenas.', 'ALIMENTO', 80, 80, 'latas', 'MEDIA', 'ATENDIDA'),
((SELECT id FROM ongs WHERE cnpj = '22.222.222/0001-22'), 'Cobertores de casal', 'Inverno chegando: cobertores grossos para o abrigo.', 'COBERTOR', 60, 12, 'unidades', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '22.222.222/0001-22'), 'Camisetas masculinas', 'Tamanhos M, G e GG, em bom estado.', 'ROUPA', 100, 30, 'peças', 'MEDIA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '22.222.222/0001-22'), 'Kits de higiene', 'Sabonete, escova, pasta de dente e desodorante.', 'HIGIENE', 200, 90, 'kits', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '33.333.333/0001-33'), 'Óleo de soja', 'Óleo de 900 ml.', 'ALIMENTO', 90, 20, 'unidades', 'MEDIA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '33.333.333/0001-33'), 'Macarrão 500 g', NULL, 'ALIMENTO', 200, 140, 'pacotes', 'BAIXA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '44.444.444/0001-44'), 'Casacos e moletons', 'Adulto e infantil.', 'ROUPA', 150, 40, 'peças', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '44.444.444/0001-44'), 'Absorventes', 'Pacotes com 8 unidades.', 'HIGIENE', 300, 110, 'pacotes', 'MEDIA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '55.555.555/0001-55'), 'Brinquedos educativos', 'Jogos de montar, quebra-cabeças e livros.', 'BRINQUEDO', 50, 18, 'unidades', 'BAIXA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '55.555.555/0001-55'), 'Tênis infantis', 'Numeração 28 a 36.', 'CALCADO', 40, 9, 'pares', 'MEDIA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '55.555.555/0001-55'), 'Uniformes escolares', 'Camisetas brancas tamanho 10 a 14.', 'ROUPA', 70, 70, 'peças', 'BAIXA', 'ATENDIDA'),
((SELECT id FROM ongs WHERE cnpj = '66.666.666/0001-66'), 'Legumes e verduras', 'Doações semanais para o preparo das marmitas.', 'ALIMENTO', 300, 120, 'kg', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '66.666.666/0001-66'), 'Marmitas descartáveis', NULL, 'OUTRO', 1000, 400, 'unidades', 'MEDIA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '77.777.777/0001-77'), 'Cobertores de solteiro', 'Para famílias desabrigadas.', 'COBERTOR', 250, 85, 'unidades', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '77.777.777/0001-77'), 'Roupas infantis', 'Tamanhos 2 a 12 anos.', 'ROUPA', 200, 60, 'peças', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '77.777.777/0001-77'), 'Botas de borracha', 'Para limpeza das casas atingidas.', 'CALCADO', 80, 25, 'pares', 'MEDIA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '88.888.888/0001-88'), 'Farinha de mandioca', NULL, 'ALIMENTO', 100, 35, 'kg', 'MEDIA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '88.888.888/0001-88'), 'Fraldas infantis', 'Tamanhos M e G.', 'HIGIENE', 120, 30, 'pacotes', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '99.999.999/0001-99'), 'Fraldas geriátricas', 'Tamanhos M e G.', 'HIGIENE', 150, 50, 'pacotes', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '99.999.999/0001-99'), 'Leite integral', 'Caixas de 1 litro.', 'ALIMENTO', 200, 90, 'litros', 'MEDIA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '10.101.010/0001-10'), 'Cestas básicas completas', NULL, 'ALIMENTO', 80, 22, 'cestas', 'ALTA', 'ABERTA'),
((SELECT id FROM ongs WHERE cnpj = '10.101.010/0001-10'), 'Agasalhos adultos', NULL, 'ROUPA', 120, 15, 'peças', 'MEDIA', 'ABERTA');

INSERT INTO doadores (nome, email, telefone, cidade, uf, latitude, longitude) VALUES
('Ana Souza', 'ana.souza@exemplo.com', '(11) 98888-0001', 'São Paulo', 'SP', -23.5614, -46.6559),
('Bruno Lima', 'bruno.lima@exemplo.com', '(21) 98888-0002', 'Rio de Janeiro', 'RJ', -22.9711, -43.1822),
('Carla Mendes', 'carla.mendes@exemplo.com', '(31) 98888-0003', 'Belo Horizonte', 'MG', -19.9320, -43.9380),
('Diego Rocha', 'diego.rocha@exemplo.com', '(51) 98888-0004', 'Porto Alegre', 'RS', -30.0277, -51.2287),
('Elisa Prado', 'elisa.prado@exemplo.com', '(41) 98888-0005', 'Curitiba', 'PR', -25.4411, -49.2765),
('Felipe Nunes', 'felipe.nunes@exemplo.com', '(19) 98888-0006', 'Campinas', 'SP', -22.8950, -47.0700);

INSERT INTO doacoes (doador_id, necessidade_id, descricao, quantidade, status, distancia_km, criado_em) VALUES
((SELECT id FROM doadores WHERE email = 'ana.souza@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Arroz 5 kg'), '10 pacotes de arroz', 10, 'ENTREGUE', 2.6, CURRENT_TIMESTAMP - INTERVAL '150' DAY),
((SELECT id FROM doadores WHERE email = 'ana.souza@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Kits de higiene'), 'Kits montados em casa', 20, 'ENTREGUE', 19.3, CURRENT_TIMESTAMP - INTERVAL '120' DAY),
((SELECT id FROM doadores WHERE email = 'ana.souza@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Cobertores de casal'), 'Cobertores novos', 4, 'CONFIRMADA', 19.3, CURRENT_TIMESTAMP - INTERVAL '5' DAY),
((SELECT id FROM doadores WHERE email = 'bruno.lima@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Casacos e moletons'), 'Moletons infantis', 15, 'ENTREGUE', 7.2, CURRENT_TIMESTAMP - INTERVAL '95' DAY),
((SELECT id FROM doadores WHERE email = 'bruno.lima@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Absorventes'), 'Pacotes de absorvente', 30, 'ENTREGUE', 7.2, CURRENT_TIMESTAMP - INTERVAL '60' DAY),
((SELECT id FROM doadores WHERE email = 'bruno.lima@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Casacos e moletons'), 'Casacos adultos', 8, 'PENDENTE', 7.2, CURRENT_TIMESTAMP - INTERVAL '2' DAY),
((SELECT id FROM doadores WHERE email = 'carla.mendes@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Brinquedos educativos'), 'Quebra-cabeças e livros', 12, 'ENTREGUE', 1.8, CURRENT_TIMESTAMP - INTERVAL '75' DAY),
((SELECT id FROM doadores WHERE email = 'carla.mendes@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Tênis infantis'), 'Tênis nº 30 e 32', 5, 'CONFIRMADA', 1.8, CURRENT_TIMESTAMP - INTERVAL '10' DAY),
((SELECT id FROM doadores WHERE email = 'diego.rocha@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Cobertores de solteiro'), 'Cobertores de microfibra', 25, 'ENTREGUE', 1.3, CURRENT_TIMESTAMP - INTERVAL '45' DAY),
((SELECT id FROM doadores WHERE email = 'diego.rocha@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Roupas infantis'), 'Roupas de 4 a 8 anos', 40, 'ENTREGUE', 1.3, CURRENT_TIMESTAMP - INTERVAL '30' DAY),
((SELECT id FROM doadores WHERE email = 'diego.rocha@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Botas de borracha'), 'Botas nº 40', 6, 'PENDENTE', 1.3, CURRENT_TIMESTAMP - INTERVAL '1' DAY),
((SELECT id FROM doadores WHERE email = 'elisa.prado@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Legumes e verduras'), 'Hortaliças da feira', 50, 'ENTREGUE', 1.5, CURRENT_TIMESTAMP - INTERVAL '20' DAY),
((SELECT id FROM doadores WHERE email = 'elisa.prado@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Marmitas descartáveis'), 'Caixa com 200 marmitas', 200, 'ENTREGUE', 1.5, CURRENT_TIMESTAMP - INTERVAL '12' DAY),
((SELECT id FROM doadores WHERE email = 'felipe.nunes@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Óleo de soja'), 'Óleo 900 ml', 20, 'ENTREGUE', 1.6, CURRENT_TIMESTAMP - INTERVAL '170' DAY),
((SELECT id FROM doadores WHERE email = 'felipe.nunes@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Macarrão 500 g'), 'Macarrão espaguete', 40, 'ENTREGUE', 1.6, CURRENT_TIMESTAMP - INTERVAL '110' DAY),
((SELECT id FROM doadores WHERE email = 'felipe.nunes@exemplo.com'), (SELECT id FROM necessidades WHERE titulo = 'Arroz 5 kg'), 'Arroz para cestas', 15, 'CANCELADA', 84.0, CURRENT_TIMESTAMP - INTERVAL '40' DAY);
