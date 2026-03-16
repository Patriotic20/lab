import logging
import random

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.quiz.model import Quiz
from app.models.question.model import Question
from app.models.results.model import Result
from app.models.quiz_questions.model import QuizQuestion
from app.models.quiz_questions.model import QuizQuestion
from app.models.user_answers.model import UserAnswers
from app.models.student.model import Student
from app.models.user.model import User

from .schemas import (
    StartQuizRequest,
    StartQuizResponse,
    EndQuizRequest,
    EndQuizResponse,
    QuestionDTO,
)

logger = logging.getLogger(__name__)


class QuizProcessRepository:
    async def start_quiz(
        self, session: AsyncSession, data: StartQuizRequest, user: User
    ) -> StartQuizResponse:
        # Fetch quiz with questions
        stmt = (
            select(Quiz)
            .options(selectinload(Quiz.quiz_questions).selectinload(QuizQuestion.question))
            .where(Quiz.id == data.quiz_id)
        )
        result = await session.execute(stmt)
        quiz = result.scalar_one_or_none()

        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found"
            )

        if not quiz.is_active:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz is not active"
            )
            
        if quiz.pin != data.pin:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Invalid PIN"
            )

        # Check if user is a student and restrict access based on group
        stmt_student = select(Student).where(Student.user_id == user.id)
        result_student = await session.execute(stmt_student)
        student = result_student.scalar_one_or_none()

        if student:
            # If user is a student, they must have a group and it must match the quiz's group if the quiz has one
            # Logic: 
            # 1. If quiz has a group_id, student must belong to that group.
            # 2. If quiz has NO group_id, looks like it's open to all? Or logic says "show only match group".
            # The prompt says: "user need show only matcvh group if user id not in student model show all quiz"
            # This implies:
            # - If Student: Access ONLY if quiz.group_id == student.group_id
            # - If Not Student: Access ALL (or at least no group restriction from this logic)
            
            # Additional clarification: "quiz have group id and user need show only matcvh group"
            
            if quiz.group_id is not None:
                if student.group_id != quiz.group_id:
                     raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN, 
                        detail="This quiz is not available for your group"
                    )
            else:
                 # Boolean: if quiz has no group, can student take it? 
                 # Usually general quizzes are for everyone.
                 # But if the requirement "show only match group" is strict, maybe they can't see general ones?
                 # Assume general quizzes (group_id=None) are open to everyone.
                 pass


        # Prepare questions with shuffled options
        question_dtos = []
        # Accessing questions via quiz_questions association
        # quiz.quiz_questions is a list of QuizQuestion objects
        # each has a .question attribute
        
        # We might want to limit the number of questions if quiz.question_number is set
        # But for now, let's take all or slice? 
        # The user didn't specify random selection logic from pool, so let's assume all linked questions or slice.
        # Let's shuffle the questions themselves too?
        
        quiz_questions = [qq.question for qq in quiz.quiz_questions if qq.question]
        
        # Determine how many questions to show
        num_questions = quiz.question_number
        if len(quiz_questions) > num_questions:
            random.shuffle(quiz_questions)
            quiz_questions = quiz_questions[:num_questions]
        else:
            random.shuffle(quiz_questions)

        for q in quiz_questions:
            q_dict = q.to_dict(randomize_options=True)
            opts = q_dict["options"]
            
            question_dtos.append(
                QuestionDTO(
                    id=q_dict["id"],
                    text=q_dict["text"],
                    option_a=opts[0],
                    option_b=opts[1],
                    option_c=opts[2],
                    option_d=opts[3],
                )
            )

        return StartQuizResponse(
            quiz_id=quiz.id,
            title=quiz.title,
            duration=quiz.duration,
            questions=question_dtos
        )

    async def end_quiz(
        self, session: AsyncSession, data: EndQuizRequest, user: User
    ) -> EndQuizResponse:
        # Fetch quiz to get subject/group info if needed, or just for verification
        stmt = select(Quiz).where(Quiz.id == data.quiz_id)
        result = await session.execute(stmt)
        quiz = result.scalar_one_or_none()
        
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found"
            )

        correct_count = 0
        wrong_count = 0
        
        # Efficiently fetch all relevant questions to check answers
        question_ids = [ans.question_id for ans in data.answers]
        if not question_ids:
             # No answers submitted?
             pass
             
        # Fetch questions
        q_stmt = select(Question).where(Question.id.in_(question_ids))
        q_result = await session.execute(q_stmt)
        questions_map = {q.id: q for q in q_result.scalars().all()}
        
        # Validate that all question IDs exist
        # If any question_id from answers is not in questions_map, it's invalid
        for ans in data.answers:
            if ans.question_id not in questions_map:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid question_id: {ans.question_id}"
                )

        for ans in data.answers:
            question = questions_map.get(ans.question_id)
            is_correct = False
            if question:
                # Option A is always correct
                if ans.answer == question.option_a:
                    correct_count += 1
                    is_correct = True
                else:
                    wrong_count += 1
            else:
                # Question not found? Count as wrong?
                wrong_count += 1
            
            # Save user answer
            user_answer = UserAnswers(
                user_id=user.id,
                quiz_id=data.quiz_id,
                question_id=ans.question_id,
                answer=ans.answer,
                correct_answer=question.option_a if question else None,
                is_correct=is_correct
            )
            session.add(user_answer)
        
        total_questions = len(data.answers) # Or strictly correct + wrong
        
        # Calculate grade (0-100)
        # Calculate percentage (0-100)
        percentage = 0
        if total_questions > 0:
            percentage = (correct_count / total_questions) * 100
        
        # Determine grade based on percentage
        if percentage >= 86:
            grade = 5
        elif percentage >= 72:
            grade = 4
        elif percentage >= 56:
            grade = 3
        else:
            grade = 2

        # Create Result
        # Assuming user_id is passed or handled via auth in router (for now relying on request data)
        
        result = Result(
            user_id=user.id, # Use authenticated user ID
            quiz_id=quiz.id,
            subject_id=quiz.subject_id,
            group_id=quiz.group_id, # This takes group from quiz, but maybe should take from user? 
                                    # Result model has group_id. Let's use quiz.group_id for now as context.
            correct_answers=correct_count,
            wrong_answers=wrong_count,
            grade=grade
        )
        session.add(result)
        
        try:
            await session.commit()
            await session.refresh(result)
        except Exception as e:
            await session.rollback()
            logger.error(f"Error saving result: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error while saving result: {e}",
            )

        return EndQuizResponse(
            total_questions=total_questions,
            correct_answers=correct_count,
            wrong_answers=wrong_count,
            grade=float(grade)
        )

get_quiz_process_repository = QuizProcessRepository()
