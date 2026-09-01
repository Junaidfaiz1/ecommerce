import {
  GraphQLError,
  Kind,
  type ASTNode,
  type ValidationContext,
  type ASTVisitor,
  type SelectionNode,
} from 'graphql';

/** Max nesting depth for selection sets (Phase 3 / 16 hardening). */
export const GRAPHQL_MAX_DEPTH = 8;

/** Approximate max selected fields (including nested) per operation. */
export const GRAPHQL_MAX_COMPLEXITY = 150;

function countFields(
  selections: readonly SelectionNode[],
  fragments: Map<string, { selectionSet: { selections: readonly SelectionNode[] } }>,
  seenFragments: Set<string>,
): number {
  let count = 0;
  for (const sel of selections) {
    if (sel.kind === Kind.FIELD) {
      count += 1;
      if (sel.selectionSet) {
        count += countFields(sel.selectionSet.selections, fragments, seenFragments);
      }
    } else if (sel.kind === Kind.INLINE_FRAGMENT && sel.selectionSet) {
      count += countFields(sel.selectionSet.selections, fragments, seenFragments);
    } else if (sel.kind === Kind.FRAGMENT_SPREAD) {
      const name = sel.name.value;
      if (seenFragments.has(name)) continue;
      seenFragments.add(name);
      const frag = fragments.get(name);
      if (frag) {
        count += countFields(frag.selectionSet.selections, fragments, seenFragments);
      }
    }
  }
  return count;
}

/**
 * Simple field-count complexity rule (no extra dependency).
 */
export function createComplexityLimitRule(maxComplexity = GRAPHQL_MAX_COMPLEXITY) {
  return function ComplexityLimitRule(context: ValidationContext): ASTVisitor {
    return {
      Document: {
        enter(document) {
          const fragments = new Map<
            string,
            { selectionSet: { selections: readonly SelectionNode[] } }
          >();
          for (const def of document.definitions) {
            if (def.kind === Kind.FRAGMENT_DEFINITION) {
              fragments.set(def.name.value, def);
            }
          }

          for (const def of document.definitions) {
            if (def.kind !== Kind.OPERATION_DEFINITION) continue;
            const complexity = countFields(
              def.selectionSet.selections,
              fragments,
              new Set(),
            );
            if (complexity > maxComplexity) {
              context.reportError(
                new GraphQLError(
                  `Query is too complex: ${complexity} fields (max ${maxComplexity}).`,
                  {
                    nodes: [def as ASTNode],
                    extensions: { code: 'BAD_USER_INPUT' },
                  },
                ),
              );
            }
          }
        },
      },
    };
  };
}
