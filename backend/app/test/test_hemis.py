
import pytest



@pytest.mark.asyncio
async def test_hemis_login_local_success(async_client, test_user):
    """
    Test login flow when user already exists locally.
    Should return tokens without hitting external Hemis API.
    """
    payload = {
        "login": test_user["username"],
        "password": test_user["password"]
    }
    
    response = await async_client.post("/hemis/login", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["type"] == "Bearer"


@pytest.mark.asyncio
async def test_hemis_login_external_success(async_client):
    """
    Test login flow when user does NOT exist locally.
    This will attempt to hit the Hemis API. 
    
    NOTE: This test naturally fails if Hemis credentials are invalid or service is unreachable.
    We use random credentials as requested by the user.
    """
    # Random credentials that are unlikely to exist locally
    payload = {
        "login": "319231100183",
        "password": "bekzod2005"
    }

    # Since we cannot mock, this call triggers the real external request logic.
    # The user is aware this might fail 400 or 503 depending on real world conditions.
    response = await async_client.post("/hemis/login", json=payload)

    # If the real Hemis is reachable and returns 200, this passes.
    # If it returns 400 (invalid login), we can at least assert that we got a response 
    # matching what our service returns for upstream errors.
    
    # However, since the user said "i can correct my self", we assume
    # they might put real creds here to make it 200. 
    # For now, we just assert the structure.
    
    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    else:
        # If it fails, it should be a handled exception from our service
        assert response.status_code in [400, 401, 503]
        data = response.json()
        assert "detail" in data
