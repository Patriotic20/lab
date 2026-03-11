import logging

import httpx
from datetime import datetime, date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from core.config import settings
from core.utils.password_hash import hash_password, verify_password
from app.models.user.model import User
from app.models.student.model import Student
from app.models.group.model import Group
from app.models.faculty.model import Faculty
from app.models.role.model import Role
from modules.user.service import auth_service
from .schemas import HemisLoginRequest, HemisLoginResponse

logger = logging.getLogger(__name__)

class HemisLoginService:
    async def hemis_login(self, session: AsyncSession, data: HemisLoginRequest) -> HemisLoginResponse:
        # 1. Search in local database
        stmt = select(User).where(User.username == data.login).options(selectinload(User.roles))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if user and user.password:
             if verify_password(data.password, user.password):
                 access_token = auth_service.create_access_token({"user_id": user.id})
                 refresh_token = auth_service.create_refresh_token({"user_id": user.id})
                 return HemisLoginResponse(access_token=access_token, refresh_token=refresh_token)
             else:
                 logger.warning(f"Local login failed for user {data.login} (password mismatch), attempting Hemis fallback.")
        else:
             logger.info(f"User {data.login} not found locally or has no password, attempting Hemis login.")
        
        # 2. If not found or invalid password, request Hemis
        return await self.request_to_hemis(session, data)

    async def request_to_hemis(self, session: AsyncSession, data: HemisLoginRequest) -> HemisLoginResponse:
        try:
            async with httpx.AsyncClient() as client:
                # Login
                login_resp = await client.post(
                    settings.hemis.login_url, 
                    json={"login": data.login, "password": data.password},
                    headers={"Accept": "application/json"}
                )
                
                if login_resp.status_code != 200:
                    raise HTTPException(status_code=400, detail="Hemis login failed")
                
                login_data = login_resp.json()
                if not login_data.get("success"):
                     raise HTTPException(status_code=400, detail="Hemis login returned unsuccessful")
                
                token = login_data["data"]["token"]

                # Me Endpoint
                me_resp = await client.get(
                    settings.hemis.me_url,
                    headers={"Authorization": f"Bearer {token}"}
                )

                if me_resp.status_code != 200:
                    raise HTTPException(status_code=400, detail="Hemis ME endpoint failed")
                
                me_result = me_resp.json()
                if not me_result.get("success"):
                     raise HTTPException(status_code=400, detail="Hemis ME returned unsuccessful")

                me_data = me_result["data"]
        except httpx.RequestError as e:
             raise HTTPException(status_code=503, detail=f"Hemis service unavailable: {str(e)}")
        
        # Save Data
        user = await self.save_user_data(session, data.login, data.password, me_data)
        
        access_token = auth_service.create_access_token({"user_id": user.id})
        refresh_token = auth_service.create_refresh_token({"user_id": user.id})

        return HemisLoginResponse(access_token=access_token, refresh_token=refresh_token)

    def _extract_name(self, data) -> str:
        """Helper to safely extract 'name' from a dictionary or return the string if it's already a string."""
        if isinstance(data, dict):
            return data.get("name", "")
        if isinstance(data, str):
            return data
        return ""

    async def save_user_data(self, session: AsyncSession, username: str, password: str, me_data: dict) -> User:
        # Save Faculty
        faculty_name = self._extract_name(me_data.get("faculty")) or "Unknown"
        faculty = await self.get_or_create_faculty(session, faculty_name)

        # Save Group
        group_name = self._extract_name(me_data.get("group")) or "Unknown"
        
        # Ensure group is linked to the faculty
        group = await self.get_or_create_group(session, group_name, faculty.id)

        # Save User (or Update)
        stmt = select(User).where(User.username == username).options(selectinload(User.roles))
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
             await session.flush() # flush to get ID

        if not user:
            user = User(username=username, password=hashed_pw)
            if student_role:
                user.roles.append(student_role)
            session.add(user)
            logger.info(f"Created new user {username} from Hemis data")
        else:
            user.password = hashed_pw # Update password
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
            birth_date = datetime.fromtimestamp(birth_timestamp).date() if birth_timestamp else date(1970, 1, 1)
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
                faculty=faculty.name, # Save string name
                level=level_val,
                semester=semester_val,
                address=me_data.get("address", ""),
                avg_gpa=0.0
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

    async def get_or_create_faculty(self, session: AsyncSession, name: str) -> Faculty:
        stmt = select(Faculty).where(Faculty.name == name)
        result = await session.execute(stmt)
        obj = result.scalar_one_or_none()
        if not obj:
            obj = Faculty(name=name)
            session.add(obj)
            await session.flush()
            await session.refresh(obj)
        return obj

    async def get_or_create_group(self, session: AsyncSession, name: str, faculty_id: int) -> Group:
        stmt = select(Group).where(Group.name == name)
        result = await session.execute(stmt)
        obj = result.scalar_one_or_none()
        if not obj:
            obj = Group(name=name, faculty_id=faculty_id)
            session.add(obj)
            await session.flush()
            await session.refresh(obj)
        return obj

hemis_service = HemisLoginService()