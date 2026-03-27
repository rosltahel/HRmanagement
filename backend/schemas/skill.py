from pydantic import BaseModel


class SkillCreate(BaseModel):
    name: str
    description: str | None = None
    skill_source: str = "company"


class SkillResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    skill_source: str

    class Config:
        from_attributes = True


class EmployeeSkillCreate(BaseModel):
    skill_id: int | None = None
    name: str | None = None
    description: str | None = None
    skill_source: str = "personal"


class EmployeeSkillComplete(BaseModel):
    skill_id: int
    note: str


class EmployeeSkillResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    skill_source: str
    status: str
    progress: float
    deadline: str | None = None
    completion_note: str | None = None


class EmployeeSkillUpdate(BaseModel):
    status: str | None = None
    progress: int | None = None
    completion_note: str | None = None    