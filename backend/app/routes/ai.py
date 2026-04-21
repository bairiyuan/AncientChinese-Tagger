from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.services import llm_service
from app.utils.text_segmentation import segment_text_with_jieba_pos

router = APIRouter(prefix="/api/ai", tags=["ai"])

class AnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    text: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    history: Optional[List[Dict[str, str]]] = None

@router.post("/analyze")
async def analyze_text(body: AnalysisRequest):
    result = llm_service.analyze_ancient_text(body.text)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return {"code": 0, "message": "success", "data": result}

@router.post("/chat")
async def ai_chat(body: ChatRequest):
    answer = llm_service.chat_with_ai(body.text, body.question, body.history)
    return {"code": 0, "message": "success", "data": answer}

@router.post("/auto-annotate")
async def auto_annotate(body: AnalysisRequest):
    result = llm_service.auto_annotate_text(body.text)
    return {"code": 0, "message": "success", "data": result}

@router.post("/tokenize")
async def tokenize_text(body: AnalysisRequest):
    try:
        # 优先尝试使用 DeepSeek
        result = llm_service.tokenize_ancient_text(body.text)
        return {"code": 0, "message": "success", "data": result, "source": "deepseek"}
    except Exception:
        # 如果 DeepSeek 失败或超时，降级到本地 jieba 分词
        result = segment_text_with_jieba_pos(body.text)
        return {"code": 0, "message": "success", "data": result, "source": "jieba"}

