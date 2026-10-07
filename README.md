# Portfólio · Aldory Waltrick

Landing page de portfólio: dados, BI, engenharia de dados, DevOps e sites.

**Site:** https://luizzwaltrick.github.io

- Site estático, sem build: HTML, CSS e JavaScript puros.
- Todo o conteúdo (perfil, serviços, BIs, projetos, experiência, contatos) fica em `assets/js/data.js`.
- Os BIs de demonstração (`assets/js/report.js` + `assets/css/report.css`) seguem o padrão Torre de Controle:
  base fictícia gerada no navegador, página principal e de detalhe, filtros, cross-filter, exportação em CSV e PDF.

## Rodar localmente

```bash
python -m http.server 8000
# abra http://localhost:8000
```
