from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from models.user import User
from models.company import Company
from models.skill import Skill
from models.employee_skill import EmployeeSkill
from schemas.skill import (
    EmployeeSkillCreate,
    EmployeeSkillComplete,
    EmployeeSkillUpdate,
    SkillCreate,
    SkillResponse,
)

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("/catalog")
def get_catalog(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        return []

    skills = (
        db.query(Skill)
        .filter(
            Skill.skill_source == "company",
            Skill.company_id == current_user.company_id,
        )
        .all()
    )
    return skills


@router.get("/my")
def get_my_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee_skills = (
        db.query(EmployeeSkill, Skill)
        .join(Skill, EmployeeSkill.skill_id == Skill.id)
        .filter(EmployeeSkill.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": es.id,
            "skill_id": skill.id,
            "name": skill.name,
            "description": skill.description,
            "skill_source": skill.skill_source,
            "status": es.status,
            "progress": es.progress,
            "deadline": es.deadline,
            "completion_note": es.completion_note,
        }
        for es, skill in employee_skills
    ]


@router.post("", response_model=SkillResponse)
def create_skill(
    data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can create company skills")

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="HR is not linked to a company")

    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company or company.status != "approved":
        raise HTTPException(status_code=403, detail="Your company is not approved")

    existing = (
        db.query(Skill)
        .filter(
            Skill.company_id == current_user.company_id,
            Skill.skill_source == "company",
            Skill.name.ilike(data.name),
        )
        .first()
    )
    if existing:
        return existing

    skill = Skill(
        name=data.name,
        description=data.description,
        skill_source="company",
        company_id=current_user.company_id,
        created_by_user_id=current_user.id,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.post("/self-add")
def add_skill_to_employee(
    data: EmployeeSkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.skill_id:
        skill = (
            db.query(Skill)
            .filter(Skill.id == data.skill_id)
            .first()
        )
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")

        # company skill must belong to same company
        if skill.skill_source == "company" and skill.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="You cannot use a skill from another company")
    else:
        if not data.name:
            raise HTTPException(status_code=400, detail="Skill name is required")

        existing_personal = (
            db.query(Skill)
            .filter(
                Skill.created_by_user_id == current_user.id,
                Skill.skill_source == "personal",
                Skill.name.ilike(data.name),
            )
            .first()
        )

        if existing_personal:
            skill = existing_personal
        else:
            skill = Skill(
                name=data.name,
                description=data.description,
                skill_source="personal",
                company_id=current_user.company_id,
                created_by_user_id=current_user.id,
            )
            db.add(skill)
            db.commit()
            db.refresh(skill)

    existing = (
        db.query(EmployeeSkill)
        .filter(
            EmployeeSkill.user_id == current_user.id,
            EmployeeSkill.skill_id == skill.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You are already learning this skill")

    employee_skill = EmployeeSkill(
        user_id=current_user.id,
        skill_id=skill.id,
        status="learning",
        progress=0,
        deadline=None,
        completion_note=None,
    )

    db.add(employee_skill)
    db.commit()
    db.refresh(employee_skill)

    return {"message": "Skill added successfully"}


@router.put("/complete-with-note")
def complete_skill(
    data: EmployeeSkillComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee_skill = (
        db.query(EmployeeSkill)
        .filter(
            EmployeeSkill.id == data.skill_id,
            EmployeeSkill.user_id == current_user.id,
        )
        .first()
    )

    if not employee_skill:
        raise HTTPException(status_code=404, detail="Employee skill not found")

    employee_skill.status = "completed"
    employee_skill.progress = 100
    employee_skill.completion_note = data.note

    db.commit()

    return {"message": "Skill completed successfully"}


@router.put("/{employee_skill_id}")
def update_my_skill(
    employee_skill_id: int,
    data: EmployeeSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee_skill = (
        db.query(EmployeeSkill)
        .filter(
            EmployeeSkill.id == employee_skill_id,
            EmployeeSkill.user_id == current_user.id,
        )
        .first()
    )

    if not employee_skill:
        raise HTTPException(status_code=404, detail="Employee skill not found")

    allowed_statuses = {"learning", "completed"}
    if data.status is not None:
        if data.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
        employee_skill.status = data.status

    if data.progress is not None:
        if data.progress < 0 or data.progress > 100:
            raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
        employee_skill.progress = data.progress

    if data.completion_note is not None:
        employee_skill.completion_note = data.completion_note

    if employee_skill.status == "completed":
        employee_skill.progress = 100

    db.commit()
    db.refresh(employee_skill)

    return {
        "message": "Skill updated successfully",
        "skill": {
            "id": employee_skill.id,
            "status": employee_skill.status,
            "progress": employee_skill.progress,
            "completion_note": employee_skill.completion_note,
        },
    }


@router.delete("/{employee_skill_id}")
def delete_my_skill(
    employee_skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee_skill = (
        db.query(EmployeeSkill)
        .filter(
            EmployeeSkill.id == employee_skill_id,
            EmployeeSkill.user_id == current_user.id,
        )
        .first()
    )

    if not employee_skill:
        raise HTTPException(status_code=404, detail="Employee skill not found")

    db.delete(employee_skill)
    db.commit()

    return {"message": "Skill deleted successfully"}