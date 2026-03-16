
import pytest
import pytest_asyncio
from sqlalchemy import select
from app.models.quiz_questions.model import QuizQuestion
from app.models.question.model import Question

@pytest_asyncio.fixture
async def setup_quiz_execution(auth_client, async_db, test_subject, test_user):
    user_id = test_user["id"]
    
    # 1. Create Quiz
    quiz_payload = {
        "title": "Reproduction Quiz",
        "question_number": 5,
        "duration": 60,
        "pin": "1234",
        "user_id": user_id,
        "subject_id": test_subject.id,
        "is_active": True
    }
    resp = await auth_client.post("/quiz/", json=quiz_payload)
    quiz_id = resp.json()["id"]
    
    # 2. Add Questions (Auto-link should happen, but let's ensure we have questions)
    # If auto-link worked in previous test, great. If not, let's create questions now 
    # that match the quiz subject/user if that's required, OR just manually link if needed?
    # The auto-link logic is: matching user_id & subject_id.
    
    # Create matching question 1
    q1_payload = {
        "subject_id": test_subject.id,
        "user_id": user_id,
        "text": "Q1",
        "option_a": "A", "option_b": "B", "option_c": "C", "option_d": "D"
    }
    q1_resp = await auth_client.post("/question/", json=q1_payload)
    q1_id = q1_resp.json()["id"]

    # We need to manually link it if it wasn't auto-linked (created AFTER quiz)
    # Auto-link only happens on quiz creation.
    # So we must link manually or create questions BEFORE quiz.
    # Actually, let's create a new question and manually link it to be sure.
    qq = QuizQuestion(quiz_id=quiz_id, question_id=q1_id)
    async_db.add(qq)
    await async_db.commit()
    
    return {
        "quiz_id": quiz_id,
        "q1_id": q1_id,
        "user_id": user_id
    }

@pytest.mark.asyncio
async def test_end_quiz_error_reproduction(setup_quiz_execution, auth_client):
    data = setup_quiz_execution
    
    # End Quiz Payload
    end_payload = {
        "quiz_id": data["quiz_id"],
        "user_id": data["user_id"],
        "answers": [
            {
                "question_id": data["q1_id"], # Valid ID
                "answer": "Option A"
            }
        ]
    }
    
    # Call end_quiz
    # We use auth_client which has the user logged in.
    # The payload has user_id which might be anything. The backend should ignore it and use auth user.
    # Let's set user_id to something invalid to prove it's ignored/handled safely.
    end_payload["user_id"] = 99999 

    resp = await auth_client.post("/quiz_process/end_quiz", json=end_payload)
    
    # We expect this to SUCCEED with 200 now
    print(resp.json())
    assert resp.status_code == 200
    assert "grade" in resp.json()
