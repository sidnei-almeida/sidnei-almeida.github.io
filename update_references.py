#!/usr/bin/env python3
"""Script para atualizar referências de caminhos nos arquivos HTML dos projetos"""

import os
import re
from pathlib import Path

# Mapeamento de substituições
replacements = [
    # Favicon
    (r'href=["\']\./favicon\.svg["\']', 'href="../../favicon.svg"'),
    (r'href=["\']favicon\.svg["\']', 'href="../../favicon.svg"'),
    (r'href=["\']\./favicon\.ico["\']', 'href="../../favicon.ico"'),
    (r'href=["\']favicon\.ico["\']', 'href="../../favicon.ico"'),
    
    # Index
    (r'href=["\']\./index\.html["\']', 'href="../../index.html"'),
    (r'href=["\']index\.html["\']', 'href="../../index.html"'),
    
    # Images (sem ./ no início)
    (r'src=["\']images/', 'src="../../images/'),
    (r'data-src=["\']images/', 'data-src="../../images/'),
    (r'href=["\']images/', 'href="../../images/'),
    
    # Images (com ./ no início)
    (r'src=["\']\./images/', 'src="../../images/'),
    (r'data-src=["\']\./images/', 'data-src="../../images/'),
    (r'href=["\']\./images/', 'href="../../images/'),
]

def update_file(filepath):
    """Atualiza referências em um arquivo"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Updated: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"✗ Error updating {filepath}: {e}")
        return False

def main():
    projects_dir = Path('projects')
    
    if not projects_dir.exists():
        print("Projects directory not found!")
        return
    
    updated_count = 0
    
    for project_dir in projects_dir.iterdir():
        if not project_dir.is_dir():
            continue
        
        print(f"\nProcessing: {project_dir.name}")
        
        for html_file in project_dir.glob('*.html'):
            if update_file(html_file):
                updated_count += 1
    
    print(f"\n✓ Updated {updated_count} files")

if __name__ == '__main__':
    main()

