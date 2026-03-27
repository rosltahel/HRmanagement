from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func

from database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    company_email = Column(String, unique=True, nullable=False, index=True)
    company_location = Column(String, nullable=False)
    start_date = Column(Date, nullable=True)
    status = Column(String, default="pending")  # pending / approved / rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)