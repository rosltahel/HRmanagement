from pydantic import BaseModel, EmailStr


class RoleCreate(BaseModel):
    title: str
    description: str | None = None
    department_id: int | None = None
    parent_role_id: int | None = None


class RoleResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    department_id: int | None = None
    parent_role_id: int | None = None

    class Config:
        from_attributes = True



class AssignEmployeeRequest(BaseModel):
    employee_id: int