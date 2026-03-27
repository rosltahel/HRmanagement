from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets

from database import get_db
from models.company import Company
from models.user import User
from core.security import hash_password
from schemas.company import CompanyCreate

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("/request")
def request_company_access(data: CompanyCreate, db: Session = Depends(get_db)):
    existing_company = (
        db.query(Company)
        .filter(Company.company_email == data.company_email)
        .first()
    )
    if existing_company:
        raise HTTPException(status_code=400, detail="Company email already registered")

    existing_hr = db.query(User).filter(User.email == data.hr_email).first()
    if existing_hr:
        raise HTTPException(status_code=400, detail="HR email already registered")

    company = Company(
        company_name=data.company_name,
        company_email=data.company_email,
        company_location=data.company_location,
        start_date=data.start_date,
        status="pending",
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    temporary_password = secrets.token_hex(8)

    hr_user = User(
        name=data.hr_name,
        email=data.hr_email,
        hashed_password=hash_password(temporary_password),
        system_role="HR",
        company_id=company.id,
        is_active=False,
        reset_token=None,
    )
    db.add(hr_user)
    db.commit()
    db.refresh(hr_user)

    return {
        "message": "Company request submitted successfully. Waiting for admin approval."
    }