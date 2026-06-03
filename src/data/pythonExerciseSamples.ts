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

/** Linux / macOS — terminal Bash */
export const LINUX_VENV_COMMANDS = `# 1) Crie a pasta do projeto e entre nela
mkdir analise-pedidos-python
cd analise-pedidos-python

# 2) Coloque analise_pedidos_guiado.py nesta pasta (download ou cópia)

# 3) Crie o ambiente virtual dentro da pasta (pasta venv/)
python3 -m venv venv

# 4) Ative o ambiente — o prompt deve mostrar (venv)
source venv/bin/activate

# 5) Rode o exercício
python analise_pedidos_guiado.py`;

/** Windows — PowerShell */
export const WINDOWS_POWERSHELL_COMMANDS = `# 1) Crie a pasta do projeto e entre nela
mkdir analise-pedidos-python
cd analise-pedidos-python

# 2) Coloque analise_pedidos_guiado.py nesta pasta (download ou cópia)

# 3) Crie o ambiente virtual dentro da pasta (pasta venv\\)
python -m venv venv

# 4) Ative o ambiente — o prompt deve mostrar (venv)
.\\venv\\Scripts\\Activate.ps1

# 5) Rode o exercício
python analise_pedidos_guiado.py`;

/** Windows — Prompt de Comando (cmd), alternativa */
export const WINDOWS_CMD_COMMANDS = `mkdir analise-pedidos-python
cd analise-pedidos-python
python -m venv venv
venv\\Scripts\\activate.bat
python analise_pedidos_guiado.py`;
