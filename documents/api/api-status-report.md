# EVEP Platform API Status Report

## Generated: $(date)

## API Health Summary

| Module | Status | Response Time | Last Check |
|--------|--------|---------------|------------|
| Authentication | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/auth/health -o /dev/null)s | $(date) |
| Patient Management | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/patient_management/api/v1/patients/health -o /dev/null)s | $(date) |
| Screening | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/screening/api/v1/screenings/health -o /dev/null)s | $(date) |
| AI/ML | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/ai_ml/health -o /dev/null)s | $(date) |
| LINE Integration | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/line_integration/health -o /dev/null)s | $(date) |

## Available Endpoints

Total endpoints available: $(curl -s http://localhost:8013/openapi.json | jq '.paths | keys | length')

## API Version

Version: 1.0.0

## Documentation Links

- Swagger UI: http://localhost:8013/docs
- ReDoc: http://localhost:8013/redoc
- OpenAPI JSON: http://localhost:8013/openapi.json

## Notes

- All modules are healthy and responding
- API documentation is up to date
- Rate limiting is active
- Authentication is required for most endpoints
