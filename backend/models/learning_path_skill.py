from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class LearningPathSkill(Base):
    __tablename__ = "learning_path_skills"

    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    sort_order = Column(Integer, nullable=False, default=1)

    learning_path = relationship("LearningPath", back_populates="skills")
    skill = relationship("Skill")