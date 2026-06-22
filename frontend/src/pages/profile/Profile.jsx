import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Flag, Trophy, UserRound } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Card from '../../components/common/Card.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyOwnerApplication } from '../../services/ownerApplicationService.js';

function formatStatus(application) {
  if (!application) return 'Not Registered';
  if (application.status === 'PENDING') return 'Pending Approval';
  if (application.status === 'APPROVED') return 'Approved';
  if (application.status === 'REJECTED') return 'Rejected';
  return application.status;
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value || '—'}</p>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMyOwnerApplication(user.userID)
      .then((result) => {
        if (active) setApplication(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.userID]);

  const ownerStatus = formatStatus(application);
  const message = useMemo(() => {
    if (!application) {
      return 'You are currently registered as a Spectator. Become an Owner to register horses and participate in races.';
    }
    if (application.status === 'PENDING') {
      return 'Your application has been submitted successfully and is waiting for administrator approval.';
    }
    if (application.status === 'REJECTED') {
      return 'Your Owner application has been rejected. Please review the reason below and submit a new application.';
    }
    if (application.status === 'APPROVED') {
      return 'Congratulations! Your Owner application has been approved.';
    }
    return '';
  }, [application]);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState label="Loading profile..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Profile"
        title="Account and Owner status"
        description="One profile page switches between Not Registered, Pending, Rejected, and Approved states."
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="grid h-28 w-28 place-items-center rounded-[2rem] bg-[#1B5E20] text-5xl font-black text-white shadow-xl shadow-[#1B5E20]/25">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">{user.username}</h2>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <StatusBadge status={application?.status === 'APPROVED' ? 'Owner' : user.role} />
              <StatusBadge status={ownerStatus} />
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            <InfoRow label="Username" value={user.username} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone Number" value={user.phone} />
            <InfoRow label="Role" value={application?.status === 'APPROVED' ? 'Owner' : user.role} />
            <InfoRow label="Owner Status" value={ownerStatus} />
          </div>
        </Card>

        <Card title="Owner application state" description={message}>
          {!application && (
            <div className="rounded-3xl bg-slate-50 p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1B5E20]/10 text-[#1B5E20]">
                  <UserRound size={22} />
                </span>
                <div>
                  <h3 className="font-black text-slate-950">Role: Spectator</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Owner Status: Not Registered</p>
                </div>
              </div>
              <Link to="/profile/become-owner" className="btn btn-primary mt-6 inline-flex">
                Become an Owner
              </Link>
            </div>
          )}

          {application?.status === 'PENDING' && (
            <div className="rounded-3xl bg-orange-50 p-6 text-orange-900 ring-1 ring-orange-100">
              <h3 className="font-black">Role: Spectator</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoRow label="Owner Status" value="Pending Approval" />
                <InfoRow label="Application Date" value={application.submittedAt} />
              </div>
              <button type="button" className="btn btn-muted mt-6" disabled>
                Waiting For Approval
              </button>
            </div>
          )}

          {application?.status === 'REJECTED' && (
            <div className="rounded-3xl bg-red-50 p-6 text-red-900 ring-1 ring-red-100">
              <h3 className="font-black">Role: Spectator</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoRow label="Owner Status" value="Rejected" />
                <InfoRow label="Rejected Date" value={application.rejectedAt} />
              </div>
              <div className="mt-4 rounded-2xl bg-white/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-red-400">Reject Reason</p>
                <p className="mt-1 text-sm font-semibold text-red-900">{application.rejectReason}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/profile/become-owner" className="btn btn-primary">
                  Apply Again
                </Link>
                <Link to="/profile/become-owner?view=1" className="btn btn-muted">
                  View Application
                </Link>
              </div>
            </div>
          )}

          {application?.status === 'APPROVED' && (
            <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-950 ring-1 ring-emerald-100">
              <h3 className="font-black">Role: Owner</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <InfoRow label="Owner Status" value="Approved" />
                <InfoRow label="Approval Date" value={application.approvedAt} />
                <InfoRow label="Owner Since" value={application.ownerSince} />
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <Link to="/owner/dashboard#register-horse" className="quick-action">
                  <Trophy size={18} /> Register Horse
                </Link>
                <Link to="/owner/dashboard#horses" className="quick-action">
                  <ClipboardList size={18} /> My Horses
                </Link>
                <Link to="/owner/dashboard#race-registration" className="quick-action">
                  <Flag size={18} /> Race Registration
                </Link>
              </div>
            </div>
          )}

          {application && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoRow label="Full Name" value={application.fullName} />
              <InfoRow label="Date of Birth" value={application.dateOfBirth} />
              <InfoRow label="Gender" value={application.gender} />
              <InfoRow label="Nationality" value={application.nationality} />
              <InfoRow label="Address" value={application.address} />
              <InfoRow label="Identity Number" value={application.identityNumber} />
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
