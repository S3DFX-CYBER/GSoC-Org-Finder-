# Changelog

## [Unreleased]
### Added
- Implemented an exponential backoff retry mechanism (3 attempts) with jitter for the Gemini API call in `call_llm` to gracefully handle transient `429 Quota Exceeded` rate limits.
- Added a "fail-open" degraded mode for the TENET Security Review GitHub Action. If the Gemini API rate limit is completely exhausted, or if the LLM response is blocked by safety filters (resulting in `response.text` being `None`), the agent will post a structured warning comment to the Pull Request and exit successfully (status `0`). 
  - **Risk:** This prevents transient LLM API issues from unnecessarily blocking the entire CI/CD pipeline, maintaining developer velocity.
  - **Reason for fail-open:** We prioritize continuous integration availability over strict security gate enforcement in cases of third-party API downtime. For stricter environments, this behavior can be toggled to fail-closed by setting `TENET_FAIL_CLOSED=true`.
- Migrated from deprecated `google.generativeai` SDK to the officially supported `google-genai` SDK.
- Added comprehensive unit tests for rate-limiting, retries, and safety-block scenarios.
