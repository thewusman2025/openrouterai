# Error Prevention Guidelines

## Quick Reference
**DXT Properties**: `dxt_version`, `entry_point`, `mcp_config`, `user_config`, `sensitive`  
**Valid Platforms**: `win32`, `darwin`, `linux` (NOT `windows`, `macos`)  
**CLI Commands**: `dxt validate`, `dxt pack`, `dxt sign`, `dxt verify`  
**MCP Tools**: `chat_completion()`, `search_models()`, `get_model_info()`, `validate_model()`  

## Core Standards
- **DXT Manifest Structure**: Use `server.mcp_config.command` with args array, direct property mapping for `user_config` (no nested properties object)
- **Platform Compatibility**: Use Node.js platform identifiers (`darwin` for macOS), specify minimum versions with `>=` syntax
- **Environment Variables**: Map user config with `${user_config.property_name}` syntax in `mcp_config.env`
- **TypeScript**: Import types with `.js` extensions for ES modules, use strict compilation with declaration files

## Error Resolution Process
1. **Validate Manifest**: Run `dxt validate manifest.json` to catch schema violations early
2. **Fix Platform Names**: Replace user-friendly names with Node.js platform constants
3. **Restructure Config**: Move user configuration properties to root level of `user_config` object
4. **Add Required Fields**: Include `mcp_config.command` and `args` array for server execution
5. **Remove Unsupported Fields**: Strip `enum` arrays and unsupported validation properties

## Architecture Patterns
- **MCP Server Integration**: Package compiled `dist/` files with `node_modules` production dependencies only
  - Use `.dxtignore` to exclude source files, tests, and development tools
  - Set executable permissions on entry point during build process
- **Configuration Management**: Implement sensitive data handling with OS keychain integration through `sensitive: true` flag

## Workflow Standards  
- **DXT Packaging**: Build TypeScript first, validate manifest, then pack to avoid runtime errors
- **Dependency Management**: Test production-only installs to verify bundled dependencies are sufficient

## Quality Gates
- **Bundle Size**: Target under 50MB for typical MCP servers through selective dependency inclusion
- **Cross-Platform**: Test on Windows, macOS, Linux with Node.js >=18.0.0 requirement