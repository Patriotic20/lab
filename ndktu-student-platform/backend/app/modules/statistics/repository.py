import logging

from fastapi import HTTPException, status
from app.models.results.model import Result
from app.models.quiz.model import Quiz
from app.models.user.model import User
from app.models.kafedra.model import Kafedra
from app.models.faculty.model import Faculty
from app.models.group.model import Group
from app.models.teacher.model import Teacher
from sqlalchemy import func, select, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from .schemas import (
    GeneralStatisticsResponse,
    QuizStatisticsResponse,
    UserStatisticsResponse,
    FacultyStatisticsResponse,
    GroupStatisticsResponse,
    TeacherStatisticsResponse,
    FacultyGroupStat,
)

logger = logging.getLogger(__name__)


class StatisticsRepository:
    async def get_general_stats(
        self, session: AsyncSession
    ) -> GeneralStatisticsResponse:
        # Total students tested (unique users in results)
        students_stmt = select(func.count(distinct(Result.user_id)))
        students_res = await session.execute(students_stmt)
        total_students = students_res.scalar() or 0

        # Total quizzes taken (total count of results)
        total_stmt = select(func.count(Result.id))
        total_res = await session.execute(total_stmt)
        total_quizzes = total_res.scalar() or 0

        # System average grade
        avg_stmt = select(func.avg(Result.grade))
        avg_res = await session.execute(avg_stmt)
        avg_grade = avg_res.scalar() or 0.0

        return GeneralStatisticsResponse(
            total_students_tested=total_students,
            total_quizzes_taken=total_quizzes,
            system_average_grade=float(avg_grade)
        )

    async def get_quiz_stats(
        self, session: AsyncSession, quiz_id: int
    ) -> QuizStatisticsResponse:
        # Check if quiz exists
        q_stmt = select(Quiz).where(Quiz.id == quiz_id)
        q_res = await session.execute(q_stmt)
        quiz = q_res.scalar_one_or_none()
        
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Aggregate stats
        stats_stmt = select(
            func.count(Result.id).label("times_taken"),
            func.avg(Result.grade).label("avg_grade"),
            func.max(Result.grade).label("max_grade"),
            func.min(Result.grade).label("min_grade")
        ).where(Result.quiz_id == quiz_id)
        
        res = await session.execute(stats_stmt)
        stats = res.one()

        return QuizStatisticsResponse(
            quiz_id=quiz.id,
            title=quiz.title,
            times_taken=stats.times_taken or 0,
            average_grade=float(stats.avg_grade or 0.0),
            highest_grade=stats.max_grade or 0,
            lowest_grade=stats.min_grade or 0
        )

    async def get_user_stats(
        self, session: AsyncSession, user_id: int
    ) -> UserStatisticsResponse:
        content_stmt = select(User).where(User.id == user_id)
        user_res = await session.execute(content_stmt)
        user = user_res.scalar_one_or_none()

        if not user:
             raise HTTPException(status_code=404, detail="User not found")
             
        stats_stmt = select(
            func.count(Result.id).label("quizzes_taken"),
            func.avg(Result.grade).label("avg_grade")
        ).where(Result.user_id == user_id)
        
        res = await session.execute(stats_stmt)
        stats = res.one()

        return UserStatisticsResponse(
            user_id=user.id,
            full_name=user.username, # Basic fallback, usually construct from profile if available or join teacher/student tables
            quizzes_taken=stats.quizzes_taken or 0,
            average_grade=float(stats.avg_grade or 0.0)
        )

    async def get_faculty_stats(
        self, session: AsyncSession, faculty_id: int
    ) -> FacultyStatisticsResponse:
        stmt = select(Faculty).where(Faculty.id == faculty_id)
        faculty = (await session.execute(stmt)).scalar_one_or_none()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found")

        # Result -> Group -> Faculty
        # We need stats per group
        stats_stmt = select(
            Group.id,
            Group.name,
            func.count(Result.id).label("total_results"),
            func.avg(Result.grade).label("avg_grade")
        ).outerjoin(Result, Result.group_id == Group.id).where(Group.faculty_id == faculty_id).group_by(Group.id)
        
        group_stats_res = (await session.execute(stats_stmt)).all()
        
        groups_data = []
        total_quizzes = 0
        total_grade_sum = 0
        total_groups_with_results = 0

        for g_id, g_name, count, avg in group_stats_res:
            count = count or 0
            avg = float(avg or 0.0)
            
            groups_data.append(FacultyGroupStat(
                group_id=g_id,
                name=g_name,
                total_quizzes_taken=count,
                average_grade=avg
            ))
            
            total_quizzes += count
            if count > 0:
                total_grade_sum += avg # Sum of averages? Or weighted average?
                # Usually system average is avg of all results.
                # Let's recalculate total average from raw results or weighted.
                # Actually, simpler to just query total stats separately or aggregate here.
                # If we sum averages and divide by count of groups we get avg of avgs.
                # If we want true average of all results: 
                # (avg1 * count1 + avg2 * count2) / total_count
        
        # Calculate true faculty average
        # Re-query or calculate from groups
        weighted_sum = sum(g.average_grade * g.total_quizzes_taken for g in groups_data)
        faculty_avg = weighted_sum / total_quizzes if total_quizzes > 0 else 0.0

        return FacultyStatisticsResponse(
            faculty_id=faculty.id,
            name=faculty.name,
            total_quizzes_taken=total_quizzes,
            average_grade=faculty_avg,
            groups=groups_data
        )

    async def get_group_stats(
        self, session: AsyncSession, group_id: int
    ) -> GroupStatisticsResponse:
        stmt = select(Group).where(Group.id == group_id)
        group = (await session.execute(stmt)).scalar_one_or_none()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        stats_stmt = select(
            func.count(Result.id).label("total_results"),
            func.avg(Result.grade).label("avg_grade")
        ).where(Result.group_id == group_id)
        
        stats = (await session.execute(stats_stmt)).one()

        return GroupStatisticsResponse(
            group_id=group.id,
            name=group.name,
            total_quizzes_taken=stats.total_results or 0,
            average_grade=float(stats.avg_grade or 0.0)
        )

    async def get_teacher_stats(
        self, session: AsyncSession, teacher_id: int
    ) -> TeacherStatisticsResponse:
        stmt = select(Teacher).where(Teacher.id == teacher_id)
        teacher = (await session.execute(stmt)).scalar_one_or_none()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")

        # Result -> Quiz -> User -> Teacher
        stats_stmt = select(
            func.count(Result.id).label("total_results"),
            func.avg(Result.grade).label("avg_grade"),
            func.count(distinct(Quiz.id)).label("quizzes_created")
        ).join(Result.quiz).join(Quiz.user).join(User.teacher).where(Teacher.id == teacher_id)
        
        stats = (await session.execute(stats_stmt)).one()
        
        # We need teacher name, assume related user is loaded or accessible via refresh if needed
        # Or simplistic concatenation if columns exist
        return TeacherStatisticsResponse(
            teacher_id=teacher.id,
            full_name=f"{teacher.first_name} {teacher.last_name}",
            total_quizzes_created=stats.quizzes_created or 0,
            total_results=stats.total_results or 0,
            average_grade=float(stats.avg_grade or 0.0)
        )

get_statistics_repository = StatisticsRepository()
