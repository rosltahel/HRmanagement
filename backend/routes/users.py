from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session


from database import get_db
from models.notification import Notification
from models.employee_learning_path import EmployeeLearningPath
from core.security import get_current_user
from models.user import User
from models.role import Role
from models.department import Department
from models.employee_skill import EmployeeSkill
from models.skill import Skill
from schemas.user import EmployeeUpdate, EmployeeStatusUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can view employees")

    users = (
        db.query(User)
        .filter(
            User.system_role == "USER",
            User.company_id == current_user.company_id,
        )
        .all()
    )

    result = []
    for user in users:
        role = db.query(Role).filter(Role.id == user.role_id).first() if user.role_id else None
        department = (
            db.query(Department).filter(Department.id == user.department_id).first()
            if user.department_id
            else None
        )

        employee_skills = db.query(EmployeeSkill).filter(EmployeeSkill.user_id == user.id).all()
        completed_count = sum(1 for s in employee_skills if s.status == "completed")
        in_progress_count = sum(1 for s in employee_skills if s.status != "completed")

        result.append(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role_id": user.role_id,
                "department_id": user.department_id,
                "title": role.title if role else None,
                "department": department.name if department else None,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "completed_skills_count": completed_count,
                "in_progress_count": in_progress_count,
            }
        )

    return result


@router.get("/achievements")
def get_user_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role not in ["HR", "USER"]:
        raise HTTPException(status_code=403, detail="Not allowed to view achievements")

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User is not linked to a company")

    users = (
        db.query(User)
        .filter(
            User.system_role == "USER",
            User.company_id == current_user.company_id,
        )
        .all()
    )

    results = []

    for user in users:
        role = db.query(Role).filter(Role.id == user.role_id).first() if user.role_id else None
        department = (
            db.query(Department).filter(Department.id == user.department_id).first()
            if user.department_id
            else None
        )

        employee_skills = (
            db.query(EmployeeSkill, Skill)
            .join(Skill, EmployeeSkill.skill_id == Skill.id)
            .filter(EmployeeSkill.user_id == user.id)
            .all()
        )

        completed_skills = []
        stars = 0
        in_progress = 0

        for emp_skill, skill in employee_skills:
            if emp_skill.status == "completed":
                stars += 1
                completed_skills.append(
                    {
                        "name": skill.name,
                        "skill_source": skill.skill_source,
                        "completion_note": emp_skill.completion_note,
                    }
                )
            else:
                in_progress += 1

        results.append(
            {
                "id": user.id,
                "name": user.name,
                "title": role.title if role else None,
                "department": department.name if department else None,
                "stars": stars,
                "in_progress": in_progress,
                "completed_skills": completed_skills,
            }
        )

    return results


@router.get("/{user_id}")
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can view employee details")

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.system_role == "USER",
            User.company_id == current_user.company_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(Role).filter(Role.id == user.role_id).first() if user.role_id else None
    department = (
        db.query(Department).filter(Department.id == user.department_id).first()
        if user.department_id
        else None
    )

    employee_skills = (
        db.query(EmployeeSkill, Skill)
        .join(Skill, EmployeeSkill.skill_id == Skill.id)
        .filter(EmployeeSkill.user_id == user.id)
        .all()
    )

    skills = []
    for emp_skill, skill in employee_skills:
        skills.append(
            {
                "name": skill.name,
                "status": emp_skill.status,
                "completion_note": emp_skill.completion_note,
                "skill_source": skill.skill_source,
            }
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role_id": user.role_id,
        "department_id": user.department_id,
        "title": role.title if role else None,
        "department": department.name if department else None,
        "is_active": user.is_active,
        "skills": skills,
        "created_at": user.created_at,
    }


@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can update employees")

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.system_role == "USER",
            User.company_id == current_user.company_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.email is not None:
        existing_user = (
            db.query(User)
            .filter(User.email == data.email, User.id != user_id)
            .first()
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email

    if data.name is not None:
        user.name = data.name

    if data.department_id is not None:
        department = db.query(Department).filter(Department.id == data.department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        user.department_id = data.department_id

    if data.role_id is not None:
        role = db.query(Role).filter(Role.id == data.role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        user.role_id = data.role_id

    if data.is_active is not None:
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)

    return {"message": "Employee updated successfully"}


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: int,
    data: EmployeeStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can update employee status")

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.system_role == "USER",
            User.company_id == current_user.company_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = data.is_active
    db.commit()
    db.refresh(user)

    return {
        "message": "Employee status updated successfully",
        "is_active": user.is_active,
    }


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can delete employees")

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.system_role == "USER",
            User.company_id == current_user.company_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(Notification).filter(Notification.user_id == user.id).delete()
    db.query(EmployeeSkill).filter(EmployeeSkill.user_id == user.id).delete()
    db.query(EmployeeLearningPath).filter(EmployeeLearningPath.user_id == user.id).delete()

    db.delete(user)
    db.commit()

    return {"message": "Employee deleted successfully"}