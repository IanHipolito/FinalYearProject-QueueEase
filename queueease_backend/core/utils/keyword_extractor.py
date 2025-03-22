from collections import Counter
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

class KeywordExtractor:
    """
    Utility class to extract meaningful keywords from feedback comments
    """
    
    def __init__(self):
        # Download NLTK resources if needed
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
            
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
        
        self.stop_words = set(stopwords.words('english'))
        # Add custom stopwords
        custom_stopwords = {'the', 'and', 'i', 'to', 'a', 'it', 'that', 'was', 'is', 'for', 'very'}
        self.stop_words.update(custom_stopwords)
    
    def preprocess_text(self, text):
        """Clean and tokenize text"""
        if not text:
            return []
            
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and short words
        filtered_tokens = [w for w in tokens if w not in self.stop_words and len(w) > 2]
        
        return filtered_tokens
    
    def extract_keywords(self, comments, sentiment_mapping=None):
        """
        Extract keywords from a list of comments
        
        Args:
            comments: List of comment strings
            sentiment_mapping: Optional dict mapping comment to sentiment
            
        Returns:
            List of dictionaries containing word, frequency and sentiment
        """
        all_tokens = []
        
        # Process each comment
        for i, comment in enumerate(comments):
            if not comment:
                continue
                
            tokens = self.preprocess_text(comment)
            
            # Add sentiment info if available
            if sentiment_mapping and comment in sentiment_mapping:
                # Add sentiment tag to tokens for this comment
                comment_sentiment = sentiment_mapping[comment]
                all_tokens.extend([(token, comment_sentiment) for token in tokens])
            else:
                all_tokens.extend([(token, "neutral") for token in tokens])
        
        # Count token frequencies
        word_counter = Counter([token[0] for token in all_tokens])
        
        # Determine most common sentiment for each word
        word_sentiment = {}
        for token, sentiment in all_tokens:
            if token not in word_sentiment:
                word_sentiment[token] = []
            word_sentiment[token].append(sentiment)
        
        # Create result list with words, their frequencies, and majority sentiment
        result = []
        for word, count in word_counter.most_common(40):  # Get top 40 keywords
            if count < 2:
                continue  # Skip words that appear only once
            
            # Get the most common sentiment for this word
            sentiments = word_sentiment[word]
            most_common_sentiment = Counter(sentiments).most_common(1)[0][0]
            
            result.append({
                "text": word,
                "value": count,
                "sentiment": most_common_sentiment
            })
            
        return result