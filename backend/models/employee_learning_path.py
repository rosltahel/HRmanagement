from sqlalchemy import Column, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base


class EmployeeLearningPath(Base):
    __tablename__ = "employee_learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False)
    is_active = Column(Boolean, default=True)

    learning_path = relationship("LearningPath", back_populates="assignments")
    user = relationship("User")