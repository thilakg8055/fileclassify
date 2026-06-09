# from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# from sqlalchemy.orm import Session
# from typing import Optional, List
# import json
# import os
# import uuid
# import shutil
# from datetime import datetime

# from database import SessionLocal, engine, Base
# import models
# import schemas
# import auth
# from websocket_manager import ConnectionManager

# # Create tables
# Base.metadata.create_all(bind=engine)

# app = FastAPI(title="FileClassify API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# os.makedirs("uploads/tasks", exist_ok=True)
# os.makedirs("uploads/completed", exist_ok=True)

# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# manager = ConnectionManager()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # Seed admin on startup
# @app.on_event("startup")
# def seed_admin():
#     db = SessionLocal()
#     admin = db.query(models.User).filter(models.User.email == "admin@fileclassify.com").first()
#     if not admin:
#         hashed = auth.hash_password("admin123")
#         admin_user = models.User(
#             id=str(uuid.uuid4()),
#             email="admin@fileclassify.com",
#             hashed_password=hashed,
#             role="admin",
#             name="Admin"
#         )
#         db.add(admin_user)
#         db.commit()
#     db.close()

# # ─── AUTH ───────────────────────────────────────────────────────────────────

# @app.post("/api/auth/login", response_model=schemas.TokenResponse)
# def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.email == body.email).first()
#     if not user or not auth.verify_password(body.password, user.hashed_password):
#         raise HTTPException(status_code=401, detail="Invalid credentials")
#     token = auth.create_token({"sub": user.id, "role": user.role})
#     return {"token": token, "role": user.role, "name": user.name, "id": user.id}

# @app.get("/api/auth/me", response_model=schemas.UserOut)
# def me(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.id == current["sub"]).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return user

# # ─── ADMIN: USERS ────────────────────────────────────────────────────────────

# @app.get("/api/admin/users", response_model=List[schemas.UserOut])
# def list_users(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     return db.query(models.User).filter(models.User.role == "employee").all()

# @app.post("/api/admin/users", response_model=schemas.UserOut)
# def create_user(body: schemas.CreateUserRequest, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     existing = db.query(models.User).filter(models.User.email == body.email).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already exists")
#     user = models.User(
#         id=str(uuid.uuid4()),
#         email=body.email,
#         name=body.name,
#         hashed_password=auth.hash_password(body.password),
#         role="employee"
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)
#     return user

# @app.delete("/api/admin/users/{user_id}")
# def delete_user(user_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404)
#     db.delete(user)
#     db.commit()
#     return {"ok": True}

# # ─── ADMIN: TASKS ────────────────────────────────────────────────────────────

# @app.post("/api/admin/tasks", response_model=schemas.TaskOut)
# async def create_task(
#     employee_id: str = Form(...),
#     title: str = Form(...),
#     description: str = Form(""),
#     classifications: str = Form(...),
#     file: UploadFile = File(...),
#     current=Depends(auth.require_admin),
#     db: Session = Depends(get_db)
# ):
#     task_id = str(uuid.uuid4())
#     file_path = f"uploads/tasks/{task_id}_{file.filename}"
#     with open(file_path, "wb") as f:
#         content = await file.read()
#         f.write(content)

#     task = models.Task(
#         id=task_id,
#         title=title,
#         description=description,
#         employee_id=employee_id,
#         classifications=classifications,
#         zip_file_path=file_path,
#         status="assigned",
#         created_at=datetime.utcnow()
#     )
#     db.add(task)
#     db.commit()
#     db.refresh(task)
#     await manager.broadcast_to_user(employee_id, {"type": "new_task", "task_id": task_id})
#     return task

# @app.get("/api/admin/tasks", response_model=List[schemas.TaskOut])
# def list_all_tasks(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     return db.query(models.Task).order_by(models.Task.created_at.desc()).all()

# @app.get("/api/admin/tasks/{task_id}", response_model=schemas.TaskOut)
# def get_task(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     return task

# @app.post("/api/admin/tasks/{task_id}/request-update")
# async def request_update(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     notif = models.Notification(
#         id=str(uuid.uuid4()),
#         task_id=task_id,
#         user_id=task.employee_id,
#         type="update_request",
#         message="Admin has requested a progress update",
#         created_at=datetime.utcnow()
#     )
#     db.add(notif)
#     db.commit()
#     await manager.broadcast_to_user(task.employee_id, {"type": "update_request", "task_id": task_id})
#     return {"ok": True}

# @app.get("/api/admin/tasks/{task_id}/updates")
# def get_task_updates(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     updates = db.query(models.TaskUpdate).filter(models.TaskUpdate.task_id == task_id).order_by(models.TaskUpdate.created_at.desc()).all()
#     return updates

# @app.get("/api/admin/tasks/{task_id}/download-zip")
# def download_completed_zip(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id).first()
#     if not task or not task.completed_zip_path:
#         raise HTTPException(status_code=404, detail="No completed ZIP")
#     return FileResponse(task.completed_zip_path, media_type="application/zip", filename=f"completed_{task_id}.zip")

# @app.get("/api/admin/analytics")
# def get_analytics(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     users = db.query(models.User).filter(models.User.role == "employee").all()
#     tasks = db.query(models.Task).all()
#     updates = db.query(models.TaskUpdate).all()

#     emp_stats = []
#     for u in users:
#         emp_tasks = [t for t in tasks if t.employee_id == u.id]
#         completed = len([t for t in emp_tasks if t.status == "completed"])
#         emp_stats.append({
#             "name": u.name,
#             "total": len(emp_tasks),
#             "completed": completed,
#             "in_progress": len(emp_tasks) - completed
#         })

#     total_files = sum(u.files_completed or 0 for u in [db.query(models.User).filter(models.User.id == u.id).first() for u in users])
    
#     classification_totals = {}
#     for upd in updates:
#         if upd.classification_data:
#             try:
#                 data = json.loads(upd.classification_data)
#                 for k, v in data.items():
#                     classification_totals[k] = classification_totals.get(k, 0) + (v or 0)
#             except:
#                 pass

#     return {
#         "employee_stats": emp_stats,
#         "classification_totals": classification_totals,
#         "total_tasks": len(tasks),
#         "completed_tasks": len([t for t in tasks if t.status == "completed"]),
#         "total_employees": len(users)
#     }

# # ─── EMPLOYEE ────────────────────────────────────────────────────────────────

# @app.get("/api/employee/tasks", response_model=List[schemas.TaskOut])
# def employee_tasks(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     return db.query(models.Task).filter(models.Task.employee_id == current["sub"]).order_by(models.Task.created_at.desc()).all()

# @app.get("/api/employee/tasks/{task_id}", response_model=schemas.TaskOut)
# def employee_get_task(task_id: str, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.employee_id == current["sub"]).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     return task

