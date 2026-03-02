#!/bin/bash

# Link Testing Script
# This script helps test all links in the application

set -e

echo "🔗 Link Testing Script"
echo "======================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
check_server() {
    echo "Checking if dev server is running..."
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running${NC}"
        echo "Please start the server with: npm run dev"
        return 1
    fi
}

# Test a single URL
test_url() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name ($url)... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Main testing function
main() {
    if ! check_server; then
        exit 1
    fi
    
    echo ""
    echo "Testing Public Routes..."
    echo "------------------------"
    
    local passed=0
    local failed=0
    
    # Public routes
    test_url "http://localhost:3001/" "Landing Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/login" "Login Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/register" "Register Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/demo" "Demo Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/about" "About Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/contact" "Contact Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/docs" "Documentation Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/support" "Support Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/industries" "Industries Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/privacy" "Privacy Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/terms" "Terms Page" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/forgot-password" "Forgot Password Page" && ((passed++)) || ((failed++))
    
    echo ""
    echo "Testing Industry Pages..."
    echo "-------------------------"
    
    # Industry pages
    test_url "http://localhost:3001/industries/real-estate" "Real Estate Industry" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/industries/education" "Education Industry" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/industries/healthcare" "Healthcare Industry" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/industries/legal" "Legal Industry" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/industries/retail" "Retail Industry" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/industries/technology" "Technology Industry" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/industries/consulting" "Consulting Industry" && ((passed++)) || ((failed++))
    test_url "http://localhost:3001/industries/banking" "Banking Industry" && ((passed++)) || ((failed++))
    
    echo ""
    echo "Summary"
    echo "-------"
    echo -e "${GREEN}Passed: $passed${NC}"
    echo -e "${RED}Failed: $failed${NC}"
    echo "Total: $((passed + failed))"
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed${NC}"
        exit 1
    fi
}

# Run main function
main
