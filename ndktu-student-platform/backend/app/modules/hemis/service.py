import logging
import re
import httpx
from datetime import datetime, date

from sqlalchemy import select, or_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, Request, status

from core.config import settings
from core.utils.password_hash import hash_password, verify_password
from app.models.user.model import User
from app.models.student.model import Student
from app.models.group.model import Group
from app.models.faculty.model import Faculty
from app.models.role.model import Role
from app.models.hemis_transaction.model import HemisTransaction
from modules.user.service import auth_service
from .schemas import (
    HemisLoginRequest,
    HemisLoginResponse,
    HemisTransactionResponse,
    HemisTransactionListResponse,
    HemisPreviewResponse,
)
from app.models.results.model import Result

logger = logging.getLogger(__name__)


class HemisLoginService:
    # ------------------------------------------------------------------ #
    #  LOGIN
    # ------------------------------------------------------------------ #
    async def hemis_login(
        self,
        session: AsyncSession,
        data: HemisLoginRequest,
        request: Request,
    ) -> HemisLoginResponse:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        # 1. Search in local database
        stmt = (
            select(User)
            .where(User.username == data.login)
            .options(selectinload(User.roles))
        )
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if user and user.password:
            if verify_password(data.password, user.password):
                access_token = auth_service.create_access_token({"user_id": user.id})
                refresh_token = auth_service.create_refresh_token({"user_id": user.id})

                # Log success (local)
                student_id = await self._get_student_id(session, user.id)
                await self._log_transaction(
                    session,
                    login=data.login,
                    login_type="local",
                    status="success",
                    user_id=user.id,
                    student_id=student_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                )

                return HemisLoginResponse(
                    access_token=access_token, refresh_token=refresh_token
                )
            else:
                logger.warning(
                    f"Local login failed for user {data.login} (password mismatch), "
                    "attempting Hemis fallback."
                )
        else:
            logger.info(
                f"User {data.login} not found locally or has no password, "
                "attempting Hemis login."
            )

        # 2. If not found or invalid password, request Hemis
        try:
            return await self.request_to_hemis(
                session, data, ip_address=ip_address, user_agent=user_agent
            )
        except HTTPException as exc:
            # Log failed attempt
            await self._log_transaction(
                session,
                login=data.login,
                login_type="hemis_api",
                status="failed",
                user_id=user.id if user else None,
                student_id=None,
                ip_address=ip_address,
                user_agent=user_agent,
                error_message=exc.detail,
            )
            raise

    # ------------------------------------------------------------------ #
    #  HEMIS API REQUEST
    # ------------------------------------------------------------------ #
    async def _fetch_hemis_data(self, login: str, password: str) -> dict:
        try:
            async with httpx.AsyncClient() as client:
                # Login
                login_resp = await client.post(
                    settings.hemis.login_url,
                    json={"login": login, "password": password},
                    headers={"Accept": "application/json"},
                )

                if login_resp.status_code != 200:
                    raise HTTPException(
                        status_code=400, detail="Hemis login failed"
                    )

                login_data = login_resp.json()
                if not login_data.get("success"):
                    raise HTTPException(
                        status_code=400, detail="Hemis login returned unsuccessful"
                    )

                token = login_data["data"]["token"]

                # Me Endpoint
                me_resp = await client.get(
                    settings.hemis.me_url,
                    headers={"Authorization": f"Bearer {token}"},
                )

                if me_resp.status_code != 200:
                    raise HTTPException(
                        status_code=400, detail="Hemis ME endpoint failed"
                    )

                me_result = me_resp.json()
                if not me_result.get("success"):
                    raise HTTPException(
                        status_code=400, detail="Hemis ME returned unsuccessful"
                    )

                return me_result["data"]
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Hemis service unavailable: {str(e)}",
            )

    async def request_to_hemis(
        self,
        session: AsyncSession,
        data: HemisLoginRequest,
        *,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> HemisLoginResponse:
        me_data = await self._fetch_hemis_data(data.login, data.password)

        # Save Data
        user = await self.save_user_data(session, data.login, data.password, me_data)

        access_token = auth_service.create_access_token({"user_id": user.id})
        refresh_token = auth_service.create_refresh_token({"user_id": user.id})

        # Log success (hemis_api)
        student_id = await self._get_student_id(session, user.id)
        await self._log_transaction(
            session,
            login=data.login,
            login_type="hemis_api",
            status="success",
            user_id=user.id,
            student_id=student_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return HemisLoginResponse(
            access_token=access_token, refresh_token=refresh_token
        )

    # ------------------------------------------------------------------ #
    #  ADMIN PREVIEW & SYNC
    # ------------------------------------------------------------------ #
    async def preview_hemis_data(self, session: AsyncSession, data: HemisLoginRequest) -> dict:
        me_data = await self._fetch_hemis_data(data.login, data.password)

        # 1. Check if User exists & Fetch existing results
        stmt_user = select(User).where(User.username == data.login)
        user = (await session.execute(stmt_user)).scalar_one_or_none()
        user_id = user.id if user else None

        existing_results_list = []
        if user_id:
            res_stmt = (
                select(Result)
                .options(
                    selectinload(Result.quiz),
                    selectinload(Result.subject),
                )
                .where(Result.user_id == user_id)
                .order_by(desc(Result.created_at))
                .limit(10)
            )
            res_res = await session.execute(res_stmt)
            results = res_res.scalars().all()
            for r in results:
                existing_results_list.append({
                    "id": r.id,
                    "quiz": {"title": r.quiz.title if r.quiz else "N/A"},
                    "subject": {"name": r.subject.name if r.subject else "N/A"},
                    "grade": float(r.grade),
                    "created_at": r.created_at.isoformat()
                })

        # 2. Check Faculty
        faculty_name = self._extract_name(me_data.get("faculty")) or "Unknown"
        stmt_fac = select(Faculty.id).where(Faculty.name == faculty_name)
        faculty_id = (await session.execute(stmt_fac)).scalar_one_or_none()

        # 3. Check Group
        group_info = me_data.get("group")
        group_name = self._extract_name(group_info) or "Unknown"
        
        clean_name = group_name.lower().strip()
        normalized = re.sub(r"(\d)([a-z])", r"\1 \2", clean_name)
        normalized = re.sub(r"(\d+)([a-z]{2})$", r"\1 \2", normalized)

        stmt_group = select(Group.id).where(
            or_(
                Group.name == normalized,
                Group.name == clean_name,
                Group.name.ilike(f"%{clean_name.replace(' ', '')}%"),
            )
        )
        group_id = (await session.execute(stmt_group)).scalars().first()

        return {
            "hemis_data": me_data,
            "user_id": user_id,
            "user_exists": user_id is not None,
            "faculty_id": faculty_id,
            "faculty_exists": faculty_id is not None,
            "group_id": group_id,
            "group_exists": group_id is not None,
            "existing_results": existing_results_list,
            "suggested_group": normalized if not group_id else group_name
        }

    async def sync_hemis_data(self, session: AsyncSession, data: HemisLoginRequest) -> dict:
        me_data = await self._fetch_hemis_data(data.login, data.password)
        user = await self.save_user_data(
            session=session,
            username=data.login,
            password=data.password,
            me_data=me_data,
            faculty_id=data.faculty_id,
            group_id=data.group_id
        )
        
        return {
            "success": True,
            "message": "Student data synced successfully",
            "user_id": user.id,
        }

    # ------------------------------------------------------------------ #
    #  HELPERS
    # ------------------------------------------------------------------ #
    def _extract_name(self, data) -> str:
        """Helper to safely extract 'name' from a dict or return the string."""
        if isinstance(data, dict):
            return data.get("name", "")
        if isinstance(data, str):
            return data
        return ""

    async def _get_student_id(
        self, session: AsyncSession, user_id: int
    ) -> int | None:
        stmt = select(Student.id).where(Student.user_id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def _log_transaction(
        self,
        session: AsyncSession,
        *,
        login: str,
        login_type: str,
        status: str,
        user_id: int | None = None,
        student_id: int | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        error_message: str | None = None,
    ) -> HemisTransaction:
        transaction = HemisTransaction(
            user_id=user_id,
            student_id=student_id,
            login=login,
            login_type=login_type,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else None,
            error_message=error_message,
        )
        session.add(transaction)
        await session.commit()
        return transaction

    # ------------------------------------------------------------------ #
    #  SAVE USER DATA
    # ------------------------------------------------------------------ #
    async def save_user_data(
        self,
        session: AsyncSession,
        username: str,
        password: str,
        me_data: dict,
        faculty_id: int | None = None,
        group_id: int | None = None,
    ) -> User:
        # Load or Identify Faculty
        if faculty_id:
            faculty = await session.get(Faculty, faculty_id)
            if not faculty:
                raise HTTPException(status_code=404, detail=f"Fakultet (id={faculty_id}) topilmadi")
        else:
            faculty_name = self._extract_name(me_data.get("faculty")) or "Unknown"
            faculty = await self.get_or_create_faculty(session, faculty_name)

        # Load or Identify Group
        if group_id:
            group = await session.get(Group, group_id)
            if not group:
                raise HTTPException(status_code=404, detail=f"Guruh (id={group_id}) topilmadi")
        else:
            group_name = self._extract_name(me_data.get("group")) or "Unknown"
            group = await self.get_or_create_group(session, group_name, faculty.id)

        # Save User (or Update)
        stmt = (
            select(User)
            .where(User.username == username)
            .options(selectinload(User.roles))
        )
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        hashed_pw = hash_password(password)

        student_role_stmt = select(Role).where(Role.name == "Student")
        role_res = await session.execute(student_role_stmt)
        student_role = role_res.scalar_one_or_none()

        if not student_role:
            # Create role if it doesn't exist (safety fallback)
            student_role = Role(name="Student")
            session.add(student_role)
            await session.flush()  # flush to get ID

        if not user:
            user = User(username=username, password=hashed_pw)
            if student_role:
                user.roles.append(student_role)
            session.add(user)
            logger.info(f"Created new user {username} from Hemis data")
        else:
            user.password = hashed_pw  # Update password
            logger.info(f"Updated password for user {username} from Hemis login")
            # Update role
            if student_role and student_role not in user.roles:
                user.roles.append(student_role)

        await session.flush()
        await session.refresh(user)

        # Save Student Profile
        stmt_student = select(Student).where(Student.user_id == user.id)
        current_student_res = await session.execute(stmt_student)
        student = current_student_res.scalar_one_or_none()

        birth_timestamp = me_data.get("birth_date", 0)
        # Handle timestamp conversion safely
        try:
            birth_date = (
                datetime.fromtimestamp(birth_timestamp).date()
                if birth_timestamp
                else date(1970, 1, 1)
            )
        except (OSError, OverflowError, ValueError):
            birth_date = date(1970, 1, 1)

        # Extract complex fields
        gender_val = self._extract_name(me_data.get("gender"))
        student_status_val = self._extract_name(me_data.get("studentStatus"))
        education_form_val = self._extract_name(me_data.get("educationForm"))
        education_type_val = self._extract_name(me_data.get("educationType"))
        payment_form_val = self._extract_name(me_data.get("paymentForm"))
        education_lang_val = self._extract_name(me_data.get("educationLang"))
        level_val = self._extract_name(me_data.get("level"))
        semester_val = self._extract_name(me_data.get("semester"))
        specialty_val = self._extract_name(me_data.get("specialty"))

        # Extract name parts
        full_name = me_data.get("full_name", "")
        name_parts = full_name.split()
        last_name = name_parts[0] if len(name_parts) > 0 else ""
        first_name = name_parts[1] if len(name_parts) > 1 else ""
        third_name = " ".join(name_parts[2:]) if len(name_parts) > 2 else ""

        if not student:
            student = Student(
                user_id=user.id,
                full_name=full_name,
                first_name=first_name,
                last_name=last_name,
                third_name=third_name,
                student_id_number=me_data.get("student_id_number", ""),
                image_path=me_data.get("image", ""),
                birth_date=birth_date,
                phone=me_data.get("phone", ""),
                gender=gender_val,
                university=me_data.get("university", ""),
                specialty=specialty_val,
                student_status=student_status_val,
                education_form=education_form_val,
                education_type=education_type_val,
                payment_form=payment_form_val,
                education_lang=education_lang_val,
                faculty=faculty.name,  # Save string name
                level=level_val,
                semester=semester_val,
                address=me_data.get("address", ""),
                avg_gpa=0.0,
            )
            student.group_id = group.id
            session.add(student)
        else:
            # Update existing student
            student.full_name = full_name
            student.first_name = first_name
            student.last_name = last_name
            student.third_name = third_name
            student.student_id_number = me_data.get("student_id_number", "")
            student.image_path = me_data.get("image", "")
            student.birth_date = birth_date
            student.group_id = group.id
            student.faculty = faculty.name
            student.student_status = student_status_val
            student.address = me_data.get("address", "")
            student.gender = gender_val
            student.specialty = specialty_val
            student.education_form = education_form_val
            student.education_type = education_type_val
            student.payment_form = payment_form_val
            student.education_lang = education_lang_val
            student.level = level_val
            student.semester = semester_val

        await session.commit()
        await session.refresh(user)
        return user

    # ------------------------------------------------------------------ #
    #  GET / CREATE helpers
    # ------------------------------------------------------------------ #
    async def get_or_create_faculty(
        self, session: AsyncSession, name: str
    ) -> Faculty:
        stmt = select(Faculty).where(Faculty.name == name)
        result = await session.execute(stmt)
        obj = result.scalar_one_or_none()
        if not obj:
            obj = Faculty(name=name)
            session.add(obj)
            await session.flush()
            await session.refresh(obj)
        return obj

    async def get_or_create_group(
        self, session: AsyncSession, name: str, faculty_id: int
    ) -> Group:
        # 1. Normalization (7A-23KT -> 7 a-23 kt)
        clean_name = name.lower().strip()
        # Use regex to bring to standard format
        normalized = re.sub(r"(\d)([a-z])", r"\1 \2", clean_name)
        normalized = re.sub(r"(\d+)([a-z]{2})$", r"\1 \2", normalized)

        # 2. Complex Search (ILIKE and variants)
        stmt = select(Group).where(
            or_(
                Group.name == normalized,
                Group.name == clean_name,
                Group.name.ilike(f"%{clean_name.replace(' ', '')}%"),
            )
        )

        result = await session.execute(stmt)
        obj = result.scalar_one_or_none()

        if not obj:
            # 3. If not found, create in the most correct (normalized) format
            try:
                obj = Group(name=normalized, faculty_id=faculty_id)
                session.add(obj)
                await session.flush()
                await session.refresh(obj)
            except IntegrityError:
                # If already created in a parallel request, search again
                await session.rollback()
                result = await session.execute(
                    select(Group).where(Group.name == normalized)
                )
                obj = result.scalar_one()

        return obj

    # ------------------------------------------------------------------ #
    #  TRANSACTION QUERIES
    # ------------------------------------------------------------------ #
    async def get_transactions(
        self,
        session: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        login: str | None = None,
        status_filter: str | None = None,
        login_type: str | None = None,
    ) -> HemisTransactionListResponse:
        stmt = select(HemisTransaction)

        if login:
            stmt = stmt.where(HemisTransaction.login.ilike(f"%{login}%"))
        if status_filter:
            stmt = stmt.where(HemisTransaction.status == status_filter)
        if login_type:
            stmt = stmt.where(HemisTransaction.login_type == login_type)

        # Total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await session.execute(count_stmt)).scalar() or 0

        # Paginated results
        stmt = (
            stmt.order_by(desc(HemisTransaction.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await session.execute(stmt)
        items = result.scalars().all()

        return HemisTransactionListResponse(
            items=[HemisTransactionResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_transaction_by_id(
        self, session: AsyncSession, transaction_id: int
    ) -> HemisTransactionResponse:
        stmt = select(HemisTransaction).where(
            HemisTransaction.id == transaction_id
        )
        result = await session.execute(stmt)
        transaction = result.scalar_one_or_none()

        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        return HemisTransactionResponse.model_validate(transaction)

    async def get_my_transactions(
        self,
        session: AsyncSession,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> HemisTransactionListResponse:
        stmt = select(HemisTransaction).where(
            HemisTransaction.user_id == user_id
        )

        # Total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await session.execute(count_stmt)).scalar() or 0

        # Paginated results
        stmt = (
            stmt.order_by(desc(HemisTransaction.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await session.execute(stmt)
        items = result.scalars().all()

        return HemisTransactionListResponse(
            items=[HemisTransactionResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )


hemis_service = HemisLoginService()