# @app.get("/api/employee/tasks/{task_id}/download")
# def download_task_zip(task_id: str, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.employee_id == current["sub"]).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     return FileResponse(task.zip_file_path, media_type="application/zip", filename=f"task_{task_id}.zip")

# @app.get("/api/employee/notifications")
# def get_notifications(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     return db.query(models.Notification).filter(
#         models.Notification.user_id == current["sub"],
#         models.Notification.read == False
#     ).order_by(models.Notification.created_at.desc()).all()

# @app.post("/api/employee/tasks/{task_id}/send-update")
# def send_update(task_id: str, body: schemas.SendUpdateRequest, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.employee_id == current["sub"]).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     update = models.TaskUpdate(
#         id=str(uuid.uuid4()),
#         task_id=task_id,
#         files_completed=body.files_completed,
#         files_remaining=body.files_remaining,
#         comments=body.comments,
#         classification_data=json.dumps(body.classification_data) if body.classification_data else None,
#         created_at=datetime.utcnow()
#     )
#     db.add(update)
#     # mark notifications as read
#     db.query(models.Notification).filter(
#         models.Notification.task_id == task_id,
#         models.Notification.user_id == current["sub"]
#     ).update({"read": True})
#     db.commit()
#     return {"ok": True}

# @app.post("/api/employee/tasks/{task_id}/upload-completed")
# async def upload_completed(
#     task_id: str,
#     file: UploadFile = File(...),
#     current=Depends(auth.get_current_user),
#     db: Session = Depends(get_db)
# ):
#     task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.employee_id == current["sub"]).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     path = f"uploads/completed/{task_id}_{file.filename}"
#     with open(path, "wb") as f:
#         content = await file.read()
#         f.write(content)
#     task.completed_zip_path = path
#     task.status = "completed"
#     db.commit()
#     return {"ok": True}

# @app.patch("/api/employee/tasks/{task_id}/status")
# def update_task_status(task_id: str, body: schemas.UpdateStatusRequest, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.employee_id == current["sub"]).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     task.status = body.status
#     db.commit()
#     return {"ok": True}

# # ─── WEBSOCKET ───────────────────────────────────────────────────────────────

# @app.websocket("/ws/{user_id}")
# async def websocket_endpoint(websocket: WebSocket, user_id: str):
#     await manager.connect(user_id, websocket)
#     try:
#         while True:
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(user_id, websocket)


# from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# from sqlalchemy.orm import Session
# from typing import Optional, List
# import json, os, uuid, shutil, httpx, re, tempfile
# from datetime import datetime
# from pathlib import Path
# from io import BytesIO
# import zipfile

# from database import SessionLocal, engine, Base
# import models, schemas, auth
# from websocket_manager import ConnectionManager

# Base.metadata.create_all(bind=engine)

# app = FastAPI(title="FileClassify API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# os.makedirs("uploads/tasks", exist_ok=True)
# os.makedirs("uploads/completed", exist_ok=True)
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
# manager = ConnectionManager()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # ── OneDrive helpers ──────────────────────────────────────────────────────────

# def extract_onedrive_share_id(url: str) -> str:
#     """
#     Convert a human-readable OneDrive share URL to the encoded share ID
#     needed by the Microsoft Graph API sharing endpoint.
    
#     Graph docs: GET /shares/{shareId}/driveItem
#     shareId = base64url( "u!" + url ) with padding replaced by "-_="
#     """
#     import base64
#     encoded = base64.urlsafe_b64encode(("u!" + url).encode()).decode()
#     # Remove padding '=' and replace '+' → '-', '/' → '_'
#     encoded = encoded.rstrip("=").replace("+", "-").replace("/", "_")
#     return encoded


# async def fetch_onedrive_folder_as_zip(share_url: str, zip_path: str) -> None:
#     """
#     1. Resolve the shared folder URL via Graph sharing API (no auth needed
#        for public/anyone-can-view links).
#     2. Recursively list all files.
#     3. Download each file and pack them into a ZIP at zip_path.
#     """
#     share_id = extract_onedrive_share_id(share_url)
#     graph_base = "https://graph.microsoft.com/v1.0"

#     async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:

#         # Step 1: resolve share to a driveItem
#         root_res = await client.get(
#             f"{graph_base}/shares/{share_id}/driveItem",
#             headers={"Accept": "application/json"},
#         )
#         if root_res.status_code != 200:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Could not access OneDrive link (status {root_res.status_code}). "
#                        "Make sure the link is set to 'Anyone with the link can view'."
#             )

#         root_item = root_res.json()
#         if "folder" not in root_item:
#             raise HTTPException(status_code=400, detail="The shared link must point to a folder, not a file.")

#         drive_id = root_item["parentReference"]["driveId"]
#         item_id = root_item["id"]

#         # Step 2: recursively collect all files
#         all_files: list[dict] = []  # each: {relative_path, download_url}

#         async def collect_files(did: str, iid: str, prefix: str):
#             children_res = await client.get(
#                 f"{graph_base}/drives/{did}/items/{iid}/children"
#                 "?$select=id,name,file,folder,@microsoft.graph.downloadUrl",
#                 headers={"Accept": "application/json"},
#             )
#             if children_res.status_code != 200:
#                 return
#             for child in children_res.json().get("value", []):
#                 child_path = f"{prefix}/{child['name']}" if prefix else child["name"]
#                 if "file" in child:
#                     dl_url = child.get("@microsoft.graph.downloadUrl", "")
#                     if dl_url:
#                         all_files.append({"path": child_path, "url": dl_url})
#                 elif "folder" in child:
#                     await collect_files(did, child["id"], child_path)

#         await collect_files(drive_id, item_id, "")

#         if not all_files:
#             raise HTTPException(status_code=400, detail="The OneDrive folder appears to be empty.")

#         # Step 3: download files and write to ZIP
#         with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
#             for entry in all_files:
#                 dl_res = await client.get(entry["url"])
#                 if dl_res.status_code == 200:
#                     zf.writestr(entry["path"], dl_res.content)


# # ── startup ───────────────────────────────────────────────────────────────────

# @app.on_event("startup")
# def seed_admin():
#     db = SessionLocal()
#     admin = db.query(models.User).filter(models.User.email == "admin@fileclassify.com").first()
#     if not admin:
#         admin_user = models.User(
#             id=str(uuid.uuid4()),
#             email="admin@fileclassify.com",
#             hashed_password=auth.hash_password("admin123"),
#             role="admin",
#             name="Admin"
#         )
#         db.add(admin_user)
#         db.commit()
#     db.close()

# # ── AUTH ──────────────────────────────────────────────────────────────────────

