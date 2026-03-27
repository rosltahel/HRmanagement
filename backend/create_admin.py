from database import SessionLocal
from models.company import Company
from models.user import User
from core.security import hash_password
from models.role import Role
from models.department import Department

db = SessionLocal()

existing_admin = db.query(User).filter(User.email == "admin@example.com").first()

if existing_admin:
    print("Admin already exists")
else:
    admin = User(
        name="Platform Admin",
        email="admin@example.com",
        hashed_password=hash_password("admin123"),
        system_role="ADMIN",
        is_active=True,
        company_id=None,
    )
    db.add(admin)
    db.commit()
    print("Admin created successfully")

db.close()