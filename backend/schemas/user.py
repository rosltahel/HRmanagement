from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    department_id: int | None = None
    role_id: int | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class SetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    password: str


class EmployeeUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    department_id: int | None = None
    role_id: int | None = None
    is_active: bool | None = None


class EmployeeStatusUpdate(BaseModel):
    is_active: bool