"""
Seed the database with default workspaces, agents, crews, tasks, and tools.
Run: python seed.py
"""
from database import SessionLocal, engine, Base
import models, schemas, crud

Base.metadata.create_all(bind=engine)

BUILTIN_TOOLS = [
    {"name": "SerperDevTool", "description": "Google Search via Serper API. Finds up-to-date information on any topic."},
    {"name": "FileReadTool", "description": "Reads local files and returns their content."},
    {"name": "WebsiteSearchTool", "description": "Semantic search within a specific website."},
    {"name": "ScrapeWebsiteTool", "description": "Scrapes and returns the full text content of a URL."},
    {"name": "CodeInterpreterTool", "description": "Executes Python code and returns the output."},
    {"name": "YoutubeVideoSearchTool", "description": "Searches YouTube for videos related to a query."},
    {"name": "GithubSearchTool", "description": "Searches GitHub repositories for code and issues."},
    {"name": "TelegramSendTool", "description": "Sends messages to a Telegram chat via bot token."},
]

WORKSPACES = {
    "ZEMARK": [
        {
            "name": "ZEMARK",
            "role": "Estrategista de Marketing Digital",
            "goal": "Criar e executar estratégias de marketing digital altamente eficazes que gerem resultados mensuráveis.",
            "backstory": "Sou ZEMARK, um especialista em marketing digital com anos de experiência em campanhas de alto impacto. Minha missão é transformar ideias em resultados concretos através de estratégias criativas e baseadas em dados.",
            "tools": ["SerperDevTool", "WebsiteSearchTool"],
        },
        {
            "name": "GERALD",
            "role": "Analista de Dados e Performance",
            "goal": "Analisar métricas e dados de campanhas para otimizar performance e ROI.",
            "backstory": "GERALD é o analista de dados da equipe ZEMARK, especializado em transformar números em insights acionáveis.",
            "tools": ["SerperDevTool", "CodeInterpreterTool"],
        },
        {
            "name": "TINA",
            "role": "Criadora de Conteúdo e Copywriter",
            "goal": "Produzir conteúdo persuasivo e de alta qualidade para todas as plataformas digitais.",
            "backstory": "TINA é a voz criativa da equipe, especializada em copywriting que converte e storytelling que engaja.",
            "tools": ["SerperDevTool", "WebsiteSearchTool"],
        },
        {
            "name": "POLI",
            "role": "Especialista em Mídias Sociais",
            "goal": "Gerenciar e crescer a presença nas redes sociais com conteúdo estratégico e engajamento autêntico.",
            "backstory": "POLI domina os algoritmos e tendências das principais plataformas sociais.",
            "tools": ["SerperDevTool", "YoutubeVideoSearchTool"],
        },
        {
            "name": "PEDRO_GOMES",
            "role": "Gestor de Tráfego Pago",
            "goal": "Otimizar campanhas de anúncios pagos para maximizar conversões com o menor CPA possível.",
            "backstory": "PEDRO GOMES é o especialista em tráfego pago, com expertise em Google Ads, Meta Ads e plataformas de performance.",
            "tools": ["SerperDevTool", "WebsiteSearchTool"],
        },
    ],
    "CASSIO": [
        {
            "name": "SNAKE",
            "role": "Especialista em Credenciais e Autenticação",
            "goal": "Garantir a segurança e integridade de todas as credenciais e sistemas de autenticação.",
            "backstory": "SNAKE é o guardião das credenciais, especializado em gestão segura de acessos e autenticação.",
            "tools": ["FileReadTool", "CodeInterpreterTool"],
        },
        {
            "name": "GERALT",
            "role": "Analista de Logs e Monitoramento",
            "goal": "Analisar logs de sistema em tempo real para identificar anomalias e prevenir falhas.",
            "backstory": "GERALT é o caçador de problemas nos logs — nenhum erro passa despercebido.",
            "tools": ["FileReadTool", "CodeInterpreterTool"],
        },
        {
            "name": "LINK",
            "role": "Monitor de Saúde de APIs",
            "goal": "Monitorar continuamente a saúde e disponibilidade de todas as APIs e endpoints.",
            "backstory": "LINK é o guardião das APIs, garantindo que todos os endpoints estejam operacionais.",
            "tools": ["WebsiteSearchTool", "ScrapeWebsiteTool"],
        },
        {
            "name": "SAMUS",
            "role": "Especialista em Disaster Recovery",
            "goal": "Planejar e executar procedimentos de recuperação de desastres para garantir continuidade do negócio.",
            "backstory": "SAMUS é a especialista em contingência — sempre pronta para o pior cenário.",
            "tools": ["FileReadTool", "CodeInterpreterTool"],
        },
        {
            "name": "RATCHET",
            "role": "Scanner de Vulnerabilidades CVE",
            "goal": "Identificar e reportar vulnerabilidades CVE em dependências e infraestrutura.",
            "backstory": "RATCHET varre continuamente o stack tecnológico em busca de vulnerabilidades conhecidas.",
            "tools": ["SerperDevTool", "GithubSearchTool"],
        },
        {
            "name": "KRATOS",
            "role": "Especialista em Performance e Otimização",
            "goal": "Analisar e otimizar a performance de sistemas para garantir máxima eficiência operacional.",
            "backstory": "KRATOS combina força bruta de análise com precisão cirúrgica na otimização.",
            "tools": ["CodeInterpreterTool", "FileReadTool"],
        },
    ],
    "DUDU": [
        {
            "name": "DUDU",
            "role": "E-commerce Manager",
            "goal": "Gerenciar e otimizar todas as operações de e-commerce para maximizar vendas e experiência do cliente.",
            "backstory": "DUDU é o gerente completo de e-commerce, responsável por estratégia de produto, precificação, estoque e atendimento ao cliente.",
            "tools": ["SerperDevTool", "WebsiteSearchTool", "ScrapeWebsiteTool"],
        },
    ],
}

