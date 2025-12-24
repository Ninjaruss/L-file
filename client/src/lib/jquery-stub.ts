/**
 * jQuery stub to prevent "jQuery is not defined" errors
 * This is a minimal implementation that does nothing but prevents errors
 * from libraries or browser extensions that expect jQuery to be globally available
 */

if (typeof window !== 'undefined') {
  // Create a minimal jQuery stub if it doesn't exist
  if (typeof (window as any).jQuery === 'undefined') {
    const jQueryStub = function(selector?: any) {
      console.warn('jQuery stub called. jQuery is not actually loaded.');
      return {
        // Return a chainable object with common jQuery methods as no-ops
        on: () => jQueryStub(selector),
        off: () => jQueryStub(selector),
        ready: (fn?: any) => {
          if (typeof fn === 'function') {
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', fn);
            } else {
              fn();
            }
          }
          return jQueryStub(selector);
        },
        click: () => jQueryStub(selector),
        find: () => jQueryStub(selector),
        each: () => jQueryStub(selector),
        addClass: () => jQueryStub(selector),
        removeClass: () => jQueryStub(selector),
        toggleClass: () => jQueryStub(selector),
        css: () => jQueryStub(selector),
        attr: () => jQueryStub(selector),
        prop: () => jQueryStub(selector),
        val: () => jQueryStub(selector),
        html: () => jQueryStub(selector),
        text: () => jQueryStub(selector),
        append: () => jQueryStub(selector),
        prepend: () => jQueryStub(selector),
        remove: () => jQueryStub(selector),
        hide: () => jQueryStub(selector),
        show: () => jQueryStub(selector),
        toggle: () => jQueryStub(selector),
        fadeIn: () => jQueryStub(selector),
        fadeOut: () => jQueryStub(selector),
        slideUp: () => jQueryStub(selector),
        slideDown: () => jQueryStub(selector),
        animate: () => jQueryStub(selector),
        length: 0,
      };
    };

    // Set static methods
    jQueryStub.ajax = () => console.warn('jQuery.ajax stub called');
    jQueryStub.get = () => console.warn('jQuery.get stub called');
    jQueryStub.post = () => console.warn('jQuery.post stub called');
    jQueryStub.getJSON = () => console.warn('jQuery.getJSON stub called');

    // Assign to window
    (window as any).jQuery = jQueryStub;
    (window as any).$ = jQueryStub;

    console.log('jQuery stub loaded to prevent "jQuery is not defined" errors');
  }
}

export {};
