export const MOCK_USERS_KEY = 'horse-racing:mock-users';
export const MOCK_OWNER_APPLICATIONS_KEY = 'horse-racing:mock-owner-applications';

const mockIdentityDocumentImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" rx="32" fill="%23fff8ee"/><rect x="36" y="36" width="568" height="328" rx="24" fill="%23ffffff" stroke="%236c3f24" stroke-opacity="0.25" stroke-width="4"/><text x="68" y="104" font-family="Arial" font-size="28" font-weight="700" fill="%232b1710">National ID / Passport</text><rect x="68" y="146" width="160" height="148" rx="18" fill="%23f7ead8"/><circle cx="148" cy="192" r="34" fill="%23d9a441"/><rect x="110" y="238" width="76" height="34" rx="17" fill="%236c3f24"/><rect x="260" y="154" width="260" height="20" rx="10" fill="%23f7ead8"/><rect x="260" y="198" width="306" height="20" rx="10" fill="%23f7ead8"/><rect x="260" y="242" width="220" height="20" rx="10" fill="%23f7ead8"/></svg>';

export const mockUsers = [
  {
    userID: 1,
    id: 1,
    username: 'spectator',
    fullName: 'Nguyễn Văn Khán Giả',
    email: 'spectator@horse.test',
    phone: '0901234567',
    password: 'password123',
    role: 'SPECTATOR',
    roleName: 'SPECTATOR',
    status: 'ACTIVE'
  },
  {
    userID: 2,
    id: 2,
    username: 'owner',
    fullName: 'Trần Minh Owner',
    email: 'owner@horse.test',
    phone: '0902234567',
    password: 'password123',
    role: 'OWNER',
    roleName: 'OWNER',
    status: 'ACTIVE'
  },
  {
    userID: 3,
    id: 3,
    username: 'admin',
    fullName: 'Admin Horse Racing',
    email: 'admin@horse.test',
    phone: '0903234567',
    password: 'password123',
    role: 'ADMIN',
    roleName: 'ADMIN',
    status: 'ACTIVE'
  },
  {
    userID: 4,
    id: 4,
    username: 'jockey',
    fullName: 'Lê Quốc Jockey',
    email: 'jockey@horse.test',
    phone: '0904234567',
    password: 'password123',
    role: 'JOCKEY',
    roleName: 'JOCKEY',
    status: 'ACTIVE'
  }
];

export const mockOwnerApplications = [
  {
    applicationID: 1001,
    userID: 5,
    applicantEmail: 'pending@horse.test',
    applicantPhone: '0905555555',
    fullName: 'Nguyễn Văn A',
    dateOfBirth: '2000-01-01',
    gender: 'Male',
    nationality: 'Vietnamese',
    address: 'Ho Chi Minh City',
    identityDocumentImage: mockIdentityDocumentImage,
    identityDocumentFileName: 'pending-national-id.png',
    status: 'PENDING',
    submittedAt: '2026-06-18'
  },
  {
    applicationID: 1002,
    userID: 2,
    applicantEmail: 'owner@horse.test',
    applicantPhone: '0902234567',
    fullName: 'Trần Minh Owner',
    dateOfBirth: '1998-04-12',
    gender: 'Male',
    nationality: 'Vietnamese',
    address: 'Da Nang',
    identityDocumentImage: mockIdentityDocumentImage,
    identityDocumentFileName: 'owner-passport.png',
    status: 'APPROVED',
    submittedAt: '2026-06-10',
    approvedAt: '2026-06-12',
    ownerSince: '2026-06-12'
  },
  {
    applicationID: 1003,
    userID: 6,
    applicantEmail: 'rejected@horse.test',
    applicantPhone: '0906666666',
    fullName: 'Phạm Thị B',
    dateOfBirth: '1999-09-09',
    gender: 'Female',
    nationality: 'Vietnamese',
    address: 'Ha Noi',
    identityDocumentImage: mockIdentityDocumentImage,
    identityDocumentFileName: 'rejected-national-id.png',
    status: 'REJECTED',
    submittedAt: '2026-06-09',
    rejectedAt: '2026-06-11',
    rejectReason: 'Identity information is invalid.'
  }
];

export const mockOwnerDashboard = {
  ownerName: 'Owner',
  totalHorses: 0,
  totalRegistrations: 0,
  registeredHorses: 0,
  participatedHorses: 0,
  upcomingRaces: 3,
  totalWins: 0
};

export const mockOwnerHorses = [];
