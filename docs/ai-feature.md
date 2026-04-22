# ai集成功能说明文档



## 使用模型

deepseek-chat



## 调用代码

```python
import requests
import json
from typing import Dict, Any, List

DEEPSEEK_API_KEY = ""
DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions"

def call_deepseek(messages: List[Dict[str, str]], temperature: float = 0.7, timeout: int = 60) -> str:
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": temperature,
        "response_format": {"type": "text"}
    }
    
    try:
        response = requests.post(DEEPSEEK_BASE_URL, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Error calling DeepSeek: {e}")
        raise e
```



## 功能介绍

利用大语言模型实现古汉语的分词、实体识别、语法分析与问答交互