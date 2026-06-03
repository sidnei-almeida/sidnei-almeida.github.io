"""
Projeto Final — Análise de Pedidos com Python Básico

Objetivo:
Completar um pequeno sistema de relatório de pedidos usando Python puro.

Este projeto junta os principais assuntos das aulas 01 a 09:

- variáveis
- print()
- operadores
- strings
- condicionais
- listas
- dicionários
- listas de dicionários
- for
- funções
- parâmetros opcionais

Como usar:
1. Crie uma pasta para o projeto.
2. Salve este arquivo como analise_pedidos_guiado.py.
3. Complete as funções marcadas com TODO.
4. Rode no terminal:

   python analise_pedidos_guiado.py

5. Crie um README.md explicando o projeto.
6. Publique no GitHub.

Observação:
A base de dados já está pronta. O foco do projeto é escrever a lógica.
"""

# ============================================================
# BASE DE DADOS
# ============================================================
# Aqui temos uma lista de pedidos.
#
# Cada pedido é um dicionário.
# Dentro de cada pedido existe uma chave chamada "itens".
# A chave "itens" guarda uma lista de produtos daquele pedido.
#
# Estrutura principal:
#
# pedidos -> lista
# pedido -> dicionário
# pedido["itens"] -> lista de dicionários
# item -> dicionário
#
# Exemplo de acesso:
#
# pedidos[0]["cliente"]
# pedidos[0]["itens"]
# pedidos[0]["itens"][0]["produto"]

pedidos = [
    {
        "id_pedido": 101,
        "cliente": "Ana Silva",
        "estado": "RS",
        "status": "entregue",
        "itens": [
            {"produto": "Mouse", "categoria": "eletronicos", "preco_unitario": 80, "quantidade": 2},
            {"produto": "Teclado", "categoria": "eletronicos", "preco_unitario": 120, "quantidade": 1}
        ]
    },
    {
        "id_pedido": 102,
        "cliente": "Carlos Souza",
        "estado": "RS",
        "status": "entregue",
        "itens": [
            {"produto": "Cadeira", "categoria": "moveis", "preco_unitario": 350, "quantidade": 2},
            {"produto": "Mesa", "categoria": "moveis", "preco_unitario": 500, "quantidade": 1}
        ]
    },
    {
        "id_pedido": 103,
        "cliente": "Mariana Lima",
        "estado": "SC",
        "status": "cancelado",
        "itens": [
            {"produto": "Monitor", "categoria": "informatica", "preco_unitario": 850, "quantidade": 1}
        ]
    },
    {
        "id_pedido": 104,
        "cliente": "João Pedro",
        "estado": "PR",
        "status": "entregue",
        "itens": [
            {"produto": "Notebook", "categoria": "informatica", "preco_unitario": 3200, "quantidade": 1},
            {"produto": "Mousepad", "categoria": "eletronicos", "preco_unitario": 45, "quantidade": 2}
        ]
    },
    {
        "id_pedido": 105,
        "cliente": "Fernanda Rocha",
        "estado": "SP",
        "status": "entregue",
        "itens": [
            {"produto": "Cafeteira", "categoria": "casa", "preco_unitario": 280, "quantidade": 1},
            {"produto": "Liquidificador", "categoria": "casa", "preco_unitario": 160, "quantidade": 1}
        ]
    },
    {
        "id_pedido": 106,
        "cliente": "Lucas Martins",
        "estado": "MG",
        "status": "entregue",
        "itens": [
            {"produto": "Webcam", "categoria": "eletronicos", "preco_unitario": 220, "quantidade": 1},
            {"produto": "Microfone", "categoria": "eletronicos", "preco_unitario": 300, "quantidade": 1}
        ]
    },
    {
        "id_pedido": 107,
        "cliente": "Patrícia Gomes",
        "estado": "RS",
        "status": "cancelado",
        "itens": [
            {"produto": "Estante", "categoria": "moveis", "preco_unitario": 420, "quantidade": 1}
        ]
    },
    {
        "id_pedido": 108,
        "cliente": "Rafael Alves",
        "estado": "RJ",
        "status": "entregue",
        "itens": [
            {"produto": "Tablet", "categoria": "informatica", "preco_unitario": 1400, "quantidade": 1},
            {"produto": "Capa para Tablet", "categoria": "eletronicos", "preco_unitario": 90, "quantidade": 1}
        ]
    }
]


