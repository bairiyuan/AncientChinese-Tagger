import json
from pathlib import Path
from typing import Any, Dict, List


def import_document(file_path: str) -> dict:
    """导入 txt 文档并返回标准结构。"""
    path = Path(file_path)

    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"文件不存在: {file_path}")

    if path.suffix.lower() != ".txt":
        raise ValueError("仅支持 txt 文件导入")

    try:
        content = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise UnicodeError("文件编码错误，请使用 utf-8 编码") from exc

    if content is None or content.strip() == "":
        raise ValueError("文件为空")

    return {
        "title": path.stem,
        "content": content,
    }


def export_document_with_annotations(
    document: dict,
    annotations: list,
    file_path: str,
    format: str = "json",
):
    """导出文档及标注信息。当前仅支持 json。"""
    if format.lower() != "json":
        raise ValueError("当前仅支持 json 导出")

    title = document.get("title")
    content = document.get("content")

    if not isinstance(title, str) or title.strip() == "":
        raise ValueError("document.title 不能为空")
    if not isinstance(content, str) or content.strip() == "":
        raise ValueError("document.content 不能为空")

    normalized_annotations: List[Dict[str, Any]] = []
    for idx, ann in enumerate(annotations):
        if not isinstance(ann, dict):
            raise ValueError(f"annotations[{idx}] 必须是对象")

        entity = ann.get("entity")
        entity_type = ann.get("entityType", ann.get("entity_type"))
        start_pos = ann.get("startPos", ann.get("start_pos"))
        end_pos = ann.get("endPos", ann.get("end_pos"))

        if not isinstance(entity, str) or entity.strip() == "":
            raise ValueError(f"annotations[{idx}].entity 非法")
        if not isinstance(entity_type, str) or entity_type.strip() == "":
            raise ValueError(f"annotations[{idx}].entityType 非法")
        if not isinstance(start_pos, int) or start_pos < 0:
            raise ValueError(f"annotations[{idx}].startPos 非法")
        if not isinstance(end_pos, int) or end_pos < 0:
            raise ValueError(f"annotations[{idx}].endPos 非法")
        if end_pos < start_pos:
            raise ValueError(f"annotations[{idx}] 的 endPos 不能小于 startPos")

        normalized_annotations.append(
            {
                "entity": entity,
                "entityType": entity_type,
                "startPos": start_pos,
                "endPos": end_pos,
            }
        )

    payload = {
        "title": title,
        "content": content,
        "annotations": normalized_annotations,
    }

    output_path = Path(file_path)
    if output_path.suffix.lower() != ".json":
        output_path = output_path.with_suffix(".json")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
