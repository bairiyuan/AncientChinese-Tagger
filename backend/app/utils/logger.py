import json
import logging
import time
from datetime import datetime

class JsonFormatter(logging.Formatter):
    """
    结构化 JSON 日志格式化器
    """
    def format(self, record):
        log_record = {
            "time": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "name": record.name,
        }
        
        # 如果有异常信息，也加入 JSON
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_record, ensure_ascii=False)

def setup_logger(name: str = "ancient-chinese-tagger"):
    """
    配置并返回一个结构化日志记录器
    """
    logger = logging.getLogger(name)
    
    # 避免重复添加 handler
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(JsonFormatter())
        logger.addHandler(console_handler)
        
    return logger

# 创建默认 logger 实例
logger = setup_logger()
