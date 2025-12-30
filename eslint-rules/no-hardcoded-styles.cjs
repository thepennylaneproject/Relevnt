/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ESLINT RULE: no-hardcoded-styles
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Design Constitution Rule 2 Enforcement for React inline styles.
 *
 * Flags inline style objects that contain hard-coded visual values.
 * These should use design tokens (CSS variables) instead.
 *
 * ALLOWED:
 * - Values using var(--*)
 * - Values of 0, 'auto', 'inherit', 'initial', 'unset', 'none'
 * - Layout properties (display, flex, grid, position, etc.)
 *
 * ESCAPE HATCH:
 * Add comment: // token-escape: <reason>
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Properties that should use design tokens
const VISUAL_PROPERTIES = [
  'color',
  'backgroundColor',
  'background',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'fill',
  'stroke',
  // Spacing
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'gap',
  'rowGap',
  'columnGap',
  // Typography
  'fontSize',
  'lineHeight',
  'letterSpacing',
  // Visual effects
  'borderRadius',
  'boxShadow',
  'textShadow',
  // Layers
  'zIndex',
];

// Values that are always allowed
const ALLOWED_VALUES = [
  '0',
  0,
  'auto',
  'inherit',
  'initial',
  'unset',
  'none',
  'transparent',
  '100%',
  '50%',
  'currentColor',
];

// Check if a value uses CSS variables
function usesVariable(value) {
  if (typeof value !== 'string') return false;
  return value.includes('var(--');
}

// Check if value is allowed
function isAllowedValue(value) {
  if (ALLOWED_VALUES.includes(value)) return true;
  if (typeof value === 'string' && usesVariable(value)) return true;
  // Allow calc(), clamp(), min(), max() with variables
  if (typeof value === 'string' && /^(calc|clamp|min|max)\(/.test(value) && usesVariable(value)) return true;
  return false;
}

// Check for escape hatch comment
function hasEscapeComment(comments, node) {
  if (!comments || comments.length === 0) return false;
  return comments.some(comment =>
    comment.value.includes('token-escape:')
  );
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hard-coded visual values in inline styles',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      noHardcodedStyle:
        'Inline style "{{property}}: {{value}}" uses a hard-coded value. ' +
        'Use a design token: var(--*). See /docs/design-token-escape.md for exemptions.',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    return {
      // Check JSX style attributes
      JSXAttribute(node) {
        if (node.name.name !== 'style') return;
        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;

        const expression = node.value.expression;
        if (!expression) return;

        // Check for escape comment
        const comments = sourceCode.getCommentsBefore(node);
        if (hasEscapeComment(comments, node)) return;

        // Handle direct object expression
        if (expression.type === 'ObjectExpression') {
          checkObjectProperties(expression, context, sourceCode);
        }
      },

      // Check style objects assigned to variables
      VariableDeclarator(node) {
        if (!node.id || !node.init) return;

        // Look for variable names that suggest styles
        const name = node.id.name || '';
        const isStyleVar =
          name.toLowerCase().includes('style') ||
          name.toLowerCase().includes('css');

        if (isStyleVar && node.init.type === 'ObjectExpression') {
          const comments = sourceCode.getCommentsBefore(node);
          if (hasEscapeComment(comments, node)) return;
          checkObjectProperties(node.init, context, sourceCode);
        }
      },
    };

    function checkObjectProperties(objectNode, context, sourceCode) {
      if (!objectNode.properties) return;

      for (const prop of objectNode.properties) {
        if (prop.type !== 'Property') continue;
        if (!prop.key) continue;

        const propName = prop.key.name || prop.key.value;
        if (!VISUAL_PROPERTIES.includes(propName)) continue;

        // Check the value
        const valueNode = prop.value;
        if (!valueNode) continue;

        let value;
        if (valueNode.type === 'Literal') {
          value = valueNode.value;
        } else if (valueNode.type === 'TemplateLiteral' && valueNode.quasis.length === 1) {
          value = valueNode.quasis[0].value.raw;
        } else {
          // Skip complex expressions (variables, function calls, etc.)
          continue;
        }

        // Check if the value is allowed
        if (!isAllowedValue(value)) {
          context.report({
            node: prop,
            messageId: 'noHardcodedStyle',
            data: {
              property: propName,
              value: String(value),
            },
          });
        }
      }
    }
  },
};
