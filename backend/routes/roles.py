from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.role import Role
from models.department import Department
from schemas.role import RoleCreate, RoleResponse

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=list[RoleResponse])
def get_roles(db: Session = Depends(get_db)):
    return db.query(Role).order_by(Role.title).all()


@router.post("/", response_model=RoleResponse)
def create_role(data: RoleCreate, db: Session = Depends(get_db)):
    if data.department_id is not None:
        department = db.query(Department).filter(Department.id == data.department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

    if data.parent_role_id is not None:
        parent_role = db.query(Role).filter(Role.id == data.parent_role_id).first()
        if not parent_role:
            raise HTTPException(status_code=404, detail="Parent role not found")

    role = Role(
        title=data.title,
        description=data.description,
        department_id=data.department_id,
        parent_role_id=data.parent_role_id,
    )

    db.add(role)
    db.commit()
    db.refresh(role)

    return role