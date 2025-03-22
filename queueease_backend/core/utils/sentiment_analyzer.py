import re
from textblob import TextBlob

class SentimentAnalyzer:
    """
    Utility class to analyze text sentiment using TextBlob
    """
    
    @staticmethod
    def clean_text(text):
        """
        Clean and normalize text for better analysis
        """
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'https?://\S+|www\.\S+', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    @staticmethod
    def analyze(text):
        """
        Analyze text and return sentiment information
        
        Returns:
            dict: Contains sentiment label, score, and polarity
        """
        if not text:
            return {
                "sentiment": "neutral",
                "score": 0.0,
                "polarity": 0.0,
                "subjectivity": 0.0
            }
            
        cleaned_text = SentimentAnalyzer.clean_text(text)
        analysis = TextBlob(cleaned_text)
        
        polarity = analysis.sentiment.polarity
        subjectivity = analysis.sentiment.subjectivity
        
        # Determine sentiment label based on polarity
        if polarity > 0.2:
            sentiment = "positive"
        elif polarity < -0.2:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        # Convert polarity to a 0-100 scale for easier interpretation
        score = (polarity + 1) * 50
        
        return {
            "sentiment": sentiment,
            "score": score,
            "polarity": polarity,
            "subjectivity": subjectivity
        }