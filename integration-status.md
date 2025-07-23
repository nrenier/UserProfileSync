# Status Integrazione Neo4j e n8n

## Configurazione Completata ✅

### Docker Compose Aggiornato
- Rimossi servizi Neo4j e n8n per evitare conflitti con container esistenti
- App configurata per connettersi ai container esterni via `host.docker.internal`
- Mantiene solo PostgreSQL per l'autenticazione dell'applicazione

### File .env Aggiornato
- `NEO4J_URI=bolt://localhost:7687`
- `NEO4J_USERNAME=neo4j`
- `NEO4J_PASSWORD=password123`
- `N8N_BASE_URL=http://localhost:5678`
- `N8N_API_KEY=your-n8n-api-key-here`
- `N8N_WORKFLOW_ID=your-workflow-id-here`

### Query Neo4j Implementata
```cypher
MATCH (n:SUK) RETURN n.nome_azienda, n.settore, n.descrizione
```

### Servizi Backend Aggiornati
- `server/services/neo4j.ts`: Legge credenziali da variabili d'ambiente
- `server/services/n8n.ts`: Configurato per container Docker esistente
- Dati di fallback disponibili quando i servizi non sono accessibili

## Passaggi Successivi 📋

### 1. Avviare i Container Docker
Se i container non sono attivi:
```bash
# Opzione A: Container singoli
docker start analytics_neo4j analytics_n8n

# Opzione B: Docker Compose
docker-compose up -d neo4j n8n

# Opzione C: Script personalizzato
./start-services.sh
```

### 2. Verificare Connessioni
```bash
# Controlla se i servizi sono accessibili
tsx check-services.js
```

### 3. Configurare n8n
1. Accedi a http://localhost:5678
2. Crea un workflow per generazione PDF
3. Genera API key nelle impostazioni
4. Aggiorna `.env` con le credenziali reali

### 4. Popolare Neo4j con Dati SUK
```cypher
CREATE (s:SUK {
  nome_azienda: "Azienda Example",
  settore: "Manufacturing", 
  descrizione: "Descrizione dell'azienda"
})
```

## Test di Funzionamento

L'applicazione è configurata per:
- ✅ Connettersi automaticamente ai container esistenti
- ✅ Utilizzare la query SUK esatta fornita
- ✅ Funzionare con dati di fallback se i servizi non sono disponibili
- ✅ Mostrare errori di connessione nei log per debugging

## File Creati

- `start-services.sh`: Script per avviare i container
- `check-services.js`: Script per verificare le connessioni
- `README-services.md`: Guida completa all'integrazione
- `integration-status.md`: Questo file di stato

## Fix Docker Build

✅ **Problema Risolto**: Aggiornato Dockerfile per installare tutte le dipendenze (incluse quelle di sviluppo) durante il build, poi rimuovere quelle non necessarie per ridurre la dimensione dell'immagine.

### Dockerfile Aggiornato
- Installa tutte le dipendenze con `npm ci` (non solo production)
- Esegue il build con script personalizzato che esclude Vite dal bundle server
- Usa import dinamico di Vite solo in sviluppo
- Rimuove le dipendenze di sviluppo dopo il build per ottimizzare l'immagine

### Script di Build Personalizzato
- `build-scripts.js`: Build separato per client e server con esclusioni corrette
- Esclude Vite, plugin Vite, e altre dipendenze di sviluppo dal bundle server
- Risolve ERR_MODULE_NOT_FOUND per Vite in produzione

### Fix Finale Docker Build
✅ **Completamente Risolto**: 
- Creato `server/vite-dev.ts` separato per import Vite solo in sviluppo
- Modificato `server/index.ts` per import dinamico condizionale 
- Build script usa `node` e `npx` per compatibilità Docker
- Bundle ridotto a 24KB senza riferimenti Vite in produzione
- Container Docker ora si builda e avvia correttamente