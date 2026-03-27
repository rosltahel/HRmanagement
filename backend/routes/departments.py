from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.department import Department
from schemas.department import DepartmentCreate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.name).all()


@router.post("/", response_model=DepartmentResponse)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Department).filter(Department.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")

    department = Department(
        name=data.name,
        description=data.description
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    return department