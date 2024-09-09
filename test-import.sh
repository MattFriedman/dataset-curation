#!/bin/bash

# Test script for Dataset Curation API
# Credentials: matt:password

# Base URL of your API
BASE_URL="http://localhost:3000"

# Function to check if jq is installed
check_jq() {
   if ! command -v jq &> /dev/null; then
       echo "jq is not installed. Please install it to parse JSON responses."
       exit 1
   fi
}

# Check for jq
check_jq

# Get JWT token
echo "Getting JWT token..."
TOKEN_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/token -H "Content-Type: application/json" -d '{"username":"matt","password":"password"}')

echo "Token: $TOKEN_RESPONSE"

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')

if [ -z "$TOKEN" ]; then
   echo "Failed to get token. Response: $TOKEN_RESPONSE"
   exit 1
fi

echo "Token received successfully."

# Test protected API endpoint (get pairs)
echo "Testing GET /api/pairs endpoint..."
PAIRS_RESPONSE=$(curl -s -X GET ${BASE_URL}/api/pairs -H "Authorization: Bearer $TOKEN")
echo "Pairs response: $PAIRS_RESPONSE"

# Test export endpoint
echo "Testing GET /export endpoint..."
EXPORT_RESPONSE=$(curl -s -X GET ${BASE_URL}/export -H "Accept: application/json" -H "Authorization: Bearer $TOKEN")

echo "Export response: $EXPORT_RESPONSE"

# Test import endpoint
echo "Testing POST /import endpoint..."
IMPORT_DATA='[{"creationMethod": "manual", "instruction":"Test instruction","output":"Test output","createdAt":"2023-01-01T00:00:00.000Z","updatedAt":"2023-01-01T00:00:00.000Z","approvals":"[{\"user\":\"matt\",\"approvedAt\":\"2023-01-01T00:00:00.000Z\"}]"}]'
IMPORT_RESPONSE=$(curl -s -X POST ${BASE_URL}/import -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$IMPORT_DATA")

echo "Import response: $IMPORT_RESPONSE"


echo "Test script completed."

