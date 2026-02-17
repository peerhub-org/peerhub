from pydantic import BaseModel


class OAuthUrlResponse(BaseModel):
    url: str
