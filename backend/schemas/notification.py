from pydantic import BaseModel

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    sent_by: str | None = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    sent_by: str | None = None
    created_at: str | None = None

    class Config:
        from_attributes = True