export const PEDIDOS_SAMPLE_CODE = `pedidos = [
    {
        "id_pedido": 101,
        "cliente": "Ana Silva",
        "estado": "RS",
        "status": "entregue",
        "itens": [
            {
                "produto": "Mouse",
                "categoria": "eletronicos",
                "preco_unitario": 80,
                "quantidade": 2
            }
        ]
    }
]`;

export const TERMINAL_OUTPUT_SAMPLE = `=======================================================
RELATÓRIO DE PEDIDOS - E-COMMERCE
=======================================================

Faturamento total: R$ 7450.00
Ticket médio: R$ 1241.67

Pedidos por status:
entregue: 6
cancelado: 2

Faturamento por categoria:
eletronicos: R$ 980.00
moveis: R$ 1200.00
informatica: R$ 4690.00
casa: R$ 440.00

Pedidos acima de R$ 500:
Pedido 102 | Carlos Souza | R$ 1200.00
Pedido 104 | João Pedro | R$ 3290.00
Pedido 108 | Rafael Alves | R$ 1490.00`;

export const GITHUB_TREE_SAMPLE = `analise-pedidos-python/
├── analise_pedidos_guiado.py
└── README.md`;

export const SETUP_SHELL = `mkdir analise-pedidos-python
cd analise-pedidos-python`;

export const RUN_SHELL = `python analise_pedidos_guiado.py`;
