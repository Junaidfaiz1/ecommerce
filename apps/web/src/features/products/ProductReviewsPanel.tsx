'use client';

import { useState, type FormEvent } from 'react';
import { createReviewInputSchema } from '@vorqen/types';
import { RatingStars } from '@/components/shared/RatingStars';
import { EmptyState } from '@/components/shared/SectionStates';
import { Button } from '@/components/ui/button';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string;
  createdAt: string;
  status: string;
};

type ReviewConnection = {
  items: ReviewItem[];
  pageInfo: { totalCount: number };
  averageRating: number | null;
};

const CREATE_REVIEW = `
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      status
      rating
      title
    }
  }
`;

type Props = {
  productId: string;
  initial: ReviewConnection;
  className?: string;
};

export function ProductReviewsPanel({ productId, initial, className }: Props) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const parsed = createReviewInputSchema.safeParse({
      productId,
      rating,
      title: title.trim() || null,
      body: body.trim() || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your review.');
      return;
    }

    setPending(true);
    try {
      await graphqlRequest(CREATE_REVIEW, { input: parsed.data });
      setNotice('Review submitted — pending moderation before it appears.');
      setTitle('');
      setBody('');
      setRating(5);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn('grid gap-10 lg:grid-cols-5', className)}>
      <div className="lg:col-span-3">
        {initial.items.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Be the first to review this product after signing in."
          />
        ) : (
          <ul className="space-y-6">
            {initial.items.map((review) => (
              <li key={review.id} className="border-b border-border pb-6">
                <div className="flex items-center gap-3">
                  <RatingStars rating={review.rating} />
                  <span className="text-sm font-medium">{review.authorName}</span>
                  <span className="font-mono text-[10px] text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.title ? (
                  <p className="mt-2 text-sm font-medium">{review.title}</p>
                ) : null}
                {review.body ? (
                  <p className="mt-1 text-sm text-muted">{review.body}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 border border-border bg-surface/40 p-4 lg:col-span-2"
      >
        <h3 className="font-display text-lg tracking-tight">Write a review</h3>
        <p className="text-xs text-muted">
          Requires sign-in. New reviews stay pending until moderation.
        </p>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted">Rating</p>
          <div className="flex items-center gap-3">
            <RatingStars
              rating={rating}
              onChange={setRating}
              size="md"
              name="rating"
            />
            <span className="text-sm text-muted">
              {rating > 0 ? `${rating} of 5` : 'Choose a rating'}
            </span>
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={4000}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {notice ? <p className="text-sm text-ink">{notice}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Submitting…' : 'Submit review'}
        </Button>
      </form>
    </div>
  );
}
