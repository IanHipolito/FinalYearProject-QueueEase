from collections import Counter
import re
import nltk  # Used for resource initialization
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import logging

logger = logging.getLogger(__name__)

class KeywordExtractor:
    """
    Utility class to extract meaningful keywords from feedback comments
    with improved robustness and sentiment analysis integration
    """
    
    def __init__(self):
        # Initialize required NLTK resources with robust error handling
        self._initialize_nltk_resources()
        
        # Setup stopwords with additional custom words
        self.stop_words = set(stopwords.words('english'))
        custom_stopwords = {
            'the', 'and', 'i', 'to', 'a', 'it', 'that', 'was', 'is', 'for', 'very',
            'am', 'are', 'this', 'these', 'those', 'there', 'their', 'they',
            'has', 'have', 'had', 'been', 'would', 'could', 'should', 'will',
            'can', 'may', 'might', 'must', 'shall', 'just', 'more', 'most', 'other',
            # Extended stopwords for better filtering
            'get', 'got', 'use', 'using', 'used', 'like', 'want', 'need', 'make',
            'also', 'even', 'much', 'many', 'some', 'any', 'all', 'one', 'two', 'three',
            'going', 'came', 'come', 'go', 'going', 'went'
        }
        self.stop_words.update(custom_stopwords)
        
        # Initialize lemmatizer for better token normalization
        self.lemmatizer = WordNetLemmatizer()
        
    def _initialize_nltk_resources(self):
        """Safely initialize all required NLTK resources"""
        resources = [
            ('tokenizers/punkt', 'punkt'),
            ('corpora/stopwords', 'stopwords'),
            ('corpora/wordnet', 'wordnet')
        ]
        
        for resource_path, resource_name in resources:
            try:
                nltk.data.find(resource_path)
            except LookupError:
                try:
                    logger.info(f"Downloading NLTK resource: {resource_name}")
                    nltk.download(resource_name, quiet=True)
                except Exception as e:
                    logger.error(f"Failed to download {resource_name}: {str(e)}")
    
    def preprocess_text(self, text):
        """
        Clean and tokenize text with improved normalization
        
        Args:
            text: The raw text string to process
            
        Returns:
            List of processed tokens
        """
        if not text or not isinstance(text, str):
            return []
            
        try:
            # Convert to lowercase
            text = text.lower()
            
            # Remove URLs
            text = re.sub(r'https?://\S+|www\.\S+', '', text)
            
            # Remove email addresses
            text = re.sub(r'\S+@\S+', '', text)
            
            # Replace special characters with spaces
            text = re.sub(r'[^a-zA-Z\s]', ' ', text)
            
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            
            # Tokenize
            tokens = word_tokenize(text)
            
            # Lemmatize and filter tokens
            filtered_tokens = []
            for token in tokens:
                # Skip stopwords and short words
                if token not in self.stop_words and len(token) > 2:
                    # Lemmatize to reduce inflectional forms to base form
                    lemma = self.lemmatizer.lemmatize(token)
                    filtered_tokens.append(lemma)
            
            return filtered_tokens
        
        except Exception as e:
            logger.error(f"Error in text preprocessing: {str(e)}")
            return []
    
    def extract_keywords(self, comments, sentiment_mapping=None):
        """
        Extract keywords from a list of comments with sentiment analysis
        
        Args:
            comments: List of comment strings
            sentiment_mapping: Optional dict mapping comment to sentiment
            
        Returns:
            List of dictionaries containing word, frequency and sentiment
        """
        all_tokens = []
        
        if not comments:
            return []
            
        # Process each comment with improved error handling
        for i, comment in enumerate(comments):
            try:
                if not comment:
                    continue
                    
                tokens = self.preprocess_text(comment)
                
                # Add sentiment info if available
                if sentiment_mapping and comment in sentiment_mapping:
                    comment_sentiment = sentiment_mapping[comment]
                    all_tokens.extend([(token, comment_sentiment) for token in tokens])
                else:
                    all_tokens.extend([(token, "neutral") for token in tokens])
                    
            except Exception as e:
                logger.error(f"Error processing comment {i}: {str(e)}")
                continue
        
        if not all_tokens:
            return []
            
        # Count token frequencies
        word_counter = Counter([token[0] for token in all_tokens])
        
        # Determine sentiment weight for each word
        word_sentiment = {}
        sentiment_weights = {"positive": 1, "neutral": 0, "negative": -1}
        
        for token, sentiment in all_tokens:
            if token not in word_sentiment:
                word_sentiment[token] = {"count": 0, "sentiments": []}
            
            word_sentiment[token]["count"] += 1
            word_sentiment[token]["sentiments"].append(sentiment)
        
        # Create result list with enhanced insights
        result = []
        for word, count in word_counter.most_common(40):  # Get top 40 keywords
            if count < 2:
                continue  # Skip words that appear only once
            
            # Get the most common sentiment for this word
            sentiments = word_sentiment[word]["sentiments"]
            sentiment_counts = Counter(sentiments)
            most_common_sentiment = sentiment_counts.most_common(1)[0][0]
            
            # Calculate sentiment proportions for more detailed analysis
            total = len(sentiments)
            positive_pct = round((sentiment_counts.get("positive", 0) / total) * 100, 1)
            neutral_pct = round((sentiment_counts.get("neutral", 0) / total) * 100, 1)
            negative_pct = round((sentiment_counts.get("negative", 0) / total) * 100, 1)
            
            result.append({
                "text": word,
                "value": count,
                "sentiment": most_common_sentiment,
                "sentiment_breakdown": {
                    "positive": positive_pct,
                    "neutral": neutral_pct,
                    "negative": negative_pct
                }
            })
            
        return result