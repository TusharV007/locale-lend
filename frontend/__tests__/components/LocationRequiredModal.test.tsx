import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LocationRequiredModal } from '../../components/LocationRequiredModal';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: require('react').forwardRef((props: any, ref: any) => {
            const { initial, animate, exit, transition, ...rest } = props;
            return <div ref={ref} {...rest} />;
        })
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('LocationRequiredModal', () => {
    let mockOnRetry: jest.Mock;

    beforeEach(() => {
        mockOnRetry = jest.fn();
        (global as any).navigator = {
            ...((global as any).navigator || {}),
            permissions: {
                query: jest.fn().mockResolvedValue({
                    state: 'prompt',
                    onchange: null
                })
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        render(<LocationRequiredModal isOpen={false} onRetry={mockOnRetry} />);
        expect(screen.queryByText('Location Required')).toBeNull();
    });

    it('renders correctly when isOpen is true', async () => {
        render(<LocationRequiredModal isOpen={true} onRetry={mockOnRetry} />);
        
        await waitFor(() => {
            expect(screen.getByText('Location Required')).toBeInTheDocument();
        });
        
        expect(screen.getByText(/LocaleLend relies on your location/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enable Location Access' })).toBeInTheDocument();
    });

    it('calls onRetry when button is clicked', async () => {
        render(<LocationRequiredModal isOpen={true} onRetry={mockOnRetry} />);
        
        await waitFor(() => {
            expect(screen.getByText('Location Required')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Enable Location Access' }));
        expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
});
