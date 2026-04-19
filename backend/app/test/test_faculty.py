import pytest


@pytest.mark.asyncio
async def test_create_faculty(auth_client):
    payload = {"name": "Economics Faculty"}
    response = await auth_client.post("/faculty/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"].lower()
    assert "id" in data


@pytest.mark.asyncio
async def test_get_faculty(auth_client, test_faculty):
    response = await auth_client.get(f"/faculty/{test_faculty['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_faculty["id"]
    assert data["name"] == test_faculty["name"]


@pytest.mark.asyncio
async def test_list_faculties(auth_client, test_faculty):
    response = await auth_client.get("/faculty/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["faculties"]) >= 1


@pytest.mark.asyncio
async def test_update_faculty(auth_client, test_faculty):
    payload = {"name": "Updated Faculty Name"}
    response = await auth_client.put(f"/faculty/{test_faculty['id']}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == payload["name"].lower()


@pytest.mark.asyncio
async def test_delete_faculty(auth_client, test_faculty):
    response = await auth_client.delete(f"/faculty/{test_faculty['id']}")
    assert response.status_code == 204
    
    # Verify deletion
    response = await auth_client.get(f"/faculty/{test_faculty['id']}")
    assert response.status_code == 404
