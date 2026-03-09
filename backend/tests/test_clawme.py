"""ClawMe backend API tests — waitlist and handle check endpoints"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthAndRoot:
    def test_root(self):
        res = requests.get(f"{BASE_URL}/api/")
        assert res.status_code == 200
        assert res.json().get("message") == "ClawMe API v1"


class TestHandleCheck:
    """GET /api/waitlist/check"""

    def test_available_handle(self):
        res = requests.get(f"{BASE_URL}/api/waitlist/check?handle=testxyz123")
        assert res.status_code == 200
        data = res.json()
        assert "available" in data
        assert isinstance(data["available"], bool)

    def test_reserved_handle_admin(self):
        res = requests.get(f"{BASE_URL}/api/waitlist/check?handle=admin")
        assert res.status_code == 200
        data = res.json()
        assert data["available"] is False

    def test_reserved_handle_api(self):
        res = requests.get(f"{BASE_URL}/api/waitlist/check?handle=api")
        assert res.status_code == 200
        assert res.json()["available"] is False

    def test_invalid_handle_format(self):
        res = requests.get(f"{BASE_URL}/api/waitlist/check?handle=A!")
        assert res.status_code == 422

    def test_short_handle_invalid(self):
        res = requests.get(f"{BASE_URL}/api/waitlist/check?handle=a")
        assert res.status_code == 422


class TestWaitlistPost:
    """POST /api/waitlist"""

    def test_successful_registration(self):
        res = requests.post(f"{BASE_URL}/api/waitlist", json={
            "email": "TEST_user_unique123@example.com",
            "desired_handle": "testunique123",
            "source": "landing_page"
        })
        assert res.status_code == 201
        data = res.json()
        assert data.get("success") is True
        assert data.get("handle") == "testunique123"

    def test_duplicate_email(self):
        email = "TEST_dup_email_abc@example.com"
        requests.post(f"{BASE_URL}/api/waitlist", json={"email": email})
        res = requests.post(f"{BASE_URL}/api/waitlist", json={"email": email})
        assert res.status_code == 409
        assert res.json().get("error") == "already_registered"

    def test_duplicate_handle(self):
        handle = "testduphandle"
        requests.post(f"{BASE_URL}/api/waitlist", json={
            "email": "TEST_first_handle@example.com",
            "desired_handle": handle
        })
        res = requests.post(f"{BASE_URL}/api/waitlist", json={
            "email": "TEST_second_handle@example.com",
            "desired_handle": handle
        })
        assert res.status_code == 409
        assert res.json().get("error") == "handle_taken"

    def test_invalid_email_format(self):
        res = requests.post(f"{BASE_URL}/api/waitlist", json={"email": "notanemail"})
        assert res.status_code == 422

    def test_reserved_handle_rejected(self):
        res = requests.post(f"{BASE_URL}/api/waitlist", json={
            "email": "TEST_reserved@example.com",
            "desired_handle": "admin"
        })
        assert res.status_code == 422

    def test_no_handle_registration(self):
        res = requests.post(f"{BASE_URL}/api/waitlist", json={
            "email": "TEST_nohandle_xyz99@example.com"
        })
        assert res.status_code == 201

    def test_handle_taken_updates_availability(self):
        handle = "checkafter123"
        requests.post(f"{BASE_URL}/api/waitlist", json={
            "email": "TEST_checkafter@example.com",
            "desired_handle": handle
        })
        res = requests.get(f"{BASE_URL}/api/waitlist/check?handle={handle}")
        assert res.status_code == 200
        assert res.json()["available"] is False
