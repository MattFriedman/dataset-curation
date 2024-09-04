# First, get the JWT token
 TOKEN=$(curl -s -X POST "http://localhost:3000/auth/token" \
      -H "Content-Type: application/json" \
      -d '{"username":"matt","password":"password"}' \
      | jq -r '.token')

 # Then use the token to export data
 curl -s -X GET "http://localhost:3000/export?format=json" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Accept: application/json"