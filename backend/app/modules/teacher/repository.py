import logging
from typing import Literal, Optional

from fastapi import HTTPException, status
from app.models.teacher.model import Teacher
from app.models.user.model import User
from app.models.group.model import Group
from app.models.subject.model import Subject
from app.models.group_teachers.model import GroupTeacher
from app.models.subject_teacher.model import SubjectTeacher
from app.models.kafedra.model import Kafedra
from app.models.faculty.model import Faculty
from app.models.results.model import Result
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import (
    TeacherCreateRequest,
    TeacherListRequest,
    TeacherListResponse,
    TeacherGroupAssignRequest,
    TeacherSubjectAssignRequest,
    TeacherRankItem,
    TeacherRankingResponse,
    TeacherRankingScope,
    FacultyRankItem,
    FacultyRankingResponse,
    KafedraRankItem,
    KafedraRankingResponse,
)

logger = logging.getLogger(__name__)


class TeacherRepository:
    def _generate_full_name(self, first_name: str, last_name: str, third_name: str) -> str:
        return f"{last_name} {first_name} {third_name}"

    async def create_teacher(
        self, session: AsyncSession, data: TeacherCreateRequest
    ) -> Teacher:
        full_name = self._generate_full_name(data.first_name, data.last_name, data.third_name)
        
        stmt_check = select(Teacher).where(Teacher.full_name == full_name)
        result_check = await session.execute(stmt_check)
        if result_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Teacher '{full_name}' already exists",
            )

        new_teacher = Teacher(
            first_name=data.first_name,
            last_name=data.last_name,
            third_name=data.third_name,
            full_name=full_name,
            kafedra_id=data.kafedra_id,
            user_id=data.user_id
        )
        session.add(new_teacher)

        try:
            await session.commit()
            await session.refresh(new_teacher)
            # Eager load relationships for response
            stmt = select(Teacher).options(
                selectinload(Teacher.kafedra),
                selectinload(Teacher.user).selectinload(User.group_teachers).selectinload(GroupTeacher.group),
                selectinload(Teacher.subject_teachers).selectinload(SubjectTeacher.subject),
            ).where(Teacher.id == new_teacher.id)
            result = await session.execute(stmt)
            new_teacher = result.scalar_one()
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error",
            )
        return new_teacher

    async def get_teacher(
        self, session: AsyncSession, teacher_id: int
    ) -> Teacher:
        stmt = select(Teacher).options(
            selectinload(Teacher.kafedra),
            selectinload(Teacher.user).selectinload(User.group_teachers).selectinload(GroupTeacher.group),
            selectinload(Teacher.subject_teachers).selectinload(SubjectTeacher.subject),
        ).where(Teacher.id == teacher_id)
        result = await session.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )

        return teacher

    async def list_teachers(
        self, session: AsyncSession, request: TeacherListRequest
    ) -> TeacherListResponse:
        stmt = select(Teacher).options(
            selectinload(Teacher.kafedra),
            selectinload(Teacher.user).selectinload(User.group_teachers).selectinload(GroupTeacher.group),
            selectinload(Teacher.subject_teachers).selectinload(SubjectTeacher.subject),
        ).offset(request.offset).limit(request.limit)

        if request.full_name:
            stmt = stmt.where(Teacher.full_name.ilike(f"%{request.full_name}%"))
        
        if request.kafedra_id:
            stmt = stmt.where(Teacher.kafedra_id == request.kafedra_id)

        result = await session.execute(stmt)
        teachers = result.scalars().all()

        count_stmt = select(func.count()).select_from(Teacher)
        if request.full_name:
            count_stmt = count_stmt.where(Teacher.full_name.ilike(f"%{request.full_name}%"))
        if request.kafedra_id:
            count_stmt = count_stmt.where(Teacher.kafedra_id == request.kafedra_id)

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return TeacherListResponse(
            total=total, page=request.page, limit=request.limit, teachers=teachers
        )

    async def update_teacher(
        self, session: AsyncSession, teacher_id: int, data: TeacherCreateRequest
    ) -> Teacher:
        stmt = select(Teacher).options(
            selectinload(Teacher.kafedra),
            selectinload(Teacher.user).selectinload(User.group_teachers).selectinload(GroupTeacher.group),
            selectinload(Teacher.subject_teachers).selectinload(SubjectTeacher.subject),
        ).where(Teacher.id == teacher_id)
        result = await session.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )

        full_name = self._generate_full_name(data.first_name, data.last_name, data.third_name)

        if full_name != teacher.full_name:
            # Check unique name excluding current
            stmt_check = select(Teacher).where(
                Teacher.full_name == full_name, Teacher.id != teacher_id
            )
            existing = (await session.execute(stmt_check)).scalar_one_or_none()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher name already taken",
                )
        
        teacher.first_name = data.first_name
        teacher.last_name = data.last_name
        teacher.third_name = data.third_name
        teacher.full_name = full_name
        
        if data.kafedra_id is not None:
             teacher.kafedra_id = data.kafedra_id

        await session.commit()
        await session.refresh(teacher)
        return teacher

    async def delete_teacher(
        self, session: AsyncSession, teacher_id: int
    ) -> None:
        stmt = select(Teacher).where(Teacher.id == teacher_id)
        result = await session.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )

        await session.delete(teacher)
        await session.commit()


    async def assign_groups(
        self, session: AsyncSession, data: TeacherGroupAssignRequest
    ) -> None:
        # 1. Fetch User (since GroupTeacher uses teacher_id pointing to User.id)
        stmt = select(User).where(User.id == data.user_id).options(selectinload(User.group_teachers))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # 2. Delete existing
        for gt in user.group_teachers:
            await session.delete(gt)
            
        await session.flush()
        
        # 3. Fetch specific groups to validate
        if data.group_ids:
            stmt_groups = select(Group).where(Group.id.in_(data.group_ids))
            result_groups = await session.execute(stmt_groups)
            groups = result_groups.scalars().all()
            
            if len(groups) != len(data.group_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more group_ids are invalid"
                )
            
            # 4. Create new GroupTeacher entries
            for group_id in data.group_ids:
                new_gt = GroupTeacher(group_id=group_id, teacher_id=data.user_id)
                session.add(new_gt)
        
        try:
            await session.commit()
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error while assigning groups"
            )

    async def assign_subjects(
        self, session: AsyncSession, data: TeacherSubjectAssignRequest
    ) -> None:
        # 1. Fetch Teacher (since SubjectTeacher uses teacher_id pointing to Teacher.id)
        stmt = select(Teacher).where(Teacher.id == data.teacher_id).options(selectinload(Teacher.subject_teachers))
        result = await session.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )

        # 2. Delete existing
        for st in teacher.subject_teachers:
            await session.delete(st)

        await session.flush()

        # 3. Fetch subjects to validate
        if data.subject_ids:
            stmt_subjects = select(Subject).where(Subject.id.in_(data.subject_ids))
            result_subjects = await session.execute(stmt_subjects)
            subjects = result_subjects.scalars().all()
            
            if len(subjects) != len(data.subject_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more subject_ids are invalid"
                )
            
            # 4. Create new entries
            for subject_id in data.subject_ids:
                new_st = SubjectTeacher(subject_id=subject_id, teacher_id=data.teacher_id)
                session.add(new_st)
        
        try:
            await session.commit()
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error while assigning subjects"
            )

    async def get_assigned_subjects_by_user(
        self, session: AsyncSession, user_id: int
    ) -> Teacher:
        stmt = select(Teacher).options(
            selectinload(Teacher.subject_teachers).selectinload(SubjectTeacher.subject)
        ).where(Teacher.user_id == user_id)
        
        result = await session.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found for this user"
            )

        return teacher

    async def get_assigned_groups_by_user(
        self, session: AsyncSession, user_id: int
    ) -> Teacher:
        stmt = select(Teacher).options(
            selectinload(Teacher.user).selectinload(User.group_teachers).selectinload(GroupTeacher.group)
        ).where(Teacher.user_id == user_id)

        result = await session.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found for this user"
            )

        return teacher

    # ------------------------------------------------------------------
    # Bayesian helper
    # ------------------------------------------------------------------
    @staticmethod
    def _bayesian(entries: list[dict], C: float = 5.0) -> list[dict]:
        """
        Apply Bayesian weighted rating to a list of dicts that have
        'avg_grade' and 'student_count' keys.  Adds 'weighted_rating'.

        Formula: weighted_rating = (C×m + avg_grade×v) / (C + v)
          m = global mean avg_grade across all entries
          v = student_count for this entry
          C = confidence threshold (default 5)
        """
        if not entries:
            return entries
        total_v = sum(e["student_count"] for e in entries)
        if total_v == 0:
            for e in entries:
                e["weighted_rating"] = 0.0
            return entries
        # Global mean = weighted avg of avg_grades
        m = sum(e["avg_grade"] * e["student_count"] for e in entries) / total_v
        for e in entries:
            v = e["student_count"]
            e["weighted_rating"] = round((C * m + e["avg_grade"] * v) / (C + v), 2)
        return entries

    # ------------------------------------------------------------------
    # Teacher ranking  (scope: overall or group)
    # ------------------------------------------------------------------
    async def get_ranking(
        self,
        session: AsyncSession,
        scope: TeacherRankingScope,
        scope_id: int | None = None,
    ) -> TeacherRankingResponse:
        """
        Return teachers ranked by Bayesian-weighted average student grade.

        Grade stored by quiz_process: 2 (fail) / 3 / 4 / 5 (excellent)

        BUG fix: use AVG(result.grade) not SUM/COUNT(distinct user) which
        inflated scores when students took many quizzes.

        Scopes:
            overall  – all teachers in the university
            group    – teachers assigned to a specific group
        """
        include_group = scope == "group"

        columns = [
            Teacher.id.label("teacher_id"),
            Teacher.full_name,
            Teacher.kafedra_id,
            Kafedra.name.label("kafedra_name"),
            Kafedra.faculty_id,
            Faculty.name.label("faculty_name"),
            func.count(func.distinct(Result.user_id)).label("student_count"),
            func.coalesce(func.avg(Result.grade), 0).label("avg_grade"),
        ]
        if include_group:
            columns += [
                Group.id.label("group_id"),
                Group.name.label("group_name"),
            ]

        stmt = (
            select(*columns)
            .join(Kafedra, Teacher.kafedra_id == Kafedra.id)
            .join(Faculty, Kafedra.faculty_id == Faculty.id)
            .join(GroupTeacher, Teacher.user_id == GroupTeacher.teacher_id)
            .join(Result, GroupTeacher.group_id == Result.group_id)
        )
        if include_group:
            stmt = stmt.join(Group, GroupTeacher.group_id == Group.id)

        if scope == "group":
            if scope_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="scope_id (group_id) is required for scope='group'",
                )
            stmt = stmt.where(Result.group_id == scope_id)

        group_by_cols = [
            Teacher.id, Teacher.full_name, Teacher.kafedra_id,
            Kafedra.name, Kafedra.faculty_id, Faculty.name,
        ]
        if include_group:
            group_by_cols += [Group.id, Group.name]
        stmt = stmt.group_by(*group_by_cols)

        rows = (await session.execute(stmt)).mappings().all()
        if not rows:
            return TeacherRankingResponse(scope=scope, scope_id=scope_id, total=0, teachers=[])

        entries = [
            {
                "row": row,
                "student_count": int(row["student_count"]),
                "avg_grade": float(row["avg_grade"]),
            }
            for row in rows
        ]
        entries = self._bayesian(entries)
        entries.sort(key=lambda e: (e["weighted_rating"], e["student_count"]), reverse=True)

        teachers = [
            TeacherRankItem(
                rank=rank,
                teacher_id=e["row"]["teacher_id"],
                full_name=e["row"]["full_name"],
                kafedra_id=e["row"]["kafedra_id"],
                kafedra_name=e["row"]["kafedra_name"],
                faculty_id=e["row"]["faculty_id"],
                faculty_name=e["row"]["faculty_name"],
                group_id=e["row"].get("group_id"),
                group_name=e["row"].get("group_name"),
                student_count=e["student_count"],
                avg_grade=round(e["avg_grade"], 2),
                weighted_rating=e["weighted_rating"],
            )
            for rank, e in enumerate(entries, start=1)
        ]
        return TeacherRankingResponse(scope=scope, scope_id=scope_id, total=len(teachers), teachers=teachers)

    # ------------------------------------------------------------------
    # Faculty ranking
    # ------------------------------------------------------------------
    async def get_faculty_ranking(self, session: AsyncSession) -> FacultyRankingResponse:
        """
        Rank faculties by the average grade of all their students.
        Uses Bayesian weighting so smaller faculties are pulled toward the mean.
        """
        stmt = (
            select(
                Faculty.id.label("faculty_id"),
                Faculty.name.label("faculty_name"),
                func.count(func.distinct(Kafedra.id)).label("kafedra_count"),
                func.count(func.distinct(Result.user_id)).label("student_count"),
                func.coalesce(func.avg(Result.grade), 0).label("avg_grade"),
            )
            # Correct order: Faculty → Kafedra → Teacher → GroupTeacher → Result
            # Teacher must appear before GroupTeacher (which references teacher.user_id)
            .join(Kafedra, Kafedra.faculty_id == Faculty.id)
            .join(Teacher, Teacher.kafedra_id == Kafedra.id)
            .join(GroupTeacher, GroupTeacher.teacher_id == Teacher.user_id)
            .join(Result, Result.group_id == GroupTeacher.group_id)
            .group_by(Faculty.id, Faculty.name)
        )
        rows = (await session.execute(stmt)).mappings().all()
        if not rows:
            return FacultyRankingResponse(total=0, faculties=[])

        entries = [
            {
                "row": row,
                "student_count": int(row["student_count"]),
                "avg_grade": float(row["avg_grade"]),
            }
            for row in rows
        ]
        entries = self._bayesian(entries)
        entries.sort(key=lambda e: (e["weighted_rating"], e["student_count"]), reverse=True)

        faculties = [
            FacultyRankItem(
                rank=rank,
                faculty_id=e["row"]["faculty_id"],
                faculty_name=e["row"]["faculty_name"],
                kafedra_count=int(e["row"]["kafedra_count"]),
                student_count=e["student_count"],
                avg_grade=round(e["avg_grade"], 2),
                weighted_rating=e["weighted_rating"],
            )
            for rank, e in enumerate(entries, start=1)
        ]
        return FacultyRankingResponse(total=len(faculties), faculties=faculties)

    # ------------------------------------------------------------------
    # Kafedra ranking
    # ------------------------------------------------------------------
    async def get_kafedra_ranking(self, session: AsyncSession) -> KafedraRankingResponse:
        """
        Rank kafedras (chairs) by the average grade of all their students.
        Uses Bayesian weighting so smaller kafedras are pulled toward the mean.
        """
        stmt = (
            select(
                Kafedra.id.label("kafedra_id"),
                Kafedra.name.label("kafedra_name"),
                Kafedra.faculty_id,
                Faculty.name.label("faculty_name"),
                func.count(func.distinct(Teacher.id)).label("teacher_count"),
                func.count(func.distinct(Result.user_id)).label("student_count"),
                func.coalesce(func.avg(Result.grade), 0).label("avg_grade"),
            )
            .join(Faculty, Faculty.id == Kafedra.faculty_id)
            .join(Teacher, Teacher.kafedra_id == Kafedra.id)
            .join(GroupTeacher, GroupTeacher.teacher_id == Teacher.user_id)
            .join(Result, Result.group_id == GroupTeacher.group_id)
            .group_by(Kafedra.id, Kafedra.name, Kafedra.faculty_id, Faculty.name)
        )
        rows = (await session.execute(stmt)).mappings().all()
        if not rows:
            return KafedraRankingResponse(total=0, kafedras=[])

        entries = [
            {
                "row": row,
                "student_count": int(row["student_count"]),
                "avg_grade": float(row["avg_grade"]),
            }
            for row in rows
        ]
        entries = self._bayesian(entries)
        entries.sort(key=lambda e: (e["weighted_rating"], e["student_count"]), reverse=True)

        kafedras = [
            KafedraRankItem(
                rank=rank,
                kafedra_id=e["row"]["kafedra_id"],
                kafedra_name=e["row"]["kafedra_name"],
                faculty_id=e["row"]["faculty_id"],
                faculty_name=e["row"]["faculty_name"],
                teacher_count=int(e["row"]["teacher_count"]),
                student_count=e["student_count"],
                avg_grade=round(e["avg_grade"], 2),
                weighted_rating=e["weighted_rating"],
            )
            for rank, e in enumerate(entries, start=1)
        ]
        return KafedraRankingResponse(total=len(kafedras), kafedras=kafedras)


get_teacher_repository = TeacherRepository()
