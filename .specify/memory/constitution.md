<!--
Sync Impact Report:
- Version change: Template → 1.0.0 (Initial constitution establishment)
- Modified principles: All principles established from template
- Added sections: Core Principles, Technology Stack, Development Standards, Governance
- Removed sections: None (initial creation)
- Templates requiring updates: ✅ All templates align with established principles
- Follow-up TODOs: None
-->

# PaleoLocal Constitution

## Core Principles

### I. API-First Design
Every feature MUST expose functionality through clean REST API endpoints. APIs MUST follow RESTful conventions with proper HTTP methods, status codes, and JSON responses. All endpoints MUST include comprehensive error handling with meaningful error messages. APIs serve as the primary contract between frontend and backend components.

**Rationale**: API-first design ensures clear separation of concerns, enables multiple client interfaces, and facilitates testing and integration.

### II. Research-Grade Data Integrity
All geological and paleontological data MUST maintain scientific accuracy and traceability. Data sources MUST be documented and attributable. Location data MUST use precise coordinates with proper validation. Generated summaries MUST clearly indicate AI-generated content and include source citations.

**Rationale**: Scientific research requires verifiable, traceable data to maintain credibility and enable peer review.

### III. Graceful AI Integration
AI services (vector search, text generation) MUST implement fallback mechanisms when external services fail. Applications MUST remain functional with reduced capabilities rather than complete failure. All AI-generated content MUST be clearly labeled and cached to avoid redundant API calls.

**Rationale**: Research tools must be reliable; AI enhancement should augment rather than replace core functionality.

## Technology Stack

### Approved Technologies
- **Backend**: Python 3.11+, FastAPI, Pydantic for data validation
- **Frontend**: React, Vite, Node.js for build tooling
- **AI/ML**: ChromaDB for vector storage, SentenceTransformers for embeddings, Google Gemini for text generation
- **Data**: CSV for seed data, JSONL for processed chunks
- **Testing**: pytest for Python, standard JavaScript testing frameworks

### Technology Constraints
- All dependencies MUST be pinned to specific versions in requirements files
- New dependencies require justification and security review
- Database solutions MUST support geospatial queries for location-based features
- AI model choices MUST prioritize local processing when possible

## Development Standards

### Code Quality
- All Python code MUST follow PEP 8 style guidelines
- Functions MUST include type hints for parameters and return values
- Complex logic MUST include inline documentation explaining scientific context
- All external API calls MUST implement proper timeout and retry logic

### Testing Requirements
- Unit tests MUST cover all data processing and API logic
- Integration tests MUST verify AI service fallback mechanisms
- Geospatial calculations MUST include precision validation tests
- API endpoints MUST include comprehensive request/response testing

### Documentation
- All API endpoints MUST include OpenAPI documentation
- Scientific methodology MUST be documented for data processing algorithms
- Setup instructions MUST be complete and tested on clean environments

## Governance

This constitution supersedes all other development practices and guidelines. All code reviews MUST verify compliance with these principles. Any complexity additions MUST be justified against research requirements and documented appropriately.

Amendments to this constitution require:
1. Documentation of the proposed change and rationale
2. Review of impact on existing codebase
3. Update of dependent templates and documentation
4. Version increment following semantic versioning

**Version**: 1.0.0 | **Ratified**: 2025-10-23 | **Last Amended**: 2025-10-23
