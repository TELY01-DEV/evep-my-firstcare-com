#!/bin/bash

# Redis Cluster Initialization Script for EVEP Platform

echo "Starting Redis cluster initialization..."

# Wait for all Redis nodes to be ready
echo "Waiting for Redis nodes to be ready..."
sleep 10

# Get container IPs
REDIS_MASTER_1_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' evep-redis-master-1)
REDIS_MASTER_2_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' evep-redis-master-2)
REDIS_MASTER_3_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' evep-redis-master-3)
REDIS_REPLICA_1_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' evep-redis-replica-1)
REDIS_REPLICA_2_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' evep-redis-replica-2)
REDIS_REPLICA_3_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' evep-redis-replica-3)

echo "Redis Master 1 IP: $REDIS_MASTER_1_IP"
echo "Redis Master 2 IP: $REDIS_MASTER_2_IP"
echo "Redis Master 3 IP: $REDIS_MASTER_3_IP"
echo "Redis Replica 1 IP: $REDIS_REPLICA_1_IP"
echo "Redis Replica 2 IP: $REDIS_REPLICA_2_IP"
echo "Redis Replica 3 IP: $REDIS_REPLICA_3_IP"

# Create cluster using redis-cli
echo "Creating Redis cluster..."
docker exec evep-redis-master-1 redis-cli --cluster create \
    $REDIS_MASTER_1_IP:6379 \
    $REDIS_MASTER_2_IP:6379 \
    $REDIS_MASTER_3_IP:6379 \
    $REDIS_REPLICA_1_IP:6379 \
    $REDIS_REPLICA_2_IP:6379 \
    $REDIS_REPLICA_3_IP:6379 \
    --cluster-replicas 1 --cluster-yes

echo "Redis cluster created successfully!"

# Verify cluster status
echo "Verifying cluster status..."
docker exec evep-redis-master-1 redis-cli --cluster info $REDIS_MASTER_1_IP:6379

echo "Redis cluster initialization completed!"
