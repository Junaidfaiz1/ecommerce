'use client';

import { useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';
import { cn } from '@/lib/utils';

const LOGOUT_MUTATION = `
  mutation Logout {
    logout { ok }
  }
`;

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    if (pending) return;
    setPending(true);
    try {
      await graphqlRequest(LOGOUT_MUTATION);
    } catch {
      // Still leave the session UI — cookies may already be invalid.
    }
    window.location.assign('/');
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={pending}
      className={cn(className, 'disabled:opacity-60')}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
