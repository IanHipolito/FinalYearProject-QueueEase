import re
import logging
from collections import Counter
from textblob import TextBlob
import nltk  # Used for resource initialization 
import logging

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """
    Comprehensive utility class to analyze text sentiment using multiple approaches
    for robust sentiment analysis in all contexts
    """
    
    # Sentiment lexicons for enhanced analysis
    POSITIVE_LEXICON = {
        "good", "great", "excellent", "amazing", "awesome", "happy", "satisfied", "wonderful",
        "fantastic", "terrific", "outstanding", "perfect", "love", "enjoy", "pleasant",
        "delighted", "pleased", "impressive", "exceptional", "efficient", "helpful",
        "professional", "friendly", "fast", "reliable", "responsive", "seamless",
        "convenient", "impressed", "quality", "thank", "appreciated", "recommend",
        "smooth", "easy", "quick", "simple", "intuitive", "effective", "useful",
        # Additional positive words for services
        "prompt", "courteous", "accurate", "accommodating", "thorough", "knowledgeable",
        "organized", "timely", "valuable", "respectful", "attentive", "patient",
        "transparent", "informative", "supportive", "innovative", "comprehensive"
    }
    
    NEGATIVE_LEXICON = {
        "bad", "poor", "terrible", "awful", "horrible", "unhappy", "disappointed",
        "frustrating", "annoying", "slow", "difficult", "confusing", "issue", "problem",
        "error", "mistake", "failure", "broken", "unreliable", "useless", "inefficient",
        "waste", "crash", "bug", "glitch", "lag", "inconsistent", "complicated",
        "expensive", "inconvenient", "disappointing", "dislike", "hate", "worst",
        "rude", "unprofessional", "unresponsive", "unfriendly", "unclear", "slow",
        # Additional negative words for services
        "delayed", "misunderstood", "overcharged", "neglected", "incompetent",
        "mismanaged", "inadequate", "incomplete", "inaccurate", "unhelpful",
        "dismissive", "disorganized", "careless", "misleading", "unresponsive"
    }
    
    # Intensifiers to recognize stronger sentiment
    INTENSIFIERS = {
        "very", "really", "extremely", "absolutely", "incredibly", "highly",
        "completely", "totally", "definitely", "certainly", "especially",
        "particularly", "remarkably", "notably", "truly", "utterly", "thoroughly"
    }
    
    # Negators to recognize sentiment inversions
    NEGATORS = {
        "not", "no", "never", "neither", "nor", "nowhere", "nothing",
        "cannot", "can't", "won't", "shouldn't", "couldn't", "wasn't", "doesn't", "don't",
        "hardly", "barely", "scarcely", "seldom", "rarely"
    }
    
    # Domain-specific terms for queue/service context
    QUEUE_SPECIFIC_POSITIVE = {
        "quick", "short", "efficient", "organized", "fast", "smooth", "seamless", "structured"
    }
    
    QUEUE_SPECIFIC_NEGATIVE = {
        "long", "wait", "delay", "slow", "disorganized", "chaotic", "messy", "confusing"
    }
    
    @staticmethod
    def initialize():
        """Initialize any required resources for sentiment analysis"""
        try:
            # Ensure TextBlob's resources are downloaded
            try:
                nltk.data.find('corpora/wordnet')
            except LookupError:
                nltk.download('wordnet', quiet=True)
                
            try:
                nltk.data.find('sentiment/vader_lexicon.zip')
            except LookupError:
                nltk.download('vader_lexicon', quiet=True)
        except Exception as e:
            logger.warning(f"Could not initialize all sentiment analysis resources: {str(e)}")
    
    @staticmethod
    def clean_text(text):
        """
        Clean and normalize text for better sentiment analysis
        
        Args:
            text: The text to clean
            
        Returns:
            Cleaned text string
        """
        if not text or not isinstance(text, str):
            return ""
        
        try:
            # Convert to lowercase
            text = text.lower()
            
            # Remove URLs
            text = re.sub(r'https?://\S+|www\.\S+', '', text)
            
            # Remove email addresses
            text = re.sub(r'\S+@\S+', '', text)
            
            # Replace multiple punctuation with single instance (e.g., !!! → !)
            text = re.sub(r'([!?.])(\1+)', r'\1', text)
            
            # Standardize common abbreviations and contractions 
            text = re.sub(r'\bwon\'t\b', 'will not', text)
            text = re.sub(r'\bcan\'t\b', 'cannot', text)
            text = re.sub(r'\bdon\'t\b', 'do not', text)
            text = re.sub(r'\bdoesn\'t\b', 'does not', text)
            text = re.sub(r'\bdidn\'t\b', 'did not', text)
            text = re.sub(r'\bcouldn\'t\b', 'could not', text)
            text = re.sub(r'\bshouldn\'t\b', 'should not', text)
            text = re.sub(r'\bwouldn\'t\b', 'would not', text)
            text = re.sub(r'\bhasn\'t\b', 'has not', text)
            text = re.sub(r'\bhaven\'t\b', 'have not', text)
            text = re.sub(r'\baren\'t\b', 'are not', text)
            text = re.sub(r'\bisn\'t\b', 'is not', text)
            
            # Preserve important punctuation by adding spaces around them
            text = re.sub(r'([!?.,:;])', r' \1 ', text)
            
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            
            return text
        except Exception as e:
            logger.error(f"Error cleaning text: {str(e)}")
            return text if text else ""
    
    @staticmethod
    def _textblob_analysis(text):
        """Analyze sentiment using TextBlob"""
        try:
            analysis = TextBlob(text)
            polarity = analysis.sentiment.polarity
            subjectivity = analysis.sentiment.subjectivity
            
            # Determine sentiment based on polarity
            sentiment = "neutral"
            if polarity > 0.2:
                sentiment = "positive"
            elif polarity < -0.2:
                sentiment = "negative"
                
            # Calculate a normalized score (0-100)
            score = int((polarity + 1) * 50)
            
            return {
                "sentiment": sentiment,
                "score": score,
                "polarity": polarity,
                "subjectivity": subjectivity
            }
        except Exception as e:
            logger.error(f"TextBlob analysis error: {str(e)}")
            return None
    
    @staticmethod
    def _vader_analysis(text):
        """Analyze sentiment using VADER (Valence Aware Dictionary for sEntiment Reasoning)"""
        try:
            from nltk.sentiment.vader import SentimentIntensityAnalyzer
            
            sid = SentimentIntensityAnalyzer()
            scores = sid.polarity_scores(text)
            
            # Determine sentiment
            compound = scores['compound']
            if compound >= 0.05:
                sentiment = "positive"
            elif compound <= -0.05:
                sentiment = "negative"
            else:
                sentiment = "neutral"
            
            # Convert compound score to 0-100 range
            score = int((compound + 1) * 50)
            
            return {
                "sentiment": sentiment,
                "score": score,
                "compound": compound,
                "pos": scores['pos'],
                "neg": scores['neg'],
                "neu": scores['neu']
            }
        except Exception as e:
            logger.error(f"VADER analysis error: {str(e)}")
            return None
    
    @staticmethod
    def _lexicon_analysis(text):
        """Context-aware lexicon-based sentiment analysis as fallback"""
        words = text.lower().split()
        
        # Count positive and negative words
        positive_count = 0
        negative_count = 0
        
        # Track word positions for contextual analysis
        word_positions = {word: i for i, word in enumerate(words)}
        
        # Flag for queue-specific context
        queue_context = any(word in text for word in ["queue", "wait", "line", "waiting"])
        
        # Analyze each word
        for i, word in enumerate(words):
            # Check for negation in context window (previous 3 words)
            context_start = max(0, i-3)
            context_window = words[context_start:i]
            negated = any(neg in context_window for neg in SentimentAnalyzer.NEGATORS)
            
            # Check for intensifiers
            intensified = any(intf in context_window for intf in SentimentAnalyzer.INTENSIFIERS)
            intensity_factor = 1.5 if intensified else 1.0
            
            # Apply sentiment with context
            if word in SentimentAnalyzer.POSITIVE_LEXICON:
                if negated:
                    negative_count += intensity_factor
                else:
                    positive_count += intensity_factor
                    
            if word in SentimentAnalyzer.NEGATIVE_LEXICON:
                if negated:
                    positive_count += intensity_factor
                else:
                    negative_count += intensity_factor
            
            # Apply queue-specific terms with higher weight if in queue context
            if queue_context:
                context_weight = 2.0  # Give more importance to domain-specific terms
                
                if word in SentimentAnalyzer.QUEUE_SPECIFIC_POSITIVE:
                    if negated:
                        negative_count += intensity_factor * context_weight
                    else:
                        positive_count += intensity_factor * context_weight
                        
                if word in SentimentAnalyzer.QUEUE_SPECIFIC_NEGATIVE:
                    if negated:
                        positive_count += intensity_factor * context_weight
                    else:
                        negative_count += intensity_factor * context_weight
        
        # Look for special patterns (e.g., "not bad" = positive)
        for i, word in enumerate(words):
            if i > 0 and words[i-1] in SentimentAnalyzer.NEGATORS:
                if word in SentimentAnalyzer.NEGATIVE_LEXICON:
                    # "not bad" is positive
                    negative_count -= 1
                    positive_count += 0.5
                elif word in SentimentAnalyzer.POSITIVE_LEXICON:
                    # "not good" is negative
                    positive_count -= 1
                    negative_count += 0.5
        
        # Determine sentiment
        sentiment = "neutral"
        if positive_count > negative_count:
            sentiment = "positive"
        elif negative_count > positive_count:
            sentiment = "negative"
        
        # Calculate a normalized score (0-100)
        total_sentiment = positive_count - negative_count
        total_words = max(1, len([w for w in words if len(w) > 1]))
        normalized_sentiment = total_sentiment / total_words
        score = int((normalized_sentiment + 1) * 50)
        score = max(0, min(100, score))  # Ensure between 0-100
        
        return {
            "sentiment": sentiment,
            "score": score,
            "positive_count": positive_count,
            "negative_count": negative_count,
            "queue_context": queue_context
        }
    
    @staticmethod
    def analyze(text, method="ensemble", context=None):
        """
        Analyze text sentiment using multiple methods for robustness
        
        Args:
            text: The text to analyze
            method: Analysis method - one of "textblob", "vader", "lexicon", or "ensemble"
            context: Optional context to help guide analysis (e.g., "queue", "service")
            
        Returns:
            Dictionary with sentiment analysis results
        """
        if not text or not isinstance(text, str) or text.strip() == "":
            return {
                "sentiment": "neutral",
                "score": 50,
                "confidence": 0,
                "method": "default"
            }
        
        # Clean and preprocess the text
        cleaned_text = SentimentAnalyzer.clean_text(text)
        
        # Select analysis method
        results = {}
        methods_used = []
        
        # Try TextBlob analysis
        if method in ("textblob", "ensemble"):
            textblob_result = SentimentAnalyzer._textblob_analysis(cleaned_text)
            if textblob_result:
                results["textblob"] = textblob_result
                methods_used.append("textblob")
        
        # Try VADER analysis
        if method in ("vader", "ensemble"):
            vader_result = SentimentAnalyzer._vader_analysis(cleaned_text)
            if vader_result:
                results["vader"] = vader_result
                methods_used.append("vader")
        
        # Always do lexicon analysis as fallback
        lexicon_result = SentimentAnalyzer._lexicon_analysis(cleaned_text)
        results["lexicon"] = lexicon_result
        methods_used.append("lexicon")
        
        # If no methods worked or specific method failed, use lexicon result
        if not methods_used or (method != "ensemble" and method not in methods_used):
            return {
                "sentiment": lexicon_result["sentiment"],
                "score": lexicon_result["score"],
                "confidence": 0.5,  # Lower confidence for fallback method
                "method": "lexicon"
            }
        
        # For ensemble, combine results with weighted voting and context awareness
        if method == "ensemble" and len(methods_used) > 1:
            # Default weights
            method_weights = {
                "vader": 0.5,      # VADER is specialized for social media
                "textblob": 0.3,   # TextBlob is good for general text
                "lexicon": 0.2     # Our lexicon is the fallback
            }
            
            # Adjust weights based on context if provided
            if context == "queue" or lexicon_result.get("queue_context", False):
                # For queue-specific text, give more weight to our custom lexicon
                method_weights = {
                    "vader": 0.3,
                    "textblob": 0.2,
                    "lexicon": 0.5  # Higher weight due to domain-specific terms
                }
            
            # Normalize weights based on available methods
            total_weight = sum(method_weights[m] for m in methods_used)
            normalized_weights = {m: method_weights[m]/total_weight for m in methods_used}
            
            # Calculate weighted sentiment score
            weighted_score = 0
            for method_name in methods_used:
                weighted_score += results[method_name]["score"] * normalized_weights[method_name]
                
            # Convert weighted score to sentiment
            final_score = int(weighted_score)
            if final_score >= 60:
                sentiment = "positive"
            elif final_score <= 40:
                sentiment = "negative"
            else:
                sentiment = "neutral"
                
            # Calculate confidence based on agreement
            sentiments = [results[m]["sentiment"] for m in methods_used]
            most_common = Counter(sentiments).most_common(1)[0]
            agreement_ratio = most_common[1] / len(methods_used)
            
            # Adjust score if there's high agreement but different sentiment
            if agreement_ratio >= 0.66 and sentiment != most_common[0]:
                # If 2/3 methods agree but weighted score suggests different sentiment,
                # adjust the score to reflect the majority sentiment
                if most_common[0] == "positive":
                    final_score = max(60, final_score)  # Ensure positive
                elif most_common[0] == "negative":
                    final_score = min(40, final_score)  # Ensure negative
                sentiment = most_common[0]
            
            return {
                "sentiment": sentiment,
                "score": final_score,
                "confidence": agreement_ratio,
                "method": "ensemble",
                "details": {m: results[m] for m in methods_used}
            }
        
        # If using a specific method that worked
        method_result = results[method]
        return {
            "sentiment": method_result["sentiment"],
            "score": method_result["score"],
            "confidence": 0.7,  # Medium confidence for single method
            "method": method,
            "details": method_result
        }
    
    @staticmethod
    def batch_analyze(texts, method="ensemble"):
        """
        Analyze multiple texts in batch for efficiency
        
        Args:
            texts: List of texts to analyze
            method: Analysis method to use
            
        Returns:
            Dictionary mapping each text to its sentiment analysis result
        """
        if not texts:
            return {}
            
        results = {}
        for text in texts:
            if not text:
                continue
                
            try:
                result = SentimentAnalyzer.analyze(text, method)
                results[text] = result
            except Exception as e:
                logger.error(f"Error analyzing text: {str(e)}")
                # Provide a neutral fallback
                results[text] = {
                    "sentiment": "neutral",
                    "score": 50,
                    "confidence": 0,
                    "method": "error",
                    "error": str(e)
                }
                
        return results