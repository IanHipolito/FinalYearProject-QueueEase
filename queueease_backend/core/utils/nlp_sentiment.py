import re
import logging
import nltk
import spacy
from textblob import TextBlob
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from transformers import pipeline

try:
    from transformers import pipeline
    HAS_TRANSFORMER = True
except ImportError:
    HAS_TRANSFORMER = False

logger = logging.getLogger(__name__)

class NLPProcessor:
    """
    Uses spaCy for efficient tokenization, lemmatization,
    and noun-chunk extraction.
    """
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
    
    def preprocess(self, text: str):
        """Preprocess text: normalize, tokenize, filter stopwords, and lemmatize."""
        text = text.strip().lower()
        doc = self.nlp(text)
        tokens = [token.lemma_ for token in doc if token.is_alpha and not token.is_stop and len(token.text) > 2]
        return tokens
    
    def extract_noun_chunks(self, text: str):
        """Extract noun chunks (phrases) from the text."""
        text = text.strip().lower()
        doc = self.nlp(text)
        return [chunk.text for chunk in doc.noun_chunks]

class KeywordExtractor:
    """
    Extracts keywords from a list of feedback comments.
    Aggregates overall frequency and sentiment breakdown for each token.
    """
    def __init__(self, nlp_processor=None):
        self.processor = nlp_processor if nlp_processor is not None else NLPProcessor()

    def extract_keywords(self, comments: list, sentiment_mapping: dict = None) -> list:
        keyword_data = {}

        for comment in comments:
            if not comment or not isinstance(comment, str):
                continue
            norm_comment = comment.strip().lower()
            tokens = self.processor.preprocess(norm_comment)
            comment_sentiment = "neutral"
            if sentiment_mapping and norm_comment in sentiment_mapping:
                comment_sentiment = sentiment_mapping[norm_comment]
            for token in tokens:
                if token not in keyword_data:
                    keyword_data[token] = {"frequency": 0, "positive": 0, "neutral": 0, "negative": 0}
                keyword_data[token]["frequency"] += 1
                if comment_sentiment == "positive":
                    keyword_data[token]["positive"] += 1
                elif comment_sentiment == "negative":
                    keyword_data[token]["negative"] += 1
                else:
                    keyword_data[token]["neutral"] += 1

        keywords_list = []
        for word, counts in keyword_data.items():
            keywords_list.append({
                "text": word,
                "value": counts["frequency"],
                "sentiment_breakdown": {
                    "positive": counts["positive"],
                    "neutral": counts["neutral"],
                    "negative": counts["negative"]
                }
            })
        return keywords_list

class TransformerSentimentAnalyzer:
    """
    Uses Hugging Face Transformers to perform sentiment analysis.
    Caches the pipeline so that it is initialized only once.
    """
    _pipeline = None  # Class variable to cache the pipeline

    def __init__(self):
        if TransformerSentimentAnalyzer._pipeline is None:
            try:
                TransformerSentimentAnalyzer._pipeline = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                    revision="714eb0f"  # Pin a specific revision
                )
            except Exception as e:
                # Log the error – with the upgraded transformers, this should ideally not happen
                import logging
                logging.getLogger(__name__).error("Transformer analyzer failed to initialize: " + str(e))
                TransformerSentimentAnalyzer._pipeline = None
        self.sentiment_pipeline = TransformerSentimentAnalyzer._pipeline

    def analyze(self, text: str) -> dict:
        if not self.sentiment_pipeline:
            return {"sentiment": "neutral", "score": 50, "confidence": 0, "method": "transformer"}
        result = self.sentiment_pipeline(text)
        label = result[0]['label'].lower()
        score = int(result[0]['score'] * 100)
        sentiment = "neutral"
        if label == "positive":
            sentiment = "positive"
        elif label == "negative":
            sentiment = "negative"
        return {
            "sentiment": sentiment,
            "score": score,
            "confidence": result[0]['score'],
            "method": "transformer"
        }

