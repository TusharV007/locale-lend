import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ItemCard } from '../../components/ItemCard';
import type { Item } from '../../types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: require('react').forwardRef((props: any, ref: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <div ref={ref} {...rest} />;
    }),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock next/dynamic (ItemLocationMap)
jest.mock('next/dynamic', () => () => {
  const MockItemLocationMap = (props: any) => (
    <div data-testid="item-location-map">
      <button onClick={props.onClose}>Close Map</button>
      <span>{props.itemTitle}</span>
    </div>
  );
  return MockItemLocationMap;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MapPin: () => <span data-testid="icon-mappin" />,
  Star: () => <span data-testid="icon-star" />,
  Clock: () => <span data-testid="icon-clock" />,
  User: () => <span data-testid="icon-user" />,
  Navigation: () => <span data-testid="icon-navigation" />,
}));

const baseItem: Item = {
  id: 'item-1',
  ownerId: 'user-1',
  owner: {
    id: 'user-1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    avatar: '',
    location: { type: 'Point', coordinates: [72.8, 19.07] },
    address: '123 Main St',
    trustScore: 4.8,
    totalReviews: 20,
    itemsLentCount: 10,
    itemsBorrowedCount: 5,
    memberSince: new Date('2023-01-01'),
    verified: true,
  },
  title: 'Power Drill',
  description: 'Professional-grade power drill, perfect for home repairs.',
  category: 'Tools',
  location: { type: 'Point', coordinates: [72.8, 19.07] },
  images: ['https://example.com/drill.jpg'],
  availabilityStatus: 'Available',
  distance: 500,
  createdAt: new Date('2024-01-01'),
  status: 'available',
  borrowCount: 7,
  rentalPricePerDay: 50,
};

describe('ItemCard', () => {
  let mockOnRequestClick: jest.Mock;

  beforeEach(() => {
    mockOnRequestClick = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders item title and description', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('Power Drill')).toBeInTheDocument();
    expect(screen.getByText(/Professional-grade power drill/)).toBeInTheDocument();
  });

  it('renders owner name and trust score', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('renders borrow count', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('7 borrows')).toBeInTheDocument();
  });

  it('renders distance in meters when less than 1000m', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('500m away')).toBeInTheDocument();
  });

  it('renders distance in km when >= 1000m', () => {
    const item = { ...baseItem, distance: 1500 };
    render(<ItemCard item={item} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('1.5km away')).toBeInTheDocument();
  });

  it('renders "Nearby" when distance is not provided', () => {
    const item = { ...baseItem, distance: undefined };
    render(<ItemCard item={item} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('Nearby')).toBeInTheDocument();
  });

  it('renders status badge as "Available" for available items', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders status badge as "Lended" for lended items', () => {
    const item = { ...baseItem, status: 'lended' as const };
    render(<ItemCard item={item} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('Lended')).toBeInTheDocument();
  });

  it('shows rental price in request button when rentalPricePerDay > 0', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText(/Request · ₹50\/day/)).toBeInTheDocument();
  });

  it('shows "Request" without price when rentalPricePerDay is 0', () => {
    const item = { ...baseItem, rentalPricePerDay: 0 };
    render(<ItemCard item={item} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('Request')).toBeInTheDocument();
  });

  it('does not show Request button for lended items', () => {
    const item = { ...baseItem, status: 'lended' as const };
    render(<ItemCard item={item} onRequestClick={mockOnRequestClick} />);
    expect(screen.queryByText(/Request/)).toBeNull();
  });

  it('calls onRequestClick when Request button is clicked', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    fireEvent.click(screen.getByText(/Request · ₹50\/day/));
    expect(mockOnRequestClick).toHaveBeenCalledWith(baseItem);
    expect(mockOnRequestClick).toHaveBeenCalledTimes(1);
  });

  it('shows location map modal when "View Location" is clicked', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    fireEvent.click(screen.getByText('View Location'));
    expect(screen.getByTestId('item-location-map')).toBeInTheDocument();
  });

  it('hides location map modal after closing', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    fireEvent.click(screen.getByText('View Location'));
    expect(screen.getByTestId('item-location-map')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close Map'));
    expect(screen.queryByTestId('item-location-map')).toBeNull();
  });

  it('renders owner initials when avatar is empty', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders item image with correct alt text', () => {
    render(<ItemCard item={baseItem} onRequestClick={mockOnRequestClick} />);
    const img = screen.getByAltText('Power Drill');
    expect(img).toHaveAttribute('src', 'https://example.com/drill.jpg');
  });
});
