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

export const MKDIR_CD = `mkdir analise-pedidos-python
cd analise-pedidos-python`;

export const VSCODE_OPEN = `code .`;

export const VENV_CREATE = `python -m venv .venv`;

export const VENV_CREATE_LINUX = `python3 -m venv .venv`;

export const ACTIVATE_LINUX = `source .venv/bin/activate`;

export const ACTIVATE_WINDOWS_PS = `.venv\\Scripts\\Activate.ps1`;

export const ACTIVATE_WINDOWS_CMD = `.venv\\Scripts\\activate.bat`;

export const VENV_PROMPT_HINT = `(.venv)`;

export const PROJECT_TREE = `analise-pedidos-python/
├── .venv/
└── analise_pedidos_guiado.py`;

export const RUN_SCRIPT = `python analise_pedidos_guiado.py`;

export const TEST_FUNCTION_SNIPPET = `print(calcular_total_item(pedidos[0]["itens"][0]))`;

export const REPORT_COMMENTED = `# gerar_relatorio(pedidos)`;

export const REPORT_ACTIVE = `gerar_relatorio(pedidos)`;

export const README_TEMPLATE = `# Análise de Pedidos com Python Básico

Este projeto simula uma análise simples de pedidos de e-commerce usando Python puro.

## Objetivo

Praticar fundamentos de Python, como listas, dicionários, condicionais, loops e funções.

## Conceitos praticados

- variáveis
- operadores
- strings
- listas
- dicionários
- listas de dicionários
- for
- if/else
- funções
- parâmetros opcionais

## Como executar

\`\`\`bash
python analise_pedidos_guiado.py
\`\`\`

## Exemplo de saída

Cole aqui um exemplo do relatório gerado no terminal.`;

export const GIT_PUBLISH = `git init
git add .
git commit -m "Adiciona projeto de análise de pedidos"`;
