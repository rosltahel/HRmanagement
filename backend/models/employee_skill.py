from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float
from database import Base


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)

    status = Column(String, nullable=False, default="learning")  # learning | completed
    progress = Column(Float, nullable=False, default=0)
    deadline = Column(String, nullable=True)
    completion_note = Column(Text, nullable=True)