# ============================================================
# FUNÇÕES PRONTAS
# ============================================================

def formatar_moeda(valor):
    """Função pronta: formata um número como moeda."""
    return f"R$ {valor:.2f}"


def ordenar_ranking_clientes(ranking_clientes):
    """
    Função pronta.

    Ordena o ranking de clientes do maior gasto para o menor gasto.

    Esta função usa sorted() com lambda.
    Não precisa alterar essa parte agora.
    """
    return sorted(
        ranking_clientes,
        key=lambda cliente: cliente["total_gasto"],
        reverse=True
    )


# ============================================================
# ETAPA 1 — TOTAL DE UM ITEM
# ============================================================

def calcular_total_item(item):
    """
    TODO:
    Calcule o total de um item.

    Um item tem:
    - preco_unitario
    - quantidade

    Fórmula:
    preco_unitario * quantidade

    Exemplo:
    item = {"produto": "Mouse", "preco_unitario": 80, "quantidade": 2}

    Resultado esperado:
    160
    """

    # 1. Acesse o preço unitário do item
    # preco = item["preco_unitario"]

    # 2. Acesse a quantidade do item
    # quantidade = item["quantidade"]

    # 3. Calcule o total
    # total = preco * quantidade

    # 4. Retorne o total
    # return total

    pass


# ============================================================
# ETAPA 2 — TOTAL DE UM PEDIDO
# ============================================================

def calcular_total_pedido(pedido):
    """
    TODO:
    Calcule o total de um pedido.

    Um pedido possui uma lista de itens:
    pedido["itens"]

    Você deve:
    1. criar uma variável total começando em 0
    2. percorrer pedido["itens"] com for
    3. calcular o total de cada item usando calcular_total_item(item)
    4. somar tudo em total
    5. retornar total
    """

    # Exemplo de estrutura:
    #
    # total = 0
    #
    # for item in pedido["itens"]:
    #     total_item = calcular_total_item(item)
    #     total = total + total_item
    #
    # return total

    pass


# ============================================================
# ETAPA 3 — FATURAMENTO TOTAL
# ============================================================

def calcular_faturamento_total(lista_pedidos):
    """
    TODO:
    Calcule o faturamento total considerando apenas pedidos entregues.

    Você deve ignorar pedidos cancelados.

    Passos:
    1. crie uma variável faturamento começando em 0
    2. percorra lista_pedidos com for
    3. verifique se pedido["status"] == "entregue"
    4. se estiver entregue, some o total do pedido
    5. retorne faturamento
    """

    pass


# ============================================================
# ETAPA 4 — CONTAGEM POR STATUS
# ============================================================

def contar_pedidos_por_status(lista_pedidos):
    """
    TODO:
    Conte quantos pedidos existem por status.

    O resultado deve ser um dicionário assim:

    {
        "entregue": 6,
        "cancelado": 2
    }

    Dica:
    Comece com:

    contagem = {}

    Depois percorra os pedidos e atualize o dicionário.
    """

    pass


# ============================================================
# ETAPA 5 — TICKET MÉDIO
# ============================================================

def calcular_ticket_medio(lista_pedidos):
    """
    TODO:
    Calcule o ticket médio dos pedidos entregues.

    Fórmula:
    faturamento_total / quantidade_de_pedidos_entregues

    Cuidado:
    Pedidos cancelados não devem entrar no cálculo.
    """

    pass


# ============================================================
# ETAPA 6 — FATURAMENTO POR CATEGORIA
# ============================================================

def calcular_faturamento_por_categoria(lista_pedidos):
    """
    TODO:
    Calcule o faturamento por categoria.

    Considere apenas pedidos entregues.

    O resultado deve ser um dicionário parecido com:

    {
        "eletronicos": 970,
        "moveis": 1200,
        "informatica": 4690
    }

    Aqui você vai precisar de dois loops:
    - um loop para percorrer os pedidos
    - outro loop para percorrer os itens de cada pedido
    """

    pass


# ============================================================
# ETAPA 7 — FATURAMENTO POR ESTADO
# ============================================================

def calcular_faturamento_por_estado(lista_pedidos):
    """
    TODO:
    Calcule o faturamento por estado.

    Considere apenas pedidos entregues.

    O resultado deve ser um dicionário parecido com:

    {
        "RS": 1480,
        "PR": 3290,
        "SP": 440
    }

    Dica:
    O estado está em pedido["estado"].
    """

    pass


