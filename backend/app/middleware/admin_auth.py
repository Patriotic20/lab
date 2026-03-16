from core.config import settings
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request


import secrets
from datetime import datetime, timedelta

class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        
        if username == settings.admin.username and password == settings.admin.password:
            # Генерируем уникальный токен для каждой сессии
            request.session.update({
                "token": secrets.token_urlsafe(32),  # Случайный токен
                "login_time": datetime.now().isoformat()
            })
            return True
        return False
    
    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        login_time_str = request.session.get("login_time")
        
        if not token or not login_time_str:
            return False
        
        login_time = datetime.fromisoformat(login_time_str)
        expiry_time = timedelta(hours=1)
        
        if datetime.now() - login_time > expiry_time:
            request.session.clear()
            return False
        
        return True