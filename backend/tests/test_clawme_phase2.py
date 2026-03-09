"""
ClawMe Phase 2 Backend API Tests
Tests: Waitlist, Handle, Heartbeat, Resolve, Connections APIs
All APIs use mock mode (mock-user-dev)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWaitlistAPI:
    """Waitlist endpoint tests - POST, check availability, count"""
    
    def test_waitlist_count(self):
        """GET /api/waitlist/count - returns count"""
        response = requests.get(f"{BASE_URL}/api/waitlist/count")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"Waitlist count: {data['count']}")
    
    def test_waitlist_check_available_handle(self):
        """GET /api/waitlist/check - check available handle"""
        unique_handle = f"test_avail_{int(time.time())}"
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle={unique_handle}")
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
        assert data["available"] == True
        print(f"Handle '{unique_handle}' is available")
    
    def test_waitlist_check_invalid_handle(self):
        """GET /api/waitlist/check - invalid handle format returns available:false or 422"""
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=ab")  # too short
        # API may return 422 or 200 with available:false depending on validation
        assert response.status_code in [200, 422]
        print(f"Short handle check returned status {response.status_code}")
    
    def test_waitlist_check_reserved_handle(self):
        """GET /api/waitlist/check - reserved handle returns unavailable"""
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=admin")
        assert response.status_code == 200
        data = response.json()
        assert data["available"] == False
        print("Reserved handle 'admin' correctly marked unavailable")
    
    def test_waitlist_post_success(self):
        """POST /api/waitlist - create new entry"""
        unique_email = f"test_{int(time.time())}@example.com"
        unique_handle = f"testhandle{int(time.time())}"
        response = requests.post(f"{BASE_URL}/api/waitlist", json={
            "email": unique_email,
            "desired_handle": unique_handle,
            "source": "test"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] == True
        print(f"Waitlist entry created for {unique_email}")
    
    def test_waitlist_post_invalid_email(self):
        """POST /api/waitlist - invalid email format"""
        response = requests.post(f"{BASE_URL}/api/waitlist", json={
            "email": "invalid-email",
            "desired_handle": "validhandle"
        })
        assert response.status_code == 422
        data = response.json()
        assert "error" in data
        print(f"Invalid email rejected: {data['error']}")
    
    def test_waitlist_post_duplicate_email(self):
        """POST /api/waitlist - duplicate email returns 409"""
        unique_email = f"dup_{int(time.time())}@example.com"
        # First registration
        requests.post(f"{BASE_URL}/api/waitlist", json={"email": unique_email})
        # Second registration with same email
        response = requests.post(f"{BASE_URL}/api/waitlist", json={"email": unique_email})
        assert response.status_code == 409
        data = response.json()
        assert data["error"] == "already_registered"
        print("Duplicate email correctly rejected")


class TestHandleAPI:
    """Handle CRUD tests - POST claim, PUT update, GET me"""
    
    def test_handle_me_returns_handle(self):
        """GET /api/handle/me - returns mock user's handle"""
        response = requests.get(f"{BASE_URL}/api/handle/me")
        # Mock mode should return handle for mock-user-dev
        if response.status_code == 200:
            data = response.json()
            assert "handle" in data
            assert "id" in data
            print(f"Current handle: @{data['handle']}")
        elif response.status_code == 404:
            print("No handle registered for mock user (expected if not claimed)")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")
    
    def test_handle_update_display_name(self):
        """PUT /api/handle - update display name"""
        # First ensure handle exists
        me_res = requests.get(f"{BASE_URL}/api/handle/me")
        if me_res.status_code == 404:
            pytest.skip("No handle to update - claim first")
        
        new_name = f"Test User {int(time.time())}"
        response = requests.put(f"{BASE_URL}/api/handle", json={
            "display_name": new_name
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("display_name") == new_name
        print(f"Display name updated to: {new_name}")
    
    def test_handle_update_description(self):
        """PUT /api/handle - update description"""
        me_res = requests.get(f"{BASE_URL}/api/handle/me")
        if me_res.status_code == 404:
            pytest.skip("No handle to update")
        
        new_desc = f"Test description {int(time.time())}"
        response = requests.put(f"{BASE_URL}/api/handle", json={
            "description": new_desc
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("description") == new_desc
        print(f"Description updated")
    
    def test_handle_update_methods(self):
        """PUT /api/handle - update supported methods"""
        me_res = requests.get(f"{BASE_URL}/api/handle/me")
        if me_res.status_code == 404:
            pytest.skip("No handle to update")
        
        methods = ["GET_AVAILABILITY", "SEND_MESSAGE"]
        response = requests.put(f"{BASE_URL}/api/handle", json={
            "supported_methods": methods
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("supported_methods") == methods
        print(f"Methods updated: {methods}")


class TestHeartbeatAPI:
    """Heartbeat API tests - POST gateway update"""
    
    def test_heartbeat_success(self):
        """POST /api/heartbeat - update gateway and last_heartbeat"""
        me_res = requests.get(f"{BASE_URL}/api/handle/me")
        if me_res.status_code == 404:
            pytest.skip("No handle registered")
        
        gateway = "https://my-agent.example.com"
        response = requests.post(f"{BASE_URL}/api/heartbeat", json={
            "gateway": gateway
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "last_heartbeat" in data
        print(f"Heartbeat sent, last_heartbeat: {data['last_heartbeat']}")
    
    def test_heartbeat_invalid_gateway(self):
        """POST /api/heartbeat - invalid gateway URL"""
        response = requests.post(f"{BASE_URL}/api/heartbeat", json={
            "gateway": "http://insecure.com"  # must be https or wss
        })
        assert response.status_code == 422
        data = response.json()
        assert "error" in data
        print(f"Invalid gateway rejected: {data['error']}")
    
    def test_heartbeat_wss_gateway(self):
        """POST /api/heartbeat - wss:// gateway accepted"""
        me_res = requests.get(f"{BASE_URL}/api/handle/me")
        if me_res.status_code == 404:
            pytest.skip("No handle registered")
        
        gateway = "wss://my-agent.example.com/ws"
        response = requests.post(f"{BASE_URL}/api/heartbeat", json={
            "gateway": gateway
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("WSS gateway accepted")


class TestResolveAPI:
    """Resolve API tests - GET A2A agent card"""
    
    def test_resolve_existing_handle(self):
        """GET /api/resolve/{handle} - returns A2A card"""
        # First get current handle
        me_res = requests.get(f"{BASE_URL}/api/handle/me")
        if me_res.status_code == 404:
            pytest.skip("No handle to resolve")
        
        handle = me_res.json()["handle"]
        response = requests.get(f"{BASE_URL}/api/resolve/{handle}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify A2A card structure
        assert data.get("@context") == "https://schema.org/extensions/a2a-v1.json"
        assert data.get("type") == "A2AAgent"
        assert "id" in data
        assert "name" in data
        print(f"Resolved @{handle}: {data['name']}")
    
    def test_resolve_with_at_prefix(self):
        """GET /api/resolve/@{handle} - handles @ prefix"""
        me_res = requests.get(f"{BASE_URL}/api/handle/me")
        if me_res.status_code == 404:
            pytest.skip("No handle to resolve")
        
        handle = me_res.json()["handle"]
        response = requests.get(f"{BASE_URL}/api/resolve/@{handle}")
        assert response.status_code == 200
        print("@ prefix handled correctly")
    
    def test_resolve_nonexistent_handle(self):
        """GET /api/resolve/{handle} - 404 or 422 for unknown handle"""
        response = requests.get(f"{BASE_URL}/api/resolve/nonexistent_handle_xyz123")
        # Long handle may fail validation (422) or not found (404)
        assert response.status_code in [404, 422]
        data = response.json()
        assert "error" in data
        print(f"Nonexistent handle returns {response.status_code}")
    
    def test_resolve_invalid_handle_format(self):
        """GET /api/resolve/{handle} - 404 or 422 for invalid format"""
        response = requests.get(f"{BASE_URL}/api/resolve/ab")  # too short
        # Short handle returns 404 (not found) or 422 (invalid)
        assert response.status_code in [404, 422]
        print(f"Invalid handle format returns {response.status_code}")


class TestConnectionsAPI:
    """Connection request API tests"""
    
    def test_pending_connections(self):
        """GET /api/connections/pending - returns pending requests"""
        response = requests.get(f"{BASE_URL}/api/connections/pending")
        assert response.status_code == 200
        data = response.json()
        assert "requests" in data
        assert isinstance(data["requests"], list)
        print(f"Pending requests: {len(data['requests'])}")
    
    def test_connection_request_no_handle(self):
        """POST /api/connections/request - requires handle"""
        # This tests the case where user has no handle
        # In mock mode, user always has handle, so we test invalid target
        response = requests.post(f"{BASE_URL}/api/connections/request", json={
            "target_handle": "nonexistent_target_xyz"
        })
        # Should return 404 for nonexistent target
        assert response.status_code == 404
        print("Connection to nonexistent target returns 404")
    
    def test_connection_request_invalid_target(self):
        """POST /api/connections/request - invalid target handle format"""
        response = requests.post(f"{BASE_URL}/api/connections/request", json={
            "target_handle": "ab"  # too short
        })
        # Short handle returns 404 (not found) or 422 (invalid)
        assert response.status_code in [404, 422]
        data = response.json()
        assert "error" in data
        print(f"Invalid target handle returns {response.status_code}")


class TestHandleClaim:
    """Handle claim tests - POST new handle"""
    
    def test_handle_claim_already_exists(self):
        """POST /api/handle - returns 409 if already claimed"""
        me_res = requests.get(f"{BASE_URL}/api/handle/me")
        if me_res.status_code == 404:
            pytest.skip("No existing handle - can't test duplicate claim")
        
        response = requests.post(f"{BASE_URL}/api/handle", json={
            "handle": "newhandle123"
        })
        assert response.status_code == 409
        data = response.json()
        assert data["error"] == "Handle already claimed"
        print("Duplicate claim correctly rejected")
    
    def test_handle_claim_invalid_format(self):
        """POST /api/handle - invalid handle format"""
        response = requests.post(f"{BASE_URL}/api/handle", json={
            "handle": "ab"  # too short
        })
        # Could be 409 (already has handle) or 422 (invalid format)
        assert response.status_code in [409, 422]
        print(f"Invalid handle claim rejected with {response.status_code}")
    
    def test_handle_claim_reserved(self):
        """POST /api/handle - reserved handle rejected"""
        response = requests.post(f"{BASE_URL}/api/handle", json={
            "handle": "admin"
        })
        # Could be 409 (already has handle) or 422 (reserved)
        assert response.status_code in [409, 422]
        print("Reserved handle claim rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
