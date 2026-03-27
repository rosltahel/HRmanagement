from pydantic import BaseModel


class LearningPathCreate(BaseModel):
    title: str
    description: str | None = None


class LearningPathResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    created_by: str | None = None

    class Config:
        from_attributes = True


class LearningPathSkillAdd(BaseModel):
    skill_id: int
    sort_order: int


class AssignLearningPathRequest(BaseModel):
    user_id: int


class LearningPathUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class LearningPathSkillUpdate(BaseModel):
    sort_order: int | None = None