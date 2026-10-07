/*
 * Conteúdo do portfólio.
 * Para atualizar textos, BIs, serviços, experiência e contatos, edite só este arquivo.
 */
window.PORTFOLIO = {
  profile: {
    name: "Aldory Waltrick",
    role: "Dados, BI & Engenharia",
    rotating: ["Engenharia de Dados", "Business Intelligence", "Power BI e SQL", "DevOps e Cloud", "IA Generativa"],
    headline: "Ajudo empresas a organizar seus dados e transformar informação em decisão, com pipelines em Python e Airflow, dashboards em Power BI e consultoria em BI.",
    location: "Itajaí, SC",
    availability: "Disponível para projetos e consultoria",
    email: "",
    whatsapp: "5547991787079", // DDI + DDD + número, só dígitos
    whatsappMessage: "Olá, Aldory! Vi seu portfólio e quero conversar sobre um projeto.",
    linkedin: "https://www.linkedin.com/in/luizzwaltrick/",
    github: "https://github.com/luizzwaltrick",
    codewars: "https://www.codewars.com/users/LuizzWaltrick",
    cv: "", // ex.: "assets/cv-aldory-waltrick.pdf"
    about: [
      "Sou analista de dados e consultor em BI, formado em Tecnologia da Informação pela Estácio. Atuo em todo o ciclo do dado: extração na origem, tratamento e validação em Python e SQL, modelagem semântica e entrega de dashboards em Power BI. Hoje sou o analista de dados da ALS Logística, responsável por análise, engenharia e governança de dados.",
      "Em paralelo, presto consultoria e desenvolvo projetos para outras empresas: diagnóstico do cenário de dados, definição de indicadores, arquitetura de BI e implantação de pipelines e painéis, sempre com foco em entregar algo que o time realmente use.",
      "Na ES Logistics, orquestrei pipelines com mais de 360 mil registros, automatizei processos que geraram uma economia estimada de 400 horas por mês e reduzi o tempo de deploy em 99% em mais de 60 repositórios. Também desenvolvi soluções de IA generativa, como chatbots com busca vetorial (RAG) para diversas áreas de negócio da empresa."
    ],
    facts: [
      ["Formação", "Tecnologia da Informação · Estácio"],
      ["Atuação", "Consultoria e projetos sob demanda"],
      ["Inglês", "Avançado · C1 (EF SET)"],
      ["Certificação", "Google Cybersecurity Professional"],
      ["Base", "Itajaí, SC · atendimento remoto ou presencial"]
    ],
    stats: [
      { to: 360, prefix: "", suffix: "k+", label: "registros em pipelines" },
      { to: 400, prefix: "", suffix: "h/mês", label: "economizadas com automação" },
      { to: 99, prefix: "−", suffix: "%", label: "no tempo de deploy" }
    ]
  },

  services: [
    {
      icon: "compass",
      title: "Consultoria em dados e BI",
      text: "Diagnóstico do cenário atual, definição de indicadores, arquitetura de dados e boas práticas de governança. Também acompanho o time interno na evolução dos painéis.",
      tags: ["Diagnóstico", "Arquitetura", "Governança", "Mentoria"]
    },
    {
      icon: "chart",
      title: "Dashboards e BI",
      text: "Painéis em Power BI com visuais personalizados e identidade própria, do levantamento de requisitos com a área até a publicação.",
      tags: ["Power BI", "DAX", "pbiviz", "Tableau", "Metabase"]
    },
    {
      icon: "db",
      title: "Engenharia de dados",
      text: "Pipelines de extração, transformação e carga orquestrados no Airflow, com validação e consultas de consolidação em SQL para que o número do painel bata com o do financeiro.",
      tags: ["Python", "Airflow", "SQL Server", "PostgreSQL", "dbt"]
    },
    {
      icon: "spark",
      title: "IA generativa e RAG",
      text: "Chatbots e assistentes que respondem com base nos documentos da empresa, usando busca vetorial, para diferentes áreas de negócio.",
      tags: ["RAG", "LLM", "ChromaDB", "Vector Search"]
    },
    {
      icon: "server",
      title: "DevOps e cloud",
      text: "Esteiras de CI/CD, ambientes padronizados com Docker e infraestrutura em nuvem organizada e documentada.",
      tags: ["GitHub Actions", "Docker", "Azure", "AWS"]
    },
    {
      icon: "code",
      title: "Sistemas e sites",
      text: "Integrações entre sistemas legados, APIs, automações, crawlers e sites institucionais, em Python, React ou no que o projeto pedir.",
      tags: ["Python", "React", "APIs REST", "Web Scraping"]
    }
  ],

  /*
   * BIs de demonstração.
   * Cada BI gera uma base fictícia ("rows" linhas nos últimos 12 meses) e calcula tudo a partir dela,
   * igual a um modelo de verdade: KPIs, tendência, rosca, ranking, ticker e tabela de detalhe.
   *
   * dims:  dimensões de cada linha (f = filtro do cabeçalho, cat = rosca, ent = ranking/lista, st = status)
   * nums:  colunas numéricas. "gen" sorteia entre [mín, máx]; "from" + "mult" deriva de outra coluna.
   * kpis:  calc = count | sum | avg | pct | sub | div. "where" filtra por dimensão; sub/div usam índices de outros KPIs.
   */
  dashboards: [
    {
      id: "torre",
      title: "Torre de Controle",
      category: "Logística",
      description: "Acompanha embarques, prazos e SLA da operação. Os visuais são personalizados em TypeScript, com cross-filter entre todos eles e exportação dos dados direto da tabela.",
      highlights: ["Visuais pbiviz feitos sob medida", "Cross-filter entre todos os componentes", "Página de detalhe com busca e exportação"],
      tools: ["Power BI", "pbiviz", "Python", "SQL"],
      image: "",
      link: "",
      preview: {
        kpis: [["Embarques", 14.2, "", "k"], ["OTIF", 96.4, "", "%"], ["SLA", 98.1, "", "%"]],
        bars: [42, 55, 48, 61, 70, 66, 74, 80, 77, 85, 90, 52]
      },
      report: {
        subtitle: "Embarques e prazos da operação",
        unit: "embarques",
        idPrefix: "EMB",
        rows: 2600,
        dims: {
          f: { label: "Porto", values: ["Itajaí", "Navegantes", "Paranaguá", "Santos", "Rio Grande"] },
          cat: { label: "Tipo de carga", values: ["Contêiner 40'", "Contêiner 20'", "Reefer", "Carga solta", "Granel", "Projeto"] },
          ent: { label: "Cliente", values: ["Têxtil Vale", "Alimentos Sul", "Metalúrgica Brusque", "Cerâmica Litoral", "Móveis Serra", "Pescados Itajaí", "Agro Planalto", "Química Norte", "Papel & Cia", "Plásticos Oeste", "Calçados Vale", "Eletro Sul", "Maderas BR", "Frigorífico Rio Sul", "Autopeças Joinville", "Vinícola Serra"] },
          st: { label: "Status", values: ["No prazo", "Atrasado", "Em trânsito"], weights: [82, 9, 9] }
        },
        nums: [
          { key: "frete", label: "Frete", fmt: "brl", gen: [1800, 14000] },
          { key: "lead", label: "Lead time", fmt: "dias", gen: [1.5, 8] }
        ],
        kpis: [
          { label: "Embarques", calc: "count", fmt: "int" },
          { label: "OTIF", calc: "pct", where: { st: "No prazo" }, fmt: "pct" },
          { label: "Frete total", calc: "sum", field: "frete", fmt: "brl" },
          { label: "Lead time médio", calc: "avg", field: "lead", fmt: "dias", lowerIsBetter: true }
        ],
        trend: { title: "Embarques por mês", kpi: 0 },
        share: { title: "Embarques por tipo de carga", kpi: 0 },
        ranking: { title: "Clientes com mais embarques", kpi: 0 },
        table: ["data", "id", "f", "ent", "cat", "st", "frete", "lead"]
      }
    },
    {
      id: "dre",
      title: "DRE Unificado",
      category: "Financeiro",
      description: "Junta o resultado de todas as empresas do grupo num DRE só, com consultas de consolidação em SQL Server e checagem das bases antes de cada atualização.",
      highlights: ["Consolidação de várias fontes em SQL", "Diagnóstico de inconsistências antes da carga", "Visão mensal, acumulada e por centro de custo"],
      tools: ["Power BI", "SQL Server", "DAX"],
      image: "",
      link: "",
      preview: {
        kpis: [["Receita", 4.1, "R$ ", "M"], ["Resultado", 18.6, "", "%"], ["Despesas", 3.3, "R$ ", "M"]],
        bars: [60, 58, 64, 70, 68, 75, 72, 79, 84, 81, 88, 40]
      },
      report: {
        subtitle: "Resultado consolidado do grupo",
        unit: "lançamentos",
        idPrefix: "LCT",
        rows: 3000,
        dims: {
          f: { label: "Empresa", values: ["Matriz", "Filial SC", "Filial SP", "Filial PR"] },
          cat: { label: "Centro de custo", values: ["Operações", "Pessoal", "Comercial", "Administrativo", "TI", "Financeiro", "Jurídico"] },
          ent: { label: "Conta", values: ["Frete internacional", "Armazenagem", "Desembaraço", "Salários", "Encargos", "Aluguel", "Energia", "Software", "Consultoria", "Combustível", "Seguros", "Manutenção", "Marketing", "Viagens"] },
          st: { label: "Natureza", values: ["Receita", "Despesa"], weights: [57, 43] }
        },
        nums: [
          { key: "valor", label: "Valor", fmt: "brl", gen: [2500, 38000] }
        ],
        kpis: [
          { label: "Receita líquida", calc: "sum", field: "valor", where: { st: "Receita" }, fmt: "brl" },
          { label: "Despesas", calc: "sum", field: "valor", where: { st: "Despesa" }, fmt: "brl", lowerIsBetter: true },
          { label: "Resultado", calc: "sub", a: 0, b: 1, fmt: "brl" },
          { label: "Margem", calc: "div", a: 2, b: 0, fmt: "pct", pct: true }
        ],
        trend: { title: "Receita líquida por mês", kpi: 0 },
        share: { title: "Despesas por centro de custo", kpi: 1 },
        ranking: { title: "Maiores contas", kpi: 1 },
        table: ["data", "id", "f", "ent", "cat", "st", "valor"]
      }
    },
    {
      id: "comercial",
      title: "Comercial",
      category: "Comercial",
      description: "Mostra faturamento, pedidos e ticket médio por time e por cliente. Segue o mesmo tema visual dos outros painéis, então quem usa um já sabe usar todos.",
      highlights: ["Requisitos levantados junto com a área", "Modelo em esquema estrela", "Tema visual próprio da empresa"],
      tools: ["Power BI", "SQL Server", "Python"],
      image: "",
      link: "",
      preview: {
        kpis: [["Faturamento", 2.4, "R$ ", "M"], ["Pedidos", 1.8, "", "k"], ["Ticket", 18.4, "R$ ", "k"]],
        bars: [30, 46, 38, 52, 49, 63, 58, 71, 69, 64, 78, 35]
      },
      report: {
        subtitle: "Pedidos e faturamento por time",
        unit: "pedidos",
        idPrefix: "PED",
        rows: 2400,
        dims: {
          f: { label: "Time", values: ["Inside Sales", "Key Accounts", "Canais", "Exportação"] },
          cat: { label: "Segmento", values: ["Indústria", "Varejo", "Serviços", "Agro", "Governo", "Saúde"] },
          ent: { label: "Cliente", values: ["Grupo Atlântico", "Rede Bom Preço", "Indústrias Kuhn", "Coop. Oeste", "Hospital Vida", "Construtora Mar", "Supermercados Litoral", "Transportes Vale", "Usina Norte", "Farmácias União", "Têxtil Brusque", "Agro Campos", "Prefeitura Sul", "Moinho Serra"] },
          st: { label: "Status", values: ["Faturado", "Em aberto", "Cancelado"], weights: [78, 15, 7] }
        },
        nums: [
          { key: "valor", label: "Valor do pedido", fmt: "brl", gen: [3500, 42000] },
          { key: "itens", label: "Itens", fmt: "int", gen: [1, 60] }
        ],
        kpis: [
          { label: "Faturamento", calc: "sum", field: "valor", where: { st: "Faturado" }, fmt: "brl" },
          { label: "Pedidos", calc: "count", fmt: "int" },
          { label: "Ticket médio", calc: "avg", field: "valor", where: { st: "Faturado" }, fmt: "brl" },
          { label: "Cancelamento", calc: "pct", where: { st: "Cancelado" }, fmt: "pct", lowerIsBetter: true }
        ],
        trend: { title: "Faturamento por mês", kpi: 0 },
        share: { title: "Faturamento por segmento", kpi: 0 },
        ranking: { title: "Maiores clientes", kpi: 0 },
        table: ["data", "id", "f", "ent", "cat", "st", "valor", "itens"]
      }
    },
    {
      id: "midia",
      title: "Mídia Paga",
      category: "Marketing",
      description: "Performance das campanhas por canal: investimento, receita, ROAS, CPA e pacing do orçamento, com cor de alerta e texto sempre que um indicador sai da meta.",
      highlights: ["Pacing do orçamento com marcas de 100% e 110%", "ROAS e CPA comparados com a meta", "Benchmark entre canais"],
      tools: ["Power BI", "pbiviz", "DAX"],
      image: "",
      link: "",
      preview: {
        kpis: [["ROAS", 4.7, "", "x"], ["CPA", 38, "R$ ", ""], ["Pacing", 96, "", "%"]],
        bars: [36, 44, 41, 55, 52, 60, 66, 63, 72, 70, 79, 30]
      },
      report: {
        subtitle: "Investimento e retorno por canal",
        unit: "registros",
        idPrefix: "CMP",
        rows: 2800,
        dims: {
          f: { label: "Canal", values: ["Google Ads", "Meta Ads", "LinkedIn Ads", "TikTok Ads"], weights: [42, 34, 14, 10] },
          cat: { label: "Objetivo", values: ["Conversão", "Tráfego", "Alcance", "Leads", "Remarketing"] },
          ent: { label: "Campanha", values: ["Institucional", "Remarketing 30d", "Lançamento", "Black Friday", "Leads B2B", "Always-on", "Volta às aulas", "Dia das Mães", "Webinar", "Catálogo", "Marca", "Concorrentes"] },
          st: { label: "Status", values: ["Ativa", "Pausada", "Encerrada"], weights: [70, 18, 12] }
        },
        nums: [
          { key: "spend", label: "Investimento", fmt: "brl", gen: [180, 2600] },
          { key: "receita", label: "Receita", fmt: "brl", from: "spend", mult: [2.4, 7.2] },
          { key: "plano", label: "Orçamento", fmt: "brl", from: "spend", mult: [0.92, 1.12] },
          { key: "conv", label: "Conversões", fmt: "int", from: "spend", mult: [0.015, 0.04], round: true }
        ],
        kpis: [
          { label: "Investimento", calc: "sum", field: "spend", fmt: "brl", pacing: { plan: "plano" } },
          { label: "Receita", calc: "sum", field: "receita", fmt: "brl" },
          { label: "ROAS", calc: "div", a: 1, b: 0, fmt: "x", target: 4, rule: "min" },
          { label: "CPA", calc: "divField", num: "spend", den: "conv", fmt: "brl", lowerIsBetter: true, target: 40, rule: "max" }
        ],
        trend: { title: "Investimento por mês", kpi: 0 },
        share: { title: "Investimento por objetivo", kpi: 0 },
        ranking: { title: "Campanhas com maior investimento", kpi: 0 },
        table: ["data", "id", "f", "ent", "cat", "st", "spend", "receita", "conv"]
      }
    }
  ],

  projects: [
    {
      title: "Pipelines de dados críticos",
      text: "Pipelines no Airflow que passaram de 360 mil registros, com validação de schema antes da carga no PostgreSQL.",
      tags: ["Python", "Airflow", "PostgreSQL", "Docker"],
      link: ""
    },
    {
      title: "CI/CD em mais de 60 repositórios",
      text: "Reestruturei as esteiras no GitHub Actions. O deploy, que levava 30 minutos, passou a levar 20 segundos.",
      tags: ["GitHub Actions", "CI/CD", "Docker"],
      link: ""
    },
    {
      title: "Chatbots com RAG",
      text: "Assistentes que respondem com base nos documentos internos, usando busca vetorial, adotados por diversas áreas de negócio da empresa.",
      tags: ["RAG", "LLM", "ChromaDB", "Python"],
      link: ""
    },
    {
      title: "Crawlers de mercado",
      text: "Rotinas de coleta de preços e fornecedores para o time de Procurement, rodando de forma agendada.",
      tags: ["Web Scraping", "Python", "Pandas"],
      link: ""
    },
    {
      title: "Infraestrutura no Azure",
      text: "Cuidei da infraestrutura em nuvem e dos ambientes do time, todos padronizados com Docker.",
      tags: ["Azure", "Docker", "Linux"],
      link: ""
    },
    {
      title: "Este portfólio",
      text: "Site estático no GitHub Pages, sem build. Os BIs de demonstração são gerados no navegador a partir de uma base fictícia.",
      tags: ["HTML", "CSS", "JavaScript"],
      link: "https://github.com/luizzwaltrick/luizzwaltrick.github.io"
    }
  ],

  experience: [
    {
      company: "ALS Logística",
      meta: "Temporário · Itajaí, SC",
      roles: [
        {
          role: "Analista de Dados Pleno",
          period: "jun. 2026 até hoje",
          text: "Cuido do ciclo completo de BI: modelagem e extração em SQL Server, tratamento e automação em Python e entrega dos dashboards em Power BI.",
          bullets: [
            "Dashboards ativos nas áreas Financeira, Comercial, RH e Logística, do levantamento de requisitos à arquitetura.",
            "Rotinas de diagnóstico em SQL para corrigir inconsistências entre bases antes da entrega.",
            "Consultas de consolidação complexas, como o DRE unificado da empresa.",
            "Tema visual próprio para padronizar a identidade e o uso dos dashboards.",
            "Único analista de dados da empresa, atuando em análise, engenharia e governança."
          ],
          tags: ["Power BI", "SQL Server", "Python"]
        }
      ]
    },
    {
      company: "ES Logistics",
      meta: "1 ano e 9 meses · Itajaí, SC",
      roles: [
        {
          role: "Desenvolvedor de Software",
          period: "abr. 2026 a jun. 2026",
          text: "Referência técnica em DevOps. Cuidei da infraestrutura em nuvem, da automação de deploys e de sistemas para importação e exportação marítima.",
          bullets: [
            "Deploy de 30 min para 20 s (−99%) em mais de 60 repositórios com GitHub Actions.",
            "Mais de 400 horas operacionais economizadas com automação de processos e servidores.",
            "Administração do Azure e dos ambientes do time, padronizados com Docker."
          ],
          tags: ["GitHub Actions", "Azure", "Docker", "Python", "React"]
        },
        {
          role: "Analista de Dados",
          period: "ago. 2025 a abr. 2026",
          text: "Engenharia e orquestração de dados com Python, Airflow, PostgreSQL, Docker, CI/CD, APIs REST, web scraping e IA generativa.",
          bullets: [
            "Pipelines de dados críticos com mais de 360 mil registros.",
            "Automação de processos operacionais, com economia estimada de 300 horas por mês.",
            "Soluções de IA generativa (RAG, LLM e banco vetorial) para agilizar consultas internas."
          ],
          tags: ["Airflow", "PostgreSQL", "RAG", "CI/CD"]
        },
        {
          role: "Estagiário em Análise de Dados",
          period: "mar. 2025 a ago. 2025",
          text: "Desenvolvimento e integração de sistemas com Python, SQL, APIs REST, ChromaDB e automação.",
          bullets: [
            "Liderança técnica na integração de dados logísticos e APIs entre sistemas legados.",
            "Chatbots com busca vetorial (RAG) para diversas áreas de negócio da empresa.",
            "Crawlers e extração de dados de mercado para o time de Procurement."
          ],
          tags: ["Python", "SQL", "ChromaDB", "Web Crawling"]
        },
        {
          role: "Comercial Interno",
          period: "out. 2024 a abr. 2025",
          text: "Análise e controle de sinistros de seguros, com foco em precisão, conformidade e prazo, e contato em inglês com parceiros externos.",
          bullets: [],
          tags: ["Análise de dados", "Inglês"]
        }
      ]
    }
  ],

  stack: {
    "Dados e BI": ["Power BI", "DAX", "Tableau", "Metabase", "Pandas", "Polars"],
    "Engenharia": ["Python", "Apache Airflow", "dbt", "Spark", "ETL", "Web Scraping"],
    "Bancos e IA": ["SQL Server", "PostgreSQL", "ChromaDB", "RAG", "LLM"],
    "DevOps e Dev": ["Docker", "Git", "GitHub Actions", "Azure", "AWS", "React"]
  }
};
