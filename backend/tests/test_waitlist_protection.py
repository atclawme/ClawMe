"""
Test suite for ClawMe Waitlist Protection Features
Tests the handle reservation and protection system:
1. Waitlist check API with email parameter
2. Handle claim API with waitlist validation
3. Reserved handle protection
"""

import pytest
import requests
import os

# Use localhost since external URL may not be responding
BASE_URL = "http://localhost:3000"


class TestWaitlistCheckAPI:
    """Tests for /api/waitlist/check endpoint with email parameter"""
    
    def test_check_available_handle(self):
        """Handle not in waitlist or handles table should be available"""
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=newhandle999")
        assert response.status_code == 200
        data = response.json()
        assert data.get("available") == True
        assert "reserved_for_you" not in data or data.get("reserved_for_you") == False
    
    def test_check_claimed_handle(self):
        """Handle already claimed should return 'claimed' reason"""
        # mockdev is claimed by mock-user-dev based on test data
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=mockdev")
        assert response.status_code == 200
        data = response.json()
        assert data.get("available") == False
        assert data.get("reason") == "claimed"
    
    def test_check_waitlist_reserved_without_email(self):
        """Handle reserved on waitlist without email param should return 'waitlist_reserved'"""
        # alice is reserved by alice@example.com
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=alice")
        assert response.status_code == 200
        data = response.json()
        assert data.get("available") == False
        assert data.get("reason") == "waitlist_reserved"
    
    def test_check_waitlist_reserved_different_email(self):
        """Handle reserved by different email should return 'waitlist_reserved'"""
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=alice&email=other@example.com")
        assert response.status_code == 200
        data = response.json()
        assert data.get("available") == False
        assert data.get("reason") == "waitlist_reserved"
    
    def test_check_waitlist_reserved_same_email(self):
        """Handle reserved by same email should return 'available: true, reserved_for_you: true'"""
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=alice&email=alice@example.com")
        assert response.status_code == 200
        data = response.json()
        assert data.get("available") == True
        assert data.get("reserved_for_you") == True
    
    def test_check_invalid_handle_format(self):
        """Invalid handle format should return 422"""
        # Handle regex is 2-24 chars, so test with 1 char (too short)
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=a")  # Too short (1 char)
        assert response.status_code == 422
        
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=invalid-handle")  # Has dash
        assert response.status_code == 422
    
    def test_check_system_reserved_handle(self):
        """System reserved handles should return 'reserved' reason"""
        # Common reserved handles like 'admin', 'api', etc.
        response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=admin")
        assert response.status_code == 200
        data = response.json()
        assert data.get("available") == False
        assert data.get("reason") == "reserved"


class TestHandleClaimAPI:
    """Tests for /api/handle POST endpoint with waitlist validation"""
    
    def test_claim_available_handle(self):
        """Should be able to claim a handle not in waitlist or handles table"""
        # First check it's available
        check_response = requests.get(f"{BASE_URL}/api/waitlist/check?handle=testclaim123")
        if check_response.json().get("available") == False:
            pytest.skip("Handle testclaim123 already taken, skipping")
        
        # Try to claim (mock mode auto-authenticates as mock-user-dev)
        response = requests.post(
            f"{BASE_URL}/api/handle",
            json={"handle": "testclaim123"},
            headers={"Content-Type": "application/json"}
        )
        # Should succeed (201) or user already has handle (409)
        assert response.status_code in [201, 409]
        
        if response.status_code == 201:
            data = response.json()
            assert data.get("handle") == "testclaim123"
            assert data.get("owner_id") == "mock-user-dev"
    
    def test_claim_waitlist_reserved_by_different_email(self):
        """Should NOT be able to claim handle reserved by different email"""
        # alice is reserved by alice@example.com, mock user is dev@mock.local
        response = requests.post(
            f"{BASE_URL}/api/handle",
            json={"handle": "alice"},
            headers={"Content-Type": "application/json"}
        )
        # Should be rejected with 409
        assert response.status_code == 409
        data = response.json()
        assert data.get("error") in ["handle_reserved", "handle_taken", "Handle already claimed"]
    
    def test_claim_already_claimed_handle(self):
        """Should NOT be able to claim handle already in handles table"""
        # mockdev is already claimed
        response = requests.post(
            f"{BASE_URL}/api/handle",
            json={"handle": "mockdev"},
            headers={"Content-Type": "application/json"}
        )
        # Should be rejected with 409
        assert response.status_code == 409
        data = response.json()
        assert data.get("error") in ["handle_taken", "Handle already claimed"]
    
    def test_claim_invalid_handle_format(self):
        """Should reject invalid handle formats"""
        response = requests.post(
            f"{BASE_URL}/api/handle",
            json={"handle": "a"},  # Too short (1 char, regex requires 2-24)
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_claim_system_reserved_handle(self):
        """Should NOT be able to claim system reserved handles"""
        response = requests.post(
            f"{BASE_URL}/api/handle",
            json={"handle": "admin"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422


class TestWaitlistFormAPI:
    """Tests for /api/waitlist POST endpoint"""
    
    def test_create_waitlist_entry(self):
        """Should be able to create a waitlist entry with handle reservation"""
        import uuid
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        unique_handle = f"testhandle{uuid.uuid4().hex[:6]}"
        
        response = requests.post(
            f"{BASE_URL}/api/waitlist",
            json={"email": unique_email, "desired_handle": unique_handle},  # API uses desired_handle
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 201
        data = response.json()
        # API returns {success: true, handle: "..."}
        assert data.get("success") == True
        assert data.get("handle") == unique_handle
        
        # Verify the handle is now reserved
        check_response = requests.get(f"{BASE_URL}/api/waitlist/check?handle={unique_handle}")
        check_data = check_response.json()
        assert check_data.get("available") == False
        assert check_data.get("reason") == "waitlist_reserved"
        
        # Verify same email can see it as reserved_for_you
        check_response2 = requests.get(f"{BASE_URL}/api/waitlist/check?handle={unique_handle}&email={unique_email}")
        check_data2 = check_response2.json()
        assert check_data2.get("available") == True
        assert check_data2.get("reserved_for_you") == True
    
    def test_duplicate_email_rejected(self):
        """Should reject duplicate email on waitlist"""
        # alice@example.com is already on waitlist
        response = requests.post(
            f"{BASE_URL}/api/waitlist",
            json={"email": "alice@example.com", "handle": "newhandle"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 409
    
    def test_duplicate_handle_rejected(self):
        """Should reject duplicate handle reservation"""
        import uuid
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/waitlist",
            json={"email": unique_email, "desired_handle": "alice"},  # alice is already reserved
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 409
        data = response.json()
        assert data.get("error") == "handle_taken"


class TestHandleMeAPI:
    """Tests for /api/handle/me endpoint"""
    
    def test_get_current_user_handle(self):
        """Should return current user's handle if they have one"""
        response = requests.get(f"{BASE_URL}/api/handle/me")
        # In mock mode, mock-user-dev may or may not have a handle
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "handle" in data
            assert data.get("owner_id") == "mock-user-dev"


class TestWaitlistCount:
    """Tests for /api/waitlist/count endpoint"""
    
    def test_get_waitlist_count(self):
        """Should return waitlist count"""
        response = requests.get(f"{BASE_URL}/api/waitlist/count")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        assert data["count"] >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