# @app.post("/api/auth/login", response_model=schemas.TokenResponse)
# def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.email == body.email).first()
#     if not user or not auth.verify_password(body.password, user.hashed_password):
#         raise HTTPException(status_code=401, detail="Invalid credentials")
#     token = auth.create_token({"sub": user.id, "role": user.role})
#     return {"token": token, "role": user.role, "name": user.name, "id": user.id}

# @app.get("/api/auth/me", response_model=schemas.UserOut)
# def me(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.id == current["sub"]).first()
#     if not user:
#         raise HTTPException(status_code=404)
#     return user

# # ── ADMIN: USERS ──────────────────────────────────────────────────────────────

# @app.get("/api/admin/users", response_model=List[schemas.UserOut])
# def list_users(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     return db.query(models.User).filter(models.User.role == "employee").all()

# @app.post("/api/admin/users", response_model=schemas.UserOut)
# def create_user(body: schemas.CreateUserRequest, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     existing = db.query(models.User).filter(models.User.email == body.email).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already exists")
#     user = models.User(
#         id=str(uuid.uuid4()),
#         email=body.email,
#         name=body.name,
#         hashed_password=auth.hash_password(body.password),
#         role="employee"
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)
#     return user

# @app.delete("/api/admin/users/{user_id}")
# def delete_user(user_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404)
#     db.delete(user)
#     db.commit()
#     return {"ok": True}

# # ── ADMIN: TASKS ──────────────────────────────────────────────────────────────

# @app.post("/api/admin/tasks", response_model=schemas.TaskOut)
# async def create_task(
#     employee_id: str = Form(...),
#     title: str = Form(...),
#     description: str = Form(""),
#     classifications: str = Form(...),
#     # local upload (optional)
#     file: Optional[UploadFile] = File(None),
#     # onedrive (optional)
#     onedrive_url: Optional[str] = Form(None),
#     current=Depends(auth.require_admin),
#     db: Session = Depends(get_db)
# ):
#     task_id = str(uuid.uuid4())

#     if onedrive_url:
#         # ── OneDrive path ────────────────────────────────────────────────────
#         zip_path = f"uploads/tasks/{task_id}_onedrive.zip"
#         await fetch_onedrive_folder_as_zip(onedrive_url, zip_path)
#         file_path = zip_path

#     elif file:
#         # ── Local upload path ────────────────────────────────────────────────
#         file_path = f"uploads/tasks/{task_id}_{file.filename}"
#         with open(file_path, "wb") as f:
#             content = await file.read()
#             f.write(content)

#     else:
#         raise HTTPException(status_code=400, detail="Provide either a file upload or a OneDrive URL")

#     task = models.Task(
#         id=task_id,
#         title=title,
#         description=description,
#         employee_id=employee_id,
#         classifications=classifications,
#         zip_file_path=file_path,
#         status="assigned",
#         created_at=datetime.utcnow()
#     )
#     db.add(task)
#     db.commit()
#     db.refresh(task)
#     await manager.broadcast_to_user(employee_id, {"type": "new_task", "task_id": task_id})
#     return task

# @app.get("/api/admin/tasks", response_model=List[schemas.TaskOut])
# def list_all_tasks(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     return db.query(models.Task).order_by(models.Task.created_at.desc()).all()

# @app.get("/api/admin/tasks/{task_id}", response_model=schemas.TaskOut)
# def get_task(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     return task

# @app.post("/api/admin/tasks/{task_id}/request-update")
# async def request_update(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     notif = models.Notification(
#         id=str(uuid.uuid4()),
#         task_id=task_id,
#         user_id=task.employee_id,
#         type="update_request",
#         message="Admin has requested a progress update",
#         created_at=datetime.utcnow()
#     )
#     db.add(notif)
#     db.commit()
#     await manager.broadcast_to_user(task.employee_id, {"type": "update_request", "task_id": task_id})
#     return {"ok": True}

# @app.get("/api/admin/tasks/{task_id}/updates")
# def get_task_updates(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     return db.query(models.TaskUpdate).filter(
#         models.TaskUpdate.task_id == task_id
#     ).order_by(models.TaskUpdate.created_at.desc()).all()

# @app.get("/api/admin/tasks/{task_id}/download-zip")
# def download_completed_zip(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id).first()
#     if not task or not task.completed_zip_path:
#         raise HTTPException(status_code=404, detail="No completed ZIP")
#     return FileResponse(task.completed_zip_path, media_type="application/zip", filename=f"completed_{task_id}.zip")

# @app.get("/api/admin/analytics")
# def get_analytics(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     users = db.query(models.User).filter(models.User.role == "employee").all()
#     tasks = db.query(models.Task).all()
#     updates = db.query(models.TaskUpdate).all()
#     emp_stats = []
#     for u in users:
#         emp_tasks = [t for t in tasks if t.employee_id == u.id]
#         completed = len([t for t in emp_tasks if t.status == "completed"])
#         emp_stats.append({
#             "name": u.name,
#             "total": len(emp_tasks),
#             "completed": completed,
#             "in_progress": len(emp_tasks) - completed
#         })
#     classification_totals = {}
#     for upd in updates:
#         if upd.classification_data:
#             try:
#                 data = json.loads(upd.classification_data)
#                 for k, v in data.items():
#                     classification_totals[k] = classification_totals.get(k, 0) + (v or 0)
#             except:
#                 pass
#     return {
#         "employee_stats": emp_stats,
#         "classification_totals": classification_totals,
#         "total_tasks": len(tasks),
#         "completed_tasks": len([t for t in tasks if t.status == "completed"]),
#         "total_employees": len(users)
#     }

# # ── EMPLOYEE ──────────────────────────────────────────────────────────────────

# @app.get("/api/employee/tasks", response_model=List[schemas.TaskOut])
# def employee_tasks(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     return db.query(models.Task).filter(
#         models.Task.employee_id == current["sub"]
#     ).order_by(models.Task.created_at.desc()).all()

# @app.get("/api/employee/tasks/{task_id}", response_model=schemas.TaskOut)
# def employee_get_task(task_id: str, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     return task

# @app.get("/api/employee/tasks/{task_id}/download")
# def download_task_zip(task_id: str, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     return FileResponse(task.zip_file_path, media_type="application/zip", filename=f"task_{task_id}.zip")

# @app.get("/api/employee/notifications")
# def get_notifications(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     return db.query(models.Notification).filter(
#         models.Notification.user_id == current["sub"],
#         models.Notification.read == False
#     ).order_by(models.Notification.created_at.desc()).all()

# @app.post("/api/employee/tasks/{task_id}/send-update")
# def send_update(task_id: str, body: schemas.SendUpdateRequest, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     update = models.TaskUpdate(
#         id=str(uuid.uuid4()),
#         task_id=task_id,
#         files_completed=body.files_completed,
#         files_remaining=body.files_remaining,
#         comments=body.comments,
#         classification_data=json.dumps(body.classification_data) if body.classification_data else None,
#         created_at=datetime.utcnow()
#     )
#     db.add(update)
#     db.query(models.Notification).filter(
#         models.Notification.task_id == task_id,
#         models.Notification.user_id == current["sub"]
#     ).update({"read": True})
#     db.commit()
#     return {"ok": True}

