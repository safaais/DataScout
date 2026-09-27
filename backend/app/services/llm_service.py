# llm_service.py 
import os
import pandas as pd
from typing import Dict, Any
from ..config import Config
from ..core.logger import logger

class LLMService:
    """Service for natural language processing with OpenAI"""
    
    def __init__(self):
        self.use_openai = False
        self.client = None
        
        api_key = Config.OPENAI_API_KEY
        if api_key:
            try:
                # Try new OpenAI v1.0.0+ style
                import openai
                self.client = openai.OpenAI(api_key=api_key)
                self.use_openai = True
                logger.info("✅ OpenAI client initialized (v1.0.0+)")
            except AttributeError:
                try:
                    # Try old OpenAI v0.28 style
                    import openai
                    openai.api_key = api_key
                    self.client = openai
                    self.use_openai = True
                    logger.info("✅ OpenAI client initialized (v0.28)")
                except Exception as e:
                    logger.warning(f"Failed to initialize OpenAI: {str(e)}")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI: {str(e)}")
        else:
            logger.warning("⚠️ No OpenAI API key found. Chat will use fallback responses.")
    
    def generate_response(self, df: pd.DataFrame, query: str, context: Dict) -> str:
        """Generate response using OpenAI or fallback"""
        if self.use_openai:
            return self._openai_response(df, query, context)
        else:
            return self._fallback_response(df, query, context)
    
    def _openai_response(self, df: pd.DataFrame, query: str, context: Dict) -> str:
        """Generate response using OpenAI API"""
        try:
            # Prepare data summary
            data_sample = df.head(10).to_string()
            
            prompt = f"""You are a data analysis assistant. Help the user understand their data.

Data Information:
- Rows: {len(df):,}
- Columns: {len(df.columns)}
- Column names: {', '.join(df.columns[:15])}
- Data types: {dict(df.dtypes)}

First 10 rows of data:
{data_sample}

User Question: {query}

Please provide a helpful, concise answer in the same language as the question (Arabic or English).
Answer based ONLY on the data provided.
"""
            
            # Try v1.0.0+ style first
            if hasattr(self.client, 'chat') and hasattr(self.client.chat, 'completions'):
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful data analysis assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.3
                )
                return response.choices[0].message.content
            
            # Try v0.28 style
            elif hasattr(self.client, 'ChatCompletion'):
                response = self.client.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful data analysis assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.3
                )
                return response.choices[0].message.content
            
            else:
                return self._fallback_response(df, query, context)
            
        except Exception as e:
            logger.error(f"OpenAI error: {str(e)}")
            return self._fallback_response(df, query, context)
    
    def _fallback_response(self, df: pd.DataFrame, query: str, context: Dict) -> str:
        """Fallback response when OpenAI is not available"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["summary", "ملخص", "describe", "وصف"]):
            return f"""📊 Data Summary:

• Total rows: {len(df):,}
• Total columns: {len(df.columns)}
• Column names: {', '.join(df.columns[:8])}{'...' if len(df.columns) > 8 else ''}

Numeric columns: {len(df.select_dtypes(include=['number']).columns)}
Categorical columns: {len(df.select_dtypes(include=['object']).columns)}

💡 Tip: Add your OpenAI API key to the .env file for better AI responses!
"""
        elif any(word in query_lower for word in ["help", "مساعدة"]):
            return """💬 Available commands:
• 'summary' or 'ملخص' - Get data overview
• 'plot' or 'ارسم' - Generate visualizations
• 'train model' or 'درب نموذج' - Run AutoML
• 'quality' or 'جودة' - Check data quality

🔑 Add OPENAI_API_KEY to .env for natural conversations!
"""
        else:
            return f"""💬 You asked: "{query}"

📊 Current dataset: {len(df):,} rows × {len(df.columns)} columns

Try:
• "summary" for data overview
• "plot" for visualizations
• "train model" for AutoML


"""