#!/usr/bin/env python3
"""
Gold Investment App Backend API Testing
Tests all backend endpoints with proper authentication flow
"""

import requests
import json
import time
from datetime import datetime, timezone
import sys

# Backend URL from frontend environment
BACKEND_URL = "https://golden-treasury.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session_token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def setup_test_user(self):
        """Create test user and session in MongoDB"""
        print("\n=== Setting up test user and session ===")
        
        # Generate unique identifiers
        timestamp = int(time.time())
        self.user_id = f"user_{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        # MongoDB commands to create test user and session
        mongo_commands = f'''
use('gold_vault_db');
db.users.insertOne({{
  user_id: "{self.user_id}",
  email: "test.user.{timestamp}@example.com",
  name: "Test User {timestamp}",
  picture: "https://via.placeholder.com/150",
  gold_balance: 0.0,
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: "{self.user_id}",
  session_token: "{self.session_token}",
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
db.portfolio.insertOne({{
  user_id: "{self.user_id}",
  gold_holdings: 0.0,
  total_invested: 0.0,
  current_value: 0.0,
  updated_at: new Date()
}});
print("Test user created successfully");
print("User ID: {self.user_id}");
print("Session Token: {self.session_token}");
'''
        
        import subprocess
        try:
            result = subprocess.run(
                ["mongosh", "--eval", mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ MongoDB setup failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ MongoDB setup error: {str(e)}")
            return False
    
    def test_health_check(self):
        """Test health endpoint"""
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Health Check", True, "Backend is healthy", data)
                return True
            else:
                self.log_result("Health Check", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_auth_me(self):
        """Test GET /api/auth/me with session token"""
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get("user_id") == self.user_id:
                    self.log_result("Auth Me", True, "User authenticated successfully", user_data)
                    return True
                else:
                    self.log_result("Auth Me", False, "User ID mismatch", user_data)
                    return False
            else:
                self.log_result("Auth Me", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Auth Me", False, f"Request error: {str(e)}")
            return False
    
    def test_auth_logout(self):
        """Test POST /api/auth/logout"""
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        try:
            response = requests.post(f"{BACKEND_URL}/auth/logout", headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                self.log_result("Auth Logout", True, "Logout successful", result)
                return True
            else:
                self.log_result("Auth Logout", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Auth Logout", False, f"Request error: {str(e)}")
            return False
    
    def test_gold_prices_current(self):
        """Test GET /api/gold/prices/current"""
        try:
            response = requests.get(f"{BACKEND_URL}/gold/prices/current", timeout=15)
            
            if response.status_code == 200:
                prices = response.json()
                required_fields = ["price_24k", "price_22k", "price_18k", "currency", "timestamp"]
                
                if all(field in prices for field in required_fields):
                    self.log_result("Gold Prices Current", True, "All price data available", prices)
                    return True
                else:
                    missing = [f for f in required_fields if f not in prices]
                    self.log_result("Gold Prices Current", False, f"Missing fields: {missing}", prices)
                    return False
            else:
                self.log_result("Gold Prices Current", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Gold Prices Current", False, f"Request error: {str(e)}")
            return False
    
    def test_gold_prices_historical(self):
        """Test GET /api/gold/prices/historical"""
        try:
            response = requests.get(f"{BACKEND_URL}/gold/prices/historical?days=7", timeout=10)
            
            if response.status_code == 200:
                prices = response.json()
                self.log_result("Gold Prices Historical", True, f"Retrieved {len(prices)} historical records", {"count": len(prices)})
                return True
            else:
                self.log_result("Gold Prices Historical", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Gold Prices Historical", False, f"Request error: {str(e)}")
            return False
    
    def test_portfolio(self):
        """Test GET /api/portfolio (requires auth)"""
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/portfolio", headers=headers, timeout=10)
            
            if response.status_code == 200:
                portfolio = response.json()
                required_fields = ["user_id", "gold_holdings", "total_invested", "current_value"]
                
                if all(field in portfolio for field in required_fields):
                    self.log_result("Portfolio", True, "Portfolio data retrieved", portfolio)
                    return True
                else:
                    missing = [f for f in required_fields if f not in portfolio]
                    self.log_result("Portfolio", False, f"Missing fields: {missing}", portfolio)
                    return False
            else:
                self.log_result("Portfolio", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Portfolio", False, f"Request error: {str(e)}")
            return False
    
    def test_jewelry_catalog(self):
        """Test GET /api/jewelry"""
        try:
            response = requests.get(f"{BACKEND_URL}/jewelry", timeout=10)
            
            if response.status_code == 200:
                jewelry = response.json()
                if isinstance(jewelry, list) and len(jewelry) > 0:
                    self.log_result("Jewelry Catalog", True, f"Retrieved {len(jewelry)} jewelry items", {"count": len(jewelry)})
                    return True
                else:
                    self.log_result("Jewelry Catalog", False, "No jewelry items found", jewelry)
                    return False
            else:
                self.log_result("Jewelry Catalog", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Jewelry Catalog", False, f"Request error: {str(e)}")
            return False
    
    def test_create_order(self):
        """Test POST /api/orders (requires auth)"""
        headers = {
            "Authorization": f"Bearer {self.session_token}",
            "Content-Type": "application/json"
        }
        
        order_data = {
            "items": [
                {
                    "item_id": "gold_bar_24k",
                    "item_type": "gold_bar",
                    "name": "24K Gold Bar - 10g",
                    "quantity": 10.0,
                    "price_per_unit": 65.0,
                    "total": 650.0
                }
            ],
            "total_amount": 650.0
        }
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/orders", 
                headers=headers, 
                json=order_data, 
                timeout=10
            )
            
            if response.status_code == 200:
                order = response.json()
                if "order_id" in order and order.get("user_id") == self.user_id:
                    self.log_result("Create Order", True, f"Order created: {order['order_id']}", order)
                    return order["order_id"]
                else:
                    self.log_result("Create Order", False, "Invalid order response", order)
                    return None
            else:
                self.log_result("Create Order", False, f"Status: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_result("Create Order", False, f"Request error: {str(e)}")
            return None
    
    def test_get_orders(self):
        """Test GET /api/orders (requires auth)"""
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/orders", headers=headers, timeout=10)
            
            if response.status_code == 200:
                orders = response.json()
                self.log_result("Get Orders", True, f"Retrieved {len(orders)} orders", {"count": len(orders)})
                return orders
            else:
                self.log_result("Get Orders", False, f"Status: {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_result("Get Orders", False, f"Request error: {str(e)}")
            return []
    
    def test_get_specific_order(self, order_id):
        """Test GET /api/orders/{order_id} (requires auth)"""
        if not order_id:
            self.log_result("Get Specific Order", False, "No order ID provided")
            return False
            
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/orders/{order_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                order = response.json()
                self.log_result("Get Specific Order", True, f"Order details retrieved: {order_id}", order)
                return True
            elif response.status_code == 404:
                self.log_result("Get Specific Order", False, "Order not found", response.text)
                return False
            else:
                self.log_result("Get Specific Order", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get Specific Order", False, f"Request error: {str(e)}")
            return False
    
    def test_create_voucher(self):
        """Test POST /api/vouchers (requires auth)"""
        headers = {
            "Authorization": f"Bearer {self.session_token}",
            "Content-Type": "application/json"
        }
        
        voucher_data = {
            "amount": 100.0,
            "recipient_name": "Ahmed Ali",
            "recipient_phone": "+966501234567"
        }
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/vouchers", 
                headers=headers, 
                json=voucher_data, 
                timeout=10
            )
            
            if response.status_code == 200:
                voucher = response.json()
                if "voucher_id" in voucher and voucher.get("user_id") == self.user_id:
                    self.log_result("Create Voucher", True, f"Voucher created: {voucher['voucher_id']}", voucher)
                    return True
                else:
                    self.log_result("Create Voucher", False, "Invalid voucher response", voucher)
                    return False
            else:
                self.log_result("Create Voucher", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Create Voucher", False, f"Request error: {str(e)}")
            return False
    
    def test_get_vouchers(self):
        """Test GET /api/vouchers (requires auth)"""
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/vouchers", headers=headers, timeout=10)
            
            if response.status_code == 200:
                vouchers = response.json()
                self.log_result("Get Vouchers", True, f"Retrieved {len(vouchers)} vouchers", {"count": len(vouchers)})
                return True
            else:
                self.log_result("Get Vouchers", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get Vouchers", False, f"Request error: {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test endpoints without authentication"""
        print("\n=== Testing Unauthorized Access ===")
        
        protected_endpoints = [
            "/auth/me",
            "/portfolio", 
            "/orders",
            "/vouchers"
        ]
        
        for endpoint in protected_endpoints:
            try:
                response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
                if response.status_code == 401:
                    self.log_result(f"Unauthorized {endpoint}", True, "Properly rejected unauthorized request")
                else:
                    self.log_result(f"Unauthorized {endpoint}", False, f"Expected 401, got {response.status_code}")
            except Exception as e:
                self.log_result(f"Unauthorized {endpoint}", False, f"Request error: {str(e)}")
    
    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n=== Cleaning up test data ===")
        
        mongo_commands = f'''
use('gold_vault_db');
db.users.deleteOne({{user_id: "{self.user_id}"}});
db.user_sessions.deleteOne({{user_id: "{self.user_id}"}});
db.portfolio.deleteOne({{user_id: "{self.user_id}"}});
db.orders.deleteMany({{user_id: "{self.user_id}"}});
db.vouchers.deleteMany({{user_id: "{self.user_id}"}});
print("Test data cleaned up");
'''
        
        import subprocess
        try:
            result = subprocess.run(
                ["mongosh", "--eval", mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print("✅ Test data cleaned up successfully")
            else:
                print(f"⚠️  Cleanup warning: {result.stderr}")
                
        except Exception as e:
            print(f"⚠️  Cleanup error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Gold Investment App Backend Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_user():
            print("❌ Failed to setup test user. Aborting tests.")
            return False
        
        # Health check
        if not self.test_health_check():
            print("❌ Backend health check failed. Aborting tests.")
            return False
        
        # Authentication tests
        print("\n=== Authentication Tests ===")
        auth_success = self.test_auth_me()
        
        # Public endpoints (no auth required)
        print("\n=== Public Endpoints ===")
        self.test_gold_prices_current()
        self.test_gold_prices_historical()
        self.test_jewelry_catalog()
        
        # Protected endpoints (auth required)
        if auth_success:
            print("\n=== Protected Endpoints ===")
            self.test_portfolio()
            
            # Order flow
            order_id = self.test_create_order()
            self.test_get_orders()
            if order_id:
                self.test_get_specific_order(order_id)
            
            # Voucher flow
            self.test_create_voucher()
            self.test_get_vouchers()
            
            # Logout test
            self.test_auth_logout()
        
        # Security tests
        self.test_unauthorized_access()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if "✅ PASS" in r["status"])
        failed = sum(1 for r in self.test_results if "❌ FAIL" in r["status"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if "✅ PASS" in result["status"]:
                print(f"  - {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)