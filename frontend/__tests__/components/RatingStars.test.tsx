import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RatingStars } from '../../components/RatingStars';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Star: ({ size, className }: { size?: number; className?: string }) => (
    <span data-testid="star" className={className} data-size={size} />
  ),
}));

describe('RatingStars', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Static mode (interactive=false)', () => {
    it('renders 5 stars by default', () => {
      render(<RatingStars rating={3} />);
      expect(screen.getAllByTestId('star')).toHaveLength(5);
    });

    it('renders custom maxRating stars', () => {
      render(<RatingStars rating={3} maxRating={10} />);
      expect(screen.getAllByTestId('star')).toHaveLength(10);
    });

    it('renders correct number of filled stars for rating=3 out of 5', () => {
      render(<RatingStars rating={3} />);
      const stars = screen.getAllByTestId('star');
      const filledStars = stars.filter(s => s.className.includes('fill-accent'));
      const emptyStars = stars.filter(s => s.className.includes('fill-muted'));
      expect(filledStars).toHaveLength(3);
      expect(emptyStars).toHaveLength(2);
    });

    it('all stars are filled for max rating', () => {
      render(<RatingStars rating={5} />);
      const stars = screen.getAllByTestId('star');
      const filledStars = stars.filter(s => s.className.includes('fill-accent'));
      expect(filledStars).toHaveLength(5);
    });

    it('no stars are filled for rating=0', () => {
      render(<RatingStars rating={0} />);
      const stars = screen.getAllByTestId('star');
      const filledStars = stars.filter(s => s.className.includes('fill-accent'));
      expect(filledStars).toHaveLength(0);
    });

    it('renders stars with correct size prop', () => {
      render(<RatingStars rating={3} size={24} />);
      const stars = screen.getAllByTestId('star');
      stars.forEach(star => {
        expect(star).toHaveAttribute('data-size', '24');
      });
    });

    it('buttons are disabled in static mode', () => {
      render(<RatingStars rating={3} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('Interactive mode', () => {
    it('calls onRatingChange when a star is clicked', () => {
      const mockOnRatingChange = jest.fn();
      render(<RatingStars rating={0} interactive onRatingChange={mockOnRatingChange} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[2]); // 3rd star
      expect(mockOnRatingChange).toHaveBeenCalledWith(3);
    });

    it('calls onRatingChange with correct value for first star', () => {
      const mockOnRatingChange = jest.fn();
      render(<RatingStars rating={0} interactive onRatingChange={mockOnRatingChange} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      expect(mockOnRatingChange).toHaveBeenCalledWith(1);
    });

    it('calls onRatingChange with correct value for last star (5)', () => {
      const mockOnRatingChange = jest.fn();
      render(<RatingStars rating={0} interactive onRatingChange={mockOnRatingChange} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[4]);
      expect(mockOnRatingChange).toHaveBeenCalledWith(5);
    });

    it('updates hover state on mouse enter', () => {
      render(<RatingStars rating={0} interactive />);
      const buttons = screen.getAllByRole('button');
      fireEvent.mouseEnter(buttons[3]); // hover over 4th star
      const stars = screen.getAllByTestId('star');
      const filledStars = stars.filter(s => s.className.includes('fill-accent'));
      expect(filledStars).toHaveLength(4);
    });

    it('resets hover state on mouse leave', () => {
      render(<RatingStars rating={1} interactive />);
      const buttons = screen.getAllByRole('button');
      fireEvent.mouseEnter(buttons[4]);
      fireEvent.mouseLeave(buttons[4]);
      const stars = screen.getAllByTestId('star');
      const filledStars = stars.filter(s => s.className.includes('fill-accent'));
      // Should go back to original rating (1)
      expect(filledStars).toHaveLength(1);
    });

    it('buttons are enabled in interactive mode', () => {
      render(<RatingStars rating={0} interactive />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => {
        expect(btn).not.toBeDisabled();
      });
    });
  });
});