# @app.post("/api/employee/tasks/{task_id}/upload-completed")
# async def upload_completed(
#     task_id: str,
#     file: UploadFile = File(...),
#     current=Depends(auth.get_current_user),
#     db: Session = Depends(get_db)
# ):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     path = f"uploads/completed/{task_id}_{file.filename}"
#     with open(path, "wb") as f:
#         content = await file.read()
#         f.write(content)
#     task.completed_zip_path = path
#     task.status = "completed"
#     db.commit()
#     return {"ok": True}

# @app.patch("/api/employee/tasks/{task_id}/status")
# def update_task_status(task_id: str, body: schemas.UpdateStatusRequest, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     task.status = body.status
#     db.commit()
#     return {"ok": True}

# # ── WEBSOCKET ─────────────────────────────────────────────────────────────────

# @app.websocket("/ws/{user_id}")
# async def websocket_endpoint(websocket: WebSocket, user_id: str):
#     await manager.connect(user_id, websocket)
#     try:
#         while True:
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(user_id, websocket)


# from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# from sqlalchemy.orm import Session
# from typing import Optional, List
# import json, os, uuid, shutil, httpx, re, tempfile
# from datetime import datetime
# from pathlib import Path
# from io import BytesIO
# import zipfile

# from database import SessionLocal, engine, Base
# import models, schemas, auth
# from websocket_manager import ConnectionManager

# Base.metadata.create_all(bind=engine)

# app = FastAPI(title="FileClassify API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# os.makedirs("uploads/tasks", exist_ok=True)
# os.makedirs("uploads/completed", exist_ok=True)
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
# manager = ConnectionManager()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # ── OneDrive helpers ──────────────────────────────────────────────────────────

# def extract_onedrive_share_id(url: str) -> str:
#     """
#     Convert a human-readable OneDrive share URL to the encoded share ID
#     needed by the Microsoft Graph API sharing endpoint.
    
#     Graph docs: GET /shares/{shareId}/driveItem
#     shareId = base64url( "u!" + url ) with padding replaced by "-_="
#     """
#     import base64
#     encoded = base64.urlsafe_b64encode(("u!" + url).encode()).decode()
#     # Remove padding '=' and replace '+' → '-', '/' → '_'
#     encoded = encoded.rstrip("=").replace("+", "-").replace("/", "_")
#     return encoded


# async def fetch_onedrive_by_ids(drive_id: str, item_id: str, zip_path: str) -> None:
#     """Download all files from a specific OneDrive folder (by driveId + itemId) into a ZIP."""
#     graph_base = "https://graph.microsoft.com/v1.0"
#     async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
#         all_files: list[dict] = []

#         async def collect_files(did: str, iid: str, prefix: str):
#             url = (
#                 f"{graph_base}/drives/{did}/items/{iid}/children"
#                 "?$select=id,name,file,folder,@microsoft.graph.downloadUrl"
#             )
#             res = await client.get(url, headers={"Accept": "application/json"})
#             if res.status_code != 200:
#                 return
#             for child in res.json().get("value", []):
#                 child_path = f"{prefix}/{child['name']}" if prefix else child["name"]
#                 if "file" in child:
#                     dl_url = child.get("@microsoft.graph.downloadUrl", "")
#                     if dl_url:
#                         all_files.append({"path": child_path, "url": dl_url})
#                 elif "folder" in child:
#                     await collect_files(did, child["id"], child_path)

#         await collect_files(drive_id, item_id, "")
#         if not all_files:
#             raise HTTPException(status_code=400, detail="The selected OneDrive folder appears to be empty.")
#         with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
#             for entry in all_files:
#                 dl_res = await client.get(entry["url"])
#                 if dl_res.status_code == 200:
#                     zf.writestr(entry["path"], dl_res.content)


# async def fetch_onedrive_folder_as_zip(share_url: str, zip_path: str) -> None:
#     """
#     1. Resolve the shared folder URL via Graph sharing API (no auth needed
#        for public/anyone-can-view links).
#     2. Recursively list all files.
#     3. Download each file and pack them into a ZIP at zip_path.
#     """
#     share_id = extract_onedrive_share_id(share_url)
#     graph_base = "https://graph.microsoft.com/v1.0"

#     async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:

#         # Step 1: resolve share to a driveItem
#         root_res = await client.get(
#             f"{graph_base}/shares/{share_id}/driveItem",
#             headers={"Accept": "application/json"},
#         )
#         if root_res.status_code != 200:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Could not access OneDrive link (status {root_res.status_code}). "
#                        "Make sure the link is set to 'Anyone with the link can view'."
#             )

#         root_item = root_res.json()
#         if "folder" not in root_item:
#             raise HTTPException(status_code=400, detail="The shared link must point to a folder, not a file.")

#         drive_id = root_item["parentReference"]["driveId"]
#         item_id = root_item["id"]

#         # Step 2: recursively collect all files
#         all_files: list[dict] = []  # each: {relative_path, download_url}

#         async def collect_files(did: str, iid: str, prefix: str):
#             children_res = await client.get(
#                 f"{graph_base}/drives/{did}/items/{iid}/children"
#                 "?$select=id,name,file,folder,@microsoft.graph.downloadUrl",
#                 headers={"Accept": "application/json"},
#             )
#             if children_res.status_code != 200:
#                 return
#             for child in children_res.json().get("value", []):
#                 child_path = f"{prefix}/{child['name']}" if prefix else child["name"]
#                 if "file" in child:
#                     dl_url = child.get("@microsoft.graph.downloadUrl", "")
#                     if dl_url:
#                         all_files.append({"path": child_path, "url": dl_url})
#                 elif "folder" in child:
#                     await collect_files(did, child["id"], child_path)

#         await collect_files(drive_id, item_id, "")

#         if not all_files:
#             raise HTTPException(status_code=400, detail="The OneDrive folder appears to be empty.")

#         # Step 3: download files and write to ZIP
#         with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
#             for entry in all_files:
#                 dl_res = await client.get(entry["url"])
#                 if dl_res.status_code == 200:
#                     zf.writestr(entry["path"], dl_res.content)


# # ── startup ───────────────────────────────────────────────────────────────────

# @app.on_event("startup")
# def seed_admin():
#     db = SessionLocal()
#     admin = db.query(models.User).filter(models.User.email == "admin@fileclassify.com").first()
#     if not admin:
#         admin_user = models.User(
#             id=str(uuid.uuid4()),
#             email="admin@fileclassify.com",
#             hashed_password=auth.hash_password("admin123"),
#             role="admin",
#             name="Admin"
#         )
#         db.add(admin_user)
#         db.commit()
#     db.close()

