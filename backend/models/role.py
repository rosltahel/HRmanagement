# from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
# from sqlalchemy.orm import relationship
# from database import Base


# class Role(Base):
#     __tablename__ = "roles"

#     id = Column(Integer, primary_key=True, index=True)
#     title = Column(String, nullable=False)
#     description = Column(Text, nullable=True)
#     department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
#     parent_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
#     is_hr_role = Column(Boolean, nullable=False, default=False)

#     users = relationship("User", back_populates="role")


from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    parent_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)

    parent = relationship("Role", remote_side=[id], backref="children")
    company = relationship("Company")