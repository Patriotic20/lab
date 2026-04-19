import pytest

@pytest.mark.asyncio
async def test_repeat_quiz(auth_client, test_subject, test_group):
    # Setup
    users_resp = await auth_client.get("/user/")
    user_id = users_resp.json()["users"][0]["id"]

    quiz_payload = {
        "title": "Repeat Quiz",
        "question_number": 2,
        "duration": 60,
        "pin": "REPEAT",
        "user_id": user_id,
        "group_id": test_group["id"],
        "subject_id": test_subject.id,
        "is_active": True
    }
    quiz_resp = await auth_client.post("/quiz/", json=quiz_payload)
    quiz_id = quiz_resp.json()["id"]

    # Repeat Quiz
    response = await auth_client.post(f"/quiz/{quiz_id}/repeat")
    assert response.status_code == 201
    data = response.json()
    
    assert data["title"] == "Repeat Quiz"
    assert data["attempt"] == 2
    assert data["pin"] != "REPEAT"
