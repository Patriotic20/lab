from pydantic import BaseModel


class HemisLoginRequest(BaseModel):
    login: str
    password: str


class HemisLoginResponse(BaseModel):
    type: str = "Bearer"
    access_token: str
    refresh_token: str