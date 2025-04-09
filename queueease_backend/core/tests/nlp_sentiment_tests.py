from unittest import TestCase, mock
from core.utils.nlp_sentiment import (
    NLPProcessor,
    KeywordExtractor, 
    SentimentAnalyzer,
    TransformerSentimentAnalyzer,
    SENTIMENT_LEXICON
)

class NLPProcessorTests(TestCase):    
    def setUp(self):
        self.processor = NLPProcessor()
        
    def test_preprocess(self):
        text = "The customer service was very good and efficient!"
        tokens = self.processor.preprocess(text)
        
        # Check that stopwords are removed and words are lemmatized
        self.assertNotIn("the", tokens)
        self.assertNotIn("was", tokens)
        self.assertNotIn("and", tokens)
        self.assertIn("customer", tokens)
        self.assertIn("service", tokens)
        self.assertIn("good", tokens)
        self.assertIn("efficient", tokens)
    
    def test_extract_noun_chunks(self):
        text = "The customer service team was helpful."
        chunks = self.processor.extract_noun_chunks(text)
        
        self.assertIn("the customer service team", chunks)


class KeywordExtractorTests(TestCase):    
    def setUp(self):
        self.extractor = KeywordExtractor()
    
    def test_extract_keywords_empty_list(self):
        results = self.extractor.extract_keywords([])
        self.assertEqual(results, [])
        
    def test_extract_keywords_single_comment(self):
        comments = ["The service was excellent"]
        results = self.extractor.extract_keywords(comments)
        
        # Find the "service" and "excellent" entries in results
        service_entry = next((item for item in results if item["text"] == "service"), None)
        excellent_entry = next((item for item in results if item["text"] == "excellent"), None)
        
        self.assertIsNotNone(service_entry)
        self.assertIsNotNone(excellent_entry)
        self.assertEqual(service_entry["value"], 1)
        self.assertEqual(excellent_entry["value"], 1)
    
    def test_extract_keywords_with_sentiment(self):
        comments = ["The service was excellent", "The wait time was terrible"]
        sentiment_mapping = {
            "the service was excellent": "positive",
            "the wait time was terrible": "negative"
        }
        
        results = self.extractor.extract_keywords(comments, sentiment_mapping)
        
        # Check "service" has positive sentiment
        service_entry = next((item for item in results if item["text"] == "service"), None)
        self.assertEqual(service_entry["sentiment_breakdown"]["positive"], 1)
        
        # Check "terrible" has negative sentiment
        terrible_entry = next((item for item in results if item["text"] == "terrible"), None)
        self.assertEqual(terrible_entry["sentiment_breakdown"]["negative"], 1)


@mock.patch("core.utils.nlp_sentiment.HAS_TRANSFORMER", False)
class SentimentAnalyzerTests(TestCase):    
    def setUp(self):
        self.analyzer = SentimentAnalyzer()
    
    def test_clean_text(self):
        dirty_text = "This is a Test! With some CAPS and http://links.com and email@test.com"
        clean = self.analyzer.clean_text(dirty_text)
        
        self.assertNotIn("http", clean)
        self.assertNotIn("email@test.com", clean)
        self.assertNotIn("!", clean)
        self.assertEqual(clean, "this is a test with some caps and and")
    
    def test_textblob_analysis(self):
        result = self.analyzer._textblob_analysis("This is a great service!")
        
        self.assertEqual(result["sentiment"], "positive")
        self.assertTrue(result["score"] > 50)
        self.assertEqual(result["method"], "textblob")
    
    def test_vader_analysis(self):
        result = self.analyzer._vader_analysis("This is a horrible experience")
        
        self.assertEqual(result["sentiment"], "negative")
        self.assertTrue(result["score"] < 50)
        self.assertEqual(result["method"], "vader")
    
    def test_lexicon_analysis(self):
        result = self.analyzer._lexicon_analysis("The service was excellent and very helpful")
        
        self.assertEqual(result["sentiment"], "positive")
        self.assertTrue(result["positive_count"] > 0)
        self.assertEqual(result["method"], "lexicon")
    
    def test_analyze_empty_text(self):
        result = self.analyzer.analyze("")
        
        self.assertEqual(result["sentiment"], "neutral")
        self.assertEqual(result["score"], 50)
    
    def test_analyze_positive_text(self):
        result = self.analyzer.analyze("The service was excellent, friendly staff and quick service!")
        
        self.assertEqual(result["sentiment"], "positive")
        self.assertTrue(result["score"] >= 60)
        self.assertEqual(result["method"], "ensemble")
    
    def test_analyze_negative_text(self):
        result = self.analyzer.analyze("Terrible experience, rude staff and slow service.")
        
        self.assertEqual(result["sentiment"], "negative")
        self.assertTrue(result["score"] <= 40)
        self.assertEqual(result["method"], "ensemble")
    
    def test_analyze_neutral_text(self):
        result = self.analyzer.analyze("The service was standard, nothing special.")
        
        self.assertEqual(result["sentiment"], "neutral")
        self.assertTrue(40 < result["score"] < 60)
    
    def test_analyze_specific_method(self):
        result = self.analyzer.analyze("The service was great!", method="vader")
        
        self.assertEqual(result["method"], "vader")
        self.assertTrue("details" in result)


