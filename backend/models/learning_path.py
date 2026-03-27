from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(String, nullable=True)

    skills = relationship(
        "LearningPathSkill",
        back_populates="learning_path",
        cascade="all, delete-orphan",
    )
    assignments = relationship(
        "EmployeeLearningPath",
        back_populates="learning_path",
        cascade="all, delete-orphan",
    )