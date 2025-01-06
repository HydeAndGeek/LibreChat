# Configuration Structure

## Environment Variables (.env)
- Server settings (host, port)
- Security credentials (JWT, encryption)
- Database connections
- API keys
- Feature flags

## YAML Configuration (librechat.yaml)
- Version: 1.2.1
- Interface settings
- Registration options
- Endpoint configurations
- File handling rules

# Docker Architecture
- Main app: LibreChat container
- Databases:
  - MongoDB: User/chat data
  - Vector DB: RAG storage
- Services:
  - Meilisearch: Search functionality
  - RAG API: Document processing

# Authentication Flow
- JWT-based auth
- Environment-based secrets
- Registration controls in YAML
- Email login enabled
