from datetime import date
from pydantic import BaseModel, EmailStr


class CompanyCreate(BaseModel):
    company_name: str
    company_email: EmailStr
    company_location: str
    start_date: date | None = None
    hr_name: str
    hr_email: EmailStr


class CompanyResponse(BaseModel):
    id: int
    company_name: str
    company_email: EmailStr
    company_location: str
    start_date: date | None = None
    status: str

    class Config:
        from_attributes = True


class CompanyStatusUpdate(BaseModel):
    status: str  # approved / rejected