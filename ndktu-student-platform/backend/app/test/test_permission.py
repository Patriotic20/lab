import pytest


@pytest.mark.asyncio
async def test_create_permission(auth_client):
    response = await auth_client.post("/permission/", json={"name": "read:book"})

    assert response.status_code == 201
    assert response.json()["id"] == 1


@pytest.mark.asyncio
async def test_create_permission_duplicate(auth_client):
    payload = {"name": "read:book"}

    await auth_client.post("/permission/", json=payload)

    response = await auth_client.post("/permission/", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == f"Permission '{payload['name']}' already exists"
