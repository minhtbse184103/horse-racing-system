import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Card from '../../components/common/Card.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { getOwnerApplications } from '../../services/adminService.js';

const statuses = ['All', 'PENDING', 'APPROVED', 'REJECTED'];
const PAGE_SIZE = 5;

export default function OwnerApplicationList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getOwnerApplications()
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesQuery =
        !normalized ||
        String(application.applicationID).includes(normalized) ||
        application.applicantName.toLowerCase().includes(normalized) ||
        application.email?.toLowerCase().includes(normalized);
      const matchesStatus = status === 'All' || application.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [applications, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  const columns = [
    { key: 'applicationID', header: 'Application ID', render: (row) => <span className="font-bold text-slate-950">#{row.applicationID}</span> },
    { key: 'applicantName', header: 'Applicant Name' },
    { key: 'submittedAt', header: 'Submission Date' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Link to={`/admin/owner-applications/${row.applicationID}`} className="font-bold text-[#1B5E20] hover:underline">
          View Details
        </Link>
      )
    }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState label="Loading owner applications..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Owner Applications"
        title="Application review queue"
        description="Search, filter, paginate, and open details for administrator approval decisions."
      />

      <Card>
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_240px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="field-input pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, applicant name, or email"
            />
          </label>
          <select className="field-input" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? 'All statuses' : item}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          emptyTitle="No owner applications"
          emptyDescription="No applications match the current search and status filter."
        />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {rows.length} of {filtered.length} applications
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-muted" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </button>
            <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
              {page} / {totalPages}
            </span>
            <button type="button" className="btn btn-muted" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              Next
            </button>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
