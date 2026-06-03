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

export const PROJECT_TREE_WITH_README = `analise-pedidos-python/
├── .venv/
├── analise_pedidos_guiado.py
└── README.md`;

export const OS_SETUP_LINUX = `mkdir analise-pedidos-python
cd analise-pedidos-python
code .
python -m venv .venv
source .venv/bin/activate
python analise_pedidos_guiado.py`;

export const OS_SETUP_WINDOWS_PS = `mkdir analise-pedidos-python
cd analise-pedidos-python
code .
python -m venv .venv
.venv\\Scripts\\Activate.ps1
python analise_pedidos_guiado.py`;

export const OS_SETUP_WINDOWS_CMD = `mkdir analise-pedidos-python
cd analise-pedidos-python
code .
python -m venv .venv
.venv\\Scripts\\activate.bat
python analise_pedidos_guiado.py`;

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

export type OsPlatform = 'linux' | 'windows-ps' | 'windows-cmd';

export const OS_SETUP_SCRIPTS: Record<OsPlatform, { code: string; language: string }> = {
  linux: { code: OS_SETUP_LINUX, language: 'bash' },
  'windows-ps': { code: OS_SETUP_WINDOWS_PS, language: 'powershell' },
  'windows-cmd': { code: OS_SETUP_WINDOWS_CMD, language: 'cmd' },
};
