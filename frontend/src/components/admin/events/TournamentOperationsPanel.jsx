import { useState } from 'react';
import RaceEntryAssignmentPanel from './race-entry/RaceEntryAssignmentPanel';
import RegistrationApprovalPanel from './registration/RegistrationApprovalPanel';

export default function TournamentOperationsPanel({
  tournament,
  registrations,
  registrationsLoading,
  registrationsError,
  retryRegistrations,
  approveRegistration,
  rejectRegistration,
  onRaceEntryCountChange,
  onRaceStatusChange,
  adminName
}) {
  const [assignmentQueueRefreshKey, setAssignmentQueueRefreshKey] = useState(0);

  async function approveAndRefreshQueue(registrationId) {
    const updatedRegistration = await approveRegistration(registrationId);
    setAssignmentQueueRefreshKey((current) => current + 1);
    return updatedRegistration;
  }

  return (
    <div className="space-y-4 border-t border-brown-700/10 bg-cream-200/35 px-4 py-4 md:px-5">
      <RaceEntryAssignmentPanel
        tournament={tournament}
        onRaceEntryCountChange={onRaceEntryCountChange}
        onRaceStatusChange={onRaceStatusChange}
        queueRefreshKey={assignmentQueueRefreshKey}
      />
      <RegistrationApprovalPanel
        tournament={tournament}
        registrations={registrations}
        isLoading={registrationsLoading}
        loadError={registrationsError}
        onRetry={retryRegistrations}
        onApprove={approveAndRefreshQueue}
        onReject={rejectRegistration}
      />
    </div>
  );
}
