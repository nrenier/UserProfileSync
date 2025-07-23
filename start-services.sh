#!/bin/bash

# Script to start Neo4j and n8n Docker containers for the analytics platform

echo "Starting Neo4j and n8n services..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker to run the services."
    exit 1
fi

# Start Neo4j container
echo "Starting Neo4j..."
docker run -d \
    --name analytics_neo4j \
    --restart unless-stopped \
    -p 7474:7474 -p 7687:7687 \
    -e NEO4J_AUTH=neo4j/password123 \
    -e NEO4J_PLUGINS='["apoc"]' \
    -v neo4j_data:/data \
    -v neo4j_logs:/logs \
    neo4j:5.15-community

# Start n8n container
echo "Starting n8n..."
docker run -d \
    --name analytics_n8n \
    --restart unless-stopped \
    -p 5678:5678 \
    -e N8N_HOST=localhost \
    -e N8N_PORT=5678 \
    -e N8N_PROTOCOL=http \
    -e WEBHOOK_URL=http://localhost:5678/ \
    -e GENERIC_TIMEZONE=Europe/Rome \
    -e N8N_USER_MANAGEMENT_DISABLED=true \
    -e N8N_API_KEY=your-n8n-api-key-here \
    -v n8n_data:/home/node/.n8n \
    n8nio/n8n:latest

echo "Services started. Waiting for containers to be ready..."
sleep 10

# Check service status
echo "Checking Neo4j status..."
docker logs analytics_neo4j --tail 5

echo "Checking n8n status..."
docker logs analytics_n8n --tail 5

echo ""
echo "Services should be available at:"
echo "- Neo4j Browser: http://localhost:7474"
echo "- Neo4j Bolt: bolt://localhost:7687 (username: neo4j, password: password123)"
echo "- n8n Interface: http://localhost:5678"
echo ""
echo "To stop services, run: docker stop analytics_neo4j analytics_n8n"