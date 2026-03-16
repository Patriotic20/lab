import pytest


@pytest.mark.asyncio
async def test_create_user(async_client):
    payload = {"name": "user"}
    response = await async_client.post("/role/", json=payload)
    assert response.status_code == 201
    user_payload = {
        "username": "bezod",
        "password": "password123",
        "roles": [{"name": "user"}],
    }
    response = await async_client.post("/user/", json=user_payload)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_get_all_users(auth_client):
    response = await auth_client.get(
        "/user/", params={"page": 1, "limit": 10, "username": "admin"}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_user_id(auth_client):
    response = await auth_client.get("/user/1")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_user_not_foud(auth_client):
    response = await auth_client.get("/user/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


@pytest.mark.asyncio
async def test_update_user(auth_client):
    response = await auth_client.put("/user/1", json={"username": "admineer"})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_user_user_not_found(auth_client):
    response = await auth_client.put("/user/999", json={"username": "admineer"})
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


@pytest.mark.asyncio
async def test_delete_user(auth_client):
    response = await auth_client.delete("/user/1")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_user(auth_client):
    response = await auth_client.delete("/user/1999")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"
