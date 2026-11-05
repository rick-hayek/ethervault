import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { MobilePageSlider } from '../../packages/app/src/components/MobilePageSlider';

describe('MobilePageSlider', () => {
    const pages = [
        <div key="0" data-testid="page-0">Vault Page</div>,
        <div key="1" data-testid="page-1">Security Page</div>,
        <div key="2" data-testid="page-2">Generator Page</div>,
        <div key="3" data-testid="page-3">Settings Page</div>,
    ];

    it('renders all pages and displays the initial page', () => {
        const onIndexChange = vi.fn();
        render(
            <MobilePageSlider currentIndex={0} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        expect(screen.getByTestId('page-0')).toBeInTheDocument();
        expect(screen.getByTestId('page-1')).toBeInTheDocument();
        expect(screen.getByTestId('page-2')).toBeInTheDocument();
        expect(screen.getByTestId('page-3')).toBeInTheDocument();
    });

    it('switches to next page when swiping left with enough distance', () => {
        const onIndexChange = vi.fn();
        const { container } = render(
            <MobilePageSlider currentIndex={0} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        const slider = container.firstChild as HTMLElement;

        // Simulate touch swipe left: touch start at x=250, move to x=100 (dx = -150)
        fireEvent.touchStart(slider, {
            touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchMove(slider, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(slider, {
            changedTouches: [{ clientX: 100, clientY: 100 }],
        });

        expect(onIndexChange).toHaveBeenCalledTimes(1);
        expect(onIndexChange).toHaveBeenCalledWith(1);
    });

    it('switches to previous page when swiping right with enough distance', () => {
        const onIndexChange = vi.fn();
        const { container } = render(
            <MobilePageSlider currentIndex={1} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        const slider = container.firstChild as HTMLElement;

        // Simulate touch swipe right: touch start at x=100, move to x=250 (dx = +150)
        fireEvent.touchStart(slider, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchMove(slider, {
            touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchEnd(slider, {
            changedTouches: [{ clientX: 250, clientY: 100 }],
        });

        expect(onIndexChange).toHaveBeenCalledTimes(1);
        expect(onIndexChange).toHaveBeenCalledWith(0);
    });

    it('does not trigger page change on small swipe movements (threshold not met)', () => {
        const onIndexChange = vi.fn();
        const { container } = render(
            <MobilePageSlider currentIndex={0} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        const slider = container.firstChild as HTMLElement;

        // Small swipe left: start at 200, move to 185 (dx = -15)
        fireEvent.touchStart(slider, {
            touches: [{ clientX: 200, clientY: 100 }],
        });
        fireEvent.touchMove(slider, {
            touches: [{ clientX: 185, clientY: 100 }],
        });
        fireEvent.touchEnd(slider, {
            changedTouches: [{ clientX: 185, clientY: 100 }],
        });

        expect(onIndexChange).not.toHaveBeenCalled();
    });

    it('ignores vertical scrolling movements and does not switch pages', () => {
        const onIndexChange = vi.fn();
        const { container } = render(
            <MobilePageSlider currentIndex={0} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        const slider = container.firstChild as HTMLElement;

        // Primarily vertical movement: dy = 150, dx = 10
        fireEvent.touchStart(slider, {
            touches: [{ clientX: 200, clientY: 100 }],
        });
        fireEvent.touchMove(slider, {
            touches: [{ clientX: 210, clientY: 250 }],
        });
        fireEvent.touchEnd(slider, {
            changedTouches: [{ clientX: 210, clientY: 250 }],
        });

        expect(onIndexChange).not.toHaveBeenCalled();
    });

    it('does not switch past boundaries (right at index 0 or left at last index)', () => {
        const onIndexChange = vi.fn();
        const { container, rerender } = render(
            <MobilePageSlider currentIndex={0} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        const slider = container.firstChild as HTMLElement;

        // Swipe right at index 0
        fireEvent.touchStart(slider, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchMove(slider, {
            touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchEnd(slider, {
            changedTouches: [{ clientX: 250, clientY: 100 }],
        });

        expect(onIndexChange).not.toHaveBeenCalled();

        // Rerender at last index
        rerender(
            <MobilePageSlider currentIndex={3} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        // Swipe left at index 3
        fireEvent.touchStart(slider, {
            touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchMove(slider, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(slider, {
            changedTouches: [{ clientX: 100, clientY: 100 }],
        });

        expect(onIndexChange).not.toHaveBeenCalled();
    });

    it('does not swipe when touching input elements', () => {
        const onIndexChange = vi.fn();
        const pagesWithInput = [
            <div key="0">
                <input data-testid="search-input" />
            </div>,
            <div key="1">Page 1</div>,
        ];

        render(
            <MobilePageSlider currentIndex={0} onIndexChange={onIndexChange}>
                {pagesWithInput}
            </MobilePageSlider>
        );

        const input = screen.getByTestId('search-input');

        fireEvent.touchStart(input, {
            touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchMove(input, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(input, {
            changedTouches: [{ clientX: 100, clientY: 100 }],
        });

        expect(onIndexChange).not.toHaveBeenCalled();
    });

    it('switches pages on mouse drag when on desktop responsive view', () => {
        const onIndexChange = vi.fn();
        const { container } = render(
            <MobilePageSlider currentIndex={0} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        const slider = container.firstChild as HTMLElement;

        fireEvent.mouseDown(slider, { clientX: 300, clientY: 100, button: 0 });
        fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
        fireEvent.mouseUp(window, { clientX: 100, clientY: 100 });

        expect(onIndexChange).toHaveBeenCalledWith(1);
    });

    it('applies smooth transition style with transform to slide between pages', () => {
        const onIndexChange = vi.fn();
        const { container, rerender } = render(
            <MobilePageSlider currentIndex={0} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        const track = container.querySelector('.will-change-transform') as HTMLElement;
        expect(track.style.transform).toContain('calc(-0%');
        expect(track.style.transition).toContain('transform');

        // Update currentIndex from prop (e.g. clicking bottom nav)
        rerender(
            <MobilePageSlider currentIndex={2} onIndexChange={onIndexChange}>
                {pages}
            </MobilePageSlider>
        );

        expect(track.style.transform).toContain('calc(-200%');
        expect(track.style.transition).toContain('transform');
    });
});
