import { renderHook, act } from '@testing-library/react';
import { useLocationSharing } from '../../hooks/useLocationSharing';

describe('useLocationSharing', () => {
    let mockGeolocation: any;

    beforeEach(() => {
        mockGeolocation = {
            watchPosition: jest.fn(),
            clearWatch: jest.fn(),
        };
        (global as any).navigator = {
            ...((global as any).navigator || {}),
            geolocation: mockGeolocation
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useLocationSharing());
        expect(result.current.currentLocation).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isSharing).toBe(false);
    });

    it('handles startSharing and success callback', () => {
        const { result } = renderHook(() => useLocationSharing());
        
        mockGeolocation.watchPosition.mockImplementationOnce((success: (pos: any) => void) => {
            success({
                coords: { latitude: 40.7128, longitude: -74.0060 }
            });
            return 123; // watchId
        });

        act(() => {
            result.current.startSharing();
        });

        expect(mockGeolocation.watchPosition).toHaveBeenCalled();
        expect(result.current.isSharing).toBe(true);
        expect(result.current.currentLocation).toEqual({
            type: 'Point',
            coordinates: [-74.0060, 40.7128]
        });
    });

    it('handles startSharing error callback', () => {
        const { result } = renderHook(() => useLocationSharing());
        
        mockGeolocation.watchPosition.mockImplementationOnce((success: any, error: (err: any) => void) => {
            error({
                code: 1, // PERMISSION_DENIED
                PERMISSION_DENIED: 1
            });
            return 123;
        });

        act(() => {
            result.current.startSharing();
        });

        expect(result.current.error).toBe('Location permission denied');
        expect(result.current.isSharing).toBe(false);
    });

    it('handles stopSharing', () => {
        const { result } = renderHook(() => useLocationSharing());
        
        mockGeolocation.watchPosition.mockReturnValue(123);

        act(() => {
            result.current.startSharing();
        });

        act(() => {
            result.current.stopSharing();
        });

        expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123);
        expect(result.current.isSharing).toBe(false);
        expect(result.current.currentLocation).toBeNull();
    });
});
