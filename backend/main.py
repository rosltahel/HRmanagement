from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import companies
from routes import notifications
from database import engine, Base
from models.user import User
from models.department import Department
from models.role import Role

from routes.auth import router as auth_router
from routes.departments import router as department_router
from routes.roles import router as role_router


from models.skill import Skill
from models.employee_skill import EmployeeSkill
from routes.skills import router as skills_router
from routes.users import router as users_router
from routes.hierarchy import router as hierarchy_router
from routes import learning_paths
from routes.admin import router as admin_router
from routes.ai import router as ai_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}

app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(department_router)
app.include_router(notifications.router)
app.include_router(role_router)
app.include_router(skills_router)
app.include_router(users_router)
app.include_router(hierarchy_router)
app.include_router(learning_paths.router)
app.include_router(companies.router)
app.include_router(ai_router)