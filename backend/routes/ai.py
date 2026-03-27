from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI
import os
import json

from database import get_db
from core.security import get_current_user
from models.user import User
from models.company import Company
from models.skill import Skill
from models.employee_skill import EmployeeSkill

router = APIRouter(prefix="/ai", tags=["AI"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def ensure_hr_company(current_user: User, db: Session):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can use AI features")

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="HR is not linked to a company")

    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company or company.status != "approved":
        raise HTTPException(status_code=403, detail="Your company is not approved")

    return company


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


def get_company_employees_with_skills(company_id: int, db: Session):
    employees = (
        db.query(User)
        .filter(
            User.system_role == "USER",
            User.company_id == company_id,
        )
        .all()
    )

    result = []

    for employee in employees:
        employee_skills = (
            db.query(EmployeeSkill, Skill)
            .join(Skill, EmployeeSkill.skill_id == Skill.id)
            .filter(EmployeeSkill.user_id == employee.id)
            .all()
        )

        completed_skills = []
        in_progress_skills = []

        for emp_skill, skill in employee_skills:
            skill_info = {
                "name": skill.name,
                "description": skill.description,
                "status": emp_skill.status,
                "progress": emp_skill.progress,
            }

            if emp_skill.status == "completed":
                completed_skills.append(skill_info)
            else:
                in_progress_skills.append(skill_info)

        result.append(
            {
                "id": employee.id,
                "name": employee.name,
                "email": employee.email,
                "title": employee.role.title if employee.role else None,
                "department": employee.department.name if employee.department else None,
                "completed_skills": completed_skills,
                "in_progress_skills": in_progress_skills,
            }
        )

    return result


@router.post("/dashboard-advice")
def get_dashboard_advice(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing")

    company_goal = (data.get("company_goal") or "").strip()
    employees = get_company_employees_with_skills(current_user.company_id, db)

    prompt = f"""
You are an AI HR assistant.

Your task:
1. Read the company goal
2. Review the employees, roles, completed skills, and in-progress skills
3. Suggest what HR should focus on
4. Suggest what each role should learn next
5. Identify employees who may need support

Return ONLY valid JSON in this exact format:
{{
  "summary": "short executive summary for the HR manager",
  "priority_skills": ["Skill 1", "Skill 2", "Skill 3"],
  "employees_needing_attention": [
    {{
      "employee_name": "John",
      "reason": "too many in-progress skills"
    }}
  ],
  "role_recommendations": [
    {{
      "role": "Frontend Developer",
      "recommended_skills": ["React", "TypeScript", "Testing"],
      "reason": "why these skills matter"
    }}
  ],
  "employee_recommendations": [
    {{
      "employee_name": "Sarah",
      "role": "Backend Developer",
      "recommended_skills": ["FastAPI", "Docker"],
      "reason": "why these are the best next skills"
    }}
  ]
}}

Rules:
- Return JSON only
- No markdown
- No explanation outside JSON
- Keep suggestions practical and specific
- Use the company goal strongly when choosing skills

Company Goal:
{company_goal or "No company goal provided"}

Employees:
{json.dumps(employees, indent=2)}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise AI HR assistant. "
                        "Return strict JSON only. No markdown. No extra explanation."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        content = response.choices[0].message.content or ""
        parsed = parse_json_from_model_output(content)
        return parsed

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI dashboard advice failed: {str(e)}")


@router.post("/job-match")
def match_employees_to_job(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing")

    job_description = (data.get("job_description") or "").strip()
    if not job_description:
        raise HTTPException(status_code=400, detail="job_description is required")

    employees = get_company_employees_with_skills(current_user.company_id, db)

    prompt = f"""
You are an AI HR assistant.

Your task:
- Read the job description
- Compare it against current employees
- Rank the best internal matches
- Explain why they match
- Show skill gaps

Return ONLY valid JSON in this exact format:
{{
  "job_summary": "short summary of what the role needs",
  "top_matches": [
    {{
      "employee_name": "Sarah",
      "role": "Frontend Developer",
      "score": 88,
      "reason": "Strong React and JavaScript background, currently learning TypeScript.",
      "missing_skills": ["Testing", "System Design"]
    }}
  ],
  "overall_skill_gaps": ["Gap 1", "Gap 2"]
}}

Rules:
- Return JSON only
- No markdown
- No extra explanation outside JSON
- Score should be from 0 to 100
- Use completed skills more strongly than in-progress skills
- In-progress skills should still count as positive signs

Job Description:
{job_description}

Employees:
{json.dumps(employees, indent=2)}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise AI HR assistant. "
                        "Return strict JSON only. No markdown. No extra explanation."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content or ""
        parsed = parse_json_from_model_output(content)
        return parsed

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI job match failed: {str(e)}")




@router.post("/chat")
def hr_ai_chat(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_hr_company(current_user, db)

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing")

    message = (data.get("message") or "").strip()
    company_goal = (data.get("company_goal") or "").strip()

    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    employees = get_company_employees_with_skills(current_user.company_id, db)

    prompt = f"""
You are an AI HR assistant helping an HR manager.

You have access to:
- the company's goal
- employees in the company
- each employee's role
- completed skills
- in-progress skills

Your job:
- answer the HR manager's question clearly
- make suggestions based only on the provided employees and skills
- if recommending training, connect it to the employee role and company goal
- be practical and concise
- do not invent employees or skills that are not supported by the data unless clearly marked as a general suggestion

Return ONLY valid JSON in this exact format:
{{
  "answer": "your direct answer to the HR manager",
  "recommended_employees": [
    {{
      "employee_name": "Sarah",
      "reason": "why this employee is relevant"
    }}
  ],
  "recommended_skills": ["Skill 1", "Skill 2"]
}}

Rules:
- Return JSON only
- No markdown
- No explanation outside JSON
- If no employees are relevant, return an empty list
- If no specific skills are relevant, return an empty list

Company Goal:
{company_goal or "No company goal provided"}

Employees:
{json.dumps(employees, indent=2)}

HR Question:
{message}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise AI HR assistant. "
                        "Return strict JSON only. No markdown. No extra explanation."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
        )

        content = response.choices[0].message.content or ""
        parsed = parse_json_from_model_output(content)
        return parsed

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")        