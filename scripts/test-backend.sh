#!/bin/bash
# BRAVOS BRASIL - Testes do backend via curl
# Uso: ./scripts/test-backend.sh [BASE_URL]
# Exemplo: ./scripts/test-backend.sh https://bravosbackend.fly.dev

BASE_URL="${1:-https://bravosbackend.fly.dev}"
PASS=0
FAIL=0

test_route() {
  local name="$1"
  local method="$2"
  local path="$3"
  local data="$4"
  local expect_status="${5:-200}"

  if [ "$method" = "GET" ]; then
    status=$(curl -s -o /tmp/bravos_resp.json -w "%{http_code}" "$BASE_URL$path")
  else
    status=$(curl -s -o /tmp/bravos_resp.json -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$path")
  fi

  if [ "$status" = "$expect_status" ] || [ "$status" = "201" ]; then
    echo "✅ $name"
    ((PASS++)) 2>/dev/null || PASS=$((PASS+1))
    return 0
  else
    echo "❌ $name (HTTP $status)"
    ((FAIL++)) 2>/dev/null || FAIL=$((FAIL+1))
    return 1
  fi
}

echo ""
echo "--- BRAVOS BRASIL - Testes do Backend ---"
echo "Base URL: $BASE_URL"
echo ""

test_route "GET /health" GET "/health"
test_route "POST /api/shipping/quote" POST "/api/shipping/quote" \
  '{"subtotal":150,"cep":"01310100","items":[{"productId":"1","quantity":2}]}'

test_route "POST /api/checkout/create-order" POST "/api/checkout/create-order" \
  '{"payer":{"name":"Teste Silva","email":"teste@example.com"},"shipping":{"cep":"01310100"},"items":[{"productId":"1","quantity":1,"unitPrice":89.9}]}'

# GET order: use externalRef do create-order se existir em /tmp/bravos_resp.json
EXT_REF=$(grep -o '"externalReference":"[^"]*"' /tmp/bravos_resp.json 2>/dev/null | head -1 | cut -d'"' -f4)
if [ -n "$EXT_REF" ]; then
  test_route "GET /api/orders/:externalReference" GET "/api/orders/$EXT_REF"
else
  test_route "GET /api/orders/:externalReference" GET "/api/orders/order_test_placeholder"
fi

test_route "POST /api/mp/create-preference" POST "/api/mp/create-preference" \
  '{"items":[{"productId":"1","quantity":1,"unitPrice":89.9,"name":"Camiseta Teste"}],"payer":{"name":"Teste Silva","email":"teste@example.com"},"amount":89.9}' "201"

echo ""
echo "--- Resultado ---"
echo "Passaram: $PASS | Falharam: $FAIL"
[ "$FAIL" -gt 0 ] && exit 1
exit 0
