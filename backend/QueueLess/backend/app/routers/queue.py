from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.queue import Queue
from app.schemas.queue import QueueCreate, QueueResponse, QueueUpdate

router = APIRouter()

# Get all queues for a hospital
@router.get("/hospital/{hospital_id}", response_model=list[QueueResponse])
def get_queues(hospital_id: int, db: Session = Depends(get_db)):
    queues = db.query(Queue).filter(Queue.hospital_id == hospital_id).all()
    return queues

# Join a queue
@router.post("/", response_model=QueueResponse)
def join_queue(queue: QueueCreate, db: Session = Depends(get_db)):
    new_queue = Queue(**queue.dict())
    db.add(new_queue)
    db.commit()
    db.refresh(new_queue)
    return new_queue

# Update queue status
@router.put("/{queue_id}", response_model=QueueResponse)
def update_queue(queue_id: int, queue_update: QueueUpdate, db: Session = Depends(get_db)):
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    for key, value in queue_update.dict().items():
        setattr(queue, key, value)
    db.commit()
    db.refresh(queue)
    return queue