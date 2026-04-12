import requests


XUNZI_MODEL_URL = "http://127.0.0.1:8001/generate"


def call_xunzi_model(text: str) -> str:
    """调用本地荀子模型服务并返回生成结果。"""
    try:
        response = requests.post(
            XUNZI_MODEL_URL,
            json={"text": text},
            timeout=30,
        )
        response.raise_for_status()

        data = response.json()

        if "result" in data:
            return data["result"]

        if "error" in data:
            return f"模型返回错误：{data['error']}"

        return "模型返回格式异常：缺少 result 字段"

    except requests.exceptions.RequestException as e:
        return f"请求模型服务失败：{str(e)}"
    except ValueError:
        return "模型服务返回了无效的 JSON 数据"
    except Exception as e:
        return f"调用模型时发生未知错误：{str(e)}"
