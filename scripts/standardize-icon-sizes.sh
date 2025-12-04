#!/bin/bash

# Script to standardize icon sizes using ICON_SIZES design tokens
# Replaces hardcoded h-X w-X with ${ICON_SIZES.XX} template literals

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🎨 Standardizing icon sizes across components..."

# Find all .tsx files in components/ excluding ui/ (shadcn components)
files=$(find components -name "*.tsx" ! -path "*/ui/*" ! -path "*/node_modules/*")

count=0
for file in $files; do
  # Check if file contains hardcoded icon sizes
  if grep -q -E 'className="[^"]*\b(h-4 w-4|w-4 h-4|h-5 w-5|w-5 h-5|h-6 w-6|w-6 h-6|h-8 w-8|w-8 h-8)' "$file" || \
     grep -q -E "className='[^']*\b(h-4 w-4|w-4 h-4|h-5 w-5|w-5 h-5|h-6 w-6|w-6 h-6|h-8 w-8|w-8 h-8)" "$file" || \
     grep -q -E 'className=\{`[^`]*\b(h-4 w-4|w-4 h-4|h-5 w-5|w-5 h-5|h-6 w-6|w-6 h-6|h-8 w-8|w-8 h-8)' "$file"; then
    
    echo -e "${YELLOW}Processing: $file${NC}"
    
    # Add ICON_SIZES import if not present
    if ! grep -q "from '@/lib/design-tokens'" "$file" && ! grep -q 'from "@/lib/design-tokens"' "$file"; then
      # Find the last import line
      last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      if [ -n "$last_import_line" ]; then
        sed -i "${last_import_line}a import { ICON_SIZES } from '@/lib/design-tokens';" "$file"
        echo "  ✓ Added ICON_SIZES import"
      fi
    fi
    
    # Replace hardcoded sizes with ICON_SIZES tokens
    # h-4 w-4 and w-4 h-4 → ${ICON_SIZES.sm}
    sed -i -E 's/className="([^"]*)\b(h-4 w-4|w-4 h-4)\b([^"]*)"/className={\`\1${ICON_SIZES.sm}\3\`}/g' "$file"
    sed -i -E "s/className='([^']*)\b(h-4 w-4|w-4 h-4)\b([^']*)'/className={\`\1\${ICON_SIZES.sm}\3\`}/g" "$file"
    
    # h-5 w-5 and w-5 h-5 → ${ICON_SIZES.md}
    sed -i -E 's/className="([^"]*)\b(h-5 w-5|w-5 h-5)\b([^"]*)"/className={\`\1${ICON_SIZES.md}\3\`}/g' "$file"
    sed -i -E "s/className='([^']*)\b(h-5 w-5|w-5 h-5)\b([^']*)'/className={\`\1\${ICON_SIZES.md}\3\`}/g" "$file"
    
    # h-6 w-6 and w-6 h-6 → ${ICON_SIZES.lg}
    sed -i -E 's/className="([^"]*)\b(h-6 w-6|w-6 h-6)\b([^"]*)"/className={\`\1${ICON_SIZES.lg}\3\`}/g' "$file"
    sed -i -E "s/className='([^']*)\b(h-6 w-6|w-6 h-6)\b([^']*)'/className={\`\1\${ICON_SIZES.lg}\3\`}/g" "$file"
    
    # h-8 w-8 and w-8 h-8 → ${ICON_SIZES.xl}
    sed -i -E 's/className="([^"]*)\b(h-8 w-8|w-8 h-8)\b([^"]*)"/className={\`\1${ICON_SIZES.xl}\3\`}/g' "$file"
    sed -i -E "s/className='([^']*)\b(h-8 w-8|w-8 h-8)\b([^']*)'/className={\`\1\${ICON_SIZES.xl}\3\`}/g" "$file"
    
    count=$((count + 1))
    echo -e "  ${GREEN}✓ Replaced icon sizes${NC}"
  fi
done

echo -e "\n${GREEN}✨ Done! Updated $count files.${NC}"
echo "Run 'npm run build' to verify changes."
