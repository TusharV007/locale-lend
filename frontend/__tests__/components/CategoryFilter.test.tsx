import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryFilter } from '../../components/CategoryFilter';
import type { ItemCategory } from '../../types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: require('react').forwardRef((props: any, ref: any) => {
      const { whileHover, whileTap, ...rest } = props;
      return <button ref={ref} {...rest} />;
    }),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Wrench: () => <span data-testid="icon-wrench" />,
  Laptop: () => <span data-testid="icon-laptop" />,
  ChefHat: () => <span data-testid="icon-chefhat" />,
  Tent: () => <span data-testid="icon-tent" />,
  BookOpen: () => <span data-testid="icon-bookopen" />,
  Bike: () => <span data-testid="icon-bike" />,
}));

describe('CategoryFilter', () => {
  let mockOnCategoryChange: jest.Mock;

  beforeEach(() => {
    mockOnCategoryChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders "All Items" button', () => {
    render(<CategoryFilter selectedCategory={null} onCategoryChange={mockOnCategoryChange} />);
    expect(screen.getByText('All Items')).toBeInTheDocument();
  });

  it('renders all 6 categories', () => {
    render(<CategoryFilter selectedCategory={null} onCategoryChange={mockOnCategoryChange} />);
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Outdoor')).toBeInTheDocument();
    expect(screen.getByText('Books & Games')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
  });

  it('calls onCategoryChange with null when "All Items" is clicked', () => {
    render(<CategoryFilter selectedCategory={null} onCategoryChange={mockOnCategoryChange} />);
    fireEvent.click(screen.getByText('All Items'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith(null);
  });

  it('calls onCategoryChange with category id when a category is clicked', () => {
    render(<CategoryFilter selectedCategory={null} onCategoryChange={mockOnCategoryChange} />);
    fireEvent.click(screen.getByText('Tools'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('Tools');
  });

  it('calls onCategoryChange with null when already-selected category is clicked (deselect)', () => {
    render(<CategoryFilter selectedCategory="Tools" onCategoryChange={mockOnCategoryChange} />);
    fireEvent.click(screen.getByText('Tools'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith(null);
  });

  it('calls onCategoryChange with the new category when a different one is clicked', () => {
    render(<CategoryFilter selectedCategory="Tools" onCategoryChange={mockOnCategoryChange} />);
    fireEvent.click(screen.getByText('Electronics'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('Electronics');
  });

  it('renders all category icons', () => {
    render(<CategoryFilter selectedCategory={null} onCategoryChange={mockOnCategoryChange} />);
    expect(screen.getByTestId('icon-wrench')).toBeInTheDocument();
    expect(screen.getByTestId('icon-laptop')).toBeInTheDocument();
    expect(screen.getByTestId('icon-chefhat')).toBeInTheDocument();
    expect(screen.getByTestId('icon-tent')).toBeInTheDocument();
    expect(screen.getByTestId('icon-bookopen')).toBeInTheDocument();
    expect(screen.getByTestId('icon-bike')).toBeInTheDocument();
  });
});
