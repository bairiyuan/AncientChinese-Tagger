from typing import List

import jieba


def segment_text_with_jieba(text: str) -> List[str]:
    """使用 jieba 对输入文本进行分词。"""
    if text is None:
        return []

    normalized = text.strip()
    if not normalized:
        return []

    return [token for token in jieba.cut(normalized) if token.strip()]
