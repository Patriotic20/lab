
import logging
import time
import jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from core.config import settings

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Extract User Info
        user_info = "Anonymous"
        auth_header = request.headers.get("Authorization")
        if auth_header:
            logger.debug(f"Auth header found: {auth_header[:10]}...") 
            
            token = auth_header
            if token.startswith("Bearer "):
                token = token.replace("Bearer ", "")

            try:
                # Decode with verification using settings
                payload = jwt.decode(token, settings.jwt.access_token_secret, algorithms=[settings.jwt.algorithm])
                user_id = payload.get("user_id")
                
                if user_id:
                    user_info = f"User({user_id})"
                    logger.debug(f"User extracted: {user_id}")
                else:
                    logger.debug(f"Token decoded but user_id missing. Payload keys: {list(payload.keys())}")

            except jwt.PyJWTError as e:
                user_info = "InvalidToken"
                logger.debug(f"Token validation failed: {str(e)}") 
        else:
            logger.debug("No Authorization header found")

        # Log Request Start (Optional, usually we log on finish to capture duration/status)
        # logger.info(f"Started {request.method} {request.url.path} by {user_info}")

        try:
            response = await call_next(request)
            
            process_time = (time.time() - start_time) * 1000
            status_code = response.status_code
            
            log_msg = (
                f"Endpoint: {request.method} {request.url.path} | "
                f"User: {user_info} | "
                f"Status: {status_code} | "
                f"Duration: {process_time:.2f}ms"
            )
            
            logger.info(log_msg)
            
            return response
            
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"Endpoint: {request.method} {request.url.path} | "
                f"User: {user_info} | "
                f"Duration: {process_time:.2f}ms | "
                f"Error: {str(e)}"
            )
            raise e
