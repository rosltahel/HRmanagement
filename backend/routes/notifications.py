from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.notification import Notification
from models.user import User
from schemas.notification import NotificationCreate

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("")
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    notification = Notification(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        sent_by=data.sent_by,
        is_read=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification sent successfully",
        "notification_id": notification.id,
    }


@router.get("/my/{user_id}")
def get_my_notifications(user_id: int, db: Session = Depends(get_db)):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return notifications


@router.put("/{notification_id}/read")
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()

    return {"message": "Notification marked as read"}