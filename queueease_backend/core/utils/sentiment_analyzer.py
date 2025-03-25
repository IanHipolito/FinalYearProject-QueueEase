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
        Analyze text sentiment using TextBlob with robust error handling
        """
        try:
            if not text or text.strip() == "":
                return {
                    "sentiment": "neutral",
                    "score": 0,
                    "polarity": 0,
                    "subjectivity": 0
                }
            
            # Clean and preprocess the text
            cleaned_text = SentimentAnalyzer.clean_text(text)
            
            # Analyze sentiment using TextBlob
            from textblob import TextBlob
            analysis = TextBlob(cleaned_text)
            
            # Get polarity score (-1 to 1) and subjectivity (0 to 1)
            polarity = analysis.sentiment.polarity
            subjectivity = analysis.sentiment.subjectivity
            
            # Determine sentiment based on polarity
            sentiment = "neutral"
            if polarity > 0.2:
                sentiment = "positive"
            elif polarity < -0.2:
                sentiment = "negative"
            
            # Calculate a normalized score for visualization (0-100)
            score = int((polarity + 1) * 50)
            
            return {
                "sentiment": sentiment,
                "score": score,
                "polarity": polarity,
                "subjectivity": subjectivity
            }
        except ImportError:
            # Fallback for when TextBlob or NLTK resources are unavailable
            print("Warning: TextBlob or NLTK resources not available, using basic sentiment analysis")
            
            # Very basic sentiment analysis based on positive/negative word count
            positive_words = ["good", "great", "excellent", "amazing", "awesome", "happy", "satisfied"]
            negative_words = ["bad", "poor", "terrible", "awful", "horrible", "unhappy", "disappointed"]
            
            if not text:
                return {"sentiment": "neutral", "score": 50, "polarity": 0, "subjectivity": 0}
            
            words = text.lower().split()
            positive_count = sum(1 for word in words if word in positive_words)
            negative_count = sum(1 for word in words if word in negative_words)
            
            if positive_count > negative_count:
                return {"sentiment": "positive", "score": 75, "polarity": 0.5, "subjectivity": 0.5}
            elif negative_count > positive_count:
                return {"sentiment": "negative", "score": 25, "polarity": -0.5, "subjectivity": 0.5}
            else:
                return {"sentiment": "neutral", "score": 50, "polarity": 0, "subjectivity": 0.5}
        except Exception as e:
            print(f"Error in sentiment analysis: {str(e)}")
            return {"sentiment": "neutral", "score": 50, "polarity": 0, "subjectivity": 0}