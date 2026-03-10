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
    RankingScope,
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
    # Ranking  (Bayesian weighted, 2–5 grade scale)
    # ------------------------------------------------------------------
    async def get_ranking(
        self,
        session: AsyncSession,
        scope: RankingScope,
        scope_id: Optional[int] = None,
    ) -> TeacherRankingResponse:
        """
        Return teachers ranked by Bayesian-weighted student grade.

        Grade scale (stored by quiz_process):
            ≥ 86 % → 5   |   ≥ 72 % → 4   |   ≥ 56 % → 3   |   < 56 % → 2

        Bayesian weighted rating formula (same as IMDB / Letterboxd):
            weighted_rating = (C × m + SUM(grades)) / (C + student_count)

        Where:
            m = global mean grade across ALL teachers in scope
            C = confidence threshold = 5  (minimum students to fully trust a score)

        Effect:
            • A teacher with 1 student scoring 5 is pulled toward the global mean.
            • A teacher with 50 students is barely affected — their real avg dominates.
            • Result is always in the 2–5 range.

        Tiebreaker: if two teachers have the same weighted_rating,
        the one with MORE students ranks higher (more data = more reliable).
        """
        # ---- C constant --------------------------------------------------
        C = 5  # confidence threshold (minimum "virtual" sample size)

        include_group = scope == "group"

        columns = [
            Teacher.id.label("teacher_id"),
            Teacher.full_name,
            Teacher.kafedra_id,
            Kafedra.name.label("kafedra_name"),
            Kafedra.faculty_id,
            Faculty.name.label("faculty_name"),
            func.count(func.distinct(Result.user_id)).label("student_count"),
            func.coalesce(func.sum(Result.grade), 0).label("total_grade"),
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

        # ---- scope filters -----------------------------------------------
        if scope == "group":
            if scope_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="scope_id (group_id) is required for scope='group'",
                )
            stmt = stmt.where(Result.group_id == scope_id)

        elif scope == "kafedra":
            if scope_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="scope_id (kafedra_id) is required for scope='kafedra'",
                )
            stmt = stmt.where(Teacher.kafedra_id == scope_id)

        elif scope == "faculty":
            if scope_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="scope_id (faculty_id) is required for scope='faculty'",
                )
            stmt = stmt.where(Kafedra.faculty_id == scope_id)

        # "overall" → no filter

        # ---- group-by (no order_by yet — we sort in Python after Bayesian) -
        group_by_cols = [
            Teacher.id,
            Teacher.full_name,
            Teacher.kafedra_id,
            Kafedra.name,
            Kafedra.faculty_id,
            Faculty.name,
        ]
        if include_group:
            group_by_cols += [Group.id, Group.name]

        stmt = stmt.group_by(*group_by_cols)

        rows = (await session.execute(stmt)).mappings().all()

        if not rows:
            return TeacherRankingResponse(
                scope=scope,
                scope_id=scope_id,
                total=0,
                teachers=[],
            )

        # ---- Phase 1: compute per-teacher avg and global mean ------------
        # Build an intermediate list first so we can calculate global m.
        intermediate = []
        total_grades_all = 0.0
        total_students_all = 0

        for row in rows:
            student_count = int(row["student_count"])
            total_grade = float(row["total_grade"])
            avg_grade = total_grade / student_count if student_count > 0 else 0.0
            intermediate.append({
                "row": row,
                "student_count": student_count,
                "total_grade": total_grade,
                "avg_grade": avg_grade,
            })
            total_grades_all += total_grade
            total_students_all += student_count

        # Global mean m = (sum of all grades) / (total students across all teachers)
        m: float = (
            total_grades_all / total_students_all
            if total_students_all > 0
            else 3.0  # fallback neutral midpoint of 2–5 scale
        )

        # ---- Phase 2: compute Bayesian weighted_rating & sort ------------
        for entry in intermediate:
            v = entry["student_count"]
            # weighted_rating = (C×m + total_grade) / (C + v)
            entry["weighted_rating"] = (C * m + entry["total_grade"]) / (C + v)

        # Sort: weighted_rating DESC, then student_count DESC (tiebreaker)
        intermediate.sort(
            key=lambda e: (e["weighted_rating"], e["student_count"]),
            reverse=True,
        )

        # ---- Phase 3: build response objects ----------------------------
        ranked: list[TeacherRankItem] = []
        for rank, entry in enumerate(intermediate, start=1):
            row = entry["row"]
            ranked.append(
                TeacherRankItem(
                    rank=rank,
                    teacher_id=row["teacher_id"],
                    full_name=row["full_name"],
                    kafedra_id=row["kafedra_id"],
                    kafedra_name=row["kafedra_name"],
                    faculty_id=row["faculty_id"],
                    faculty_name=row["faculty_name"],
                    group_id=row.get("group_id"),
                    group_name=row.get("group_name"),
                    student_count=entry["student_count"],
                    total_grade=entry["total_grade"],
                    avg_grade=round(entry["avg_grade"], 2),
                    weighted_rating=round(entry["weighted_rating"], 2),
                )
            )

        return TeacherRankingResponse(
            scope=scope,
            scope_id=scope_id,
            total=len(ranked),
            teachers=ranked,
        )


get_teacher_repository = TeacherRepository()
