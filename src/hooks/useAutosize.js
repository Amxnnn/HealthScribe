import { useLayoutEffect } from 'react';

/** Fit a textarea to its content. Exported for use in `onInput` handlers. */
export function fitTextarea(el, max = Infinity) {
    if (!el) return;
    el.style.height = 'auto';
    // scrollHeight excludes the border, but box-sizing: border-box counts it
    // in height — without this the last line is clipped.
    const borders = el.offsetHeight - el.clientHeight;
    el.style.height = `${Math.min(el.scrollHeight + borders, max)}px`;
}

/**
 * Grows a textarea to fit its content.
 *
 * Measuring once is not enough: the first measurement happens before the
 * webfont has loaded and before any later width change, either of which
 * reflows the text and leaves the last line clipped. This re-measures when
 * fonts settle and whenever the element's width actually changes.
 *
 * @param {object} ref  ref pointing at the textarea
 * @param {*} value     content to track
 * @param {number} max  optional height ceiling in px, after which it scrolls
 */
export function useAutosize(ref, value, max = Infinity) {
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const resize = () => fitTextarea(el, max);

        resize();

        // Width-only guard: observing an element whose height we set would
        // otherwise feed back into itself.
        let lastWidth = el.clientWidth;
        let observer;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(() => {
                if (el.clientWidth !== lastWidth) {
                    lastWidth = el.clientWidth;
                    resize();
                }
            });
            observer.observe(el);
        }

        // A webfont swapping in after the first measure re-wraps the text.
        // `ready` can resolve before the font is even requested, so also
        // listen for each load finishing.
        let cancelled = false;
        const onFontsDone = () => { if (!cancelled) resize(); };
        document.fonts?.addEventListener?.('loadingdone', onFontsDone);
        document.fonts?.ready.then(onFontsDone).catch(() => { /* unsupported */ });

        return () => {
            cancelled = true;
            observer?.disconnect();
            document.fonts?.removeEventListener?.('loadingdone', onFontsDone);
        };
    }, [ref, value, max]);
}
