#!/bin/bash

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install jq to run this script."
    exit 1
fi

# Configuration
SERVER_URL="http://localhost:3000"
USERNAME="matt"
PASSWORD="password"
OUTPUT_FILE="export_data.json"

# Check if the server is up
echo "Checking if the server is up..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${SERVER_URL}/health")

if [ "$HEALTH_RESPONSE" != "200" ]; then
    echo "Error: Server is not responding. Please make sure the server is running."
    exit 1
fi

echo "Server is up and running. Proceeding with authentication..."

echo "Authenticating..."
RESPONSE=$(curl -s -X POST "${SERVER_URL}/auth/token" \
     -H "Content-Type: application/json" \
     -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")


if ! TOKEN=$(echo "$RESPONSE" | jq -r '.token'); then
    echo "Error: Failed to parse token from response."
    exit 1
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "Error: Failed to obtain token."
    exit 1
fi

echo "Authentication successful. Exporting data..."
RESPONSE=$(curl -s -X GET "${SERVER_URL}/export?format=json" \
     -H "Authorization: Bearer ${TOKEN}" \
     -H "Accept: application/json")

if [ $? -ne 0 ]; then
    echo "Error: Failed to connect to the server during export."
    exit 1
fi

echo "$RESPONSE" | jq . > "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
    echo "Error: Failed to parse or save the JSON response."
    exit 1
fi

echo "Export completed successfully. Data saved to $OUTPUT_FILE"
