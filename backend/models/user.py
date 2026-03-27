from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from sqlalchemy import DateTime
from sqlalchemy.sql import func

created_at = Column(DateTime(timezone=True), server_default=func.now())
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    system_role = Column(String, default="USER")  # ADMIN / HR / USER

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company = relationship("Company")
    is_active = Column(Boolean, default=True)
    reset_token = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    role = relationship("Role")
    department = relationship("Department")
