# Changelog

## [Unreleased]

### Added

- Initial release of Tea, a lightweight, type-safe API client builder for TypeScript
- `createTea` function for creating a type-safe API client
- Support for GET, POST, PUT, PATCH, and DELETE HTTP methods
- Path parameter parsing and validation
- Query parameter support
- Request body validation using Zod schemas
- Response parsing and validation using Zod schemas
- Custom headers and request options support
- Error handling for HTTP errors
- TypeScript type inference for request parameters and response data

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.1.0] - 2024-10-04

- Initial release

## [0.1.1] - 2024-10-04

- Added error handling with tuple return type to abstract away try/catch
- Changed stringify option to boolean - defaults to false
- Added example to README
- Fixed issue with merged options not being applied correctly
