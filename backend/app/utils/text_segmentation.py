from typing import List, Dict

import jieba
import jieba.posseg as pseg


def segment_text_with_jieba(text: str) -> List[Dict[str, str]]:
    """使用 jieba 对输入文本进行分词。"""
    if text is None:
        return []

    normalized = text.strip()
    if not normalized:
        return []

    return [token for token in jieba.cut(normalized) if token.strip()]

def segment_text_with_jieba_pos(text: str) -> List[Dict[str, str]]:
    """使用 jieba 对输入文本进行分词并标注词性。"""
    if text is None:
        return []

    normalized = text.strip()
    if not normalized:
        return []

    # 映射 jieba 词性到项目定义的词性
    pos_map = {
        'n': '名', 'nr': '名', 'ns': '名', 'nt': '名', 'nz': '名',
        'v': '动', 'vd': '动', 'vn': '动',
        'a': '形', 'ad': '形', 'an': '形',
        'r': '代',
        'd': '副',
        'p': '介',
        'c': '连',
        'u': '助',
        'e': '叹',
        'm': '量', 'q': '量'
    }

    results = []
    words = pseg.cut(normalized)
    for word, flag in words:
        if not word.strip():
            continue
        # 获取映射后的词性，默认使用 '名'
        pos = pos_map.get(flag[0] if flag else '', '名')
        results.append({"word": word, "pos": pos})
    
    return results
