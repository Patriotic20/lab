import pytest


@pytest.mark.asyncio
async def test_create_group(auth_client, test_faculty):
    payload = {
        "name": "Math-101",
        "faculty_id": test_faculty["id"]
    }
    response = await auth_client.post("/group/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["faculty_id"] == payload["faculty_id"]
    assert "id" in data


@pytest.mark.asyncio
async def test_get_group(auth_client, test_group):
    response = await auth_client.get(f"/group/{test_group['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_group["id"]
    assert data["name"] == test_group["name"]


@pytest.mark.asyncio
async def test_list_groups(auth_client, test_group):
    response = await auth_client.get("/group/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["groups"]) >= 1


@pytest.mark.asyncio
async def test_update_group(auth_client, test_group):
    payload = {
        "name": "Updated Group",
        "faculty_id": test_group["faculty_id"]
    }
    response = await auth_client.put(f"/group/{test_group['id']}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == payload["name"]


@pytest.mark.asyncio
async def test_delete_group(auth_client, test_group):
    response = await auth_client.delete(f"/group/{test_group['id']}")
    assert response.status_code == 204
    
    # Verify deletion
    response = await auth_client.get(f"/group/{test_group['id']}")
    assert response.status_code == 404