# # ── AUTH ──────────────────────────────────────────────────────────────────────

# @app.post("/api/auth/login", response_model=schemas.TokenResponse)
# def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.email == body.email).first()
#     if not user or not auth.verify_password(body.password, user.hashed_password):
#         raise HTTPException(status_code=401, detail="Invalid credentials")
#     token = auth.create_token({"sub": user.id, "role": user.role})
#     return {"token": token, "role": user.role, "name": user.name, "id": user.id}

# @app.get("/api/auth/me", response_model=schemas.UserOut)
# def me(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.id == current["sub"]).first()
#     if not user:
#         raise HTTPException(status_code=404)
#     return user

# # ── ADMIN: USERS ──────────────────────────────────────────────────────────────

# @app.get("/api/admin/users", response_model=List[schemas.UserOut])
# def list_users(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     return db.query(models.User).filter(models.User.role == "employee").all()

# @app.post("/api/admin/users", response_model=schemas.UserOut)
# def create_user(body: schemas.CreateUserRequest, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     existing = db.query(models.User).filter(models.User.email == body.email).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already exists")
#     user = models.User(
#         id=str(uuid.uuid4()),
#         email=body.email,
#         name=body.name,
#         hashed_password=auth.hash_password(body.password),
#         role="employee"
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)
#     return user

# @app.delete("/api/admin/users/{user_id}")
# def delete_user(user_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404)
#     db.delete(user)
#     db.commit()
#     return {"ok": True}

# # ── ADMIN: TASKS ──────────────────────────────────────────────────────────────

# @app.post("/api/admin/tasks", response_model=schemas.TaskOut)
# async def create_task(
#     employee_id: str = Form(...),
#     title: str = Form(...),
#     description: str = Form(""),
#     classifications: str = Form(...),
#     file: Optional[UploadFile] = File(None),
#     onedrive_url: Optional[str] = Form(None),
#     onedrive_drive_id: Optional[str] = Form(None),
#     onedrive_item_id: Optional[str] = Form(None),
#     onedrive_folder_name: Optional[str] = Form(None),
#     current=Depends(auth.require_admin),
#     db: Session = Depends(get_db)
# ):
#     task_id = str(uuid.uuid4())

#     if onedrive_drive_id and onedrive_item_id:
#         # Frontend resolved the exact folder — download it directly by IDs
#         folder_name = onedrive_folder_name or "onedrive"
#         zip_path = f"uploads/tasks/{task_id}_{folder_name}.zip"
#         await fetch_onedrive_by_ids(onedrive_drive_id, onedrive_item_id, zip_path)
#         file_path = zip_path

#     elif onedrive_url:
#         # Fallback: resolve from share URL
#         zip_path = f"uploads/tasks/{task_id}_onedrive.zip"
#         await fetch_onedrive_folder_as_zip(onedrive_url, zip_path)
#         file_path = zip_path

#     elif file:
#         file_path = f"uploads/tasks/{task_id}_{file.filename}"
#         with open(file_path, "wb") as fh:
#             content_bytes = await file.read()
#             fh.write(content_bytes)

#     else:
#         raise HTTPException(status_code=400, detail="Provide either a file upload or a OneDrive folder")

#     task = models.Task(
#         id=task_id,
#         title=title,
#         description=description,
#         employee_id=employee_id,
#         classifications=classifications,
#         zip_file_path=file_path,
#         status="assigned",
#         created_at=datetime.utcnow()
#     )
#     db.add(task)
#     db.commit()
#     db.refresh(task)
#     await manager.broadcast_to_user(employee_id, {"type": "new_task", "task_id": task_id})
#     return task

# @app.get("/api/admin/tasks", response_model=List[schemas.TaskOut])
# def list_all_tasks(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     return db.query(models.Task).order_by(models.Task.created_at.desc()).all()

# @app.get("/api/admin/tasks/{task_id}", response_model=schemas.TaskOut)
# def get_task(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     return task

# @app.post("/api/admin/tasks/{task_id}/request-update")
# async def request_update(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     notif = models.Notification(
#         id=str(uuid.uuid4()),
#         task_id=task_id,
#         user_id=task.employee_id,
#         type="update_request",
#         message="Admin has requested a progress update",
#         created_at=datetime.utcnow()
#     )
#     db.add(notif)
#     db.commit()
#     await manager.broadcast_to_user(task.employee_id, {"type": "update_request", "task_id": task_id})
#     return {"ok": True}

# @app.get("/api/admin/tasks/{task_id}/updates")
# def get_task_updates(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     return db.query(models.TaskUpdate).filter(
#         models.TaskUpdate.task_id == task_id
#     ).order_by(models.TaskUpdate.created_at.desc()).all()

# @app.get("/api/admin/tasks/{task_id}/download-zip")
# def download_completed_zip(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(models.Task.id == task_id).first()
#     if not task or not task.completed_zip_path:
#         raise HTTPException(status_code=404, detail="No completed ZIP")
#     return FileResponse(task.completed_zip_path, media_type="application/zip", filename=f"completed_{task_id}.zip")

# @app.get("/api/admin/analytics")
# def get_analytics(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
#     users = db.query(models.User).filter(models.User.role == "employee").all()
#     tasks = db.query(models.Task).all()
#     updates = db.query(models.TaskUpdate).all()
#     emp_stats = []
#     for u in users:
#         emp_tasks = [t for t in tasks if t.employee_id == u.id]
#         completed = len([t for t in emp_tasks if t.status == "completed"])
#         emp_stats.append({
#             "name": u.name,
#             "total": len(emp_tasks),
#             "completed": completed,
#             "in_progress": len(emp_tasks) - completed
#         })
#     classification_totals = {}
#     for upd in updates:
#         if upd.classification_data:
#             try:
#                 data = json.loads(upd.classification_data)
#                 for k, v in data.items():
#                     classification_totals[k] = classification_totals.get(k, 0) + (v or 0)
#             except:
#                 pass
#     return {
#         "employee_stats": emp_stats,
#         "classification_totals": classification_totals,
#         "total_tasks": len(tasks),
#         "completed_tasks": len([t for t in tasks if t.status == "completed"]),
#         "total_employees": len(users)
#     }

# # ── EMPLOYEE ──────────────────────────────────────────────────────────────────

# @app.get("/api/employee/tasks", response_model=List[schemas.TaskOut])
# def employee_tasks(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     return db.query(models.Task).filter(
#         models.Task.employee_id == current["sub"]
#     ).order_by(models.Task.created_at.desc()).all()

# @app.get("/api/employee/tasks/{task_id}", response_model=schemas.TaskOut)
# def employee_get_task(task_id: str, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     return task

