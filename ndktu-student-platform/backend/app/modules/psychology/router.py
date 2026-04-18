from fastapi import APIRouter

router = APIRouter(
    prefix="/psychology",
    tags=["psychology"],
)

@router.post("/method")
async def create_method():
    return {"message": "Create a new psychology method"}

@router.get("/method/{method_id}")
async def read_method(method_id: int):
    return {"message": f"Read psychology method with id {method_id}"}

@router.get("/methods")
async def list_methods():
    return {"message": "Read all psychology methods"}

@router.put("/method/{method_id}")
async def update_method(method_id: int):
    return {"message": f"Update psychology method with id {method_id}"}


@router.delete("/method/{method_id}")
async def delete_method(method_id: int):
    return {"message": f"Delete psychology method with id {method_id}"}


