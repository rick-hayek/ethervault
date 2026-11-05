import React, { useState, useRef, useEffect } from 'react';

interface MobilePageSliderProps {
    children: React.ReactNode[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
}

export const MobilePageSlider: React.FC<MobilePageSliderProps> = ({
    children,
    currentIndex,
    onIndexChange,
}) => {
    const [displayIndex, setDisplayIndex] = useState(currentIndex);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const gestureDirRef = useRef<'undetermined' | 'horizontal' | 'vertical'>('undetermined');
    const swipedRef = useRef(false);
    const isTouchActiveRef = useRef(false);
    const touchTimerRef = useRef<any>(null);

    const currentIndexRef = useRef(currentIndex);
    currentIndexRef.current = currentIndex;

    const onIndexChangeRef = useRef(onIndexChange);
    onIndexChangeRef.current = onIndexChange;

    const countRef = useRef(children.length);
    countRef.current = children.length;

    // Sync displayIndex when currentIndex changes from props (e.g. bottom nav click)
    useEffect(() => {
        setDisplayIndex(currentIndex);
        setDragOffset(0);
        setIsDragging(false);
    }, [currentIndex]);

    // Handle touch start
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        isTouchActiveRef.current = true;
        if (touchTimerRef.current) clearTimeout(touchTimerRef.current);

        const target = e.target as HTMLElement | null;
        if (target) {
            // Ignore if touching interactive form controls or elements that handle their own interaction
            const tagName = target.tagName;
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
                return;
            }
            if (target.closest('input, textarea, select')) {
                return;
            }
        }

        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
        gestureDirRef.current = 'undetermined';
        swipedRef.current = false;
    };

    // Handle touch move
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;

        if (gestureDirRef.current === 'undetermined') {
            // Wait for slight movement threshold to determine gesture direction
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;

            if (Math.abs(dy) >= Math.abs(dx)) {
                // Vertical scrolling: release to native scroll
                gestureDirRef.current = 'vertical';
                return;
            } else {
                // Horizontal swipe: capture and drag
                gestureDirRef.current = 'horizontal';
                setIsDragging(true);
            }
        }

        if (gestureDirRef.current === 'horizontal') {
            swipedRef.current = true;
            let offset = dx;

            // Rubber-band resistance at boundaries
            const isAtStart = currentIndexRef.current === 0;
            const isAtEnd = currentIndexRef.current === countRef.current - 1;

            if ((isAtStart && offset > 0) || (isAtEnd && offset < 0)) {
                offset = offset * 0.3;
            }

            setDragOffset(offset);
        }
    };

    // Handle touch end
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
        touchTimerRef.current = setTimeout(() => {
            isTouchActiveRef.current = false;
        }, 500);

        if (!touchStartRef.current) return;

        const isHorizontal = gestureDirRef.current === 'horizontal';
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const duration = Date.now() - touchStartRef.current.time;

        touchStartRef.current = null;
        gestureDirRef.current = 'undetermined';

        if (!isHorizontal) {
            setIsDragging(false);
            setDragOffset(0);
            return;
        }

        const containerWidth = containerRef.current?.offsetWidth || window.innerWidth || 360;
        const velocity = Math.abs(dx) / (duration || 1);
        const distanceThreshold = Math.min(containerWidth * 0.22, 100);

        const isFlick = velocity > 0.3 && Math.abs(dx) > 30;
        const isPastThreshold = Math.abs(dx) > distanceThreshold;

        let targetIndex = currentIndexRef.current;

        if (isFlick || isPastThreshold) {
            if (dx < 0 && currentIndexRef.current < countRef.current - 1) {
                targetIndex = currentIndexRef.current + 1;
            } else if (dx > 0 && currentIndexRef.current > 0) {
                targetIndex = currentIndexRef.current - 1;
            }
        }

        setIsDragging(false);
        setDragOffset(0);
        setDisplayIndex(targetIndex);

        if (targetIndex !== currentIndexRef.current) {
            onIndexChangeRef.current(targetIndex);
        }
    };

    const handleTouchCancel = () => {
        touchStartRef.current = null;
        gestureDirRef.current = 'undetermined';
        setIsDragging(false);
        setDragOffset(0);
    };

    // Suppress click events if a swipe occurred
    const handleClickCapture = (e: React.MouseEvent) => {
        if (swipedRef.current) {
            e.stopPropagation();
            e.preventDefault();
            swipedRef.current = false;
        }
    };

    // Mouse drag support (for testing or desktop responsive mode)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isTouchActiveRef.current || e.button !== 0) return;
        const target = e.target as HTMLElement | null;
        if (target) {
            const tagName = target.tagName;
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;
            if (target.closest('input, textarea, select')) return;
        }

        touchStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            time: Date.now(),
        };
        gestureDirRef.current = 'undetermined';
        swipedRef.current = false;

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!touchStartRef.current) return;
            const dx = moveEvent.clientX - touchStartRef.current.x;
            const dy = moveEvent.clientY - touchStartRef.current.y;

            if (gestureDirRef.current === 'undetermined') {
                if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
                if (Math.abs(dy) >= Math.abs(dx)) {
                    gestureDirRef.current = 'vertical';
                    return;
                } else {
                    gestureDirRef.current = 'horizontal';
                    setIsDragging(true);
                }
            }

            if (gestureDirRef.current === 'horizontal') {
                swipedRef.current = true;
                let offset = dx;
                const isAtStart = currentIndexRef.current === 0;
                const isAtEnd = currentIndexRef.current === countRef.current - 1;
                if ((isAtStart && offset > 0) || (isAtEnd && offset < 0)) {
                    offset = offset * 0.3;
                }
                setDragOffset(offset);
            }
        };

        const onMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            if (!touchStartRef.current) return;
            const isHorizontal = gestureDirRef.current === 'horizontal';
            const dx = upEvent.clientX - touchStartRef.current.x;
            const duration = Date.now() - touchStartRef.current.time;

            touchStartRef.current = null;
            gestureDirRef.current = 'undetermined';

            if (!isHorizontal) {
                setIsDragging(false);
                setDragOffset(0);
                return;
            }

            const containerWidth = containerRef.current?.offsetWidth || window.innerWidth || 360;
            const velocity = Math.abs(dx) / (duration || 1);
            const distanceThreshold = Math.min(containerWidth * 0.22, 100);

            const isFlick = velocity > 0.3 && Math.abs(dx) > 30;
            const isPastThreshold = Math.abs(dx) > distanceThreshold;

            let targetIndex = currentIndexRef.current;
            if (isFlick || isPastThreshold) {
                if (dx < 0 && currentIndexRef.current < countRef.current - 1) {
                    targetIndex = currentIndexRef.current + 1;
                } else if (dx > 0 && currentIndexRef.current > 0) {
                    targetIndex = currentIndexRef.current - 1;
                }
            }

            setIsDragging(false);
            setDragOffset(0);
            setDisplayIndex(targetIndex);

            if (targetIndex !== currentIndexRef.current) {
                onIndexChangeRef.current(targetIndex);
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden select-none touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onMouseDown={handleMouseDown}
            onClickCapture={handleClickCapture}
        >
            <div
                className="flex h-full w-full will-change-transform"
                style={{
                    transform: `translate3d(calc(-${displayIndex * 100}% + ${dragOffset}px), 0, 0)`,
                    transition: isDragging
                        ? 'none'
                        : 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {children.map((child, i) => (
                    <div
                        key={i}
                        className={`w-full h-full flex-shrink-0 overflow-y-auto overscroll-y-contain pb-[calc(7.5rem+env(safe-area-inset-bottom))] scrollbar-hide ${
                            i !== displayIndex && !isDragging ? 'pointer-events-none' : ''
                        }`}
                        style={{ width: '100%', minWidth: '100%', maxWidth: '100%' }}
                        aria-hidden={i !== displayIndex}
                    >
                        <div className="max-w-6xl mx-auto min-h-full">
                            {child}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