# @app.get("/api/employee/tasks/{task_id}/download")
# def download_task_zip(task_id: str, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     return FileResponse(task.zip_file_path, media_type="application/zip", filename=f"task_{task_id}.zip")

# @app.get("/api/employee/notifications")
# def get_notifications(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     return db.query(models.Notification).filter(
#         models.Notification.user_id == current["sub"],
#         models.Notification.read == False
#     ).order_by(models.Notification.created_at.desc()).all()

# @app.post("/api/employee/tasks/{task_id}/send-update")
# def send_update(task_id: str, body: schemas.SendUpdateRequest, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     update = models.TaskUpdate(
#         id=str(uuid.uuid4()),
#         task_id=task_id,
#         files_completed=body.files_completed,
#         files_remaining=body.files_remaining,
#         comments=body.comments,
#         classification_data=json.dumps(body.classification_data) if body.classification_data else None,
#         created_at=datetime.utcnow()
#     )
#     db.add(update)
#     db.query(models.Notification).filter(
#         models.Notification.task_id == task_id,
#         models.Notification.user_id == current["sub"]
#     ).update({"read": True})
#     db.commit()
#     return {"ok": True}

# @app.post("/api/employee/tasks/{task_id}/upload-completed")
# async def upload_completed(
#     task_id: str,
#     file: UploadFile = File(...),
#     current=Depends(auth.get_current_user),
#     db: Session = Depends(get_db)
# ):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     path = f"uploads/completed/{task_id}_{file.filename}"
#     with open(path, "wb") as f:
#         content = await file.read()
#         f.write(content)
#     task.completed_zip_path = path
#     task.status = "completed"
#     db.commit()
#     return {"ok": True}

# @app.patch("/api/employee/tasks/{task_id}/status")
# def update_task_status(task_id: str, body: schemas.UpdateStatusRequest, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
#     task = db.query(models.Task).filter(
#         models.Task.id == task_id,
#         models.Task.employee_id == current["sub"]
#     ).first()
#     if not task:
#         raise HTTPException(status_code=404)
#     task.status = body.status
#     db.commit()
#     return {"ok": True}

# # ── WEBSOCKET ─────────────────────────────────────────────────────────────────

# @app.websocket("/ws/{user_id}")
# async def websocket_endpoint(websocket: WebSocket, user_id: str):
#     await manager.connect(user_id, websocket)
#     try:
#         while True:
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(user_id, websocket)


from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import json, os, uuid, httpx, base64, zipfile, io
from datetime import datetime
from pathlib import Path

from database import SessionLocal, engine, Base
import models, schemas, auth
from websocket_manager import ConnectionManager
from pg_database import get_pg_connection, get_pg_cursor
from dedup_router import router as dedup_router
import psycopg2
import psycopg2.extras

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FileClassify API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(dedup_router)
os.makedirs("uploads/tasks", exist_ok=True)
os.makedirs("uploads/completed", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
manager = ConnectionManager()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── startup ───────────────────────────────────────────────────

@app.on_event("startup")
def seed_admin():
    db = SessionLocal()
    admin = db.query(models.User).filter(models.User.email == "admin@fileclassify.com").first()
    if not admin:
        admin_user = models.User(
            id=str(uuid.uuid4()),
            email="admin@fileclassify.com",
            hashed_password=auth.hash_password("admin123"),
            role="admin",
            name="Admin",
        )
        db.add(admin_user)
        db.commit()
    db.close()


# ── AUTH ──────────────────────────────────────────────────────

@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not auth.verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_token({"sub": user.id, "role": user.role})
    return {"token": token, "role": user.role, "name": user.name, "id": user.id}


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current["sub"]).first()
    if not user:
        raise HTTPException(status_code=404)
    return user


# ── ADMIN: USERS ──────────────────────────────────────────────

@app.get("/api/admin/users", response_model=List[schemas.UserOut])
def list_users(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == "employee").all()


