from fastapi import FastAPI

app = FastAPI(title="AncientChinese Backend")

@app.get("/")
async def root():
    return {"message": "Hello AncientChinese!"}