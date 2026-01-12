from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from .database import get_session
from .models import WorkItem, Status

router = APIRouter()

@router.get("/items", response_model=List[WorkItem])
def read_items(
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = 100,
):
    items = session.exec(select(WorkItem).offset(offset).limit(limit)).all()
    return items

@router.post("/items", response_model=WorkItem)
def create_item(item: WorkItem, session: Session = Depends(get_session)):
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.get("/items/{item_id}", response_model=WorkItem)
def read_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(WorkItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/items/{item_id}", response_model=WorkItem)
def update_item(item_id: int, item_data: WorkItem, session: Session = Depends(get_session)):
    db_item = session.get(WorkItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item_dict = item_data.dict(exclude_unset=True)
    # Avoid updating id
    item_dict.pop("id", None)
    
    for key, value in item_dict.items():
        setattr(db_item, key, value)
        
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@router.delete("/items/{item_id}")
def delete_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(WorkItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}

@router.get("/stats")
def get_stats(session: Session = Depends(get_session)):
    active_statuses = [Status.ACTIVE, Status.INVITED, Status.IN_REVIEW]
    pending_status = [Status.PENDING_DECISION]
    completed_statuses = [Status.COMPLETED, Status.ACCEPTED, Status.REJECTED]
    
    # Simple counting - in production SQL count(*) is better
    all_items = session.exec(select(WorkItem)).all()
    
    active = sum(1 for i in all_items if i.status in active_statuses)
    pending = sum(1 for i in all_items if i.status in pending_status)
    completed = sum(1 for i in all_items if i.status in completed_statuses)
    
    return {
        "active": active,
        "pending": pending,
        "completed": completed
    }
