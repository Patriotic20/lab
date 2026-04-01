import logging
import random
import base64
import os
from datetime import datetime
from pathlib import Path

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
    UploadCheatingImageRequest,
    UploadCheatingImageResponse,
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

        is_admin = any(role.name.lower() == "admin" for role in user.roles)
        student_image_url = None

        if student:
            # Mandate student image for quiz (Admins take it anyway)
            if not student.image_path and not is_admin:
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Sizning suratingiz topilmadi. Profilingizga surat yuklang."
                )
            
            student_image_url = student.image_path

            if quiz.group_id is not None:
                if student.group_id != quiz.group_id:
                     raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN, 
                        detail="This quiz is not available for your group"
                    )

        # Prepare questions with shuffled options
        quiz_questions = [qq.question for qq in quiz.quiz_questions if qq.question]
        
        num_questions = quiz.question_number
        if len(quiz_questions) > num_questions:
            random.shuffle(quiz_questions)
            quiz_questions = quiz_questions[:num_questions]
        else:
            random.shuffle(quiz_questions)

        question_dtos = []
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
            questions=question_dtos,
            image_url=student_image_url
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
        
        total_questions = len(data.answers)
        
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
        result = Result(
            user_id=user.id,
            quiz_id=quiz.id,
            subject_id=quiz.subject_id,
            group_id=quiz.group_id,
            correct_answers=correct_count,
            wrong_answers=wrong_count,
            grade=grade,
            cheating_detected=data.cheating_detected or False,
            reason_for_stop=data.reason if data.cheating_detected else None,
            cheating_image_url=data.cheating_image_url
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
            grade=float(grade),
            cheating_detected=data.cheating_detected or False,
            reason=data.reason if data.cheating_detected else None
        )

    async def upload_cheating_evidence(
        self, session: AsyncSession, data: UploadCheatingImageRequest, user: User
    ) -> UploadCheatingImageResponse:
        """
        Upload and save cheating evidence image (face detection proof)
        """
        try:
            # Validate quiz exists
            stmt = select(Quiz).where(Quiz.id == data.quiz_id)
            result = await session.execute(stmt)
            quiz = result.scalar_one_or_none()

            if not quiz:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Quiz not found"
                )

            # Create directory for cheating evidence
            evidence_dir = Path("cheating_evidence")
            evidence_dir.mkdir(exist_ok=True)

            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            user_id = user.id if hasattr(user, 'id') else data.user_id
            filename = f"quiz_{data.quiz_id}_user_{user_id}_{timestamp}.jpg"
            filepath = evidence_dir / filename

            # Decode and save the base64 image
            # Remove the data URL prefix if present
            image_data = data.image_data
            if ',' in image_data:
                image_data = image_data.split(',')[1]

            # Decode base64
            image_bytes = base64.b64decode(image_data)

            # Save to file
            with open(filepath, 'wb') as f:
                f.write(image_bytes)

            logger.info(f"Cheating evidence saved: {filepath}")

            # Return response with relative path
            image_url = f"/evidence/{filename}"

            return UploadCheatingImageResponse(
                success=True,
                image_url=image_url,
                message="Cheating evidence saved successfully"
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error saving cheating evidence: {e}", exc_info=True)
            return UploadCheatingImageResponse(
                success=False,
                message=f"Failed to save evidence: {str(e)}"
            )

get_quiz_process_repository = QuizProcessRepository()
