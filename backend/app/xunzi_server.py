from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
torch.set_num_threads(2)

app = FastAPI()

MODEL_PATH = r"D:\models"

# 加载 tokenizer
model = None
tokenizer = None

def load_model():
    global model, tokenizer
    if model is None:
        print("🔥 正在加载模型...")
        tokenizer = AutoTokenizer.from_pretrained(
            MODEL_PATH,
            local_files_only=True
        )
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            dtype=torch.float32,
            local_files_only=True
        )
        model.to("cpu")
        model.eval()
        print("✅ 模型加载完成")


class RequestBody(BaseModel):
    text: str


@app.post("/generate")
async def generate(req: RequestBody):
    load_model()
    try:
        inputs = tokenizer(req.text, return_tensors="pt")

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=200,
                do_sample=True,
                temperature=0.7,
                top_p=0.9
            )

        result = tokenizer.decode(outputs[0], skip_special_tokens=True)

        return {"result": result}

    except Exception as e:
        return {"error": str(e)}
