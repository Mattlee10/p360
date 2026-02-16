#!/bin/bash
# Hook: Protect sensitive files from modification
# Used by: PreToolUse hook for Edit|Write operations

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

# Protected file patterns
PROTECTED_PATTERNS=(
  ".env"
  ".env.production"
  ".env.local"
  "secrets/"
  "credentials"
  "*.pem"
  "*.key"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: $FILE_PATH matches protected pattern '$pattern'" >&2
    exit 2  # Exit code 2 blocks the operation
  fi
done

# Allow the operation
exit 0