# ============================================================
# ETAPA 8 — RANKING DE CLIENTES
# ============================================================

def criar_ranking_clientes(lista_pedidos):
    """
    TODO:
    Crie um ranking de clientes por gasto total.

    Considere apenas pedidos entregues.

    O resultado deve ser uma lista de dicionários:

    [
        {"cliente": "João Pedro", "total_gasto": 3290},
        {"cliente": "Rafael Alves", "total_gasto": 1490}
    ]

    Dica:
    Primeiro crie um dicionário acumulando o total por cliente:

    totais_por_cliente = {}

    Depois transforme esse dicionário em uma lista de dicionários.
    """

    pass


# ============================================================
# ETAPA 9 — PEDIDOS ACIMA DE UM VALOR
# ============================================================

def listar_pedidos_acima_de(lista_pedidos, valor_minimo=500):
    """
    TODO:
    Liste pedidos entregues acima de um valor mínimo.

    Parâmetro obrigatório:
    lista_pedidos

    Parâmetro opcional:
    valor_minimo=500

    O resultado deve ser uma lista de dicionários:

    [
        {
            "id_pedido": 104,
            "cliente": "João Pedro",
            "total_pedido": 3290
        }
    ]
    """

    pass


# ============================================================
# ETAPA 10 — RELATÓRIO FINAL
# ============================================================

def gerar_relatorio(lista_pedidos):
    """
    TODO:
    Gere um relatório final no terminal usando print().

    O relatório deve mostrar:

    - faturamento total
    - ticket médio
    - contagem de pedidos por status
    - faturamento por categoria
    - faturamento por estado
    - ranking de clientes
    - pedidos acima de R$ 500
    """

    print("=" * 55)
    print("RELATÓRIO DE PEDIDOS - E-COMMERCE")
    print("=" * 55)

    # 1. Faturamento total
    # faturamento = calcular_faturamento_total(lista_pedidos)
    # print("Faturamento total:", formatar_moeda(faturamento))

    # 2. Ticket médio
    # ticket_medio = calcular_ticket_medio(lista_pedidos)
    # print("Ticket médio:", formatar_moeda(ticket_medio))

    # 3. Contagem por status
    # status = contar_pedidos_por_status(lista_pedidos)
    # print("Pedidos por status:", status)

    # 4. Faturamento por categoria
    # categorias = calcular_faturamento_por_categoria(lista_pedidos)
    # print("Faturamento por categoria:", categorias)

    # 5. Faturamento por estado
    # estados = calcular_faturamento_por_estado(lista_pedidos)
    # print("Faturamento por estado:", estados)

    # 6. Ranking de clientes
    # ranking = criar_ranking_clientes(lista_pedidos)
    # ranking_ordenado = ordenar_ranking_clientes(ranking)
    # print("Ranking de clientes:", ranking_ordenado)

    # 7. Pedidos acima de R$ 500
    # pedidos_altos = listar_pedidos_acima_de(lista_pedidos, 500)
    # print("Pedidos acima de R$ 500:", pedidos_altos)

    pass


# ============================================================
# TESTES MANUAIS
# ============================================================
# Antes de gerar o relatório completo, você pode testar função por função.
#
# Exemplo:
#
# print(calcular_total_item(pedidos[0]["itens"][0]))
# print(calcular_total_pedido(pedidos[0]))
# print(calcular_faturamento_total(pedidos))


# ============================================================
# EXECUÇÃO DO PROGRAMA
# ============================================================

# Quando terminar as funções, remova o comentário da linha abaixo:

# gerar_relatorio(pedidos)


# ============================================================
# DESAFIOS BÔNUS
# ============================================================
# Se terminar o projeto principal, tente implementar:
#
# 1. Mostrar o produto mais vendido em quantidade.
# 2. Mostrar a categoria com maior faturamento.
# 3. Criar um menu com input() e while:
#
#    1 - Ver relatório geral
#    2 - Ver pedidos acima de um valor
#    3 - Ver faturamento por categoria
#    4 - Sair
#
# 4. Criar um README.md explicando:
#    - objetivo do projeto
#    - conceitos usados
#    - como executar
#    - exemplo de saída
