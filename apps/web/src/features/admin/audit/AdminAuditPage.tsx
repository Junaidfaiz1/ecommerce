'use client';

import { useEffect, useState } from 'react';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@vorqen/types';
import { ErrorState } from '@/components/shared/SectionStates';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADMIN_AUDIT_LOGS } from '../graphql';
import { AdminHeader, AdminPager, AdminTable, AdminEmptyState, Field, fieldClass } from '../ui';

type Row = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  ip: string | null;
  createdAt: string;
  actorEmail: string | null;
};

type PageInfo = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [items, setItems] = useState<Row[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{
          adminAuditLogs: { items: Row[]; pageInfo: PageInfo };
        }>(ADMIN_AUDIT_LOGS, {
          input: {
            page,
            ...(action ? { action } : {}),
            ...(entityType ? { entityType } : {}),
          },
        });
        if (cancelled) return;
        setItems(data.adminAuditLogs.items);
        setPageInfo(data.adminAuditLogs.pageInfo);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, action, entityType]);

  return (
    <div>
      <AdminHeader
        title="Audit log"
        description="Staff-critical writes. Metadata is sanitized on persist."
      />
      {error ? <ErrorState message={error} /> : null}
      <div className="mb-4 flex flex-wrap gap-3">
        <Field label="Action">
          <select
            className={fieldClass}
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Entity">
          <select
            className={fieldClass}
            value={entityType}
            onChange={(e) => {
              setPage(1);
              setEntityType(e.target.value);
            }}
          >
            <option value="">All entities</option>
            {AUDIT_ENTITY_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {loading && items.length === 0 && !error ? (
        <p className="text-sm text-muted">Loading audit log…</p>
      ) : items.length === 0 && !error ? (
        <AdminEmptyState
          title={action || entityType ? 'No matching audit rows' : 'No audit rows yet'}
          description={
            action || entityType
              ? 'Try a different action or entity filter.'
              : 'Staff catalog, order, inventory, and coupon writes will appear here.'
          }
        />
      ) : items.length === 0 ? null : (
        <AdminTable>
          <thead>
            <tr className="border-b border-border text-[11px] text-muted uppercase">
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Entity</th>
              <th className="px-3 py-2 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-border/80">
                <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                  {row.createdAt.replace('T', ' ').slice(0, 19)}
                </td>
                <td className="px-3 py-2 text-xs">{row.actorEmail ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-[11px]">{row.action}</td>
                <td className="px-3 py-2 font-mono text-[11px]">
                  {row.entityType}
                  {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ''}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-muted">
                  {row.ip ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
      {pageInfo ? (
        <AdminPager
          page={pageInfo.page}
          totalPages={pageInfo.totalPages}
          hasPrev={pageInfo.hasPreviousPage}
          hasNext={pageInfo.hasNextPage}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
    </div>
  );
}
