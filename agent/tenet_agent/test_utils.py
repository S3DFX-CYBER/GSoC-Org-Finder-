import os
import unittest
from unittest.mock import Mock, patch
from google.genai import errors
from agent.tenet_agent.utils import call_llm


class TestCallLLM(unittest.TestCase):
    def setUp(self):
        self.client = Mock()
        self.prompt = "Test prompt"
        self.original_fail_closed = os.environ.get("TENET_FAIL_CLOSED")
        # Ensure fail closed is off for these tests
        os.environ["TENET_FAIL_CLOSED"] = "false"

    def tearDown(self):
        if self.original_fail_closed is None:
            if "TENET_FAIL_CLOSED" in os.environ:
                del os.environ["TENET_FAIL_CLOSED"]
        else:
            os.environ["TENET_FAIL_CLOSED"] = self.original_fail_closed

    @patch('agent.tenet_agent.utils.time.sleep')
    def test_retries_on_429(self, mock_sleep):
        # Setup mock to raise 429 twice, then succeed
        error_429 = errors.APIError("429 Quota Exceeded", {})
        error_429.code = 429
        success_response = Mock()
        success_response.text = "Success"

        self.client.models.generate_content.side_effect = [
            error_429,
            error_429,
            success_response
        ]

        result = call_llm(self.client, self.prompt)
        self.assertEqual(result, "Success")
        self.assertEqual(self.client.models.generate_content.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)

    def test_fail_open_on_429_exhausted(self):
        # Setup mock to constantly raise 429
        error_429 = errors.APIError("429 Quota Exceeded", {})
        error_429.code = 429
        self.client.models.generate_content.side_effect = error_429

        with patch('agent.tenet_agent.utils.time.sleep'):
            result = call_llm(self.client, self.prompt)

        self.assertEqual(
            result, "⚠️ TENET Security Review skipped due to API rate limits.")
        self.assertEqual(self.client.models.generate_content.call_count, 3)

    def test_fail_open_on_safety_block_none_text(self):
        # Setup mock to return None text (safety block)
        blocked_response = Mock()
        blocked_response.text = None
        self.client.models.generate_content.return_value = blocked_response

        result = call_llm(self.client, self.prompt)

        self.assertEqual(
            result, "⚠️ TENET Security Review skipped due to safety filters.")
        self.assertEqual(self.client.models.generate_content.call_count, 1)

    def test_fail_closed_on_429_exhausted(self):
        os.environ["TENET_FAIL_CLOSED"] = "true"
        error_429 = errors.APIError("429 Quota Exceeded", {})
        error_429.code = 429
        self.client.models.generate_content.side_effect = error_429

        with patch('agent.tenet_agent.utils.time.sleep'):
            result = call_llm(self.client, self.prompt)

        self.assertIsNone(result)
        self.assertEqual(self.client.models.generate_content.call_count, 3)

    def test_fail_closed_on_safety_block_none_text(self):
        os.environ["TENET_FAIL_CLOSED"] = "true"
        blocked_response = Mock()
        blocked_response.text = None
        self.client.models.generate_content.return_value = blocked_response

        result = call_llm(self.client, self.prompt)

        self.assertIsNone(result)
        self.assertEqual(self.client.models.generate_content.call_count, 1)


if __name__ == '__main__':
    unittest.main()
