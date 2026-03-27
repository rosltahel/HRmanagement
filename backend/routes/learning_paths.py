from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from models.learning_path import LearningPath
from models.learning_path_skill import LearningPathSkill
from models.employee_learning_path import EmployeeLearningPath
from models.employee_skill import EmployeeSkill
from models.skill import Skill
from models.user import User
from models.notification import Notification
from models.company import Company
from schemas.learning_path import (
    LearningPathCreate,
    LearningPathSkillAdd,
    AssignLearningPathRequest,
    LearningPathUpdate,
    LearningPathSkillUpdate,
)

router = APIRouter(prefix="/learning-paths", tags=["Learning Paths"])


@router.get("")
def get_learning_paths(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can view learning paths")

    paths = (
        db.query(LearningPath)
        .filter(LearningPath.company_id == current_user.company_id)
        .all()
    )

    result = []
    for path in paths:
        result.append({
            "id": path.id,
            "title": path.title,
            "description": path.description,
            "created_by": path.created_by,
            "skills_count": len(path.skills),
            "assigned_count": len(path.assignments),
        })

    return result


@router.get("/my")
def get_my_learning_paths(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignments = (
        db.query(EmployeeLearningPath)
        .filter(EmployeeLearningPath.user_id == current_user.id)
        .all()
    )

    result = []

    for assignment in assignments:
        path = (
            db.query(LearningPath)
            .filter(
                LearningPath.id == assignment.learning_path_id,
                LearningPath.company_id == current_user.company_id,
            )
            .first()
        )

        if not path:
            continue

        path_skills = (
            db.query(LearningPathSkill, Skill)
            .join(Skill, LearningPathSkill.skill_id == Skill.id)
            .filter(LearningPathSkill.learning_path_id == path.id)
            .order_by(LearningPathSkill.sort_order.asc())
            .all()
        )

        skills = []
        for lp_skill, skill in path_skills:
            employee_skill = (
                db.query(EmployeeSkill)
                .filter(
                    EmployeeSkill.user_id == current_user.id,
                    EmployeeSkill.skill_id == skill.id,
                )
                .first()
            )

            skills.append({
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "sort_order": lp_skill.sort_order,
                "status": employee_skill.status if employee_skill else "learning",
                "progress": employee_skill.progress if employee_skill else 0,
            })

        result.append({
            "id": path.id,
            "title": path.title,
            "description": path.description,
            "skills": skills,
        })

    return result


@router.post("")
def create_learning_path(
    data: LearningPathCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can create learning paths")

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="HR is not linked to a company")

    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company or company.status != "approved":
        raise HTTPException(status_code=403, detail="Your company is not approved")

    path = LearningPath(
        title=data.title,
        description=data.description,
        company_id=current_user.company_id,
        created_by_user_id=current_user.id,
        created_by=current_user.name or "HR Manager",
    )
    db.add(path)
    db.commit()
    db.refresh(path)

    return {
        "message": "Learning path created successfully",
        "id": path.id,
    }


@router.get("/{path_id}")
def get_learning_path_details(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can view learning path details")

    path = (
        db.query(LearningPath)
        .filter(
            LearningPath.id == path_id,
            LearningPath.company_id == current_user.company_id,
        )
        .first()
    )
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    path_skills = (
        db.query(LearningPathSkill, Skill)
        .join(Skill, LearningPathSkill.skill_id == Skill.id)
        .filter(LearningPathSkill.learning_path_id == path_id)
        .order_by(LearningPathSkill.sort_order.asc())
        .all()
    )

    skills = []
    for ps, skill in path_skills:
        skills.append({
            "id": ps.id,
            "skill_id": skill.id,
            "name": skill.name,
            "description": skill.description,
            "skill_source": skill.skill_source,
            "sort_order": ps.sort_order,
        })

    return {
        "id": path.id,
        "title": path.title,
        "description": path.description,
        "created_by": path.created_by,
        "skills": skills,
    }


@router.post("/{path_id}/skills")
def add_skill_to_learning_path(
    path_id: int,
    data: LearningPathSkillAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can edit learning paths")

    path = (
        db.query(LearningPath)
        .filter(
            LearningPath.id == path_id,
            LearningPath.company_id == current_user.company_id,
        )
        .first()
    )
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    skill = db.query(Skill).filter(Skill.id == data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    existing = (
        db.query(LearningPathSkill)
        .filter(
            LearningPathSkill.learning_path_id == path_id,
            LearningPathSkill.skill_id == data.skill_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Skill already added to this path")

    item = LearningPathSkill(
        learning_path_id=path_id,
        skill_id=data.skill_id,
        sort_order=data.sort_order,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return {"message": "Skill added to learning path successfully"}


@router.post("/{path_id}/assign")
def assign_learning_path(
    path_id: int,
    data: AssignLearningPathRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can assign learning paths")

    path = (
        db.query(LearningPath)
        .filter(
            LearningPath.id == path_id,
            LearningPath.company_id == current_user.company_id,
        )
        .first()
    )
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    user = (
        db.query(User)
        .filter(
            User.id == data.user_id,
            User.system_role == "USER",
            User.company_id == current_user.company_id,
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing_assignment = (
        db.query(EmployeeLearningPath)
        .filter(
            EmployeeLearningPath.user_id == data.user_id,
            EmployeeLearningPath.learning_path_id == path_id,
        )
        .first()
    )
    if existing_assignment:
        raise HTTPException(status_code=400, detail="Learning path already assigned")

    assignment = EmployeeLearningPath(
        user_id=data.user_id,
        learning_path_id=path_id,
        is_active=True,
    )
    db.add(assignment)

    notification = Notification(
        user_id=data.user_id,
        title=f"New Learning Path Assigned: {path.title}",
        message=f"You have been assigned a new learning path: {path.title}. Open your dashboard and press Start Learning to begin.",
        sent_by=current_user.name or "HR Manager",
        is_read=False,
    )
    db.add(notification)

    db.commit()

    return {
        "message": "Learning path assigned successfully",
    }


@router.put("/{path_id}")
def update_learning_path(
    path_id: int,
    data: LearningPathUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can update learning paths")

    path = (
        db.query(LearningPath)
        .filter(
            LearningPath.id == path_id,
            LearningPath.company_id == current_user.company_id,
        )
        .first()
    )
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    if data.title is not None:
        path.title = data.title

    if data.description is not None:
        path.description = data.description

    db.commit()
    db.refresh(path)

    return {"message": "Learning path updated successfully"}


@router.delete("/{path_id}")
def delete_learning_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can delete learning paths")

    path = (
        db.query(LearningPath)
        .filter(
            LearningPath.id == path_id,
            LearningPath.company_id == current_user.company_id,
        )
        .first()
    )
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    db.query(LearningPathSkill).filter(
        LearningPathSkill.learning_path_id == path_id
    ).delete()

    db.query(EmployeeLearningPath).filter(
        EmployeeLearningPath.learning_path_id == path_id
    ).delete()

    db.delete(path)
    db.commit()

    return {"message": "Learning path deleted successfully"}


@router.put("/skills/{path_skill_id}")
def update_learning_path_skill(
    path_skill_id: int,
    data: LearningPathSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can update learning path skills")

    item = (
        db.query(LearningPathSkill)
        .join(LearningPath, LearningPathSkill.learning_path_id == LearningPath.id)
        .filter(
            LearningPathSkill.id == path_skill_id,
            LearningPath.company_id == current_user.company_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Path skill not found")

    if data.sort_order is not None:
        item.sort_order = data.sort_order

    db.commit()
    db.refresh(item)

    return {"message": "Path skill updated successfully"}


@router.delete("/skills/{path_skill_id}")
def delete_learning_path_skill(
    path_skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can remove learning path skills")

    item = (
        db.query(LearningPathSkill)
        .join(LearningPath, LearningPathSkill.learning_path_id == LearningPath.id)
        .filter(
            LearningPathSkill.id == path_skill_id,
            LearningPath.company_id == current_user.company_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Path skill not found")

    db.delete(item)
    db.commit()

    return {"message": "Skill removed from learning path successfully"}