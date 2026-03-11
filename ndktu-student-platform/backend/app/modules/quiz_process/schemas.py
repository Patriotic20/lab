from typing import Optional
from pydantic import BaseModel

class StartQuizRequest(BaseModel):
    quiz_id: int
    pin: str

class QuestionDTO(BaseModel):
    id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str

class StartQuizResponse(BaseModel):
    quiz_id: int
    title: str
    duration: int
    questions: list[QuestionDTO]

class AnswerDTO(BaseModel):
    question_id: int
    answer: str

class EndQuizRequest(BaseModel):
    quiz_id: int
    user_id: Optional[int] = None 
    answers: list[AnswerDTO]
    cheating_detected: Optional[bool] = False
    reason: Optional[str] = None

class EndQuizResponse(BaseModel):
    total_questions: int
    correct_answers: int
    wrong_answers: int
    grade: int
    cheating_detected: Optional[bool] = False
    reason: Optional[str] = None

class UploadCheatingImageRequest(BaseModel):
    quiz_id: int
    user_id: Optional[int] = None
    image_data: str  # Base64 encoded JPEG

class UploadCheatingImageResponse(BaseModel):
    success: bool
    image_url: Optional[str] = None
    message: Optional[str] = None
