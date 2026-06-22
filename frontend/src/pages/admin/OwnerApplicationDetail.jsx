import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { approveOwnerApplication, getOwnerApplicationById, rejectOwnerApplication } from '../../services/adminService.js';

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value || '—'}</p>
    </div>
  );
}

export default function OwnerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function loadApplication() {
    setLoading(true);
    const result = await getOwnerApplicationById(id);
    setApplication(result);
    setLoading(false);
  }

  useEffect(() => {
    loadApplication();
  }, [id]);

  async function handleApprove() {
    setActionLoading(true);
    setError('');
    try {
      await approveOwnerApplication(id);
      setApproveOpen(false);
      setSuccess('Application approved. User role has been changed to Owner and an OwnerProfile has been created.');
      await loadApplication();
    } catch (actionError) {
      setError(actionError.message || 'Approve failed.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    setActionLoading(true);
    setError('');
    try {
      await rejectOwnerApplication(id, rejectReason);
      setRejectOpen(false);
      setRejectReason('');
      setSuccess('Application rejected. User role remains Spectator.');
      await loadApplication();
    } catch (actionError) {
      setError(actionError.message || 'Reject failed.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState label="Loading application detail..." />
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout>
        <Card>
          <p className="font-bold text-slate-950">Application not found.</p>
          <button type="button" className="btn btn-primary mt-5" onClick={() => navigate('/admin/owner-applications')}>
            Back to list
          </button>
        </Card>
      </DashboardLayout>
    );
  }

  const isPending = application.status === 'PENDING';

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Application Detail"
        title={`Owner application #${application.applicationID}`}
        description="Review submitted identity information and approve or reject the Owner request."
        action={
          <Link to="/admin/owner-applications" className="btn btn-muted">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      {success && <p className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p>}
      {error && <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card title="Personal Information" description="Submitted owner identity data.">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Full Name" value={application.fullName} />
            <DetailItem label="Date of Birth" value={application.dateOfBirth} />
            <DetailItem label="Gender" value={application.gender} />
            <DetailItem label="Nationality" value={application.nationality} />
            <DetailItem label="Address" value={application.address} />
            <DetailItem label="Identity Number" value={application.identityNumber} />
            <DetailItem label="Email" value={application.email} />
            <DetailItem label="Phone Number" value={application.phone} />
          </div>
        </Card>

        <Card title="Admin actions">
          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current Status</p>
              <div className="mt-3">
                <StatusBadge status={application.status} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Approve changes user role to Owner. Reject keeps the user as Spectator and stores the reject reason.
              </p>
            </div>

            {application.rejectReason && <DetailItem label="Reject Reason" value={application.rejectReason} />}
            {application.approvedAt && <DetailItem label="Approval Date" value={application.approvedAt} />}
            {application.rejectedAt && <DetailItem label="Rejected Date" value={application.rejectedAt} />}

            <button type="button" className="btn btn-primary w-full" disabled={!isPending} onClick={() => setApproveOpen(true)}>
              Approve
            </button>
            <button type="button" className="btn btn-danger w-full" disabled={!isPending} onClick={() => setRejectOpen(true)}>
              Reject
            </button>
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={approveOpen}
        title="Approve owner application"
        message="Are you sure you want to approve this owner application?"
        confirmLabel="Approve"
        loading={actionLoading}
        onCancel={() => setApproveOpen(false)}
        onConfirm={handleApprove}
      />

      <ConfirmModal
        open={rejectOpen}
        title="Reject owner application"
        confirmLabel="Confirm Reject"
        variant="danger"
        loading={actionLoading}
        onCancel={() => setRejectOpen(false)}
        onConfirm={handleReject}
      >
        <label className="field-label">
          Reject Reason
          <textarea
            className="field-input min-h-28 resize-none"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Identity information is invalid."
          />
        </label>
      </ConfirmModal>
    </DashboardLayout>
  );
}
