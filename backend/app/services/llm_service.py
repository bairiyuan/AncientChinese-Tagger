import os
import requests
import json
from typing import Dict, Any, List

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/chat/completions")

if not DEEPSEEK_API_KEY:
    raise RuntimeError("DEEPSEEK_API_KEY environment variable is not set")

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

def analyze_ancient_text(text: str) -> Dict[str, Any]:
    system_prompt = (
        "你是一位精通中国古汉语的专家。请分析用户提供的古文，并严格按以下JSON格式返回结果：\n"
        "{\n"
        "  \"sentence\": \"对原文的完整断句\",\n"
        "  \"grammar\": \"文中涉及的重要语法结构分析\",\n"
        "  \"meaning\": \"整篇文章的完整现代汉语翻译，如果原文有分段，译文也请保留对应的分段（使用 \\n 换行符）\",\n"
        "  \"segments\": [\n"
        "    {\"text\": \"原文中的字或词组\", \"explanation\": \"该字词在当前语境下的意思\"}\n"
        "  ]\n"
        "}\n"
        "要求：\n"
        "1. 处理全文内容，不得截断或只解析部分内容。即使篇幅较长，也要确保 segments 覆盖到最后。 \n"
        "2. segments 必须严格按照原文顺序切分，拼接后应与原文一致，不得遗漏内容。\n"
        "3. 优先按有意义的词组切分，必要时可细到单字；标点符号也要保留，可将 explanation 设为空字符串。\n"
        "4. 如果原文包含换行符（分段），请在 segments 中作为一个独立项返回：{\"text\": \"\\n\", \"explanation\": \"\"}。\n"
        "5. meaning 必须是整篇文章的完整现代汉语翻译，且必须保留原文的分段结构。\n"
        "注意：你的回答必须仅包含该JSON对象，不要有任何其他解释。严格基于提供的文本，不要引用外部无关信息。"
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"请解析这段完整的古文：\n\n{text}"}
    ]
    
    try:
        response_text = call_deepseek(messages, temperature=0.3)
        # 尝试从响应中提取JSON
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        if start != -1 and end != 0:
            json_str = response_text[start:end]
            return json.loads(json_str)
        return {"error": "Failed to parse AI response as JSON", "raw": response_text}
    except Exception as e:
        return {"error": str(e)}

def chat_with_ai(text: str, question: str, history: List[Dict[str, str]] = None) -> str:
    system_prompt = (
        f"你是一位古文研究助手。当前正在研究的古文内容如下：\n\"\"\"\n{text}\n\"\"\"\n"
        "请回答用户关于这段文字的问题。要求：\n"
        "1. 严格基于提供的文本内容进行回答。\n"
        "2. 可以使用Markdown格式使回答更易读（如使用 **加粗** 重要词汇）。\n"
        "3. 保持回答紧凑，不要在段落之间添加多余的空行，除非确实需要分段。\n"
        "4. 禁止在回答开头和结尾添加多余的双引号。\n"
        "5. 如果问题与文本无关，请礼貌地告知用户你只能讨论当前文本。\n"
        "6. 保持专业、严谨的学术态度。"
    )
    
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": question})
    
    try:
        response_text = call_deepseek(messages)
        
        # 清洗返回结果，去除开头结尾可能存在的引号
        response_text = response_text.strip()
        if response_text.startswith('\"') and response_text.endswith('\"'):
            response_text = response_text[1:-1]
            
        return response_text.strip()
    except Exception:
        return "抱歉，AI助手暂时无法回答这个问题，请稍后再试。"

def auto_annotate_text(text: str) -> List[Dict[str, Any]]:
    system_prompt = (
        "你是一位古籍标注专家。请从提供的古文中尽可能详尽地识别出所有实体。要求：\n"
        "1. 识别范围包括：人名（所有出现的人物）、地名（国家、城市、河流等）、时间（朝代、年份、月份、具体时刻）、核心概念（重要的官职、事件、器物）。\n"
        "2. 不要遗漏文中的任何细微实体，只要是专有名词或具有特定含义的词汇都请提取。\n"
        "3. 以JSON列表格式返回结果：\n"
        "[\n"
        "  {\"entity\": \"项羽\", \"entity_type\": \"person\", \"reason\": \"西楚霸王\"},\n"
        "  {\"entity\": \"楚\", \"entity_type\": \"location\", \"reason\": \"国名\"}\n"
        "]\n"
        "可选类型：person (人物), location (地点), time (时间), other (其他概念)。\n"
        "注意：仅返回JSON列表，不要有任何其他解释。严格基于文本。请务必保持高召回率，不要只提取两三个。"
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"请标注这段古文中的实体：{text}"}
    ]
    
    try:
        response_text = call_deepseek(messages, temperature=0.2)
        start = response_text.find('[')
        end = response_text.rfind(']') + 1
        if start != -1 and end != 0:
            return json.loads(response_text[start:end])
        return []
    except Exception:
        return []

def tokenize_ancient_text(text: str) -> List[Dict[str, str]]:
    system_prompt = (
        "你是一位精通古汉语的专家。请对用户提供的古文进行分词并标注词性。要求：\n"
        "1. 将古文切分为词语。\n"
        "2. 标注词性，可选类型：名 (名词), 动 (动词), 形 (形容词), 代 (代词), 副 (副词), 介 (介词), 连 (连词), 助 (助词), 叹 (叹词), 量 (量词)。\n"
        "3. 以JSON列表格式返回结果：[{\"word\": \"项羽\", \"pos\": \"名\"}, {\"word\": \"名\", \"pos\": \"名\"}, ...]\n"
        "4. 如果原文包含换行符 \\n（分段），请将其作为一个独立项返回：{\"word\": \"\\n\", \"pos\": \"标\"}。\n"
        "注意：仅返回JSON列表，不要有任何解释。严格基于文本。"
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": text}
    ]
    
    try:
        # 设置较长的超时时间，例如 30 秒，确保 DeepSeek 能够完成复杂的古文分词
        response_text = call_deepseek(messages, temperature=0.1, timeout=30)
        start = response_text.find('[')
        end = response_text.rfind(']') + 1
        if start != -1 and end != 0:
            return json.loads(response_text[start:end])
        return []
    except Exception as e:
        print(f"DeepSeek tokenization failed or timed out: {e}")
        raise e
