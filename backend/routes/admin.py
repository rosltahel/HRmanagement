from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
import secrets

from database import get_db
from models.company import Company
from models.user import User
from core.email_service import send_reset_email

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/companies/pending")
def get_pending_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).filter(Company.status == "pending").all()

    result = []
    for company in companies:
        hr_user = (
            db.query(User)
            .filter(
                User.company_id == company.id,
                User.system_role == "HR",
            )
            .first()
        )

        result.append(
            {
                "id": company.id,
                "company_name": company.company_name,
                "company_email": company.company_email,
                "company_location": company.company_location,
                "start_date": company.start_date,
                "status": company.status,
                "hr_name": hr_user.name if hr_user else None,
                "hr_email": hr_user.email if hr_user else None,
                "created_at": company.created_at,
            }
        )

    return result


@router.get("/companies/all")
def get_all_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()

    result = []
    for company in companies:
        hr_user = (
            db.query(User)
            .filter(
                User.company_id == company.id,
                User.system_role == "HR",
            )
            .first()
        )

        result.append(
            {
                "id": company.id,
                "company_name": company.company_name,
                "company_email": company.company_email,
                "company_location": company.company_location,
                "start_date": company.start_date,
                "status": company.status,
                "hr_name": hr_user.name if hr_user else None,
                "hr_email": hr_user.email if hr_user else None,
                "created_at": company.created_at,
            }
        )

    return result


@router.patch("/companies/{company_id}/approve")
async def approve_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    hr_user = (
        db.query(User)
        .filter(
            User.company_id == company.id,
            User.system_role == "HR",
        )
        .first()
    )
    if not hr_user:
        raise HTTPException(status_code=404, detail="HR user not found for this company")

    company.status = "approved"
    company.approved_at = func.now()
    hr_user.is_active = True

    reset_token = secrets.token_urlsafe(32)
    hr_user.reset_token = reset_token

    db.commit()
    db.refresh(company)
    db.refresh(hr_user)

    reset_link = f"http://localhost:3000/set-password?token={reset_token}&email={hr_user.email}"
    await send_reset_email(hr_user.email, reset_link)

    return {
        "message": "Company approved successfully. HR manager has been emailed to set password.",
        "company_id": company.id,
        "company_status": company.status,
        "approved_at": company.approved_at,
    }


@router.patch("/companies/{company_id}/reject")
def reject_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    hr_user = (
        db.query(User)
        .filter(
            User.company_id == company.id,
            User.system_role == "HR",
        )
        .first()
    )
    if not hr_user:
        raise HTTPException(status_code=404, detail="HR user not found for this company")

    company.status = "rejected"
    hr_user.is_active = False
    hr_user.reset_token = None

    db.commit()
    db.refresh(company)

    return {
        "message": "Company rejected successfully.",
        "company_id": company.id,
        "company_status": company.status,
    }