class SentimentAnalyzer:
    """
    A comprehensive sentiment analyzer using an ensemble of methods:
      - TextBlob
      - VADER
      - Lexicon-based analysis (custom lexicon)
      - Optionally, Transformer-based analysis
    """
    def __init__(self):
        for resource in ['corpora/wordnet', 'corpora/stopwords', 'sentiment/vader_lexicon']:
            try:
                nltk.data.find(resource)
            except LookupError:
                nltk.download(resource.split('/')[-1], quiet=True)
        self.vader_analyzer = SentimentIntensityAnalyzer()
        if HAS_TRANSFORMER:
            try:
                self.transformer_analyzer = TransformerSentimentAnalyzer()
            except Exception as ex:
                logger.error("Transformer analyzer failed to initialize: " + str(ex))
                self.transformer_analyzer = None
        else:
            self.transformer_analyzer = None

    def clean_text(self, text: str) -> str:
        if not text or not isinstance(text, str):
            return ""
        try:
            text = text.strip().lower()
            text = re.sub(r'https?://\S+|www\.\S+', '', text)
            text = re.sub(r'\S+@\S+', '', text)
            text = re.sub(r'[^a-zA-Z\s]', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        except Exception as e:
            logger.error(f"Error cleaning text: {e}")
            return text

    def _textblob_analysis(self, text: str) -> dict:
        try:
            analysis = TextBlob(text)
            polarity = analysis.sentiment.polarity
            sentiment = "neutral"
            if polarity > 0.2:
                sentiment = "positive"
            elif polarity < -0.2:
                sentiment = "negative"
            score = int((polarity + 1) * 50)
            return {"sentiment": sentiment, "score": score, "polarity": polarity, "method": "textblob", "confidence": 0.7}
        except Exception as e:
            logger.error("TextBlob analysis error: " + str(e))
            return None

    def _vader_analysis(self, text: str) -> dict:
        try:
            scores = self.vader_analyzer.polarity_scores(text)
            compound = scores["compound"]
            sentiment = "neutral"
            if compound >= 0.05:
                sentiment = "positive"
            elif compound <= -0.05:
                sentiment = "negative"
            score = int((compound + 1) * 50)
            return {"sentiment": sentiment, "score": score, "compound": compound, "pos": scores["pos"], "neu": scores["neu"], "neg": scores["neg"], "method": "vader", "confidence": 0.7}
        except Exception as e:
            logger.error("VADER analysis error: " + str(e))
            return None

    def _lexicon_analysis(self, text: str) -> dict:
        words = text.split()
        positive_count = 0
        negative_count = 0
        for word in words:
            if word in SENTIMENT_LEXICON.pos:
                positive_count += 1
            if word in SENTIMENT_LEXICON.neg:
                negative_count += 1
        sentiment = "neutral"
        if positive_count > negative_count:
            sentiment = "positive"
        elif negative_count > positive_count:
            sentiment = "negative"
        total = len(words) if words else 1
        score = int((((positive_count - negative_count) / total) + 1) * 50)
        return {"sentiment": sentiment, "score": score, "positive_count": positive_count, "negative_count": negative_count, "method": "lexicon", "confidence": 0.5}

    def analyze(self, text: str, method="ensemble", context=None) -> dict:
        if not text or not isinstance(text, str) or text.strip() == "":
            return {"sentiment": "neutral", "score": 50, "confidence": 0, "method": "default"}
        cleaned_text = self.clean_text(text)
        results = {}
        methods_used = []
        if method in ("textblob", "ensemble"):
            tb_result = self._textblob_analysis(cleaned_text)
            if tb_result:
                results["textblob"] = tb_result
                methods_used.append("textblob")
        if method in ("vader", "ensemble"):
            vader_result = self._vader_analysis(cleaned_text)
            if vader_result:
                results["vader"] = vader_result
                methods_used.append("vader")
        lex_result = self._lexicon_analysis(cleaned_text)
        results["lexicon"] = lex_result
        methods_used.append("lexicon")
        if method == "ensemble" and self.transformer_analyzer:
            transformer_result = self.transformer_analyzer.analyze(cleaned_text)
            if transformer_result:
                results["transformer"] = transformer_result
                methods_used.append("transformer")
        if method != "ensemble" and method in results:
            return {
                "sentiment": results[method]["sentiment"],
                "score": results[method]["score"],
                "confidence": results[method].get("confidence", 0.7),
                "method": method,
                "details": results[method]
            }
        weights = {"vader": 0.35, "textblob": 0.35, "lexicon": 0.2, "transformer": 0.1}
        total_weight = sum(weights[m] for m in methods_used)
        normalized_weights = {m: weights[m] / total_weight for m in methods_used}
        weighted_score = sum(results[m]["score"] * normalized_weights[m] for m in methods_used)
        final_score = int(weighted_score)
        sentiment = "neutral"
        if final_score >= 60:
            sentiment = "positive"
        elif final_score <= 40:
            sentiment = "negative"
        confidence = sum(results[m].get("confidence", 0.7) * normalized_weights[m] for m in methods_used)
        return {
            "sentiment": sentiment,
            "score": final_score,
            "confidence": confidence,
            "method": "ensemble",
            "details": results
        }

class SENTIMENT_LEXICON:
    pos = {
        "good", "great", "excellent", "amazing", "awesome", "happy", "satisfied", "wonderful",
        "fantastic", "terrific", "outstanding", "perfect", "love", "enjoy", "pleasant",
        "delighted", "pleased", "impressive", "exceptional", "efficient", "helpful",
        "professional", "friendly", "fast", "reliable", "responsive", "seamless",
        "convenient", "impressed", "quality", "thank", "appreciated", "recommend",
        "smooth", "easy", "quick", "simple", "intuitive", "effective", "useful",
        "prompt", "courteous", "accurate", "accommodating", "thorough", "knowledgeable",
        "organized", "timely", "valuable", "respectful", "attentive", "patient",
        "transparent", "informative", "supportive", "innovative", "comprehensive"
    }
    neg = {
        "bad", "poor", "terrible", "awful", "horrible", "unhappy", "disappointed",
        "frustrating", "annoying", "slow", "difficult", "confusing", "issue", "problem",
        "error", "mistake", "failure", "broken", "unreliable", "useless", "inefficient",
        "waste", "crash", "bug", "glitch", "lag", "inconsistent", "complicated",
        "expensive", "inconvenient", "disappointing", "dislike", "hate", "worst",
        "rude", "unprofessional", "unresponsive", "unfriendly", "unclear",
        "delayed", "misunderstood", "overcharged", "neglected", "incompetent",
        "mismanaged", "inadequate", "incomplete", "inaccurate", "unhelpful",
        "dismissive", "disorganized", "careless", "misleading", "unresponsive",
        "complain", "complaining", "complaint"
    }
