import pytest
from app.models.user_answers.model import UserAnswers
from sqlalchemy import select

@pytest.mark.asyncio
async def test_end_quiz_check_correct_answer(auth_client, test_subject, test_group, async_db):
    users_resp = await auth_client.get("/user/")
    user_id = users_resp.json()["users"][0]["id"]

    quiz_payload = {
        "title": "Check Correct Answer Quiz",
        "question_number": 1,
        "duration": 60,
        "pin": "1111",
        "user_id": user_id,
        "group_id": test_group["id"],
        "subject_id": test_subject.id,
        "is_active": True
    }
    quiz_resp = await auth_client.post("/quiz/", json=quiz_payload)
    quiz_id = quiz_resp.json()["id"]

    q_payload = {
        "subject_id": test_subject.id,
        "user_id": user_id,
        "text": "Correct Answer Check",
        "option_a": "CorrectChoice",
        "option_b": "WrongChoice1",
        "option_c": "WrongChoice2",
        "option_d": "WrongChoice3"
    }
    q_resp = await auth_client.post("/question/", json=q_payload)
    question_id = q_resp.json()["id"]

    end_payload = {
        "quiz_id": quiz_id,
        "user_id": user_id,
        "answers": [
            {"question_id": question_id, "answer": "WrongChoice1"}
        ]
    }
    
    response = await auth_client.post("/quiz_process/end_quiz", json=end_payload)
    assert response.status_code == 200

    # Verify correct_answer is correctly saved to DB
    stmt = select(UserAnswers).where(UserAnswers.quiz_id == quiz_id, UserAnswers.question_id == question_id)
    result = await async_db.execute(stmt)
    user_answer = result.scalar_one_or_none()

    assert user_answer is not None
    assert user_answer.answer == "WrongChoice1"
    assert user_answer.correct_answer == "CorrectChoice"
    assert user_answer.is_correct is False
