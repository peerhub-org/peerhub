from pydantic import BaseModel


class ExchangeCodeRequest(BaseModel):
    code: str
