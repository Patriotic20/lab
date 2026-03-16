from fastapi_cache import FastAPICache


from fastapi import Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse

async def custom_key_builder(
    func,
    namespace: str = "",
    request: Request = None,
    response: Response = None,
    *args,
    **kwargs,
):
    from fastapi_cache import FastAPICache

    prefix = FastAPICache.get_prefix()
    cache_key = f"{prefix}:{namespace}:{func.__module__}:{func.__name__}"

    if args:
        cache_key += f":{args}"

    if kwargs:
        filtered_kwargs = {}
        for key, value in kwargs.items():
            if key == "_":  # Skip unused dependencies (convention)
                continue
                
            if isinstance(value, (AsyncSession, Request, Response, StarletteRequest, StarletteResponse)):
                continue
            
            # Skip User objects (often returned by auth/permission dependencies)
            if type(value).__name__ == "User":
                continue
                
            # Also skip PermissionRequired if somehow passed directly
            if type(value).__name__ == "PermissionRequired":
                continue
            filtered_kwargs[key] = value
        
        if filtered_kwargs:
           cache_key += f":{filtered_kwargs}"

    return cache_key

async def clear_cache(func, *args, **kwargs):
    """
    Clears the cache for a specific function.
    If args/kwargs are provided, attempts to clear specific key (complex due to flexible key builder).
    Currently implementing: Clear ALL keys for this function pattern to ensuring safety.
    """
    try:
        backend = FastAPICache.get_backend()
        if not backend:
            return
            
        prefix = FastAPICache.get_prefix()
        # Namespace is usually empty or None in this project context unless specified.
        # Assuming default namespace behavior or "" if not set.
        namespace = ""
        
        # Construct base pattern: "fastapi-cache::app.modules.role.router:list_roles*"
        pattern = f"{prefix}:{namespace}:{func.__module__}:{func.__name__}*"
        
        if hasattr(backend, "redis"):
            redis = backend.redis
            # Scan for keys matching the pattern to avoid blocking with keys() on large datasets
            # multiple scans might be needed but keys() is okay for smaller scale testing/dev
            # forcing keys() here for simplicity as per plan, but being aware of potential perf impact on massive redis
            keys = await redis.keys(pattern)
            if keys:
                await redis.delete(*keys)
    except Exception as e:
        # Fail silently or log error to avoid breaking the main flow if cache clearing fails
        # For now, we just pass
        pass
