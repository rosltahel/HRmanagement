

# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# import secrets

# from database import get_db
# from models.user import User
# from schemas.user import (
#     EmployeeCreate,
#     UserLogin,
#     ForgotPasswordRequest,
#     SetPasswordRequest,
# )
# from core.security import (
#     hash_password,
#     verify_password,
#     create_access_token,
#     get_current_user,
# )
# from core.email_service import send_reset_email

# router = APIRouter()


# @router.get("/profile")
# def profile(current_user: User = Depends(get_current_user)):
#     return {
#         "email": current_user.email,
#         "message": "You are authenticated 🎉",
#     }


# @router.post("/forgot-password")
# async def forgot_password(
#     request: ForgotPasswordRequest, db: Session = Depends(get_db)
# ):
#     user = db.query(User).filter(User.email == request.email).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     reset_token = secrets.token_urlsafe(32)
#     user.reset_token = reset_token
#     db.commit()
#     db.refresh(user)

#     reset_link = f"http://localhost:3000/set-password?token={reset_token}&email={user.email}"
#     await send_reset_email(user.email, reset_link)

#     return {"message": "Password reset link has been sent to your email."}


# @router.post("/register")
# async def register(user: EmployeeCreate, db: Session = Depends(get_db)):
#     existing_user = db.query(User).filter(User.email == user.email).first()
#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     # create user with TEMP password
#     temporary_password = secrets.token_hex(8)
#     hashed_pw = hash_password(temporary_password)

#     new_user = User(
#         name=user.name,
#         email=user.email,
#         hashed_password=hashed_pw,
#         system_role="USER",
#         department_id=user.department_id,
#         role_id=user.role_id,
#         is_active=True,
#     )

#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)

#     # 🔥 GENERATE RESET TOKEN
#     reset_token = secrets.token_urlsafe(32)
#     new_user.reset_token = reset_token
#     db.commit()

#     # 🔥 CREATE LINK (IMPORTANT: change port!)
#     reset_link = f"http://localhost:3000/set-password?token={reset_token}&email={new_user.email}"

#     # 🔥 SEND EMAIL
#     await send_reset_email(new_user.email, reset_link)

#     return {"message": "Employee created and invite email sent 🚀"}

# @router.post("/login")
# def login(user: UserLogin, db: Session = Depends(get_db)):
#     db_user = db.query(User).filter(User.email == user.email).first()

#     if not db_user:
#         raise HTTPException(status_code=400, detail="Invalid credentials")

#     if not verify_password(user.password, db_user.hashed_password):
#         raise HTTPException(status_code=400, detail="Invalid credentials")

#     token = create_access_token({"sub": db_user.email})

#     return {
#         "access_token": token,
#         "token_type": "bearer",
#         "role": "HR" if db_user.system_role == "HR" else "USER",
#         "role_title": db_user.role.title if db_user.role else None,
#         "name": db_user.name or db_user.email,
#         "user_id":db_user.id,
#     }

# @router.post("/set-password")
# def set_password(request: SetPasswordRequest, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.email == request.email).first()
#     if not user or user.reset_token != request.token:
#         raise HTTPException(status_code=400, detail="Invalid token or email")

#     user.hashed_password = hash_password(request.password)
#     user.reset_token = None
#     db.commit()

#     return {"message": "Password has been successfully reset."}





from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets

from database import get_db
from models.user import User
from models.company import Company
from schemas.user import (
    EmployeeCreate,
    UserLogin,
    ForgotPasswordRequest,
    SetPasswordRequest,
)
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from core.email_service import send_reset_email

router = APIRouter()


@router.get("/profile")
def profile(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "message": "You are authenticated 🎉",
        "role": current_user.system_role,
    }


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    db.commit()
    db.refresh(user)

    reset_link = f"http://localhost:3000/set-password?token={reset_token}&email={user.email}"
    await send_reset_email(user.email, reset_link)

    return {"message": "Password reset link has been sent to your email."}


@router.post("/register")
async def register(
    user: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.system_role != "HR":
        raise HTTPException(status_code=403, detail="Only HR can add employees")

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="HR is not linked to a company")
    
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company or company.status != "approved":
      raise HTTPException(status_code=403, detail="Your company is not approved")

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    temporary_password = secrets.token_hex(8)
    hashed_pw = hash_password(temporary_password)

    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_pw,
        system_role="USER",
        department_id=user.department_id,
        role_id=user.role_id,
        company_id=current_user.company_id,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    reset_token = secrets.token_urlsafe(32)
    new_user.reset_token = reset_token
    db.commit()

    reset_link = f"http://localhost:3000/set-password?token={reset_token}&email={new_user.email}"
    await send_reset_email(new_user.email, reset_link)

    return {"message": "Employee created and invite email sent 🚀"}


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Block inactive HR users until admin approves them
    if db_user.system_role == "HR":
        company = None
        if db_user.company_id:
            company = db.query(Company).filter(Company.id == db_user.company_id).first()

        if not db_user.is_active:
            if company and company.status == "rejected":
                raise HTTPException(
                    status_code=403,
                    detail="Your company request was rejected by the admin.",
                )

            raise HTTPException(
                status_code=403,
                detail="Your company request is still pending admin approval.",
            )

        if company and company.status != "approved":
            raise HTTPException(
                status_code=403,
                detail="Your company is not approved yet.",
            )

    # Optional extra safety for regular employees
    if db_user.system_role == "USER" and not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive. Please contact your HR manager.",
        )

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.system_role,  # ADMIN / HR / USER
        "role_title": db_user.role.title if db_user.role else None,
        "name": db_user.name or db_user.email,
        "user_id": db_user.id,
        "company_id": db_user.company_id,
    }


@router.post("/set-password")
def set_password(request: SetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or user.reset_token != request.token:
        raise HTTPException(status_code=400, detail="Invalid token or email")

    user.hashed_password = hash_password(request.password)
    user.reset_token = None
    db.commit()

    return {"message": "Password has been successfully reset."}