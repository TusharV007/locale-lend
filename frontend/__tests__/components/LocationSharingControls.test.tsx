import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationSharingControls from '../../components/LocationSharingControls';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn((ref, cb) => {
    cb({ data: () => ({ locationSharing: { enabled: false } }) });
    return jest.fn(); // unsubscribe
  }),
}));

jest.mock('../../lib/firebase', () => ({ db: {} }));

// Mock db functions
jest.mock('../../lib/db', () => ({
  enableLocationSharing: jest.fn().mockResolvedValue(undefined),
  disableLocationSharing: jest.fn().mockResolvedValue(undefined),
  updateSharedLocation: jest.fn().mockResolvedValue(undefined),
}));

// Mock useLocationSharing hook
const mockStartSharing = jest.fn();
const mockStopSharing = jest.fn();
jest.mock('../../hooks/useLocationSharing', () => ({
  useLocationSharing: () => ({
    startSharing: mockStartSharing,
    stopSharing: mockStopSharing,
    currentLocation: null,
    error: null,
    isSharing: false,
  }),
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Bob', photoURL: null },
  }),
}));

// Mock LiveLocationMap
jest.mock('../../components/LiveLocationMap', () => ({
  LiveLocationMap: (props: any) => (
    <div data-testid="live-location-map">
      <button onClick={props.onClose}>Close Live Map</button>
    </div>
  ),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MapPin: () => <span data-testid="icon-mappin" />,
  Navigation: () => <span data-testid="icon-navigation" />,
}));

const defaultProps = {
  requestId: 'req-1',
  userId: 'user-1',
  isOwner: false,
  isBorrower: false,
  otherPartyName: 'Charlie',
};

describe('LocationSharingControls', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Share My Location button when isOwner is true', () => {
    render(<LocationSharingControls {...defaultProps} isOwner={true} />);
    expect(screen.getByText('Share My Location')).toBeInTheDocument();
  });

  it('does not render the Share My Location button when isOwner is false', () => {
    render(<LocationSharingControls {...defaultProps} isOwner={false} />);
    expect(screen.queryByText('Share My Location')).toBeNull();
  });

  it('calls enableLocationSharing and startSharing when toggle button is clicked (sharing off)', async () => {
    const { enableLocationSharing } = require('../../lib/db');
    render(<LocationSharingControls {...defaultProps} isOwner={true} />);
    fireEvent.click(screen.getByText('Share My Location'));
    await waitFor(() => {
      expect(enableLocationSharing).toHaveBeenCalledWith('req-1');
      expect(mockStartSharing).toHaveBeenCalled();
    });
  });

  it('does not show "View Owner\'s Location" button when isBorrower=false', () => {
    render(<LocationSharingControls {...defaultProps} isBorrower={false} />);
    expect(screen.queryByText("View Owner's Location")).toBeNull();
  });

  it('renders nothing interactive when both isOwner and isBorrower are false', () => {
    render(<LocationSharingControls {...defaultProps} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