class TransformerSentimentAnalyzerMockTests(TestCase):
    @mock.patch("core.utils.nlp_sentiment.TransformerSentimentAnalyzer._pipeline", None)
    @mock.patch("core.utils.nlp_sentiment.pipeline")
    def test_transformer_initialization(self, mock_pipeline):
        # Configure the mock pipeline
        mock_pipeline.return_value = "mocked_pipeline"
        
        analyzer = TransformerSentimentAnalyzer()
        
        # Verify pipeline was initialized
        mock_pipeline.assert_called_once()
        self.assertEqual(analyzer.sentiment_pipeline, "mocked_pipeline")
    
    @mock.patch("core.utils.nlp_sentiment.TransformerSentimentAnalyzer._pipeline", None)
    @mock.patch("core.utils.nlp_sentiment.pipeline")
    def test_transformer_analyze(self, mock_pipeline):
        # Mock the pipeline and its prediction
        mock_prediction = [{"label": "POSITIVE", "score": 0.95}]
        mock_pipeline_instance = mock.MagicMock()
        mock_pipeline_instance.return_value = mock_prediction
        mock_pipeline.return_value = mock_pipeline_instance
        
        analyzer = TransformerSentimentAnalyzer()
        result = analyzer.analyze("This is a great service!")
        
        self.assertEqual(result["sentiment"], "positive")
        # The implementation actually uses int(result[0]['score'] * 100)
        self.assertEqual(result["score"], 95) 
        self.assertEqual(result["method"], "transformer")
        
    @mock.patch("core.utils.nlp_sentiment.TransformerSentimentAnalyzer._pipeline", None)
    @mock.patch("core.utils.nlp_sentiment.pipeline")
    def test_transformer_analyze_negative(self, mock_pipeline):
        # Mock the pipeline and its prediction
        mock_prediction = [{"label": "NEGATIVE", "score": 0.85}]
        mock_pipeline_instance = mock.MagicMock()
        mock_pipeline_instance.return_value = mock_prediction
        mock_pipeline.return_value = mock_pipeline_instance
        
        analyzer = TransformerSentimentAnalyzer()
        result = analyzer.analyze("This is a terrible service!")
        
        self.assertEqual(result["sentiment"], "negative")
        # The implementation actually uses int(result[0]['score'] * 100)
        self.assertEqual(result["score"], 85)
        self.assertEqual(result["method"], "transformer")
    
    @mock.patch("core.utils.nlp_sentiment.TransformerSentimentAnalyzer._pipeline", None)
    @mock.patch("core.utils.nlp_sentiment.pipeline")
    def test_transformer_initialization_failure(self, mock_pipeline):
        # Configure the mock to raise an exception
        mock_pipeline.side_effect = Exception("Failed to load model")
        
        analyzer = TransformerSentimentAnalyzer()
        
        result = analyzer.analyze("This is a test")
        self.assertEqual(result["sentiment"], "neutral")
        self.assertEqual(result["score"], 50)


class SentimentLexiconTests(TestCase):
    """Test the sentiment lexicon."""
    
    def test_lexicon_word_presence(self):
        """Test that important words are in the lexicon."""
        self.assertIn("excellent", SENTIMENT_LEXICON.pos)
        self.assertIn("good", SENTIMENT_LEXICON.pos)
        self.assertIn("terrible", SENTIMENT_LEXICON.neg)
        self.assertIn("poor", SENTIMENT_LEXICON.neg)
    
    def test_lexicon_positive_count(self):
        """Test that lexicon has enough positive words."""
        self.assertGreater(len(SENTIMENT_LEXICON.pos), 30)
    
    def test_lexicon_negative_count(self):
        """Test that lexicon has enough negative words."""
        self.assertGreater(len(SENTIMENT_LEXICON.neg), 30)