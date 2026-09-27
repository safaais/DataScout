# security.py - Security and prompt injection protection
import re
from typing import Tuple, List
from enum import Enum

class ThreatLevel(Enum):
    SAFE = "safe"
    SUSPICIOUS = "suspicious"
    BLOCKED = "blocked"

class Security:
    """Security handler for query validation"""
    
    # Injection patterns
    INJECTION_PATTERNS = [
        (r"(?i)(?:system|subprocess|os\.|eval\(|exec\(|__import__|compile\()", "command_injection"),
        (r"(?i)(?:rm\s+-rf|del\s+/|format\s+|dd\s+if=)", "dangerous_command"),
        (r"(?i)(?:;\s*--|\s+or\s+1=1|\'.*?(?:--|#))", "sql_injection"),
        (r"(?i)(?:ignore previous instructions|forget your training|new instruction:|system prompt:)", "prompt_injection"),
        (r"(?i)(?:pretend you are|act as if|roleplay as|you are now)", "role_manipulation"),
        (r"(?i)(?:password|api[_-]?key|secret|token|credential)", "sensitive_data_request"),
        (r"(?:\.\./|\.\.\\|/etc/passwd|C:\\Windows\\System32)", "path_traversal"),
    ]
    
    # Blocked keywords
    BLOCKED_WORDS = [
        "delete", "drop", "truncate", "shutdown", "reboot",
        "rm -rf", "format", "system", "exec", "eval"
    ]
    
    @classmethod
    def analyze_query(cls, query: str) -> Tuple[ThreatLevel, List[str]]:
        """Analyze query for security threats"""
        threats = []
        
        for pattern, description in cls.INJECTION_PATTERNS:
            if re.search(pattern, query):
                threats.append(description)
        
        query_lower = query.lower()
        for word in cls.BLOCKED_WORDS:
            if word in query_lower:
                threats.append(f"blocked_word: {word}")
        
        if len(threats) >= 3:
            threat_level = ThreatLevel.BLOCKED
        elif len(threats) > 0:
            threat_level = ThreatLevel.SUSPICIOUS
        else:
            threat_level = ThreatLevel.SAFE
        
        return threat_level, threats
    
    @classmethod
    def sanitize_query(cls, query: str) -> str:
        """Clean query from dangerous characters"""
        dangerous_chars = [';', '`', '$', '\\', '|', '&', '>', '<', '\n', '\r', '\t']
        for char in dangerous_chars:
            query = query.replace(char, ' ')
        
        query = re.sub(r'\s+', ' ', query)
        query = query.split('&&')[0].split('||')[0]
        
        return query.strip()[:2000]
    
    @classmethod
    def is_safe(cls, query: str) -> bool:
        """Quick safety check"""
        threat_level, _ = cls.analyze_query(query)
        return threat_level != ThreatLevel.BLOCKED