CREW_CONFIGS = {
    "ZEMARK": {
        "name": "Crew ZEMARK - Marketing Digital",
        "description": "Equipe especializada em estratégias de marketing digital, criação de conteúdo e gestão de tráfego pago.",
        "process_type": "sequential",
        "tasks": [
            {
                "description": "Pesquisar e analisar o mercado atual, tendências e concorrentes. Identificar oportunidades de growth.",
                "expected_output": "Relatório completo de análise de mercado com oportunidades identificadas e recomendações estratégicas.",
                "agent_name": "ZEMARK",
                "order": 0,
            },
            {
                "description": "Com base na análise de mercado, criar um plano de conteúdo para os próximos 30 dias.",
                "expected_output": "Calendário editorial detalhado com temas, formatos, plataformas e CTAs para cada peça de conteúdo.",
                "agent_name": "TINA",
                "order": 1,
            },
            {
                "description": "Estruturar campanhas de tráfego pago alinhadas ao plano de conteúdo.",
                "expected_output": "Estrutura completa de campanhas com públicos, criativos, orçamentos e KPIs esperados.",
                "agent_name": "PEDRO_GOMES",
                "order": 2,
            },
        ],
    },
    "CASSIO": {
        "name": "Crew CASSIO - DevOps & Security",
        "description": "Equipe de segurança e infraestrutura responsável por monitoramento, segurança e continuidade operacional.",
        "process_type": "sequential",
        "tasks": [
            {
                "description": "Realizar scan completo de vulnerabilidades CVE nos repositórios e dependências do projeto.",
                "expected_output": "Relatório de vulnerabilidades com severidade, CVE IDs e plano de mitigação priorizado.",
                "agent_name": "RATCHET",
                "order": 0,
            },
            {
                "description": "Analisar logs de sistema das últimas 24h e identificar anomalias ou padrões suspeitos.",
                "expected_output": "Relatório de análise de logs com anomalias identificadas, causa raiz e ações corretivas.",
                "agent_name": "GERALT",
                "order": 1,
            },
            {
                "description": "Verificar saúde de todas as APIs e endpoints críticos do sistema.",
                "expected_output": "Dashboard de status de APIs com latência, disponibilidade e alertas de degradação.",
                "agent_name": "LINK",
                "order": 2,
            },
        ],
    },
    "DUDU": {
        "name": "Crew DUDU - E-commerce Operations",
        "description": "Gerenciamento completo das operações de e-commerce incluindo estratégia, produtos e atendimento.",
        "process_type": "sequential",
        "tasks": [
            {
                "description": "Analisar performance atual da loja, produtos mais vendidos, carrinhos abandonados e oportunidades de upsell.",
                "expected_output": "Relatório executivo de e-commerce com métricas-chave, insights e top 5 ações de melhoria imediata.",
                "agent_name": "DUDU",
                "order": 0,
            },
        ],
    },
}


def seed():
    db = SessionLocal()
    try:
        # 1. Tools
        existing_tools = {t.name for t in crud.get_tools(db)}
        tool_map = {}
        for t in BUILTIN_TOOLS:
            if t["name"] not in existing_tools:
                tool = crud.create_tool(db, schemas.ToolCreate(**t))
            else:
                tool = next(x for x in crud.get_tools(db) if x.name == t["name"])
            tool_map[t["name"]] = tool
        print(f"✅ {len(BUILTIN_TOOLS)} tools seeded")

        # 2. Agents
        existing_agents = {a.name for a in crud.get_agents(db)}
        agent_map = {}
        for workspace, agents in WORKSPACES.items():
            for a in agents:
                if a["name"] not in existing_agents:
                    agent = crud.create_agent(db, schemas.AgentCreate(
                        name=a["name"],
                        role=a["role"],
                        goal=a["goal"],
                        backstory=a["backstory"],
                        tools=a.get("tools", []),
                        workspace=workspace,
                        llm_model="claude-sonnet-4-6",
                    ))
                    existing_agents.add(a["name"])
                else:
                    agent = next(x for x in crud.get_agents(db) if x.name == a["name"])
                agent_map[a["name"]] = agent
        print(f"✅ {sum(len(v) for v in WORKSPACES.values())} agents seeded")

        # 3. Crews + Tasks
        existing_crews = {c.name for c in crud.get_crews(db)}
        for workspace, config in CREW_CONFIGS.items():
            if config["name"] in existing_crews:
                continue

            workspace_agents = WORKSPACES[workspace]
            agent_ids = [agent_map[a["name"]].id for a in workspace_agents if a["name"] in agent_map]

            crew = crud.create_crew(db, schemas.CrewCreate(
                name=config["name"],
                description=config["description"],
                process_type=config["process_type"],
                workspace=workspace,
                agent_ids=agent_ids,
            ))

            for t in config["tasks"]:
                agent = agent_map.get(t["agent_name"])
                crud.create_task(db, schemas.TaskCreate(
                    description=t["description"],
                    expected_output=t["expected_output"],
                    agent_id=agent.id if agent else None,
                    crew_id=crew.id,
                    order=t["order"],
                ))

        print(f"✅ {len(CREW_CONFIGS)} crews seeded")
        print("🚀 Database seeded successfully!")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
