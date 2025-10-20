# Spec-Driven Development with OpenSpec

When working on this project, follow the OpenSpec spec-driven development workflow integrated with MCP tools.

## Overview
OpenSpec helps align humans and AI on what to build before writing code. Use MCP tools to enhance planning, code quality, and implementation.


## 1. Create Proposals with scaffold-mcp

When implementing new features or changes, use scaffold-mcp MCP tools:

**For new projects/features:**
1. Use `list-boilerplates` MCP tool to see available templates
2. Use `use-boilerplate` MCP tool to scaffold new projects
3. Create OpenSpec proposal: "Create an OpenSpec proposal for [feature description]"

**For adding features to existing code:**
1. Use `list-scaffolding-methods` MCP tool with projectPath to see available features
2. Use `use-scaffold-method` MCP tool to generate boilerplate code
3. Create OpenSpec proposal to capture the specs


AI will scaffold: openspec/changes/[feature-name]/ with proposal.md, tasks.md, and spec deltas


## 2. Review & Validate with architect-mcp

Before and after editing files, use architect-mcp MCP tools:

**Before editing:**
- Use `get-file-design-pattern` MCP tool to understand:
  - Applicable design patterns from architect.yaml
  - Coding rules from RULES.yaml (must_do, should_do, must_not_do)
  - Code examples showing the patterns

**After editing:**
- Use `review-code-change` MCP tool to check for:
  - Must not do violations (critical issues)
  - Must do missing (required patterns not followed)
  - Should do suggestions (best practices)

**Validate OpenSpec specs:**
- Use `openspec validate [feature-name]` to check spec formatting
- Iterate with AI until specs are agreed upon


## 3. Implement with MCP-Guided Development

During implementation:
1. Ask AI to implement: "Apply the OpenSpec change [feature-name]"
2. **Before each file edit**: Use `get-file-design-pattern` to understand patterns
3. AI implements tasks from tasks.md following design patterns
4. **After each file edit**: Use `review-code-change` to verify compliance
5. Fix any violations before proceeding


## 4. Archive Completed Changes

After successful implementation:
- "Archive the OpenSpec change [feature-name]"
- This merges approved spec updates into openspec/specs/


## MCP Tools Reference


### scaffold-mcp
- `list-boilerplates` - List available project templates
- `use-boilerplate` - Create new project from template
- `list-scaffolding-methods` - List features for existing project
- `use-scaffold-method` - Add feature to existing project


### architect-mcp
- `get-file-design-pattern` - Get design patterns for file
- `review-code-change` - Review code for violations


### OpenSpec CLI
- `openspec list` - View active changes
- `openspec show [change]` - Display change details
- `openspec validate [change]` - Check spec formatting
- `openspec archive [change]` - Archive completed change


## Workflow Summary

1. **Plan**: Use scaffold-mcp to generate boilerplate + OpenSpec proposal for specs
2. **Design**: Use architect-mcp to understand patterns before editing
3. **Implement**: Follow specs and patterns
4. **Review**: Use architect-mcp to validate code quality
5. **Archive**: Merge specs into source of truth

For more details, refer to @/openspec/AGENTS.md when working with OpenSpec.