@app.post("/api/admin/users", response_model=schemas.UserOut)
def create_user(body: schemas.CreateUserRequest, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    user = models.User(
        id=str(uuid.uuid4()),
        email=body.email,
        name=body.name,
        hashed_password=auth.hash_password(body.password),
        role="employee",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404)
    db.delete(user)
    db.commit()
    return {"ok": True}


# ── ADMIN: POSTGRESQL FOLDER BROWSER ─────────────────────────

@app.get("/api/admin/db-folders")
def list_db_folders(current=Depends(auth.require_admin)):
    """Return all folders stored in PostgreSQL with file count & total size."""
    try:
        conn = get_pg_connection()
        cur = get_pg_cursor(conn)
        cur.execute("""
            SELECT
                f.id,
                f.name,
                f.description,
                f.created_at,
                COUNT(ff.id)                   AS file_count,
                COALESCE(SUM(ff.file_size), 0) AS total_bytes
            FROM folders f
            LEFT JOIN folder_files ff ON ff.folder_id = f.id
            GROUP BY f.id
            ORDER BY f.created_at DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [
            {
                "id": r["id"],
                "name": r["name"],
                "description": r["description"] or "",
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "file_count": r["file_count"],
                "total_bytes": r["total_bytes"],
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/admin/db-folders/{folder_id}/files")
def list_db_folder_files(folder_id: int, current=Depends(auth.require_admin)):
    """List files inside a specific PostgreSQL folder (no binary data)."""
    try:
        conn = get_pg_connection()
        cur = get_pg_cursor(conn)
        cur.execute(
            "SELECT id, filename, mime_type, file_size, created_at "
            "FROM folder_files WHERE folder_id = %s ORDER BY filename",
            (folder_id,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [
            {
                "id": r["id"],
                "filename": r["filename"],
                "mime_type": r["mime_type"],
                "file_size": r["file_size"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/admin/db-folders/{folder_id}/download-zip")
def download_db_folder_zip(folder_id: int, current=Depends(auth.require_admin)):
    """Stream a ZIP of all files in the given PostgreSQL folder."""
    try:
        conn = get_pg_connection()
        cur = get_pg_cursor(conn)

        # Get folder name
        cur.execute("SELECT name FROM folders WHERE id = %s", (folder_id,))
        folder_row = cur.fetchone()
        if not folder_row:
            raise HTTPException(status_code=404, detail="Folder not found in database")

        folder_name = folder_row["name"]

        # Get all files
        cur.execute(
            "SELECT filename, file_data FROM folder_files WHERE folder_id = %s ORDER BY filename",
            (folder_id,),
        )
        files = cur.fetchall()
        cur.close()
        conn.close()

        if not files:
            raise HTTPException(status_code=400, detail="This folder has no files in the database")

        # Build ZIP in memory
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in files:
                data = bytes(f["file_data"])  # psycopg2 returns memoryview
                zf.writestr(f["filename"], data)
        buf.seek(0)

        return StreamingResponse(
            buf,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{folder_name}.zip"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/admin/db-folders/upload")
async def upload_folder_to_db(
    folder_name: str = Form(...),
    description: str = Form(""),
    files: List[UploadFile] = File(...),
    current=Depends(auth.require_admin),
):
    """Upload multiple files into a new PostgreSQL folder."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    try:
        conn = get_pg_connection()
        cur = conn.cursor()

        # Create folder
        cur.execute(
            "INSERT INTO folders (name, description) VALUES (%s, %s) RETURNING id",
            (folder_name, description),
        )
        folder_id = cur.fetchone()[0]

        # Insert each file
        for upload in files:
            content = await upload.read()
            cur.execute(
                "INSERT INTO folder_files (folder_id, filename, file_data, mime_type, file_size) "
                "VALUES (%s, %s, %s, %s, %s)",
                (
                    folder_id,
                    upload.filename,
                    psycopg2.Binary(content),
                    upload.content_type or "application/octet-stream",
                    len(content),
                ),
            )

        conn.commit()
        cur.close()
        conn.close()
        return {"ok": True, "folder_id": folder_id, "folder_name": folder_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


# ── ADMIN: ONEDRIVE PROXY ─────────────────────────────────────

def _encode_share_id(url: str) -> str:
    encoded = base64.urlsafe_b64encode(("u!" + url).encode()).decode()
    return encoded.rstrip("=").replace("+", "-").replace("/", "_")


@app.post("/api/admin/onedrive/list-folders")
async def onedrive_list_folders(body: dict, current=Depends(auth.require_admin)):
    """
    Server-side proxy: resolves a OneDrive share URL and returns the folder tree.
    Body: { "share_url": "https://..." }
    """
    share_url = (body.get("share_url") or "").strip()
    if not share_url:
        raise HTTPException(status_code=400, detail="share_url is required")

    share_id = _encode_share_id(share_url)
    graph_base = "https://graph.microsoft.com/v1.0"

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        # Resolve share → driveItem
        root_res = await client.get(
            f"{graph_base}/shares/{share_id}/driveItem?$select=id,name,folder,parentReference",
            headers={"Accept": "application/json"},
        )
        if root_res.status_code != 200:
            err = root_res.json().get("error", {}).get("message", f"HTTP {root_res.status_code}")
            raise HTTPException(
                status_code=400,
                detail=f"Cannot access OneDrive link: {err}. "
                       "Make sure it is set to 'Anyone with the link can view'.",
            )

        root_item = root_res.json()
        if "folder" not in root_item:
            raise HTTPException(status_code=400, detail="The shared link must point to a folder, not a file.")

        drive_id = root_item["parentReference"]["driveId"]
        root_item_id = root_item["id"]

        # Fetch first-level children
        children_res = await client.get(
            f"{graph_base}/drives/{drive_id}/items/{root_item_id}/children"
            "?$select=id,name,file,folder",
            headers={"Accept": "application/json"},
        )
        children = children_res.json().get("value", []) if children_res.status_code == 200 else []

        nodes = sorted(
            [
                {
                    "id": c["id"],
                    "name": c["name"],
                    "type": "folder" if "folder" in c else "file",
                    "childCount": c.get("folder", {}).get("childCount", 0),
                }
                for c in children
            ],
            key=lambda x: (x["type"] != "folder", x["name"].lower()),
        )

        return {"drive_id": drive_id, "root_item_id": root_item_id, "children": nodes}


@app.post("/api/admin/onedrive/list-children")
async def onedrive_list_children(body: dict, current=Depends(auth.require_admin)):
    """
    Server-side proxy: list children of any OneDrive folder by driveId + itemId.
    Body: { "drive_id": "...", "item_id": "..." }
    """
    drive_id = (body.get("drive_id") or "").strip()
    item_id = (body.get("item_id") or "").strip()
    if not drive_id or not item_id:
        raise HTTPException(status_code=400, detail="drive_id and item_id are required")

    graph_base = "https://graph.microsoft.com/v1.0"
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        res = await client.get(
            f"{graph_base}/drives/{drive_id}/items/{item_id}/children?$select=id,name,file,folder",
            headers={"Accept": "application/json"},
        )
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Graph API error {res.status_code}")

        children = res.json().get("value", [])
        nodes = sorted(
            [
                {
                    "id": c["id"],
                    "name": c["name"],
                    "type": "folder" if "folder" in c else "file",
                    "childCount": c.get("folder", {}).get("childCount", 0),
                }
                for c in children
            ],
            key=lambda x: (x["type"] != "folder", x["name"].lower()),
        )
        return {"children": nodes}


# ── ADMIN: TASKS ──────────────────────────────────────────────

@app.post("/api/admin/tasks", response_model=schemas.TaskOut)
async def create_task(
    employee_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    classifications: str = Form(...),
    # source: "db_folder" | "onedrive" | "upload"
    source: str = Form("upload"),
    # DB folder
    db_folder_id: Optional[str] = Form(None),
    db_folder_name: Optional[str] = Form(None),
    # OneDrive (resolved server-side)
    onedrive_drive_id: Optional[str] = Form(None),
    onedrive_item_id: Optional[str] = Form(None),
    onedrive_folder_name: Optional[str] = Form(None),
    # ZIP upload
    file: Optional[UploadFile] = File(None),
    current=Depends(auth.require_admin),
    db: Session = Depends(get_db),
):
    task_id = str(uuid.uuid4())

    if source == "db_folder" and db_folder_id:
        # ── Pull from PostgreSQL ──────────────────────────────
        folder_name = db_folder_name or f"folder_{db_folder_id}"
        zip_path = f"uploads/tasks/{task_id}_{folder_name}.zip"
        try:
            conn = get_pg_connection()
            cur = get_pg_cursor(conn)
            cur.execute(
                "SELECT filename, file_data FROM folder_files WHERE folder_id = %s ORDER BY filename",
                (int(db_folder_id),),
            )
            files = cur.fetchall()
            cur.close()
            conn.close()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

        if not files:
            raise HTTPException(status_code=400, detail="Selected folder has no files")

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in files:
                zf.writestr(f["filename"], bytes(f["file_data"]))
        file_path = zip_path

    elif source == "onedrive" and onedrive_drive_id and onedrive_item_id:
        # ── Download from OneDrive server-side ────────────────
        folder_name = onedrive_folder_name or "onedrive"
        zip_path = f"uploads/tasks/{task_id}_{folder_name}.zip"
        await _fetch_onedrive_to_zip(onedrive_drive_id, onedrive_item_id, zip_path)
        file_path = zip_path

    elif source == "upload" and file:
        # ── Local ZIP upload ──────────────────────────────────
        file_path = f"uploads/tasks/{task_id}_{file.filename}"
        with open(file_path, "wb") as fh:
            fh.write(await file.read())

    else:
        raise HTTPException(status_code=400, detail="Provide a valid source (db_folder / onedrive / upload)")

    task = models.Task(
        id=task_id,
        title=title,
        description=description,
        employee_id=employee_id,
        classifications=classifications,
        zip_file_path=file_path,
        status="assigned",
        created_at=datetime.utcnow(),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    await manager.broadcast_to_user(employee_id, {"type": "new_task", "task_id": task_id})
    return task


async def _fetch_onedrive_to_zip(drive_id: str, item_id: str, zip_path: str) -> None:
    """Recursively download all files in a OneDrive folder and write to zip_path."""
    graph_base = "https://graph.microsoft.com/v1.0"
    all_files: list[dict] = []

    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        async def collect(did: str, iid: str, prefix: str):
            res = await client.get(
                f"{graph_base}/drives/{did}/items/{iid}/children"
                "?$select=id,name,file,folder,@microsoft.graph.downloadUrl",
                headers={"Accept": "application/json"},
            )
            if res.status_code != 200:
                return
            for child in res.json().get("value", []):
                child_path = f"{prefix}/{child['name']}" if prefix else child["name"]
                if "file" in child:
                    dl = child.get("@microsoft.graph.downloadUrl", "")
                    if dl:
                        all_files.append({"path": child_path, "url": dl})
                elif "folder" in child:
                    await collect(did, child["id"], child_path)

        await collect(drive_id, item_id, "")

        if not all_files:
            raise HTTPException(status_code=400, detail="The OneDrive folder appears to be empty.")

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for entry in all_files:
                dl_res = await client.get(entry["url"])
                if dl_res.status_code == 200:
                    zf.writestr(entry["path"], dl_res.content)


@app.get("/api/admin/tasks", response_model=List[schemas.TaskOut])
def list_all_tasks(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
    return db.query(models.Task).order_by(models.Task.created_at.desc()).all()


@app.get("/api/admin/tasks/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404)
    return task


@app.post("/api/admin/tasks/{task_id}/request-update")
async def request_update(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404)
    notif = models.Notification(
        id=str(uuid.uuid4()),
        task_id=task_id,
        user_id=task.employee_id,
        type="update_request",
        message="Admin has requested a progress update",
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    db.commit()
    await manager.broadcast_to_user(task.employee_id, {"type": "update_request", "task_id": task_id})
    return {"ok": True}


@app.get("/api/admin/tasks/{task_id}/updates")
def get_task_updates(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
    return db.query(models.TaskUpdate).filter(
        models.TaskUpdate.task_id == task_id
    ).order_by(models.TaskUpdate.created_at.desc()).all()


@app.get("/api/admin/tasks/{task_id}/download-zip")
def download_completed_zip(task_id: str, current=Depends(auth.require_admin), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task or not task.completed_zip_path:
        raise HTTPException(status_code=404, detail="No completed ZIP")
    return FileResponse(task.completed_zip_path, media_type="application/zip", filename=f"completed_{task_id}.zip")


@app.get("/api/admin/analytics")
def get_analytics(current=Depends(auth.require_admin), db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.role == "employee").all()
    tasks = db.query(models.Task).all()
    updates = db.query(models.TaskUpdate).all()
    emp_stats = []
    for u in users:
        emp_tasks = [t for t in tasks if t.employee_id == u.id]
        completed = len([t for t in emp_tasks if t.status == "completed"])
        emp_stats.append({
            "name": u.name,
            "total": len(emp_tasks),
            "completed": completed,
            "in_progress": len(emp_tasks) - completed,
        })
    classification_totals = {}
    for upd in updates:
        if upd.classification_data:
            try:
                data = json.loads(upd.classification_data)
                for k, v in data.items():
                    classification_totals[k] = classification_totals.get(k, 0) + (v or 0)
            except Exception:
                pass
    return {
        "employee_stats": emp_stats,
        "classification_totals": classification_totals,
        "total_tasks": len(tasks),
        "completed_tasks": len([t for t in tasks if t.status == "completed"]),
        "total_employees": len(users),
    }


# ── EMPLOYEE ──────────────────────────────────────────────────

@app.get("/api/employee/tasks", response_model=List[schemas.TaskOut])
def employee_tasks(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Task).filter(
        models.Task.employee_id == current["sub"]
    ).order_by(models.Task.created_at.desc()).all()


@app.get("/api/employee/tasks/{task_id}", response_model=schemas.TaskOut)
def employee_get_task(task_id: str, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.employee_id == current["sub"]
    ).first()
    if not task:
        raise HTTPException(status_code=404)
    return task


@app.get("/api/employee/tasks/{task_id}/download")
def download_task_zip(task_id: str, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.employee_id == current["sub"]
    ).first()
    if not task:
        raise HTTPException(status_code=404)
    return FileResponse(task.zip_file_path, media_type="application/zip", filename=f"task_{task_id}.zip")


@app.get("/api/employee/notifications")
def get_notifications(current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current["sub"],
        models.Notification.read == False,
    ).order_by(models.Notification.created_at.desc()).all()


@app.post("/api/employee/tasks/{task_id}/send-update")
def send_update(task_id: str, body: schemas.SendUpdateRequest, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.employee_id == current["sub"]
    ).first()
    if not task:
        raise HTTPException(status_code=404)
    update = models.TaskUpdate(
        id=str(uuid.uuid4()),
        task_id=task_id,
        files_completed=body.files_completed,
        files_remaining=body.files_remaining,
        comments=body.comments,
        classification_data=json.dumps(body.classification_data) if body.classification_data else None,
        created_at=datetime.utcnow(),
    )
    db.add(update)
    db.query(models.Notification).filter(
        models.Notification.task_id == task_id,
        models.Notification.user_id == current["sub"],
    ).update({"read": True})
    db.commit()
    return {"ok": True}


@app.post("/api/employee/tasks/{task_id}/upload-completed")
async def upload_completed(
    task_id: str,
    file: UploadFile = File(...),
    current=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.employee_id == current["sub"]
    ).first()
    if not task:
        raise HTTPException(status_code=404)
    path = f"uploads/completed/{task_id}_{file.filename}"
    with open(path, "wb") as f:
        f.write(await file.read())
    task.completed_zip_path = path
    task.status = "completed"
    db.commit()
    return {"ok": True}


@app.patch("/api/employee/tasks/{task_id}/status")
def update_task_status(task_id: str, body: schemas.UpdateStatusRequest, current=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.employee_id == current["sub"]
    ).first()
    if not task:
        raise HTTPException(status_code=404)
    task.status = body.status
    db.commit()
    return {"ok": True}


# ── WEBSOCKET ─────────────────────────────────────────────────

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

