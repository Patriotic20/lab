import pytest


@pytest.mark.asyncio
async def test_create_teacher(auth_client, test_kafedra):
    # Create a user for the teacher
    user_payload = {
        "username": "teacher_create_user",
        "password": "password123",
        "roles": [{"name": "Admin"}]
    }
    user_response = await auth_client.post("/user/", json=user_payload)
    assert user_response.status_code == 201
    user_data = user_response.json()

    payload = {
        "first_name": "Alice",
        "last_name": "Johnson",
        "third_name": "Marie",
        "kafedra_id": test_kafedra["id"],
        "user_id": user_data["id"]
    }
    response = await auth_client.post("/teacher/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == payload["first_name"]
    assert data["kafedra_id"] == payload["kafedra_id"]
    assert "id" in data


@pytest.mark.asyncio
async def test_get_teacher(auth_client, test_teacher):
    response = await auth_client.get(f"/teacher/{test_teacher['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_teacher["id"]
    assert data["full_name"] is not None


@pytest.mark.asyncio
async def test_list_teachers(auth_client, test_teacher):
    response = await auth_client.get("/teacher/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["teachers"]) >= 1


@pytest.mark.asyncio
async def test_update_teacher(auth_client, test_teacher):
    payload = {
        "first_name": "Updated Alice",
        "last_name": "Updated Johnson",
        "third_name": "Marie",
        "kafedra_id": test_teacher["kafedra_id"],
        "user_id": test_teacher["user_id"]
    }
    response = await auth_client.put(f"/teacher/{test_teacher['id']}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == payload["first_name"]


@pytest.mark.asyncio
async def test_delete_teacher(auth_client, test_teacher):
    response = await auth_client.delete(f"/teacher/{test_teacher['id']}")
    assert response.status_code == 204
    
    # Verify deletion
    response = await auth_client.get(f"/teacher/{test_teacher['id']}")
    assert response.status_code == 404
