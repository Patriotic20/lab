import logging

from fastapi import HTTPException, status
from sqlalchemy import func, select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.resource.model import Resource
from app.modules.subject.models.subject_teacher import SubjectTeacher

from .schemas import (
    ResourceCreateRequest,
    ResourceUpdateRequest,
    ResourceListRequest,
    ResourceListResponse,
)

logger = logging.getLogger(__name__)


class ResourceRepository:

    async def create_resource(
        self, session: AsyncSession, data: ResourceCreateRequest
    ) -> Resource:
        # Verify subject_teacher exists
        st_stmt = select(SubjectTeacher).where(SubjectTeacher.id == data.subject_teacher_id)
        st_result = await session.execute(st_stmt)
        subject_teacher = st_result.scalar_one_or_none()
        if not subject_teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SubjectTeacher not found",
            )

        new_resource = Resource(
            subject_teacher_id=data.subject_teacher_id,
            main_text=data.main_text,
            links=[link.model_dump() for link in data.links],
        )
        session.add(new_resource)

        try:
            await session.commit()
            await session.refresh(new_resource)
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating resource: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}",
            )

        return await self.get_resource(session=session, resource_id=new_resource.id)

    async def get_resource(
        self, session: AsyncSession, resource_id: int
    ) -> Resource:
        stmt = (
            select(Resource)
            .options(selectinload(Resource.subject_teacher))
            .where(Resource.id == resource_id)
        )
        result = await session.execute(stmt)
        resource = result.scalar_one_or_none()

        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found"
            )

        return resource

    async def list_resources(
        self, session: AsyncSession, request: ResourceListRequest
    ) -> ResourceListResponse:
        stmt = select(Resource).options(selectinload(Resource.subject_teacher))

        if request.subject_teacher_id:
            stmt = stmt.where(Resource.subject_teacher_id == request.subject_teacher_id)

        stmt = stmt.order_by(desc(Resource.created_at))
        stmt = stmt.offset(request.offset).limit(request.limit)

        result = await session.execute(stmt)
        resources = result.scalars().all()

        # Count
        count_stmt = select(func.count()).select_from(Resource)
        if request.subject_teacher_id:
            count_stmt = count_stmt.where(Resource.subject_teacher_id == request.subject_teacher_id)

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return ResourceListResponse(
            total=total, page=request.page, limit=request.limit, resources=resources
        )

    async def update_resource(
        self, session: AsyncSession, resource_id: int, data: ResourceUpdateRequest
    ) -> Resource:
        stmt = (
            select(Resource)
            .options(selectinload(Resource.subject_teacher))
            .where(Resource.id == resource_id)
        )
        result = await session.execute(stmt)
        resource = result.scalar_one_or_none()

        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found"
            )

        if data.main_text is not None:
            resource.main_text = data.main_text
        if data.links is not None:
            resource.links = [link.model_dump() for link in data.links]

        try:
            await session.commit()
            await session.refresh(resource)
        except Exception as e:
            await session.rollback()
            logger.error(f"Error updating resource: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}",
            )

        return resource

    async def delete_resource(
        self, session: AsyncSession, resource_id: int
    ) -> None:
        stmt = select(Resource).where(Resource.id == resource_id)
        result = await session.execute(stmt)
        resource = result.scalar_one_or_none()

        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found"
            )

        await session.delete(resource)
        await session.commit()


get_resource_repository = ResourceRepository()
