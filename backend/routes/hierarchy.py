from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from models.role import Role
from models.user import User
from models.company import Company
from schemas.role import AssignEmployeeRequest

from openai import OpenAI
from pypdf import PdfReader
from io import BytesIO
import os
import json
import base64

router = APIRouter(prefix="/hierarchy", tags=["Hierarchy"])
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    parts = []

    for page in reader.pages:
        text = page.extract_text()
        if text:
            parts.append(text)

    return "\n".join(parts).strip()


def parse_json_from_model_output(content: str):
    if not content or not content.strip():
        raise ValueError("Model returned empty content")

    cleaned = content.strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(cleaned[start:end + 1])

    raise ValueError(f"Could not parse JSON from model output: {content}")


def ask_openai_for_hierarchy_from_text(text: str):
    prompt = f"""
You are reading an organization chart.

Extract role hierarchy from the content below.

Return ONLY valid JSON in this exact format:
{{
  "roles": [
    {{ "title": "CEO", "parent_title": null }},
    {{ "title": "Engineering Manager", "parent_title": "CEO" }},
    {{ "title": "Frontend Developer", "parent_title": "Engineering Manager" }}
  ]
}}

Rules:
- Include roles only, not employee names
- Keep titles short and clean
- If a role is top-level, parent_title must be null
- No markdown
- No explanation text

Content:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You extract organization hierarchy into strict JSON. "
                    "Return valid JSON only. No markdown fences. No explanation."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0,
    )

    content = response.choices[0].message.content or ""
    return parse_json_from_model_output(content)


def ask_openai_for_hierarchy_from_image(file_bytes: bytes, mime_type: str):
    base64_image = base64.b64encode(file_bytes).decode("utf-8")

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Extract organization hierarchy from an org chart image. "
                    "Return valid JSON only, with no markdown fences and no explanation. "
                    'Format: {"roles":[{"title":"CEO","parent_title":null}]}'
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Read this org chart image and return only JSON. "
                            "Include roles only, not employee names. "
                            "Use parent_title null for top-level roles."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        },
                    },
                ],
            },
        ],
        temperature=0,
    )

    content = response.choices[0].message.content or ""
    return parse_json_from_model_output(content)


def ensure_hr_company(current_user: User, db: Session):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can manage hierarchy")

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="HR is not linked to a company")

    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company or company.status != "approved":
        raise HTTPException(status_code=403, detail="Your company is not approved")

    return company


@router.get("/roles")
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    roles = (
        db.query(Role)
        .filter(Role.company_id == current_user.company_id)
        .all()
    )

    users = (
        db.query(User)
        .filter(
            User.system_role == "USER",
            User.company_id == current_user.company_id,
        )
        .all()
    )

    result = []
    for role in roles:
        role_employees = [
            {
                "id": user.id,
                "employee_id": user.id,
                "assignment_id": user.id,
                "name": user.name,
                "email": user.email,
                "title": role.title,
                "is_active": user.is_active,
                "stars": 0,
                "completed_skills_count": 0,
                "in_progress_count": 0,
            }
            for user in users
            if user.role_id == role.id
        ]

        result.append(
            {
                "id": role.id,
                "title": role.title,
                "description": role.description,
                "department_id": role.department_id,
                "parent_role_id": role.parent_role_id,
                "company_id": role.company_id,
                "employees": role_employees,
            }
        )

    return result


@router.post("/roles")
def create_role(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    title = (data.get("title") or "").strip()
    parent_role_id = data.get("parent_role_id")
    department_id = data.get("department_id")

    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    existing = (
        db.query(Role)
        .filter(
            Role.company_id == current_user.company_id,
            Role.title.ilike(title),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Role already exists in your company")

    if parent_role_id is not None:
        parent = (
            db.query(Role)
            .filter(
                Role.id == parent_role_id,
                Role.company_id == current_user.company_id,
            )
            .first()
        )
        if not parent:
            raise HTTPException(status_code=404, detail="Parent role not found")

    role = Role(
        title=title,
        parent_role_id=parent_role_id,
        department_id=department_id,
        description=data.get("description"),
        company_id=current_user.company_id,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.put("/roles/{role_id}")
def update_role(
    role_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    role = (
        db.query(Role)
        .filter(
            Role.id == role_id,
            Role.company_id == current_user.company_id,
        )
        .first()
    )
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    new_title = data.get("title", role.title)
    new_parent_role_id = data.get("parent_role_id", role.parent_role_id)
    new_department_id = data.get("department_id", role.department_id)
    new_description = data.get("description", role.description)

    if new_parent_role_id == role.id:
        raise HTTPException(status_code=400, detail="A role cannot be its own parent")

    if new_parent_role_id is not None:
        parent = (
            db.query(Role)
            .filter(
                Role.id == new_parent_role_id,
                Role.company_id == current_user.company_id,
            )
            .first()
        )
        if not parent:
            raise HTTPException(status_code=404, detail="Parent role not found")

    role.title = new_title
    role.parent_role_id = new_parent_role_id
    role.department_id = new_department_id
    role.description = new_description

    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    role = (
        db.query(Role)
        .filter(
            Role.id == role_id,
            Role.company_id == current_user.company_id,
        )
        .first()
    )
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    children = (
        db.query(Role)
        .filter(
            Role.parent_role_id == role.id,
            Role.company_id == current_user.company_id,
        )
        .all()
    )
    for child in children:
        child.parent_role_id = role.parent_role_id

    users = (
        db.query(User)
        .filter(
            User.role_id == role.id,
            User.company_id == current_user.company_id,
        )
        .all()
    )
    for user in users:
        user.role_id = None

    db.delete(role)
    db.commit()
    return {"message": "Role deleted successfully"}


@router.post("/roles/{role_id}/assign")
def assign_employee(
    role_id: int,
    data: AssignEmployeeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    role = (
        db.query(Role)
        .filter(
            Role.id == role_id,
            Role.company_id == current_user.company_id,
        )
        .first()
    )
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    user = (
        db.query(User)
        .filter(
            User.id == data.employee_id,
            User.system_role == "USER",
            User.company_id == current_user.company_id,
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    user.role_id = role.id

    if role.department_id:
        user.department_id = role.department_id

    db.commit()
    db.refresh(user)

    return {
        "message": "Employee assigned successfully",
        "employee_id": user.id,
        "role_id": role.id,
    }


@router.delete("/roles/{role_id}/assignments/{employee_id}")
def remove_employee_from_role(
    role_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    role = (
        db.query(Role)
        .filter(
            Role.id == role_id,
            Role.company_id == current_user.company_id,
        )
        .first()
    )
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    user = (
        db.query(User)
        .filter(
            User.id == employee_id,
            User.role_id == role_id,
            User.company_id == current_user.company_id,
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Assignment not found")

    user.role_id = None
    db.commit()
    return {"message": "Employee removed from role"}


@router.post("/roles/parse-image")
async def parse_hierarchy_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        if file.content_type == "application/pdf" or file.filename.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf(file_bytes)
            if not extracted_text:
                raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            parsed = ask_openai_for_hierarchy_from_text(extracted_text)

        elif file.content_type in ["image/png", "image/jpeg", "image/jpg", "image/webp"]:
            parsed = ask_openai_for_hierarchy_from_image(file_bytes, file.content_type)

        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        roles_data = parsed.get("roles", [])
        if not roles_data:
            raise HTTPException(status_code=400, detail="No roles found in uploaded org chart")

        title_to_id = {}
        final_roles = []

        existing_roles = (
            db.query(Role)
            .filter(Role.company_id == current_user.company_id)
            .all()
        )
        for r in existing_roles:
            title_to_id[r.title.strip().lower()] = r.id

        for item in roles_data:
            title = (item.get("title") or "").strip()
            if not title:
                continue

            key = title.lower()
            if key not in title_to_id:
                new_role = Role(
                    title=title,
                    parent_role_id=None,
                    department_id=None,
                    description=None,
                    company_id=current_user.company_id,
                )
                db.add(new_role)
                db.commit()
                db.refresh(new_role)
                title_to_id[key] = new_role.id

        for item in roles_data:
            title = (item.get("title") or "").strip()
            parent_title = item.get("parent_title")

            if not title:
                continue

            role = (
                db.query(Role)
                .filter(Role.id == title_to_id[title.lower()])
                .first()
            )

            if parent_title:
                parent_key = parent_title.strip().lower()
                parent_id = title_to_id.get(parent_key)
                if parent_id and parent_id != role.id:
                    role.parent_role_id = parent_id
            else:
                role.parent_role_id = None

        db.commit()

        for item in roles_data:
            title = (item.get("title") or "").strip()
            if not title:
                continue

            role = (
                db.query(Role)
                .filter(Role.id == title_to_id[title.lower()])
                .first()
            )
            final_roles.append(
                {
                    "id": role.id,
                    "title": role.title,
                }
            )

        return {
            "created": len(final_roles),
            "roles": final_roles,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {str(e)}")