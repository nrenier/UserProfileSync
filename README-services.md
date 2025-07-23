# Neo4j e n8n Integration Guide

## Configurazione Esistente

L'applicazione è configurata per integrarsi con i container Docker esistenti di Neo4j e n8n tramite le variabili d'ambiente nel file `.env`.

### Credenziali Correnti

**Neo4j:**
- URI: `bolt://localhost:7687`
- Username: `neo4j` 
- Password: `password123`

**n8n:**
- URL: `http://localhost:5678`
- API Key: `your-n8n-api-key-here` (da configurare)
- Workflow ID: `your-workflow-id-here` (da configurare)

## Query Neo4j Implementata

L'applicazione utilizza esattamente la query Cypher fornita:
```cypher
MATCH (n:SUK) RETURN n.nome_azienda, n.settore, n.descrizione
```

## Come Avviare i Servizi

### Opzione 1: Container Esistenti
Se i container sono già presenti, assicurati che siano in esecuzione:
```bash
docker start analytics_neo4j analytics_n8n
```

### Opzione 2: Nuovi Container
Se i container non esistono, utilizza lo script fornito:
```bash
./start-services.sh
```

### Opzione 3: Docker Compose
Avvia tutti i servizi insieme:
```bash
docker-compose up -d neo4j n8n
```

## Verifica Connessioni

Controlla se i servizi sono accessibili:
```bash
npm run check-services
```

## Configurazione n8n

1. Accedi all'interfaccia n8n: http://localhost:5678
2. Crea un workflow per la generazione PDF
3. Genera una API key nelle impostazioni
4. Aggiorna il file `.env` con:
   - `N8N_API_KEY=<tua-api-key>`
   - `N8N_WORKFLOW_ID=<id-del-workflow>`

## Popolamento Dati Neo4j

Per aggiungere dati di test nel formato SUK:
```cypher
CREATE (s:SUK {
  nome_azienda: "Azienda Example",
  settore: "Manufacturing", 
  descrizione: "Descrizione dell'azienda"
})
```

## Troubleshooting

1. **Neo4j non si connette**: Verifica che il container sia in esecuzione sulla porta 7687
2. **n8n non accessibile**: Controlla che il container sia in esecuzione sulla porta 5678
3. **Dati non trovati**: Assicurati che i nodi SUK siano presenti nel database Neo4j

L'applicazione include dati di fallback per funzionare anche senza i servizi esterni.