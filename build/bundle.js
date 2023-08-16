
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\layout\Scroller.svelte generated by Svelte v3.44.1 */

    const { window: window_1 } = globals;
    const file = "src\\layout\\Scroller.svelte";
    const get_foreground_slot_changes = dirty => ({});
    const get_foreground_slot_context = ctx => ({});
    const get_background_slot_changes = dirty => ({});
    const get_background_slot_context = ctx => ({});

    function create_fragment(ctx) {
    	let svelte_scroller_outer;
    	let svelte_scroller_background_container;
    	let svelte_scroller_background;
    	let t;
    	let svelte_scroller_foreground;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[19]);
    	const background_slot_template = /*#slots*/ ctx[18].background;
    	const background_slot = create_slot(background_slot_template, ctx, /*$$scope*/ ctx[17], get_background_slot_context);
    	const foreground_slot_template = /*#slots*/ ctx[18].foreground;
    	const foreground_slot = create_slot(foreground_slot_template, ctx, /*$$scope*/ ctx[17], get_foreground_slot_context);

    	const block = {
    		c: function create() {
    			svelte_scroller_outer = element("svelte-scroller-outer");
    			svelte_scroller_background_container = element("svelte-scroller-background-container");
    			svelte_scroller_background = element("svelte-scroller-background");
    			if (background_slot) background_slot.c();
    			t = space();
    			svelte_scroller_foreground = element("svelte-scroller-foreground");
    			if (foreground_slot) foreground_slot.c();
    			set_custom_element_data(svelte_scroller_background, "class", "svelte-3stote");
    			add_location(svelte_scroller_background, file, 186, 2, 4913);
    			set_custom_element_data(svelte_scroller_background_container, "class", "background-container svelte-3stote");
    			add_location(svelte_scroller_background_container, file, 185, 1, 4818);
    			set_custom_element_data(svelte_scroller_foreground, "class", "svelte-3stote");
    			add_location(svelte_scroller_foreground, file, 191, 1, 5080);
    			set_custom_element_data(svelte_scroller_outer, "class", "svelte-3stote");
    			toggle_class(svelte_scroller_outer, "splitscreen", /*splitscreen*/ ctx[0]);
    			add_location(svelte_scroller_outer, file, 184, 0, 4756);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svelte_scroller_outer, anchor);
    			append_dev(svelte_scroller_outer, svelte_scroller_background_container);
    			append_dev(svelte_scroller_background_container, svelte_scroller_background);

    			if (background_slot) {
    				background_slot.m(svelte_scroller_background, null);
    			}

    			/*svelte_scroller_background_binding*/ ctx[20](svelte_scroller_background);
    			/*svelte_scroller_background_container_binding*/ ctx[21](svelte_scroller_background_container);
    			append_dev(svelte_scroller_outer, t);
    			append_dev(svelte_scroller_outer, svelte_scroller_foreground);

    			if (foreground_slot) {
    				foreground_slot.m(svelte_scroller_foreground, null);
    			}

    			/*svelte_scroller_foreground_binding*/ ctx[22](svelte_scroller_foreground);
    			/*svelte_scroller_outer_binding*/ ctx[23](svelte_scroller_outer);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window_1, "resize", /*onwindowresize*/ ctx[19]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (background_slot) {
    				if (background_slot.p && (!current || dirty[0] & /*$$scope*/ 131072)) {
    					update_slot_base(
    						background_slot,
    						background_slot_template,
    						ctx,
    						/*$$scope*/ ctx[17],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[17])
    						: get_slot_changes(background_slot_template, /*$$scope*/ ctx[17], dirty, get_background_slot_changes),
    						get_background_slot_context
    					);
    				}
    			}

    			if (foreground_slot) {
    				if (foreground_slot.p && (!current || dirty[0] & /*$$scope*/ 131072)) {
    					update_slot_base(
    						foreground_slot,
    						foreground_slot_template,
    						ctx,
    						/*$$scope*/ ctx[17],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[17])
    						: get_slot_changes(foreground_slot_template, /*$$scope*/ ctx[17], dirty, get_foreground_slot_changes),
    						get_foreground_slot_context
    					);
    				}
    			}

    			if (dirty[0] & /*splitscreen*/ 1) {
    				toggle_class(svelte_scroller_outer, "splitscreen", /*splitscreen*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(background_slot, local);
    			transition_in(foreground_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(background_slot, local);
    			transition_out(foreground_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svelte_scroller_outer);
    			if (background_slot) background_slot.d(detaching);
    			/*svelte_scroller_background_binding*/ ctx[20](null);
    			/*svelte_scroller_background_container_binding*/ ctx[21](null);
    			if (foreground_slot) foreground_slot.d(detaching);
    			/*svelte_scroller_foreground_binding*/ ctx[22](null);
    			/*svelte_scroller_outer_binding*/ ctx[23](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const handlers = [];
    let manager;

    if (typeof window !== 'undefined') {
    	const run_all = () => handlers.forEach(fn => fn());
    	window.addEventListener('scroll', run_all);
    	window.addEventListener('resize', run_all);
    }

    if (typeof IntersectionObserver !== 'undefined') {
    	const map = new Map();

    	const observer = new IntersectionObserver((entries, observer) => {
    			entries.forEach(entry => {
    				const update = map.get(entry.target);
    				const index = handlers.indexOf(update);

    				if (entry.isIntersecting) {
    					if (index === -1) handlers.push(update);
    				} else {
    					update();
    					if (index !== -1) handlers.splice(index, 1);
    				}
    			});
    		},
    	{
    			rootMargin: '400px 0px', // TODO why 400?
    			
    		});

    	manager = {
    		add: ({ outer, update }) => {
    			const { top, bottom } = outer.getBoundingClientRect();
    			if (top < window.innerHeight && bottom > 0) handlers.push(update);
    			map.set(outer, update);
    			observer.observe(outer);
    		},
    		remove: ({ outer, update }) => {
    			const index = handlers.indexOf(update);
    			if (index !== -1) handlers.splice(index, 1);
    			map.delete(outer);
    			observer.unobserve(outer);
    		}
    	};
    } else {
    	manager = {
    		add: ({ update }) => {
    			handlers.push(update);
    		},
    		remove: ({ update }) => {
    			const index = handlers.indexOf(update);
    			if (index !== -1) handlers.splice(index, 1);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let top_px;
    	let bottom_px;
    	let threshold_px;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Scroller', slots, ['background','foreground']);
    	let { top = 0 } = $$props;
    	let { bottom = 1 } = $$props;
    	let { threshold = 0.5 } = $$props;
    	let { query = 'section' } = $$props;
    	let { parallax = false } = $$props;
    	let { index = 0 } = $$props;
    	let { count = 0 } = $$props;
    	let { offset = 0 } = $$props;
    	let { progress = 0 } = $$props;
    	let { visible = false } = $$props;
    	let { splitscreen = false } = $$props;
    	let { id = null } = $$props;
    	let outer;
    	let bgContainer; // IE patch. Container binding to update inline style
    	let foreground;
    	let background;
    	let left;
    	let sections;
    	let wh = 0;
    	let fixed;
    	let offset_top;
    	let width = 1;
    	let height;
    	let inverted;

    	onMount(() => {
    		sections = foreground.querySelectorAll(query);
    		$$invalidate(7, count = sections.length);
    		update();
    		const scroller = { outer, update };
    		manager.add(scroller);
    		return () => manager.remove(scroller);
    	});

    	// IE patch. BG container style (fixed/unfixed) set via function
    	function setFixed() {
    		if (bgContainer) {
    			let style = `position: ${fixed ? 'fixed' : 'absolute'}; top: 0; transform: translate(0, ${offset_top}px); width: ${width}px; z-index: ${inverted ? 3 : 1};`;
    			$$invalidate(3, bgContainer.style.cssText = style, bgContainer);
    		}
    	}

    	function update() {
    		if (!foreground) return;

    		// re-measure outer container
    		const bcr = outer.getBoundingClientRect();

    		left = bcr.left;
    		width = bcr.right - bcr.left;

    		// determine fix state
    		const fg = foreground.getBoundingClientRect();

    		const bg = background.getBoundingClientRect();
    		$$invalidate(10, visible = fg.top < wh && fg.bottom > 0);
    		const foreground_height = fg.bottom - fg.top;
    		const background_height = bg.bottom - bg.top;
    		const available_space = bottom_px - top_px;
    		$$invalidate(9, progress = (top_px - fg.top) / (foreground_height - available_space));

    		if (progress <= 0) {
    			offset_top = 0;

    			if (fixed) {
    				fixed = false;
    				setFixed();
    			} // Non-IE specific patch to avoid setting style repeatedly
    		} else if (progress >= 1) {
    			offset_top = parallax
    			? foreground_height - background_height
    			: foreground_height - available_space;

    			if (fixed) {
    				fixed = false;
    				setFixed();
    			}
    		} else {
    			offset_top = parallax
    			? Math.round(top_px - progress * (background_height - available_space))
    			: top_px;

    			if (!fixed) {
    				fixed = true;
    				setFixed();
    			}
    		}

    		for ($$invalidate(6, index = 0); index < sections.length; $$invalidate(6, index += 1)) {
    			const section = sections[index];
    			const { top } = section.getBoundingClientRect();
    			const next = sections[index + 1];
    			const bottom = next ? next.getBoundingClientRect().top : fg.bottom;
    			$$invalidate(8, offset = (threshold_px - top) / (bottom - top));
    			$$invalidate(11, id = section.dataset.id ? section.dataset.id : null);
    			if (bottom >= threshold_px) break;
    		}
    	}

    	const writable_props = [
    		'top',
    		'bottom',
    		'threshold',
    		'query',
    		'parallax',
    		'index',
    		'count',
    		'offset',
    		'progress',
    		'visible',
    		'splitscreen',
    		'id'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Scroller> was created with unknown prop '${key}'`);
    	});

    	function onwindowresize() {
    		$$invalidate(1, wh = window_1.innerHeight);
    	}

    	function svelte_scroller_background_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			background = $$value;
    			$$invalidate(5, background);
    		});
    	}

    	function svelte_scroller_background_container_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			bgContainer = $$value;
    			$$invalidate(3, bgContainer);
    		});
    	}

    	function svelte_scroller_foreground_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			foreground = $$value;
    			$$invalidate(4, foreground);
    		});
    	}

    	function svelte_scroller_outer_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			outer = $$value;
    			$$invalidate(2, outer);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('top' in $$props) $$invalidate(12, top = $$props.top);
    		if ('bottom' in $$props) $$invalidate(13, bottom = $$props.bottom);
    		if ('threshold' in $$props) $$invalidate(14, threshold = $$props.threshold);
    		if ('query' in $$props) $$invalidate(15, query = $$props.query);
    		if ('parallax' in $$props) $$invalidate(16, parallax = $$props.parallax);
    		if ('index' in $$props) $$invalidate(6, index = $$props.index);
    		if ('count' in $$props) $$invalidate(7, count = $$props.count);
    		if ('offset' in $$props) $$invalidate(8, offset = $$props.offset);
    		if ('progress' in $$props) $$invalidate(9, progress = $$props.progress);
    		if ('visible' in $$props) $$invalidate(10, visible = $$props.visible);
    		if ('splitscreen' in $$props) $$invalidate(0, splitscreen = $$props.splitscreen);
    		if ('id' in $$props) $$invalidate(11, id = $$props.id);
    		if ('$$scope' in $$props) $$invalidate(17, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		handlers,
    		manager,
    		onMount,
    		top,
    		bottom,
    		threshold,
    		query,
    		parallax,
    		index,
    		count,
    		offset,
    		progress,
    		visible,
    		splitscreen,
    		id,
    		outer,
    		bgContainer,
    		foreground,
    		background,
    		left,
    		sections,
    		wh,
    		fixed,
    		offset_top,
    		width,
    		height,
    		inverted,
    		setFixed,
    		update,
    		threshold_px,
    		top_px,
    		bottom_px
    	});

    	$$self.$inject_state = $$props => {
    		if ('top' in $$props) $$invalidate(12, top = $$props.top);
    		if ('bottom' in $$props) $$invalidate(13, bottom = $$props.bottom);
    		if ('threshold' in $$props) $$invalidate(14, threshold = $$props.threshold);
    		if ('query' in $$props) $$invalidate(15, query = $$props.query);
    		if ('parallax' in $$props) $$invalidate(16, parallax = $$props.parallax);
    		if ('index' in $$props) $$invalidate(6, index = $$props.index);
    		if ('count' in $$props) $$invalidate(7, count = $$props.count);
    		if ('offset' in $$props) $$invalidate(8, offset = $$props.offset);
    		if ('progress' in $$props) $$invalidate(9, progress = $$props.progress);
    		if ('visible' in $$props) $$invalidate(10, visible = $$props.visible);
    		if ('splitscreen' in $$props) $$invalidate(0, splitscreen = $$props.splitscreen);
    		if ('id' in $$props) $$invalidate(11, id = $$props.id);
    		if ('outer' in $$props) $$invalidate(2, outer = $$props.outer);
    		if ('bgContainer' in $$props) $$invalidate(3, bgContainer = $$props.bgContainer);
    		if ('foreground' in $$props) $$invalidate(4, foreground = $$props.foreground);
    		if ('background' in $$props) $$invalidate(5, background = $$props.background);
    		if ('left' in $$props) left = $$props.left;
    		if ('sections' in $$props) sections = $$props.sections;
    		if ('wh' in $$props) $$invalidate(1, wh = $$props.wh);
    		if ('fixed' in $$props) fixed = $$props.fixed;
    		if ('offset_top' in $$props) offset_top = $$props.offset_top;
    		if ('width' in $$props) width = $$props.width;
    		if ('height' in $$props) height = $$props.height;
    		if ('inverted' in $$props) inverted = $$props.inverted;
    		if ('threshold_px' in $$props) threshold_px = $$props.threshold_px;
    		if ('top_px' in $$props) top_px = $$props.top_px;
    		if ('bottom_px' in $$props) bottom_px = $$props.bottom_px;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*top, wh*/ 4098) {
    			 top_px = Math.round(top * wh);
    		}

    		if ($$self.$$.dirty[0] & /*bottom, wh*/ 8194) {
    			 bottom_px = Math.round(bottom * wh);
    		}

    		if ($$self.$$.dirty[0] & /*threshold, wh*/ 16386) {
    			 threshold_px = Math.round(threshold * wh);
    		}

    		if ($$self.$$.dirty[0] & /*top, bottom, threshold, parallax*/ 94208) {
    			 (update());
    		}
    	};

    	return [
    		splitscreen,
    		wh,
    		outer,
    		bgContainer,
    		foreground,
    		background,
    		index,
    		count,
    		offset,
    		progress,
    		visible,
    		id,
    		top,
    		bottom,
    		threshold,
    		query,
    		parallax,
    		$$scope,
    		slots,
    		onwindowresize,
    		svelte_scroller_background_binding,
    		svelte_scroller_background_container_binding,
    		svelte_scroller_foreground_binding,
    		svelte_scroller_outer_binding
    	];
    }

    class Scroller extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{
    				top: 12,
    				bottom: 13,
    				threshold: 14,
    				query: 15,
    				parallax: 16,
    				index: 6,
    				count: 7,
    				offset: 8,
    				progress: 9,
    				visible: 10,
    				splitscreen: 0,
    				id: 11
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Scroller",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get top() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get threshold() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set threshold(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get parallax() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set parallax(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get count() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get progress() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set progress(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get splitscreen() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set splitscreen(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var wf=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{};function Sf(Pu,wc,Li){return Li={path:wc,exports:{},require:function(Co,ko){return Tf(Co,ko??Li.path)}},Pu(Li,Li.exports),Li.exports}function Tf(){throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs")}var ze=Sf(function(Pu,wc){(function(Li,Co){Pu.exports=Co();})(wf,function(){var Li,Co,ko;function zu(u,Zr){if(!Li)Li=Zr;else if(!Co)Co=Zr;else {var ct="var sharedChunk = {}; ("+Li+")(sharedChunk); ("+Co+")(sharedChunk);",tr={};Li(tr),ko=Zr(tr),typeof window!="undefined"&&(ko.workerUrl=window.URL.createObjectURL(new Blob([ct],{type:"text/javascript"})));}}return zu(["exports"],function(u){function Zr(t,e){return t(e={exports:{}},e.exports),e.exports}var ct=tr;function tr(t,e,r,a){this.cx=3*t,this.bx=3*(r-t)-this.cx,this.ax=1-this.cx-this.bx,this.cy=3*e,this.by=3*(a-e)-this.cy,this.ay=1-this.cy-this.by,this.p1x=t,this.p1y=a,this.p2x=r,this.p2y=a;}tr.prototype.sampleCurveX=function(t){return ((this.ax*t+this.bx)*t+this.cx)*t},tr.prototype.sampleCurveY=function(t){return ((this.ay*t+this.by)*t+this.cy)*t},tr.prototype.sampleCurveDerivativeX=function(t){return (3*this.ax*t+2*this.bx)*t+this.cx},tr.prototype.solveCurveX=function(t,e){var r,a,l,c,h;for(e===void 0&&(e=1e-6),l=t,h=0;h<8;h++){if(c=this.sampleCurveX(l)-t,Math.abs(c)<e)return l;var m=this.sampleCurveDerivativeX(l);if(Math.abs(m)<1e-6)break;l-=c/m;}if((l=t)<(r=0))return r;if(l>(a=1))return a;for(;r<a;){if(c=this.sampleCurveX(l),Math.abs(c-t)<e)return l;t>c?r=l:a=l,l=.5*(a-r)+r;}return l},tr.prototype.solve=function(t,e){return this.sampleCurveY(this.solveCurveX(t,e))};var jt=Ti;function Ti(t,e){this.x=t,this.y=e;}Ti.prototype={clone:function(){return new Ti(this.x,this.y)},add:function(t){return this.clone()._add(t)},sub:function(t){return this.clone()._sub(t)},multByPoint:function(t){return this.clone()._multByPoint(t)},divByPoint:function(t){return this.clone()._divByPoint(t)},mult:function(t){return this.clone()._mult(t)},div:function(t){return this.clone()._div(t)},rotate:function(t){return this.clone()._rotate(t)},rotateAround:function(t,e){return this.clone()._rotateAround(t,e)},matMult:function(t){return this.clone()._matMult(t)},unit:function(){return this.clone()._unit()},perp:function(){return this.clone()._perp()},round:function(){return this.clone()._round()},mag:function(){return Math.sqrt(this.x*this.x+this.y*this.y)},equals:function(t){return this.x===t.x&&this.y===t.y},dist:function(t){return Math.sqrt(this.distSqr(t))},distSqr:function(t){var e=t.x-this.x,r=t.y-this.y;return e*e+r*r},angle:function(){return Math.atan2(this.y,this.x)},angleTo:function(t){return Math.atan2(this.y-t.y,this.x-t.x)},angleWith:function(t){return this.angleWithSep(t.x,t.y)},angleWithSep:function(t,e){return Math.atan2(this.x*e-this.y*t,this.x*t+this.y*e)},_matMult:function(t){var e=t[2]*this.x+t[3]*this.y;return this.x=t[0]*this.x+t[1]*this.y,this.y=e,this},_add:function(t){return this.x+=t.x,this.y+=t.y,this},_sub:function(t){return this.x-=t.x,this.y-=t.y,this},_mult:function(t){return this.x*=t,this.y*=t,this},_div:function(t){return this.x/=t,this.y/=t,this},_multByPoint:function(t){return this.x*=t.x,this.y*=t.y,this},_divByPoint:function(t){return this.x/=t.x,this.y/=t.y,this},_unit:function(){return this._div(this.mag()),this},_perp:function(){var t=this.y;return this.y=this.x,this.x=-t,this},_rotate:function(t){var e=Math.cos(t),r=Math.sin(t),a=r*this.x+e*this.y;return this.x=e*this.x-r*this.y,this.y=a,this},_rotateAround:function(t,e){var r=Math.cos(t),a=Math.sin(t),l=e.y+a*(this.x-e.x)+r*(this.y-e.y);return this.x=e.x+r*(this.x-e.x)-a*(this.y-e.y),this.y=l,this},_round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}},Ti.convert=function(t){return t instanceof Ti?t:Array.isArray(t)?new Ti(t[0],t[1]):t};var Pt=typeof self!="undefined"?self:{},vs=Math.pow(2,53)-1;function Jr(t,e,r,a){var l=new ct(t,e,r,a);return function(c){return l.solve(c)}}var bn=Jr(.25,.1,.25,1);function Lr(t,e,r){return Math.min(r,Math.max(e,t))}function Mo(t,e,r){var a=r-e,l=((t-e)%a+a)%a+e;return l===e?r:l}function lr(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];for(var a=0,l=e;a<l.length;a+=1){var c=l[a];for(var h in c)t[h]=c[h];}return t}var ga=1;function to(){return ga++}function Bi(){return function t(e){return e?(e^16*Math.random()>>e/4).toString(16):([1e7]+-[1e3]+-4e3+-8e3+-1e11).replace(/[018]/g,t)}()}function eo(t){return !!t&&/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)}function ro(t,e){t.forEach(function(r){e[r]&&(e[r]=e[r].bind(e));});}function wn(t,e){return t.indexOf(e,t.length-e.length)!==-1}function yr(t,e,r){var a={};for(var l in t)a[l]=e.call(r||this,t[l],l,t);return a}function Ri(t,e,r){var a={};for(var l in t)e.call(r||this,t[l],l,t)&&(a[l]=t[l]);return a}function pi(t){return Array.isArray(t)?t.map(pi):typeof t=="object"&&t?yr(t,pi):t}var io={};function Me(t){io[t]||(typeof console!="undefined"&&console.warn(t),io[t]=!0);}function Br(t,e,r){return (r.y-t.y)*(e.x-t.x)>(e.y-t.y)*(r.x-t.x)}function _a(t){for(var e=0,r=0,a=t.length,l=a-1,c=void 0,h=void 0;r<a;l=r++)e+=((h=t[l]).x-(c=t[r]).x)*(c.y+h.y);return e}function hi(){return typeof WorkerGlobalScope!="undefined"&&typeof self!="undefined"&&self instanceof WorkerGlobalScope}function no(t){var e={};if(t.replace(/(?:^|(?:\s*\,\s*))([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)(?:\=(?:([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)|(?:\"((?:[^"\\]|\\.)*)\")))?/g,function(a,l,c,h){var m=c||h;return e[l]=!m||m.toLowerCase(),""}),e["max-age"]){var r=parseInt(e["max-age"],10);isNaN(r)?delete e["max-age"]:e["max-age"]=r;}return e}var oo=null;function va(t){if(oo==null){var e=t.navigator?t.navigator.userAgent:null;oo=!!t.safari||!(!e||!(/\b(iPad|iPhone|iPod)\b/.test(e)||e.match("Safari")&&!e.match("Chrome")));}return oo}function Ki(t){try{var e=Pt[t];return e.setItem("_mapbox_test_",1),e.removeItem("_mapbox_test_"),!0}catch(r){return !1}}var fi,Ii,Sn,Tn,Hi=Pt.performance&&Pt.performance.now?Pt.performance.now.bind(Pt.performance):Date.now.bind(Date),xs=Pt.requestAnimationFrame||Pt.mozRequestAnimationFrame||Pt.webkitRequestAnimationFrame||Pt.msRequestAnimationFrame,gr=Pt.cancelAnimationFrame||Pt.mozCancelAnimationFrame||Pt.webkitCancelAnimationFrame||Pt.msCancelAnimationFrame,Fi={now:Hi,frame:function(t){var e=xs(t);return {cancel:function(){return gr(e)}}},getImageData:function(t,e){e===void 0&&(e=0);var r=Pt.document.createElement("canvas"),a=r.getContext("2d");if(!a)throw new Error("failed to create canvas 2d context");return r.width=t.width,r.height=t.height,a.drawImage(t,0,0,t.width,t.height),a.getImageData(-e,-e,t.width+2*e,t.height+2*e)},resolveURL:function(t){return fi||(fi=Pt.document.createElement("a")),fi.href=t,fi.href},hardwareConcurrency:Pt.navigator&&Pt.navigator.hardwareConcurrency||4,get devicePixelRatio(){return Pt.devicePixelRatio},get prefersReducedMotion(){return !!Pt.matchMedia&&(Ii==null&&(Ii=Pt.matchMedia("(prefers-reduced-motion: reduce)")),Ii.matches)}},ye={API_URL:"https://api.mapbox.com",get EVENTS_URL(){return this.API_URL?this.API_URL.indexOf("https://api.mapbox.cn")===0?"https://events.mapbox.cn/events/v2":this.API_URL.indexOf("https://api.mapbox.com")===0?"https://events.mapbox.com/events/v2":null:null},FEEDBACK_URL:"https://apps.mapbox.com/feedback",REQUIRE_ACCESS_TOKEN:!0,ACCESS_TOKEN:null,MAX_PARALLEL_IMAGE_REQUESTS:16},Ei={supported:!1,testSupport:function(t){!ao&&Tn&&(di?$t(t):Sn=t);}},ao=!1,di=!1;function $t(t){var e=t.createTexture();t.bindTexture(t.TEXTURE_2D,e);try{if(t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,Tn),t.isContextLost())return;Ei.supported=!0;}catch(r){}t.deleteTexture(e),ao=!0;}Pt.document&&((Tn=Pt.document.createElement("img")).onload=function(){Sn&&$t(Sn),Sn=null,di=!0;},Tn.onerror=function(){ao=!0,Sn=null;},Tn.src="data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAQAAAAfQ//73v/+BiOh/AAA=");var Ji="01",Ar=function(t,e){this._transformRequestFn=t,this._customAccessToken=e,this._createSkuToken();};function Yr(t){return t.indexOf("mapbox:")===0}Ar.prototype._createSkuToken=function(){var t=function(){for(var e="",r=0;r<10;r++)e+="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(62*Math.random())];return {token:["1",Ji,e].join(""),tokenExpiresAt:Date.now()+432e5}}();this._skuToken=t.token,this._skuTokenExpiresAt=t.tokenExpiresAt;},Ar.prototype._isSkuTokenExpired=function(){return Date.now()>this._skuTokenExpiresAt},Ar.prototype.transformRequest=function(t,e){return this._transformRequestFn&&this._transformRequestFn(t,e)||{url:t}},Ar.prototype.normalizeStyleURL=function(t,e){if(!Yr(t))return t;var r=Qr(t);return r.path="/styles/v1"+r.path,this._makeAPIURL(r,this._customAccessToken||e)},Ar.prototype.normalizeGlyphsURL=function(t,e){if(!Yr(t))return t;var r=Qr(t);return r.path="/fonts/v1"+r.path,this._makeAPIURL(r,this._customAccessToken||e)},Ar.prototype.normalizeSourceURL=function(t,e){if(!Yr(t))return t;var r=Qr(t);return r.path="/v4/"+r.authority+".json",r.params.push("secure"),this._makeAPIURL(r,this._customAccessToken||e)},Ar.prototype.normalizeSpriteURL=function(t,e,r,a){var l=Qr(t);return Yr(t)?(l.path="/styles/v1"+l.path+"/sprite"+e+r,this._makeAPIURL(l,this._customAccessToken||a)):(l.path+=""+e+r,In(l))},Ar.prototype.normalizeTileURL=function(t,e){if(this._isSkuTokenExpired()&&this._createSkuToken(),t&&!Yr(t))return t;var r=Qr(t);r.path=r.path.replace(/(\.(png|jpg)\d*)(?=$)/,(Fi.devicePixelRatio>=2||e===512?"@2x":"")+(Ei.supported?".webp":"$1")),r.path=r.path.replace(/^.+\/v4\//,"/"),r.path="/v4"+r.path;var a=this._customAccessToken||function(l){for(var c=0,h=l;c<h.length;c+=1){var m=h[c].match(/^access_token=(.*)$/);if(m)return m[1]}return null}(r.params)||ye.ACCESS_TOKEN;return ye.REQUIRE_ACCESS_TOKEN&&a&&this._skuToken&&r.params.push("sku="+this._skuToken),this._makeAPIURL(r,a)},Ar.prototype.canonicalizeTileURL=function(t,e){var r=Qr(t);if(!r.path.match(/(^\/v4\/)/)||!r.path.match(/\.[\w]+$/))return t;var a="mapbox://tiles/";a+=r.path.replace("/v4/","");var l=r.params;return e&&(l=l.filter(function(c){return !c.match(/^access_token=/)})),l.length&&(a+="?"+l.join("&")),a},Ar.prototype.canonicalizeTileset=function(t,e){for(var r=!!e&&Yr(e),a=[],l=0,c=t.tiles||[];l<c.length;l+=1){var h=c[l];mi(h)?a.push(this.canonicalizeTileURL(h,r)):a.push(h);}return a},Ar.prototype._makeAPIURL=function(t,e){var r="See https://www.mapbox.com/api-documentation/#access-tokens-and-token-scopes",a=Qr(ye.API_URL);if(t.protocol=a.protocol,t.authority=a.authority,t.protocol==="http"){var l=t.params.indexOf("secure");l>=0&&t.params.splice(l,1);}if(a.path!=="/"&&(t.path=""+a.path+t.path),!ye.REQUIRE_ACCESS_TOKEN)return In(t);if(!(e=e||ye.ACCESS_TOKEN))throw new Error("An API access token is required to use Mapbox GL. "+r);if(e[0]==="s")throw new Error("Use a public access token (pk.*) with Mapbox GL, not a secret access token (sk.*). "+r);return t.params=t.params.filter(function(c){return c.indexOf("access_token")===-1}),t.params.push("access_token="+e),In(t)};var bs=/^((https?:)?\/\/)?([^\/]+\.)?mapbox\.c(n|om)(\/|\?|$)/i;function mi(t){return bs.test(t)}var Do=/^(\w+):\/\/([^/?]*)(\/[^?]+)?\??(.+)?/;function Qr(t){var e=t.match(Do);if(!e)throw new Error("Unable to parse URL object");return {protocol:e[1],authority:e[2],path:e[3]||"/",params:e[4]?e[4].split("&"):[]}}function In(t){var e=t.params.length?"?"+t.params.join("&"):"";return t.protocol+"://"+t.authority+t.path+e}function so(t){if(!t)return null;var e=t.split(".");if(!e||e.length!==3)return null;try{return JSON.parse(decodeURIComponent(Pt.atob(e[1]).split("").map(function(r){return "%"+("00"+r.charCodeAt(0).toString(16)).slice(-2)}).join("")))}catch(r){return null}}var $r=function(t){this.type=t,this.anonId=null,this.eventData={},this.queue=[],this.pendingRequest=null;};$r.prototype.getStorageKey=function(t){var e,r=so(ye.ACCESS_TOKEN);return e=r&&r.u?Pt.btoa(encodeURIComponent(r.u).replace(/%([0-9A-F]{2})/g,function(a,l){return String.fromCharCode(Number("0x"+l))})):ye.ACCESS_TOKEN||"",t?"mapbox.eventData."+t+":"+e:"mapbox.eventData:"+e},$r.prototype.fetchEventData=function(){var t=Ki("localStorage"),e=this.getStorageKey(),r=this.getStorageKey("uuid");if(t)try{var a=Pt.localStorage.getItem(e);a&&(this.eventData=JSON.parse(a));var l=Pt.localStorage.getItem(r);l&&(this.anonId=l);}catch(c){Me("Unable to read from LocalStorage");}},$r.prototype.saveEventData=function(){var t=Ki("localStorage"),e=this.getStorageKey(),r=this.getStorageKey("uuid");if(t)try{Pt.localStorage.setItem(r,this.anonId),Object.keys(this.eventData).length>=1&&Pt.localStorage.setItem(e,JSON.stringify(this.eventData));}catch(a){Me("Unable to write to LocalStorage");}},$r.prototype.processRequests=function(t){},$r.prototype.postEvent=function(t,e,r,a){var l=this;if(ye.EVENTS_URL){var c=Qr(ye.EVENTS_URL);c.params.push("access_token="+(a||ye.ACCESS_TOKEN||""));var h={event:this.type,created:new Date(t).toISOString(),sdkIdentifier:"mapbox-gl-js",sdkVersion:"1.13.2",skuId:Ji,userId:this.anonId},m=e?lr(h,e):h,g={url:In(c),headers:{"Content-Type":"text/plain"},body:JSON.stringify([m])};this.pendingRequest=Re(g,function(_){l.pendingRequest=null,r(_),l.saveEventData(),l.processRequests(a);});}},$r.prototype.queueRequest=function(t,e){this.queue.push(t),this.processRequests(e);};var ti,En,yi=function(t){function e(){t.call(this,"map.load"),this.success={},this.skuToken="";}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.postMapLoadEvent=function(r,a,l,c){this.skuToken=l,(ye.EVENTS_URL&&c||ye.ACCESS_TOKEN&&Array.isArray(r)&&r.some(function(h){return Yr(h)||mi(h)}))&&this.queueRequest({id:a,timestamp:Date.now()},c);},e.prototype.processRequests=function(r){var a=this;if(!this.pendingRequest&&this.queue.length!==0){var l=this.queue.shift(),c=l.id,h=l.timestamp;c&&this.success[c]||(this.anonId||this.fetchEventData(),eo(this.anonId)||(this.anonId=Bi()),this.postEvent(h,{skuToken:this.skuToken},function(m){m||c&&(a.success[c]=!0);},r));}},e}($r),xa=new(function(t){function e(r){t.call(this,"appUserTurnstile"),this._customAccessToken=r;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.postTurnstileEvent=function(r,a){ye.EVENTS_URL&&ye.ACCESS_TOKEN&&Array.isArray(r)&&r.some(function(l){return Yr(l)||mi(l)})&&this.queueRequest(Date.now(),a);},e.prototype.processRequests=function(r){var a=this;if(!this.pendingRequest&&this.queue.length!==0){this.anonId&&this.eventData.lastSuccess&&this.eventData.tokenU||this.fetchEventData();var l=so(ye.ACCESS_TOKEN),c=l?l.u:ye.ACCESS_TOKEN,h=c!==this.eventData.tokenU;eo(this.anonId)||(this.anonId=Bi(),h=!0);var m=this.queue.shift();if(this.eventData.lastSuccess){var g=new Date(this.eventData.lastSuccess),_=new Date(m),x=(m-this.eventData.lastSuccess)/864e5;h=h||x>=1||x<-1||g.getDate()!==_.getDate();}else h=!0;if(!h)return this.processRequests();this.postEvent(m,{"enabled.telemetry":!1},function(b){b||(a.eventData.lastSuccess=m,a.eventData.tokenU=c);},r);}},e}($r)),ba=xa.postTurnstileEvent.bind(xa),Lo=new yi,Bo=Lo.postMapLoadEvent.bind(Lo),lo=500,wa=50;function uo(){Pt.caches&&!ti&&(ti=Pt.caches.open("mapbox-tiles"));}function Ro(t){var e=t.indexOf("?");return e<0?t:t.slice(0,e)}var An,Fo=1/0;function Oo(){return An==null&&(An=Pt.OffscreenCanvas&&new Pt.OffscreenCanvas(1,1).getContext("2d")&&typeof Pt.createImageBitmap=="function"),An}var Sa={Unknown:"Unknown",Style:"Style",Source:"Source",Tile:"Tile",Glyphs:"Glyphs",SpriteImage:"SpriteImage",SpriteJSON:"SpriteJSON",Image:"Image"};typeof Object.freeze=="function"&&Object.freeze(Sa);var Ta=function(t){function e(r,a,l){a===401&&mi(l)&&(r+=": you may have provided an invalid Mapbox access token. See https://www.mapbox.com/api-documentation/#access-tokens-and-token-scopes"),t.call(this,r),this.status=a,this.url=l,this.name=this.constructor.name,this.message=r;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.toString=function(){return this.name+": "+this.message+" ("+this.status+"): "+this.url},e}(Error),Pn=hi()?function(){return self.worker&&self.worker.referrer}:function(){return (Pt.location.protocol==="blob:"?Pt.parent:Pt).location.href},Oi,Ui,co=function(t,e){if(!(/^file:/.test(r=t.url)||/^file:/.test(Pn())&&!/^\w+:/.test(r))){if(Pt.fetch&&Pt.Request&&Pt.AbortController&&Pt.Request.prototype.hasOwnProperty("signal"))return function(a,l){var c,h=new Pt.AbortController,m=new Pt.Request(a.url,{method:a.method||"GET",body:a.body,credentials:a.credentials,headers:a.headers,referrer:Pn(),signal:h.signal}),g=!1,_=!1,x=(c=m.url).indexOf("sku=")>0&&mi(c);a.type==="json"&&m.headers.set("Accept","application/json");var b=function(E,L,B){if(!_){if(E&&E.message!=="SecurityError"&&Me(E),L&&B)return I(L);var q=Date.now();Pt.fetch(m).then(function(V){if(V.ok){var W=x?V.clone():null;return I(V,W,q)}return l(new Ta(V.statusText,V.status,a.url))}).catch(function(V){V.code!==20&&l(new Error(V.message));});}},I=function(E,L,B){(a.type==="arrayBuffer"?E.arrayBuffer():a.type==="json"?E.json():E.text()).then(function(q){_||(L&&B&&function(V,W,J){if(uo(),ti){var Y={status:W.status,statusText:W.statusText,headers:new Pt.Headers};W.headers.forEach(function(nt,ut){return Y.headers.set(ut,nt)});var $=no(W.headers.get("Cache-Control")||"");$["no-store"]||($["max-age"]&&Y.headers.set("Expires",new Date(J+1e3*$["max-age"]).toUTCString()),new Date(Y.headers.get("Expires")).getTime()-J<42e4||function(nt,ut){if(En===void 0)try{new Response(new ReadableStream),En=!0;}catch(ft){En=!1;}En?ut(nt.body):nt.blob().then(ut);}(W,function(nt){var ut=new Pt.Response(nt,Y);uo(),ti&&ti.then(function(ft){return ft.put(Ro(V.url),ut)}).catch(function(ft){return Me(ft.message)});}));}}(m,L,B),g=!0,l(null,q,E.headers.get("Cache-Control"),E.headers.get("Expires")));}).catch(function(q){_||l(new Error(q.message));});};return x?function(E,L){if(uo(),!ti)return L(null);var B=Ro(E.url);ti.then(function(q){q.match(B).then(function(V){var W=function(J){if(!J)return !1;var Y=new Date(J.headers.get("Expires")||0),$=no(J.headers.get("Cache-Control")||"");return Y>Date.now()&&!$["no-cache"]}(V);q.delete(B),W&&q.put(B,V.clone()),L(null,V,W);}).catch(L);}).catch(L);}(m,b):b(null,null),{cancel:function(){_=!0,g||h.abort();}}}(t,e);if(hi()&&self.worker&&self.worker.actor)return self.worker.actor.send("getResource",t,e,void 0,!0)}var r;return function(a,l){var c=new Pt.XMLHttpRequest;for(var h in c.open(a.method||"GET",a.url,!0),a.type==="arrayBuffer"&&(c.responseType="arraybuffer"),a.headers)c.setRequestHeader(h,a.headers[h]);return a.type==="json"&&(c.responseType="text",c.setRequestHeader("Accept","application/json")),c.withCredentials=a.credentials==="include",c.onerror=function(){l(new Error(c.statusText));},c.onload=function(){if((c.status>=200&&c.status<300||c.status===0)&&c.response!==null){var m=c.response;if(a.type==="json")try{m=JSON.parse(c.response);}catch(g){return l(g)}l(null,m,c.getResponseHeader("Cache-Control"),c.getResponseHeader("Expires"));}else l(new Ta(c.statusText,c.status,a.url));},c.send(a.body),{cancel:function(){return c.abort()}}}(t,e)},Uo=function(t,e){return co(lr(t,{type:"arrayBuffer"}),e)},Re=function(t,e){return co(lr(t,{method:"POST"}),e)},w="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=";Oi=[],Ui=0;var T=function(t,e){if(Ei.supported&&(t.headers||(t.headers={}),t.headers.accept="image/webp,*/*"),Ui>=ye.MAX_PARALLEL_IMAGE_REQUESTS){var r={requestParameters:t,callback:e,cancelled:!1,cancel:function(){this.cancelled=!0;}};return Oi.push(r),r}Ui++;var a=!1,l=function(){if(!a)for(a=!0,Ui--;Oi.length&&Ui<ye.MAX_PARALLEL_IMAGE_REQUESTS;){var h=Oi.shift();h.cancelled||(h.cancel=T(h.requestParameters,h.callback).cancel);}},c=Uo(t,function(h,m,g,_){l(),h?e(h):m&&(Oo()?function(x,b){var I=new Pt.Blob([new Uint8Array(x)],{type:"image/png"});Pt.createImageBitmap(I).then(function(E){b(null,E);}).catch(function(E){b(new Error("Could not load image because of "+E.message+". Please make sure to use a supported image type such as PNG or JPEG. Note that SVGs are not supported."));});}(m,e):function(x,b,I,E){var L=new Pt.Image,B=Pt.URL;L.onload=function(){b(null,L),B.revokeObjectURL(L.src),L.onload=null,Pt.requestAnimationFrame(function(){L.src=w;});},L.onerror=function(){return b(new Error("Could not load image. Please make sure to use a supported image type such as PNG or JPEG. Note that SVGs are not supported."))};var q=new Pt.Blob([new Uint8Array(x)],{type:"image/png"});L.cacheControl=I,L.expires=E,L.src=x.byteLength?B.createObjectURL(q):w;}(m,e,g,_));});return {cancel:function(){c.cancel(),l();}}};function A(t,e,r){r[t]&&r[t].indexOf(e)!==-1||(r[t]=r[t]||[],r[t].push(e));}function M(t,e,r){if(r&&r[t]){var a=r[t].indexOf(e);a!==-1&&r[t].splice(a,1);}}var O=function(t,e){e===void 0&&(e={}),lr(this,e),this.type=t;},Z=function(t){function e(r,a){a===void 0&&(a={}),t.call(this,"error",lr({error:r},a));}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(O),X=function(){};X.prototype.on=function(t,e){return this._listeners=this._listeners||{},A(t,e,this._listeners),this},X.prototype.off=function(t,e){return M(t,e,this._listeners),M(t,e,this._oneTimeListeners),this},X.prototype.once=function(t,e){return this._oneTimeListeners=this._oneTimeListeners||{},A(t,e,this._oneTimeListeners),this},X.prototype.fire=function(t,e){typeof t=="string"&&(t=new O(t,e||{}));var r=t.type;if(this.listens(r)){t.target=this;for(var a=0,l=this._listeners&&this._listeners[r]?this._listeners[r].slice():[];a<l.length;a+=1)l[a].call(this,t);for(var c=0,h=this._oneTimeListeners&&this._oneTimeListeners[r]?this._oneTimeListeners[r].slice():[];c<h.length;c+=1){var m=h[c];M(r,m,this._oneTimeListeners),m.call(this,t);}var g=this._eventedParent;g&&(lr(t,typeof this._eventedParentData=="function"?this._eventedParentData():this._eventedParentData),g.fire(t));}else t instanceof Z&&console.error(t.error);return this},X.prototype.listens=function(t){return this._listeners&&this._listeners[t]&&this._listeners[t].length>0||this._oneTimeListeners&&this._oneTimeListeners[t]&&this._oneTimeListeners[t].length>0||this._eventedParent&&this._eventedParent.listens(t)},X.prototype.setEventedParent=function(t,e){return this._eventedParent=t,this._eventedParentData=e,this};var C={$version:8,$root:{version:{required:!0,type:"enum",values:[8]},name:{type:"string"},metadata:{type:"*"},center:{type:"array",value:"number"},zoom:{type:"number"},bearing:{type:"number",default:0,period:360,units:"degrees"},pitch:{type:"number",default:0,units:"degrees"},light:{type:"light"},sources:{required:!0,type:"sources"},sprite:{type:"string"},glyphs:{type:"string"},transition:{type:"transition"},layers:{required:!0,type:"array",value:"layer"}},sources:{"*":{type:"source"}},source:["source_vector","source_raster","source_raster_dem","source_geojson","source_video","source_image"],source_vector:{type:{required:!0,type:"enum",values:{vector:{}}},url:{type:"string"},tiles:{type:"array",value:"string"},bounds:{type:"array",value:"number",length:4,default:[-180,-85.051129,180,85.051129]},scheme:{type:"enum",values:{xyz:{},tms:{}},default:"xyz"},minzoom:{type:"number",default:0},maxzoom:{type:"number",default:22},attribution:{type:"string"},promoteId:{type:"promoteId"},volatile:{type:"boolean",default:!1},"*":{type:"*"}},source_raster:{type:{required:!0,type:"enum",values:{raster:{}}},url:{type:"string"},tiles:{type:"array",value:"string"},bounds:{type:"array",value:"number",length:4,default:[-180,-85.051129,180,85.051129]},minzoom:{type:"number",default:0},maxzoom:{type:"number",default:22},tileSize:{type:"number",default:512,units:"pixels"},scheme:{type:"enum",values:{xyz:{},tms:{}},default:"xyz"},attribution:{type:"string"},volatile:{type:"boolean",default:!1},"*":{type:"*"}},source_raster_dem:{type:{required:!0,type:"enum",values:{"raster-dem":{}}},url:{type:"string"},tiles:{type:"array",value:"string"},bounds:{type:"array",value:"number",length:4,default:[-180,-85.051129,180,85.051129]},minzoom:{type:"number",default:0},maxzoom:{type:"number",default:22},tileSize:{type:"number",default:512,units:"pixels"},attribution:{type:"string"},encoding:{type:"enum",values:{terrarium:{},mapbox:{}},default:"mapbox"},volatile:{type:"boolean",default:!1},"*":{type:"*"}},source_geojson:{type:{required:!0,type:"enum",values:{geojson:{}}},data:{type:"*"},maxzoom:{type:"number",default:18},attribution:{type:"string"},buffer:{type:"number",default:128,maximum:512,minimum:0},filter:{type:"*"},tolerance:{type:"number",default:.375},cluster:{type:"boolean",default:!1},clusterRadius:{type:"number",default:50,minimum:0},clusterMaxZoom:{type:"number"},clusterMinPoints:{type:"number"},clusterProperties:{type:"*"},lineMetrics:{type:"boolean",default:!1},generateId:{type:"boolean",default:!1},promoteId:{type:"promoteId"}},source_video:{type:{required:!0,type:"enum",values:{video:{}}},urls:{required:!0,type:"array",value:"string"},coordinates:{required:!0,type:"array",length:4,value:{type:"array",length:2,value:"number"}}},source_image:{type:{required:!0,type:"enum",values:{image:{}}},url:{required:!0,type:"string"},coordinates:{required:!0,type:"array",length:4,value:{type:"array",length:2,value:"number"}}},layer:{id:{type:"string",required:!0},type:{type:"enum",values:{fill:{},line:{},symbol:{},circle:{},heatmap:{},"fill-extrusion":{},raster:{},hillshade:{},background:{}},required:!0},metadata:{type:"*"},source:{type:"string"},"source-layer":{type:"string"},minzoom:{type:"number",minimum:0,maximum:24},maxzoom:{type:"number",minimum:0,maximum:24},filter:{type:"filter"},layout:{type:"layout"},paint:{type:"paint"}},layout:["layout_fill","layout_line","layout_circle","layout_heatmap","layout_fill-extrusion","layout_symbol","layout_raster","layout_hillshade","layout_background"],layout_background:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_fill:{"fill-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_circle:{"circle-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_heatmap:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},"layout_fill-extrusion":{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_line:{"line-cap":{type:"enum",values:{butt:{},round:{},square:{}},default:"butt",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"line-join":{type:"enum",values:{bevel:{},round:{},miter:{}},default:"miter",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"line-miter-limit":{type:"number",default:2,requires:[{"line-join":"miter"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"line-round-limit":{type:"number",default:1.05,requires:[{"line-join":"round"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"line-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_symbol:{"symbol-placement":{type:"enum",values:{point:{},line:{},"line-center":{}},default:"point",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"symbol-spacing":{type:"number",default:250,minimum:1,units:"pixels",requires:[{"symbol-placement":"line"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"symbol-avoid-edges":{type:"boolean",default:!1,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"symbol-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"symbol-z-order":{type:"enum",values:{auto:{},"viewport-y":{},source:{}},default:"auto",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-allow-overlap":{type:"boolean",default:!1,requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-ignore-placement":{type:"boolean",default:!1,requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-optional":{type:"boolean",default:!1,requires:["icon-image","text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-rotation-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-size":{type:"number",default:1,minimum:0,units:"factor of the original icon size",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-text-fit":{type:"enum",values:{none:{},width:{},height:{},both:{}},default:"none",requires:["icon-image","text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-text-fit-padding":{type:"array",value:"number",length:4,default:[0,0,0,0],units:"pixels",requires:["icon-image","text-field",{"icon-text-fit":["both","width","height"]}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"icon-image":{type:"resolvedImage",tokens:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-rotate":{type:"number",default:0,period:360,units:"degrees",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-padding":{type:"number",default:2,minimum:0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"icon-keep-upright":{type:"boolean",default:!1,requires:["icon-image",{"icon-rotation-alignment":"map"},{"symbol-placement":["line","line-center"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-offset":{type:"array",value:"number",length:2,default:[0,0],requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-anchor":{type:"enum",values:{center:{},left:{},right:{},top:{},bottom:{},"top-left":{},"top-right":{},"bottom-left":{},"bottom-right":{}},default:"center",requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-pitch-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-pitch-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-rotation-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-field":{type:"formatted",default:"",tokens:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-font":{type:"array",value:"string",default:["Open Sans Regular","Arial Unicode MS Regular"],requires:["text-field"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-size":{type:"number",default:16,minimum:0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-max-width":{type:"number",default:10,minimum:0,units:"ems",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-line-height":{type:"number",default:1.2,units:"ems",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-letter-spacing":{type:"number",default:0,units:"ems",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-justify":{type:"enum",values:{auto:{},left:{},center:{},right:{}},default:"center",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-radial-offset":{type:"number",units:"ems",default:0,requires:["text-field"],"property-type":"data-driven",expression:{interpolated:!0,parameters:["zoom","feature"]}},"text-variable-anchor":{type:"array",value:"enum",values:{center:{},left:{},right:{},top:{},bottom:{},"top-left":{},"top-right":{},"bottom-left":{},"bottom-right":{}},requires:["text-field",{"symbol-placement":["point"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-anchor":{type:"enum",values:{center:{},left:{},right:{},top:{},bottom:{},"top-left":{},"top-right":{},"bottom-left":{},"bottom-right":{}},default:"center",requires:["text-field",{"!":"text-variable-anchor"}],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-max-angle":{type:"number",default:45,units:"degrees",requires:["text-field",{"symbol-placement":["line","line-center"]}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-writing-mode":{type:"array",value:"enum",values:{horizontal:{},vertical:{}},requires:["text-field",{"symbol-placement":["point"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-rotate":{type:"number",default:0,period:360,units:"degrees",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-padding":{type:"number",default:2,minimum:0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-keep-upright":{type:"boolean",default:!0,requires:["text-field",{"text-rotation-alignment":"map"},{"symbol-placement":["line","line-center"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-transform":{type:"enum",values:{none:{},uppercase:{},lowercase:{}},default:"none",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-offset":{type:"array",value:"number",units:"ems",length:2,default:[0,0],requires:["text-field",{"!":"text-radial-offset"}],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-allow-overlap":{type:"boolean",default:!1,requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-ignore-placement":{type:"boolean",default:!1,requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-optional":{type:"boolean",default:!1,requires:["text-field","icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_raster:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_hillshade:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},filter:{type:"array",value:"*"},filter_operator:{type:"enum",values:{"==":{},"!=":{},">":{},">=":{},"<":{},"<=":{},in:{},"!in":{},all:{},any:{},none:{},has:{},"!has":{},within:{}}},geometry_type:{type:"enum",values:{Point:{},LineString:{},Polygon:{}}},function:{expression:{type:"expression"},stops:{type:"array",value:"function_stop"},base:{type:"number",default:1,minimum:0},property:{type:"string",default:"$zoom"},type:{type:"enum",values:{identity:{},exponential:{},interval:{},categorical:{}},default:"exponential"},colorSpace:{type:"enum",values:{rgb:{},lab:{},hcl:{}},default:"rgb"},default:{type:"*",required:!1}},function_stop:{type:"array",minimum:0,maximum:24,value:["number","color"],length:2},expression:{type:"array",value:"*",minimum:1},light:{anchor:{type:"enum",default:"viewport",values:{map:{},viewport:{}},"property-type":"data-constant",transition:!1,expression:{interpolated:!1,parameters:["zoom"]}},position:{type:"array",default:[1.15,210,30],length:3,value:"number","property-type":"data-constant",transition:!0,expression:{interpolated:!0,parameters:["zoom"]}},color:{type:"color","property-type":"data-constant",default:"#ffffff",expression:{interpolated:!0,parameters:["zoom"]},transition:!0},intensity:{type:"number","property-type":"data-constant",default:.5,minimum:0,maximum:1,expression:{interpolated:!0,parameters:["zoom"]},transition:!0}},paint:["paint_fill","paint_line","paint_circle","paint_heatmap","paint_fill-extrusion","paint_symbol","paint_raster","paint_hillshade","paint_background"],paint_fill:{"fill-antialias":{type:"boolean",default:!0,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"fill-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"fill-pattern"}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-outline-color":{type:"color",transition:!0,requires:[{"!":"fill-pattern"},{"fill-antialias":!0}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"fill-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["fill-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"fill-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"cross-faded-data-driven"}},"paint_fill-extrusion":{"fill-extrusion-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"fill-extrusion-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"fill-extrusion-pattern"}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-extrusion-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"fill-extrusion-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["fill-extrusion-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"fill-extrusion-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"cross-faded-data-driven"},"fill-extrusion-height":{type:"number",default:0,minimum:0,units:"meters",transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-extrusion-base":{type:"number",default:0,minimum:0,units:"meters",transition:!0,requires:["fill-extrusion-height"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-extrusion-vertical-gradient":{type:"boolean",default:!0,transition:!1,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"}},paint_line:{"line-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"line-pattern"}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"line-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["line-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"line-width":{type:"number",default:1,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-gap-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-offset":{type:"number",default:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-blur":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-dasharray":{type:"array",value:"number",minimum:0,transition:!0,units:"line widths",requires:[{"!":"line-pattern"}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"cross-faded"},"line-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"cross-faded-data-driven"},"line-gradient":{type:"color",transition:!1,requires:[{"!":"line-dasharray"},{"!":"line-pattern"},{source:"geojson",has:{lineMetrics:!0}}],expression:{interpolated:!0,parameters:["line-progress"]},"property-type":"color-ramp"}},paint_circle:{"circle-radius":{type:"number",default:5,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-blur":{type:"number",default:0,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"circle-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["circle-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"circle-pitch-scale":{type:"enum",values:{map:{},viewport:{}},default:"map",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"circle-pitch-alignment":{type:"enum",values:{map:{},viewport:{}},default:"viewport",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"circle-stroke-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-stroke-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-stroke-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"}},paint_heatmap:{"heatmap-radius":{type:"number",default:30,minimum:1,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"heatmap-weight":{type:"number",default:1,minimum:0,transition:!1,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"heatmap-intensity":{type:"number",default:1,minimum:0,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"heatmap-color":{type:"color",default:["interpolate",["linear"],["heatmap-density"],0,"rgba(0, 0, 255, 0)",.1,"royalblue",.3,"cyan",.5,"lime",.7,"yellow",1,"red"],transition:!1,expression:{interpolated:!0,parameters:["heatmap-density"]},"property-type":"color-ramp"},"heatmap-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},paint_symbol:{"icon-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-color":{type:"color",default:"#000000",transition:!0,requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-halo-color":{type:"color",default:"rgba(0, 0, 0, 0)",transition:!0,requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-halo-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-halo-blur":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"icon-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["icon-image","icon-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-color":{type:"color",default:"#000000",transition:!0,overridable:!0,requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-halo-color":{type:"color",default:"rgba(0, 0, 0, 0)",transition:!0,requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-halo-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-halo-blur":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["text-field","text-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"}},paint_raster:{"raster-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-hue-rotate":{type:"number",default:0,period:360,transition:!0,units:"degrees",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-brightness-min":{type:"number",default:0,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-brightness-max":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-saturation":{type:"number",default:0,minimum:-1,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-contrast":{type:"number",default:0,minimum:-1,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-resampling":{type:"enum",values:{linear:{},nearest:{}},default:"linear",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"raster-fade-duration":{type:"number",default:300,minimum:0,transition:!1,units:"milliseconds",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},paint_hillshade:{"hillshade-illumination-direction":{type:"number",default:335,minimum:0,maximum:359,transition:!1,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-illumination-anchor":{type:"enum",values:{map:{},viewport:{}},default:"viewport",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-exaggeration":{type:"number",default:.5,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-shadow-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-highlight-color":{type:"color",default:"#FFFFFF",transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-accent-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},paint_background:{"background-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"background-pattern"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"background-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"cross-faded"},"background-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},transition:{duration:{type:"number",default:300,minimum:0,units:"milliseconds"},delay:{type:"number",default:0,minimum:0,units:"milliseconds"}},"property-type":{"data-driven":{type:"property-type"},"cross-faded":{type:"property-type"},"cross-faded-data-driven":{type:"property-type"},"color-ramp":{type:"property-type"},"data-constant":{type:"property-type"},constant:{type:"property-type"}},promoteId:{"*":{type:"string"}}},U=function(t,e,r,a){this.message=(t?t+": ":"")+r,a&&(this.identifier=a),e!=null&&e.__line__&&(this.line=e.__line__);};function H(t){var e=t.value;return e?[new U(t.key,e,"constants have been deprecated as of v8")]:[]}function at(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];for(var a=0,l=e;a<l.length;a+=1){var c=l[a];for(var h in c)t[h]=c[h];}return t}function lt(t){return t instanceof Number||t instanceof String||t instanceof Boolean?t.valueOf():t}function rt(t){if(Array.isArray(t))return t.map(rt);if(t instanceof Object&&!(t instanceof Number||t instanceof String||t instanceof Boolean)){var e={};for(var r in t)e[r]=rt(t[r]);return e}return lt(t)}var st=function(t){function e(r,a){t.call(this,a),this.message=a,this.key=r;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(Error),It=function(t,e){e===void 0&&(e=[]),this.parent=t,this.bindings={};for(var r=0,a=e;r<a.length;r+=1){var l=a[r];this.bindings[l[0]]=l[1];}};It.prototype.concat=function(t){return new It(this,t)},It.prototype.get=function(t){if(this.bindings[t])return this.bindings[t];if(this.parent)return this.parent.get(t);throw new Error(t+" not found in scope.")},It.prototype.has=function(t){return !!this.bindings[t]||!!this.parent&&this.parent.has(t)};var St={kind:"null"},it={kind:"number"},xt={kind:"string"},dt={kind:"boolean"},yt={kind:"color"},Wt={kind:"object"},_t={kind:"value"},te={kind:"collator"},ge={kind:"formatted"},Ht={kind:"resolvedImage"};function le(t,e){return {kind:"array",itemType:t,N:e}}function re(t){if(t.kind==="array"){var e=re(t.itemType);return typeof t.N=="number"?"array<"+e+", "+t.N+">":t.itemType.kind==="value"?"array":"array<"+e+">"}return t.kind}var _r=[St,it,xt,dt,yt,ge,Wt,le(_t),Ht];function pe(t,e){if(e.kind==="error")return null;if(t.kind==="array"){if(e.kind==="array"&&(e.N===0&&e.itemType.kind==="value"||!pe(t.itemType,e.itemType))&&(typeof t.N!="number"||t.N===e.N))return null}else {if(t.kind===e.kind)return null;if(t.kind==="value"){for(var r=0,a=_r;r<a.length;r+=1)if(!pe(a[r],e))return null}}return "Expected "+re(t)+" but found "+re(e)+" instead."}function Fe(t,e){return e.some(function(r){return r.kind===t.kind})}function de(t,e){return e.some(function(r){return r==="null"?t===null:r==="array"?Array.isArray(t):r==="object"?t&&!Array.isArray(t)&&typeof t=="object":r===typeof t})}var Qt=Zr(function(t,e){var r={transparent:[0,0,0,0],aliceblue:[240,248,255,1],antiquewhite:[250,235,215,1],aqua:[0,255,255,1],aquamarine:[127,255,212,1],azure:[240,255,255,1],beige:[245,245,220,1],bisque:[255,228,196,1],black:[0,0,0,1],blanchedalmond:[255,235,205,1],blue:[0,0,255,1],blueviolet:[138,43,226,1],brown:[165,42,42,1],burlywood:[222,184,135,1],cadetblue:[95,158,160,1],chartreuse:[127,255,0,1],chocolate:[210,105,30,1],coral:[255,127,80,1],cornflowerblue:[100,149,237,1],cornsilk:[255,248,220,1],crimson:[220,20,60,1],cyan:[0,255,255,1],darkblue:[0,0,139,1],darkcyan:[0,139,139,1],darkgoldenrod:[184,134,11,1],darkgray:[169,169,169,1],darkgreen:[0,100,0,1],darkgrey:[169,169,169,1],darkkhaki:[189,183,107,1],darkmagenta:[139,0,139,1],darkolivegreen:[85,107,47,1],darkorange:[255,140,0,1],darkorchid:[153,50,204,1],darkred:[139,0,0,1],darksalmon:[233,150,122,1],darkseagreen:[143,188,143,1],darkslateblue:[72,61,139,1],darkslategray:[47,79,79,1],darkslategrey:[47,79,79,1],darkturquoise:[0,206,209,1],darkviolet:[148,0,211,1],deeppink:[255,20,147,1],deepskyblue:[0,191,255,1],dimgray:[105,105,105,1],dimgrey:[105,105,105,1],dodgerblue:[30,144,255,1],firebrick:[178,34,34,1],floralwhite:[255,250,240,1],forestgreen:[34,139,34,1],fuchsia:[255,0,255,1],gainsboro:[220,220,220,1],ghostwhite:[248,248,255,1],gold:[255,215,0,1],goldenrod:[218,165,32,1],gray:[128,128,128,1],green:[0,128,0,1],greenyellow:[173,255,47,1],grey:[128,128,128,1],honeydew:[240,255,240,1],hotpink:[255,105,180,1],indianred:[205,92,92,1],indigo:[75,0,130,1],ivory:[255,255,240,1],khaki:[240,230,140,1],lavender:[230,230,250,1],lavenderblush:[255,240,245,1],lawngreen:[124,252,0,1],lemonchiffon:[255,250,205,1],lightblue:[173,216,230,1],lightcoral:[240,128,128,1],lightcyan:[224,255,255,1],lightgoldenrodyellow:[250,250,210,1],lightgray:[211,211,211,1],lightgreen:[144,238,144,1],lightgrey:[211,211,211,1],lightpink:[255,182,193,1],lightsalmon:[255,160,122,1],lightseagreen:[32,178,170,1],lightskyblue:[135,206,250,1],lightslategray:[119,136,153,1],lightslategrey:[119,136,153,1],lightsteelblue:[176,196,222,1],lightyellow:[255,255,224,1],lime:[0,255,0,1],limegreen:[50,205,50,1],linen:[250,240,230,1],magenta:[255,0,255,1],maroon:[128,0,0,1],mediumaquamarine:[102,205,170,1],mediumblue:[0,0,205,1],mediumorchid:[186,85,211,1],mediumpurple:[147,112,219,1],mediumseagreen:[60,179,113,1],mediumslateblue:[123,104,238,1],mediumspringgreen:[0,250,154,1],mediumturquoise:[72,209,204,1],mediumvioletred:[199,21,133,1],midnightblue:[25,25,112,1],mintcream:[245,255,250,1],mistyrose:[255,228,225,1],moccasin:[255,228,181,1],navajowhite:[255,222,173,1],navy:[0,0,128,1],oldlace:[253,245,230,1],olive:[128,128,0,1],olivedrab:[107,142,35,1],orange:[255,165,0,1],orangered:[255,69,0,1],orchid:[218,112,214,1],palegoldenrod:[238,232,170,1],palegreen:[152,251,152,1],paleturquoise:[175,238,238,1],palevioletred:[219,112,147,1],papayawhip:[255,239,213,1],peachpuff:[255,218,185,1],peru:[205,133,63,1],pink:[255,192,203,1],plum:[221,160,221,1],powderblue:[176,224,230,1],purple:[128,0,128,1],rebeccapurple:[102,51,153,1],red:[255,0,0,1],rosybrown:[188,143,143,1],royalblue:[65,105,225,1],saddlebrown:[139,69,19,1],salmon:[250,128,114,1],sandybrown:[244,164,96,1],seagreen:[46,139,87,1],seashell:[255,245,238,1],sienna:[160,82,45,1],silver:[192,192,192,1],skyblue:[135,206,235,1],slateblue:[106,90,205,1],slategray:[112,128,144,1],slategrey:[112,128,144,1],snow:[255,250,250,1],springgreen:[0,255,127,1],steelblue:[70,130,180,1],tan:[210,180,140,1],teal:[0,128,128,1],thistle:[216,191,216,1],tomato:[255,99,71,1],turquoise:[64,224,208,1],violet:[238,130,238,1],wheat:[245,222,179,1],white:[255,255,255,1],whitesmoke:[245,245,245,1],yellow:[255,255,0,1],yellowgreen:[154,205,50,1]};function a(m){return (m=Math.round(m))<0?0:m>255?255:m}function l(m){return a(m[m.length-1]==="%"?parseFloat(m)/100*255:parseInt(m))}function c(m){return (g=m[m.length-1]==="%"?parseFloat(m)/100:parseFloat(m))<0?0:g>1?1:g;var g;}function h(m,g,_){return _<0?_+=1:_>1&&(_-=1),6*_<1?m+(g-m)*_*6:2*_<1?g:3*_<2?m+(g-m)*(2/3-_)*6:m}try{e.parseCSSColor=function(m){var g,_=m.replace(/ /g,"").toLowerCase();if(_ in r)return r[_].slice();if(_[0]==="#")return _.length===4?(g=parseInt(_.substr(1),16))>=0&&g<=4095?[(3840&g)>>4|(3840&g)>>8,240&g|(240&g)>>4,15&g|(15&g)<<4,1]:null:_.length===7&&(g=parseInt(_.substr(1),16))>=0&&g<=16777215?[(16711680&g)>>16,(65280&g)>>8,255&g,1]:null;var x=_.indexOf("("),b=_.indexOf(")");if(x!==-1&&b+1===_.length){var I=_.substr(0,x),E=_.substr(x+1,b-(x+1)).split(","),L=1;switch(I){case"rgba":if(E.length!==4)return null;L=c(E.pop());case"rgb":return E.length!==3?null:[l(E[0]),l(E[1]),l(E[2]),L];case"hsla":if(E.length!==4)return null;L=c(E.pop());case"hsl":if(E.length!==3)return null;var B=(parseFloat(E[0])%360+360)%360/360,q=c(E[1]),V=c(E[2]),W=V<=.5?V*(q+1):V+q-V*q,J=2*V-W;return [a(255*h(J,W,B+1/3)),a(255*h(J,W,B)),a(255*h(J,W,B-1/3)),L];default:return null}}return null};}catch(m){}}).parseCSSColor,ue=function(t,e,r,a){a===void 0&&(a=1),this.r=t,this.g=e,this.b=r,this.a=a;};ue.parse=function(t){if(t){if(t instanceof ue)return t;if(typeof t=="string"){var e=Qt(t);if(e)return new ue(e[0]/255*e[3],e[1]/255*e[3],e[2]/255*e[3],e[3])}}},ue.prototype.toString=function(){var t=this.toArray(),e=t[1],r=t[2],a=t[3];return "rgba("+Math.round(t[0])+","+Math.round(e)+","+Math.round(r)+","+a+")"},ue.prototype.toArray=function(){var t=this.a;return t===0?[0,0,0,0]:[255*this.r/t,255*this.g/t,255*this.b/t,t]},ue.black=new ue(0,0,0,1),ue.white=new ue(1,1,1,1),ue.transparent=new ue(0,0,0,0),ue.red=new ue(1,0,0,1);var Pr=function(t,e,r){this.sensitivity=t?e?"variant":"case":e?"accent":"base",this.locale=r,this.collator=new Intl.Collator(this.locale?this.locale:[],{sensitivity:this.sensitivity,usage:"search"});};Pr.prototype.compare=function(t,e){return this.collator.compare(t,e)},Pr.prototype.resolvedLocale=function(){return new Intl.Collator(this.locale?this.locale:[]).resolvedOptions().locale};var Vo=function(t,e,r,a,l){this.text=t,this.image=e,this.scale=r,this.fontStack=a,this.textColor=l;},er=function(t){this.sections=t;};er.fromString=function(t){return new er([new Vo(t,null,null,null,null)])},er.prototype.isEmpty=function(){return this.sections.length===0||!this.sections.some(function(t){return t.text.length!==0||t.image&&t.image.name.length!==0})},er.factory=function(t){return t instanceof er?t:er.fromString(t)},er.prototype.toString=function(){return this.sections.length===0?"":this.sections.map(function(t){return t.text}).join("")},er.prototype.serialize=function(){for(var t=["format"],e=0,r=this.sections;e<r.length;e+=1){var a=r[e];if(a.image)t.push(["image",a.image.name]);else {t.push(a.text);var l={};a.fontStack&&(l["text-font"]=["literal",a.fontStack.split(",")]),a.scale&&(l["font-scale"]=a.scale),a.textColor&&(l["text-color"]=["rgba"].concat(a.textColor.toArray())),t.push(l);}}return t};var zr=function(t){this.name=t.name,this.available=t.available;};function ws(t,e,r,a){return typeof t=="number"&&t>=0&&t<=255&&typeof e=="number"&&e>=0&&e<=255&&typeof r=="number"&&r>=0&&r<=255?a===void 0||typeof a=="number"&&a>=0&&a<=1?null:"Invalid rgba value ["+[t,e,r,a].join(", ")+"]: 'a' must be between 0 and 1.":"Invalid rgba value ["+(typeof a=="number"?[t,e,r,a]:[t,e,r]).join(", ")+"]: 'r', 'g', and 'b' must be between 0 and 255."}function No(t){if(t===null)return !0;if(typeof t=="string")return !0;if(typeof t=="boolean")return !0;if(typeof t=="number")return !0;if(t instanceof ue)return !0;if(t instanceof Pr)return !0;if(t instanceof er)return !0;if(t instanceof zr)return !0;if(Array.isArray(t)){for(var e=0,r=t;e<r.length;e+=1)if(!No(r[e]))return !1;return !0}if(typeof t=="object"){for(var a in t)if(!No(t[a]))return !1;return !0}return !1}function Oe(t){if(t===null)return St;if(typeof t=="string")return xt;if(typeof t=="boolean")return dt;if(typeof t=="number")return it;if(t instanceof ue)return yt;if(t instanceof Pr)return te;if(t instanceof er)return ge;if(t instanceof zr)return Ht;if(Array.isArray(t)){for(var e,r=t.length,a=0,l=t;a<l.length;a+=1){var c=Oe(l[a]);if(e){if(e===c)continue;e=_t;break}e=c;}return le(e||_t,r)}return Wt}function jo(t){var e=typeof t;return t===null?"":e==="string"||e==="number"||e==="boolean"?String(t):t instanceof ue||t instanceof er||t instanceof zr?t.toString():JSON.stringify(t)}zr.prototype.toString=function(){return this.name},zr.fromString=function(t){return t?new zr({name:t,available:!1}):null},zr.prototype.serialize=function(){return ["image",this.name]};var vr=function(t,e){this.type=t,this.value=e;};vr.parse=function(t,e){if(t.length!==2)return e.error("'literal' expression requires exactly one argument, but found "+(t.length-1)+" instead.");if(!No(t[1]))return e.error("invalid value");var r=t[1],a=Oe(r),l=e.expectedType;return a.kind!=="array"||a.N!==0||!l||l.kind!=="array"||typeof l.N=="number"&&l.N!==0||(a=l),new vr(a,r)},vr.prototype.evaluate=function(){return this.value},vr.prototype.eachChild=function(){},vr.prototype.outputDefined=function(){return !0},vr.prototype.serialize=function(){return this.type.kind==="array"||this.type.kind==="object"?["literal",this.value]:this.value instanceof ue?["rgba"].concat(this.value.toArray()):this.value instanceof er?this.value.serialize():this.value};var rr=function(t){this.name="ExpressionEvaluationError",this.message=t;};rr.prototype.toJSON=function(){return this.message};var ei={string:xt,number:it,boolean:dt,object:Wt},Te=function(t,e){this.type=t,this.args=e;};Te.parse=function(t,e){if(t.length<2)return e.error("Expected at least one argument.");var r,a=1,l=t[0];if(l==="array"){var c,h;if(t.length>2){var m=t[1];if(typeof m!="string"||!(m in ei)||m==="object")return e.error('The item type argument of "array" must be one of string, number, boolean',1);c=ei[m],a++;}else c=_t;if(t.length>3){if(t[2]!==null&&(typeof t[2]!="number"||t[2]<0||t[2]!==Math.floor(t[2])))return e.error('The length argument to "array" must be a positive integer literal',2);h=t[2],a++;}r=le(c,h);}else r=ei[l];for(var g=[];a<t.length;a++){var _=e.parse(t[a],a,_t);if(!_)return null;g.push(_);}return new Te(r,g)},Te.prototype.evaluate=function(t){for(var e=0;e<this.args.length;e++){var r=this.args[e].evaluate(t);if(!pe(this.type,Oe(r)))return r;if(e===this.args.length-1)throw new rr("Expected value to be of type "+re(this.type)+", but found "+re(Oe(r))+" instead.")}return null},Te.prototype.eachChild=function(t){this.args.forEach(t);},Te.prototype.outputDefined=function(){return this.args.every(function(t){return t.outputDefined()})},Te.prototype.serialize=function(){var t=this.type,e=[t.kind];if(t.kind==="array"){var r=t.itemType;if(r.kind==="string"||r.kind==="number"||r.kind==="boolean"){e.push(r.kind);var a=t.N;(typeof a=="number"||this.args.length>1)&&e.push(a);}}return e.concat(this.args.map(function(l){return l.serialize()}))};var gi=function(t){this.type=ge,this.sections=t;};gi.parse=function(t,e){if(t.length<2)return e.error("Expected at least one argument.");var r=t[1];if(!Array.isArray(r)&&typeof r=="object")return e.error("First argument must be an image or text section.");for(var a=[],l=!1,c=1;c<=t.length-1;++c){var h=t[c];if(l&&typeof h=="object"&&!Array.isArray(h)){l=!1;var m=null;if(h["font-scale"]&&!(m=e.parse(h["font-scale"],1,it)))return null;var g=null;if(h["text-font"]&&!(g=e.parse(h["text-font"],1,le(xt))))return null;var _=null;if(h["text-color"]&&!(_=e.parse(h["text-color"],1,yt)))return null;var x=a[a.length-1];x.scale=m,x.font=g,x.textColor=_;}else {var b=e.parse(t[c],1,_t);if(!b)return null;var I=b.type.kind;if(I!=="string"&&I!=="value"&&I!=="null"&&I!=="resolvedImage")return e.error("Formatted text type must be 'string', 'value', 'image' or 'null'.");l=!0,a.push({content:b,scale:null,font:null,textColor:null});}}return new gi(a)},gi.prototype.evaluate=function(t){return new er(this.sections.map(function(e){var r=e.content.evaluate(t);return Oe(r)===Ht?new Vo("",r,null,null,null):new Vo(jo(r),null,e.scale?e.scale.evaluate(t):null,e.font?e.font.evaluate(t).join(","):null,e.textColor?e.textColor.evaluate(t):null)}))},gi.prototype.eachChild=function(t){for(var e=0,r=this.sections;e<r.length;e+=1){var a=r[e];t(a.content),a.scale&&t(a.scale),a.font&&t(a.font),a.textColor&&t(a.textColor);}},gi.prototype.outputDefined=function(){return !1},gi.prototype.serialize=function(){for(var t=["format"],e=0,r=this.sections;e<r.length;e+=1){var a=r[e];t.push(a.content.serialize());var l={};a.scale&&(l["font-scale"]=a.scale.serialize()),a.font&&(l["text-font"]=a.font.serialize()),a.textColor&&(l["text-color"]=a.textColor.serialize()),t.push(l);}return t};var Gr=function(t){this.type=Ht,this.input=t;};Gr.parse=function(t,e){if(t.length!==2)return e.error("Expected two arguments.");var r=e.parse(t[1],1,xt);return r?new Gr(r):e.error("No image name provided.")},Gr.prototype.evaluate=function(t){var e=this.input.evaluate(t),r=zr.fromString(e);return r&&t.availableImages&&(r.available=t.availableImages.indexOf(e)>-1),r},Gr.prototype.eachChild=function(t){t(this.input);},Gr.prototype.outputDefined=function(){return !1},Gr.prototype.serialize=function(){return ["image",this.input.serialize()]};var _l={"to-boolean":dt,"to-color":yt,"to-number":it,"to-string":xt},ri=function(t,e){this.type=t,this.args=e;};ri.parse=function(t,e){if(t.length<2)return e.error("Expected at least one argument.");var r=t[0];if((r==="to-boolean"||r==="to-string")&&t.length!==2)return e.error("Expected one argument.");for(var a=_l[r],l=[],c=1;c<t.length;c++){var h=e.parse(t[c],c,_t);if(!h)return null;l.push(h);}return new ri(a,l)},ri.prototype.evaluate=function(t){if(this.type.kind==="boolean")return Boolean(this.args[0].evaluate(t));if(this.type.kind==="color"){for(var e,r,a=0,l=this.args;a<l.length;a+=1){if(r=null,(e=l[a].evaluate(t))instanceof ue)return e;if(typeof e=="string"){var c=t.parseColor(e);if(c)return c}else if(Array.isArray(e)&&!(r=e.length<3||e.length>4?"Invalid rbga value "+JSON.stringify(e)+": expected an array containing either three or four numeric values.":ws(e[0],e[1],e[2],e[3])))return new ue(e[0]/255,e[1]/255,e[2]/255,e[3])}throw new rr(r||"Could not parse color from value '"+(typeof e=="string"?e:String(JSON.stringify(e)))+"'")}if(this.type.kind==="number"){for(var h=null,m=0,g=this.args;m<g.length;m+=1){if((h=g[m].evaluate(t))===null)return 0;var _=Number(h);if(!isNaN(_))return _}throw new rr("Could not convert "+JSON.stringify(h)+" to number.")}return this.type.kind==="formatted"?er.fromString(jo(this.args[0].evaluate(t))):this.type.kind==="resolvedImage"?zr.fromString(jo(this.args[0].evaluate(t))):jo(this.args[0].evaluate(t))},ri.prototype.eachChild=function(t){this.args.forEach(t);},ri.prototype.outputDefined=function(){return this.args.every(function(t){return t.outputDefined()})},ri.prototype.serialize=function(){if(this.type.kind==="formatted")return new gi([{content:this.args[0],scale:null,font:null,textColor:null}]).serialize();if(this.type.kind==="resolvedImage")return new Gr(this.args[0]).serialize();var t=["to-"+this.type.kind];return this.eachChild(function(e){t.push(e.serialize());}),t};var Cu=["Unknown","Point","LineString","Polygon"],Vi=function(){this.globals=null,this.feature=null,this.featureState=null,this.formattedSection=null,this._parseColorCache={},this.availableImages=null,this.canonical=null;};Vi.prototype.id=function(){return this.feature&&"id"in this.feature?this.feature.id:null},Vi.prototype.geometryType=function(){return this.feature?typeof this.feature.type=="number"?Cu[this.feature.type]:this.feature.type:null},Vi.prototype.geometry=function(){return this.feature&&"geometry"in this.feature?this.feature.geometry:null},Vi.prototype.canonicalID=function(){return this.canonical},Vi.prototype.properties=function(){return this.feature&&this.feature.properties||{}},Vi.prototype.parseColor=function(t){var e=this._parseColorCache[t];return e||(e=this._parseColorCache[t]=ue.parse(t)),e};var ur=function(t,e,r,a){this.name=t,this.type=e,this._evaluate=r,this.args=a;};ur.prototype.evaluate=function(t){return this._evaluate(t,this.args)},ur.prototype.eachChild=function(t){this.args.forEach(t);},ur.prototype.outputDefined=function(){return !1},ur.prototype.serialize=function(){return [this.name].concat(this.args.map(function(t){return t.serialize()}))},ur.parse=function(t,e){var r,a=t[0],l=ur.definitions[a];if(!l)return e.error('Unknown expression "'+a+'". If you wanted a literal array, use ["literal", [...]].',0);for(var c=Array.isArray(l)?l[0]:l.type,h=Array.isArray(l)?[[l[1],l[2]]]:l.overloads,m=h.filter(function(Mt){var vt=Mt[0];return !Array.isArray(vt)||vt.length===t.length-1}),g=null,_=0,x=m;_<x.length;_+=1){var b=x[_],I=b[0],E=b[1];g=new tn(e.registry,e.path,null,e.scope);for(var L=[],B=!1,q=1;q<t.length;q++){var V=t[q],W=Array.isArray(I)?I[q-1]:I.type,J=g.parse(V,1+L.length,W);if(!J){B=!0;break}L.push(J);}if(!B)if(Array.isArray(I)&&I.length!==L.length)g.error("Expected "+I.length+" arguments, but found "+L.length+" instead.");else {for(var Y=0;Y<L.length;Y++){var $=Array.isArray(I)?I[Y]:I.type,nt=L[Y];g.concat(Y+1).checkSubtype($,nt.type);}if(g.errors.length===0)return new ur(a,c,E,L)}}if(m.length===1)(r=e.errors).push.apply(r,g.errors);else {for(var ut=(m.length?m:h).map(function(Mt){var vt;return vt=Mt[0],Array.isArray(vt)?"("+vt.map(re).join(", ")+")":"("+re(vt.type)+"...)"}).join(" | "),ft=[],zt=1;zt<t.length;zt++){var gt=e.parse(t[zt],1+ft.length);if(!gt)return null;ft.push(re(gt.type));}e.error("Expected arguments of type "+ut+", but found ("+ft.join(", ")+") instead.");}return null},ur.register=function(t,e){for(var r in ur.definitions=e,e)t[r]=ur;};var Ai=function(t,e,r){this.type=te,this.locale=r,this.caseSensitive=t,this.diacriticSensitive=e;};function xr(t,e){t[0]=Math.min(t[0],e[0]),t[1]=Math.min(t[1],e[1]),t[2]=Math.max(t[2],e[0]),t[3]=Math.max(t[3],e[1]);}function zn(t,e){return !(t[0]<=e[0]||t[2]>=e[2]||t[1]<=e[1]||t[3]>=e[3])}function ku(t,e){var r=(180+t[0])/360,a=(180-180/Math.PI*Math.log(Math.tan(Math.PI/4+t[1]*Math.PI/360)))/360,l=Math.pow(2,e.z);return [Math.round(r*l*8192),Math.round(a*l*8192)]}function Mu(t,e,r){return e[1]>t[1]!=r[1]>t[1]&&t[0]<(r[0]-e[0])*(t[1]-e[1])/(r[1]-e[1])+e[0]}function Ss(t,e){for(var r,a,l,c,h,m,g,_=!1,x=0,b=e.length;x<b;x++)for(var I=e[x],E=0,L=I.length;E<L-1;E++){if((c=(r=t)[0]-(a=I[E])[0])*(g=r[1]-(l=I[E+1])[1])-(m=r[0]-l[0])*(h=r[1]-a[1])==0&&c*m<=0&&h*g<=0)return !1;Mu(t,I[E],I[E+1])&&(_=!_);}return _}function Du(t,e){for(var r=0;r<e.length;r++)if(Ss(t,e[r]))return !0;return !1}function vl(t,e,r,a){var l=a[0]-r[0],c=a[1]-r[1],h=(t[0]-r[0])*c-l*(t[1]-r[1]),m=(e[0]-r[0])*c-l*(e[1]-r[1]);return h>0&&m<0||h<0&&m>0}function Lu(t,e,r){for(var a=0,l=r;a<l.length;a+=1)for(var c=l[a],h=0;h<c.length-1;++h)if((b=[(x=c[h+1])[0]-(_=c[h])[0],x[1]-_[1]])[0]*(I=[(g=e)[0]-(m=t)[0],g[1]-m[1]])[1]-b[1]*I[0]!=0&&vl(m,g,_,x)&&vl(_,x,m,g))return !0;var m,g,_,x,b,I;return !1}function xl(t,e){for(var r=0;r<t.length;++r)if(!Ss(t[r],e))return !1;for(var a=0;a<t.length-1;++a)if(Lu(t[a],t[a+1],e))return !1;return !0}function bl(t,e){for(var r=0;r<e.length;r++)if(xl(t,e[r]))return !0;return !1}function po(t,e,r){for(var a=[],l=0;l<t.length;l++){for(var c=[],h=0;h<t[l].length;h++){var m=ku(t[l][h],r);xr(e,m),c.push(m);}a.push(c);}return a}function Ts(t,e,r){for(var a=[],l=0;l<t.length;l++){var c=po(t[l],e,r);a.push(c);}return a}function qo(t,e,r,a){if(t[0]<r[0]||t[0]>r[2]){var l=.5*a,c=t[0]-r[0]>l?-a:r[0]-t[0]>l?a:0;c===0&&(c=t[0]-r[2]>l?-a:r[2]-t[0]>l?a:0),t[0]+=c;}xr(e,t);}function wl(t,e,r,a){for(var l=8192*Math.pow(2,a.z),c=[8192*a.x,8192*a.y],h=[],m=0,g=t;m<g.length;m+=1)for(var _=0,x=g[m];_<x.length;_+=1){var b=x[_],I=[b.x+c[0],b.y+c[1]];qo(I,e,r,l),h.push(I);}return h}function Ia(t,e,r,a){for(var l,c=8192*Math.pow(2,a.z),h=[8192*a.x,8192*a.y],m=[],g=0,_=t;g<_.length;g+=1){for(var x=[],b=0,I=_[g];b<I.length;b+=1){var E=I[b],L=[E.x+h[0],E.y+h[1]];xr(e,L),x.push(L);}m.push(x);}if(e[2]-e[0]<=c/2){(l=e)[0]=l[1]=1/0,l[2]=l[3]=-1/0;for(var B=0,q=m;B<q.length;B+=1)for(var V=0,W=q[B];V<W.length;V+=1)qo(W[V],e,r,c);}return m}Ai.parse=function(t,e){if(t.length!==2)return e.error("Expected one argument.");var r=t[1];if(typeof r!="object"||Array.isArray(r))return e.error("Collator options argument must be an object.");var a=e.parse(r["case-sensitive"]!==void 0&&r["case-sensitive"],1,dt);if(!a)return null;var l=e.parse(r["diacritic-sensitive"]!==void 0&&r["diacritic-sensitive"],1,dt);if(!l)return null;var c=null;return r.locale&&!(c=e.parse(r.locale,1,xt))?null:new Ai(a,l,c)},Ai.prototype.evaluate=function(t){return new Pr(this.caseSensitive.evaluate(t),this.diacriticSensitive.evaluate(t),this.locale?this.locale.evaluate(t):null)},Ai.prototype.eachChild=function(t){t(this.caseSensitive),t(this.diacriticSensitive),this.locale&&t(this.locale);},Ai.prototype.outputDefined=function(){return !1},Ai.prototype.serialize=function(){var t={};return t["case-sensitive"]=this.caseSensitive.serialize(),t["diacritic-sensitive"]=this.diacriticSensitive.serialize(),this.locale&&(t.locale=this.locale.serialize()),["collator",t]};var ii=function(t,e){this.type=dt,this.geojson=t,this.geometries=e;};function Yi(t){if(t instanceof ur){if(t.name==="get"&&t.args.length===1)return !1;if(t.name==="feature-state")return !1;if(t.name==="has"&&t.args.length===1)return !1;if(t.name==="properties"||t.name==="geometry-type"||t.name==="id")return !1;if(/^filter-/.test(t.name))return !1}if(t instanceof ii)return !1;var e=!0;return t.eachChild(function(r){e&&!Yi(r)&&(e=!1);}),e}function Qi(t){if(t instanceof ur&&t.name==="feature-state")return !1;var e=!0;return t.eachChild(function(r){e&&!Qi(r)&&(e=!1);}),e}function Cn(t,e){if(t instanceof ur&&e.indexOf(t.name)>=0)return !1;var r=!0;return t.eachChild(function(a){r&&!Cn(a,e)&&(r=!1);}),r}ii.parse=function(t,e){if(t.length!==2)return e.error("'within' expression requires exactly one argument, but found "+(t.length-1)+" instead.");if(No(t[1])){var r=t[1];if(r.type==="FeatureCollection")for(var a=0;a<r.features.length;++a){var l=r.features[a].geometry.type;if(l==="Polygon"||l==="MultiPolygon")return new ii(r,r.features[a].geometry)}else if(r.type==="Feature"){var c=r.geometry.type;if(c==="Polygon"||c==="MultiPolygon")return new ii(r,r.geometry)}else if(r.type==="Polygon"||r.type==="MultiPolygon")return new ii(r,r)}return e.error("'within' expression requires valid geojson object that contains polygon geometry type.")},ii.prototype.evaluate=function(t){if(t.geometry()!=null&&t.canonicalID()!=null){if(t.geometryType()==="Point")return function(e,r){var a=[1/0,1/0,-1/0,-1/0],l=[1/0,1/0,-1/0,-1/0],c=e.canonicalID();if(r.type==="Polygon"){var h=po(r.coordinates,l,c),m=wl(e.geometry(),a,l,c);if(!zn(a,l))return !1;for(var g=0,_=m;g<_.length;g+=1)if(!Ss(_[g],h))return !1}if(r.type==="MultiPolygon"){var x=Ts(r.coordinates,l,c),b=wl(e.geometry(),a,l,c);if(!zn(a,l))return !1;for(var I=0,E=b;I<E.length;I+=1)if(!Du(E[I],x))return !1}return !0}(t,this.geometries);if(t.geometryType()==="LineString")return function(e,r){var a=[1/0,1/0,-1/0,-1/0],l=[1/0,1/0,-1/0,-1/0],c=e.canonicalID();if(r.type==="Polygon"){var h=po(r.coordinates,l,c),m=Ia(e.geometry(),a,l,c);if(!zn(a,l))return !1;for(var g=0,_=m;g<_.length;g+=1)if(!xl(_[g],h))return !1}if(r.type==="MultiPolygon"){var x=Ts(r.coordinates,l,c),b=Ia(e.geometry(),a,l,c);if(!zn(a,l))return !1;for(var I=0,E=b;I<E.length;I+=1)if(!bl(E[I],x))return !1}return !0}(t,this.geometries)}return !1},ii.prototype.eachChild=function(){},ii.prototype.outputDefined=function(){return !0},ii.prototype.serialize=function(){return ["within",this.geojson]};var $i=function(t,e){this.type=e.type,this.name=t,this.boundExpression=e;};$i.parse=function(t,e){if(t.length!==2||typeof t[1]!="string")return e.error("'var' expression requires exactly one string literal argument.");var r=t[1];return e.scope.has(r)?new $i(r,e.scope.get(r)):e.error('Unknown variable "'+r+'". Make sure "'+r+'" has been bound in an enclosing "let" expression before using it.',1)},$i.prototype.evaluate=function(t){return this.boundExpression.evaluate(t)},$i.prototype.eachChild=function(){},$i.prototype.outputDefined=function(){return !1},$i.prototype.serialize=function(){return ["var",this.name]};var tn=function(t,e,r,a,l){e===void 0&&(e=[]),a===void 0&&(a=new It),l===void 0&&(l=[]),this.registry=t,this.path=e,this.key=e.map(function(c){return "["+c+"]"}).join(""),this.scope=a,this.errors=l,this.expectedType=r;};function Ea(t,e){for(var r,a=t.length-1,l=0,c=a,h=0;l<=c;)if((r=t[h=Math.floor((l+c)/2)])<=e){if(h===a||e<t[h+1])return h;l=h+1;}else {if(!(r>e))throw new rr("Input is not a number.");c=h-1;}return 0}tn.prototype.parse=function(t,e,r,a,l){return l===void 0&&(l={}),e?this.concat(e,r,a)._parse(t,l):this._parse(t,l)},tn.prototype._parse=function(t,e){function r(_,x,b){return b==="assert"?new Te(x,[_]):b==="coerce"?new ri(x,[_]):_}if(t!==null&&typeof t!="string"&&typeof t!="boolean"&&typeof t!="number"||(t=["literal",t]),Array.isArray(t)){if(t.length===0)return this.error('Expected an array with at least one element. If you wanted a literal array, use ["literal", []].');var a=t[0];if(typeof a!="string")return this.error("Expression name must be a string, but found "+typeof a+' instead. If you wanted a literal array, use ["literal", [...]].',0),null;var l=this.registry[a];if(l){var c=l.parse(t,this);if(!c)return null;if(this.expectedType){var h=this.expectedType,m=c.type;if(h.kind!=="string"&&h.kind!=="number"&&h.kind!=="boolean"&&h.kind!=="object"&&h.kind!=="array"||m.kind!=="value")if(h.kind!=="color"&&h.kind!=="formatted"&&h.kind!=="resolvedImage"||m.kind!=="value"&&m.kind!=="string"){if(this.checkSubtype(h,m))return null}else c=r(c,h,e.typeAnnotation||"coerce");else c=r(c,h,e.typeAnnotation||"assert");}if(!(c instanceof vr)&&c.type.kind!=="resolvedImage"&&function _(x){if(x instanceof $i)return _(x.boundExpression);if(x instanceof ur&&x.name==="error")return !1;if(x instanceof Ai)return !1;if(x instanceof ii)return !1;var b=x instanceof ri||x instanceof Te,I=!0;return x.eachChild(function(E){I=b?I&&_(E):I&&E instanceof vr;}),!!I&&Yi(x)&&Cn(x,["zoom","heatmap-density","line-progress","accumulated","is-supported-script"])}(c)){var g=new Vi;try{c=new vr(c.type,c.evaluate(g));}catch(_){return this.error(_.message),null}}return c}return this.error('Unknown expression "'+a+'". If you wanted a literal array, use ["literal", [...]].',0)}return this.error(t===void 0?"'undefined' value invalid. Use null instead.":typeof t=="object"?'Bare objects invalid. Use ["literal", {...}] instead.':"Expected an array, but found "+typeof t+" instead.")},tn.prototype.concat=function(t,e,r){var a=typeof t=="number"?this.path.concat(t):this.path,l=r?this.scope.concat(r):this.scope;return new tn(this.registry,a,e||null,l,this.errors)},tn.prototype.error=function(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];var a=""+this.key+e.map(function(l){return "["+l+"]"}).join("");this.errors.push(new st(a,t));},tn.prototype.checkSubtype=function(t,e){var r=pe(t,e);return r&&this.error(r),r};var Rr=function(t,e,r){this.type=t,this.input=e,this.labels=[],this.outputs=[];for(var a=0,l=r;a<l.length;a+=1){var c=l[a],h=c[1];this.labels.push(c[0]),this.outputs.push(h);}};function qe(t,e,r){return t*(1-r)+e*r}Rr.parse=function(t,e){if(t.length-1<4)return e.error("Expected at least 4 arguments, but found only "+(t.length-1)+".");if((t.length-1)%2!=0)return e.error("Expected an even number of arguments.");var r=e.parse(t[1],1,it);if(!r)return null;var a=[],l=null;e.expectedType&&e.expectedType.kind!=="value"&&(l=e.expectedType);for(var c=1;c<t.length;c+=2){var h=c===1?-1/0:t[c],m=t[c+1],g=c,_=c+1;if(typeof h!="number")return e.error('Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.',g);if(a.length&&a[a.length-1][0]>=h)return e.error('Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.',g);var x=e.parse(m,_,l);if(!x)return null;l=l||x.type,a.push([h,x]);}return new Rr(l,r,a)},Rr.prototype.evaluate=function(t){var e=this.labels,r=this.outputs;if(e.length===1)return r[0].evaluate(t);var a=this.input.evaluate(t);if(a<=e[0])return r[0].evaluate(t);var l=e.length;return a>=e[l-1]?r[l-1].evaluate(t):r[Ea(e,a)].evaluate(t)},Rr.prototype.eachChild=function(t){t(this.input);for(var e=0,r=this.outputs;e<r.length;e+=1)t(r[e]);},Rr.prototype.outputDefined=function(){return this.outputs.every(function(t){return t.outputDefined()})},Rr.prototype.serialize=function(){for(var t=["step",this.input.serialize()],e=0;e<this.labels.length;e++)e>0&&t.push(this.labels[e]),t.push(this.outputs[e].serialize());return t};var ho=Object.freeze({__proto__:null,number:qe,color:function(t,e,r){return new ue(qe(t.r,e.r,r),qe(t.g,e.g,r),qe(t.b,e.b,r),qe(t.a,e.a,r))},array:function(t,e,r){return t.map(function(a,l){return qe(a,e[l],r)})}}),Sl=6/29*3*(6/29),Bu=Math.PI/180,Ru=180/Math.PI;function Is(t){return t>.008856451679035631?Math.pow(t,1/3):t/Sl+4/29}function Es(t){return t>6/29?t*t*t:Sl*(t-4/29)}function As(t){return 255*(t<=.0031308?12.92*t:1.055*Math.pow(t,1/2.4)-.055)}function Ps(t){return (t/=255)<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)}function Tl(t){var e=Ps(t.r),r=Ps(t.g),a=Ps(t.b),l=Is((.4124564*e+.3575761*r+.1804375*a)/.95047),c=Is((.2126729*e+.7151522*r+.072175*a)/1);return {l:116*c-16,a:500*(l-c),b:200*(c-Is((.0193339*e+.119192*r+.9503041*a)/1.08883)),alpha:t.a}}function Il(t){var e=(t.l+16)/116,r=isNaN(t.a)?e:e+t.a/500,a=isNaN(t.b)?e:e-t.b/200;return e=1*Es(e),r=.95047*Es(r),a=1.08883*Es(a),new ue(As(3.2404542*r-1.5371385*e-.4985314*a),As(-.969266*r+1.8760108*e+.041556*a),As(.0556434*r-.2040259*e+1.0572252*a),t.alpha)}function Fu(t,e,r){var a=e-t;return t+r*(a>180||a<-180?a-360*Math.round(a/360):a)}var Zo={forward:Tl,reverse:Il,interpolate:function(t,e,r){return {l:qe(t.l,e.l,r),a:qe(t.a,e.a,r),b:qe(t.b,e.b,r),alpha:qe(t.alpha,e.alpha,r)}}},Go={forward:function(t){var e=Tl(t),r=e.l,a=e.a,l=e.b,c=Math.atan2(l,a)*Ru;return {h:c<0?c+360:c,c:Math.sqrt(a*a+l*l),l:r,alpha:t.a}},reverse:function(t){var e=t.h*Bu,r=t.c;return Il({l:t.l,a:Math.cos(e)*r,b:Math.sin(e)*r,alpha:t.alpha})},interpolate:function(t,e,r){return {h:Fu(t.h,e.h,r),c:qe(t.c,e.c,r),l:qe(t.l,e.l,r),alpha:qe(t.alpha,e.alpha,r)}}},El=Object.freeze({__proto__:null,lab:Zo,hcl:Go}),cr=function(t,e,r,a,l){this.type=t,this.operator=e,this.interpolation=r,this.input=a,this.labels=[],this.outputs=[];for(var c=0,h=l;c<h.length;c+=1){var m=h[c],g=m[1];this.labels.push(m[0]),this.outputs.push(g);}};function zs(t,e,r,a){var l=a-r,c=t-r;return l===0?0:e===1?c/l:(Math.pow(e,c)-1)/(Math.pow(e,l)-1)}cr.interpolationFactor=function(t,e,r,a){var l=0;if(t.name==="exponential")l=zs(e,t.base,r,a);else if(t.name==="linear")l=zs(e,1,r,a);else if(t.name==="cubic-bezier"){var c=t.controlPoints;l=new ct(c[0],c[1],c[2],c[3]).solve(zs(e,1,r,a));}return l},cr.parse=function(t,e){var r=t[0],a=t[1],l=t[2],c=t.slice(3);if(!Array.isArray(a)||a.length===0)return e.error("Expected an interpolation type expression.",1);if(a[0]==="linear")a={name:"linear"};else if(a[0]==="exponential"){var h=a[1];if(typeof h!="number")return e.error("Exponential interpolation requires a numeric base.",1,1);a={name:"exponential",base:h};}else {if(a[0]!=="cubic-bezier")return e.error("Unknown interpolation type "+String(a[0]),1,0);var m=a.slice(1);if(m.length!==4||m.some(function(q){return typeof q!="number"||q<0||q>1}))return e.error("Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.",1);a={name:"cubic-bezier",controlPoints:m};}if(t.length-1<4)return e.error("Expected at least 4 arguments, but found only "+(t.length-1)+".");if((t.length-1)%2!=0)return e.error("Expected an even number of arguments.");if(!(l=e.parse(l,2,it)))return null;var g=[],_=null;r==="interpolate-hcl"||r==="interpolate-lab"?_=yt:e.expectedType&&e.expectedType.kind!=="value"&&(_=e.expectedType);for(var x=0;x<c.length;x+=2){var b=c[x],I=c[x+1],E=x+3,L=x+4;if(typeof b!="number")return e.error('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.',E);if(g.length&&g[g.length-1][0]>=b)return e.error('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.',E);var B=e.parse(I,L,_);if(!B)return null;_=_||B.type,g.push([b,B]);}return _.kind==="number"||_.kind==="color"||_.kind==="array"&&_.itemType.kind==="number"&&typeof _.N=="number"?new cr(_,r,a,l,g):e.error("Type "+re(_)+" is not interpolatable.")},cr.prototype.evaluate=function(t){var e=this.labels,r=this.outputs;if(e.length===1)return r[0].evaluate(t);var a=this.input.evaluate(t);if(a<=e[0])return r[0].evaluate(t);var l=e.length;if(a>=e[l-1])return r[l-1].evaluate(t);var c=Ea(e,a),h=cr.interpolationFactor(this.interpolation,a,e[c],e[c+1]),m=r[c].evaluate(t),g=r[c+1].evaluate(t);return this.operator==="interpolate"?ho[this.type.kind.toLowerCase()](m,g,h):this.operator==="interpolate-hcl"?Go.reverse(Go.interpolate(Go.forward(m),Go.forward(g),h)):Zo.reverse(Zo.interpolate(Zo.forward(m),Zo.forward(g),h))},cr.prototype.eachChild=function(t){t(this.input);for(var e=0,r=this.outputs;e<r.length;e+=1)t(r[e]);},cr.prototype.outputDefined=function(){return this.outputs.every(function(t){return t.outputDefined()})},cr.prototype.serialize=function(){var t;t=this.interpolation.name==="linear"?["linear"]:this.interpolation.name==="exponential"?this.interpolation.base===1?["linear"]:["exponential",this.interpolation.base]:["cubic-bezier"].concat(this.interpolation.controlPoints);for(var e=[this.operator,t,this.input.serialize()],r=0;r<this.labels.length;r++)e.push(this.labels[r],this.outputs[r].serialize());return e};var en=function(t,e){this.type=t,this.args=e;};en.parse=function(t,e){if(t.length<2)return e.error("Expectected at least one argument.");var r=null,a=e.expectedType;a&&a.kind!=="value"&&(r=a);for(var l=[],c=0,h=t.slice(1);c<h.length;c+=1){var m=e.parse(h[c],1+l.length,r,void 0,{typeAnnotation:"omit"});if(!m)return null;r=r||m.type,l.push(m);}var g=a&&l.some(function(_){return pe(a,_.type)});return new en(g?_t:r,l)},en.prototype.evaluate=function(t){for(var e,r=null,a=0,l=0,c=this.args;l<c.length&&(a++,(r=c[l].evaluate(t))&&r instanceof zr&&!r.available&&(e||(e=r.name),r=null,a===this.args.length&&(r=e)),r===null);l+=1);return r},en.prototype.eachChild=function(t){this.args.forEach(t);},en.prototype.outputDefined=function(){return this.args.every(function(t){return t.outputDefined()})},en.prototype.serialize=function(){var t=["coalesce"];return this.eachChild(function(e){t.push(e.serialize());}),t};var rn=function(t,e){this.type=e.type,this.bindings=[].concat(t),this.result=e;};rn.prototype.evaluate=function(t){return this.result.evaluate(t)},rn.prototype.eachChild=function(t){for(var e=0,r=this.bindings;e<r.length;e+=1)t(r[e][1]);t(this.result);},rn.parse=function(t,e){if(t.length<4)return e.error("Expected at least 3 arguments, but found "+(t.length-1)+" instead.");for(var r=[],a=1;a<t.length-1;a+=2){var l=t[a];if(typeof l!="string")return e.error("Expected string, but found "+typeof l+" instead.",a);if(/[^a-zA-Z0-9_]/.test(l))return e.error("Variable names must contain only alphanumeric characters or '_'.",a);var c=e.parse(t[a+1],a+1);if(!c)return null;r.push([l,c]);}var h=e.parse(t[t.length-1],t.length-1,e.expectedType,r);return h?new rn(r,h):null},rn.prototype.outputDefined=function(){return this.result.outputDefined()},rn.prototype.serialize=function(){for(var t=["let"],e=0,r=this.bindings;e<r.length;e+=1){var a=r[e];t.push(a[0],a[1].serialize());}return t.push(this.result.serialize()),t};var kn=function(t,e,r){this.type=t,this.index=e,this.input=r;};kn.parse=function(t,e){if(t.length!==3)return e.error("Expected 2 arguments, but found "+(t.length-1)+" instead.");var r=e.parse(t[1],1,it),a=e.parse(t[2],2,le(e.expectedType||_t));return r&&a?new kn(a.type.itemType,r,a):null},kn.prototype.evaluate=function(t){var e=this.index.evaluate(t),r=this.input.evaluate(t);if(e<0)throw new rr("Array index out of bounds: "+e+" < 0.");if(e>=r.length)throw new rr("Array index out of bounds: "+e+" > "+(r.length-1)+".");if(e!==Math.floor(e))throw new rr("Array index must be an integer, but found "+e+" instead.");return r[e]},kn.prototype.eachChild=function(t){t(this.index),t(this.input);},kn.prototype.outputDefined=function(){return !1},kn.prototype.serialize=function(){return ["at",this.index.serialize(),this.input.serialize()]};var Mn=function(t,e){this.type=dt,this.needle=t,this.haystack=e;};Mn.parse=function(t,e){if(t.length!==3)return e.error("Expected 2 arguments, but found "+(t.length-1)+" instead.");var r=e.parse(t[1],1,_t),a=e.parse(t[2],2,_t);return r&&a?Fe(r.type,[dt,xt,it,St,_t])?new Mn(r,a):e.error("Expected first argument to be of type boolean, string, number or null, but found "+re(r.type)+" instead"):null},Mn.prototype.evaluate=function(t){var e=this.needle.evaluate(t),r=this.haystack.evaluate(t);if(!r)return !1;if(!de(e,["boolean","string","number","null"]))throw new rr("Expected first argument to be of type boolean, string, number or null, but found "+re(Oe(e))+" instead.");if(!de(r,["string","array"]))throw new rr("Expected second argument to be of type array or string, but found "+re(Oe(r))+" instead.");return r.indexOf(e)>=0},Mn.prototype.eachChild=function(t){t(this.needle),t(this.haystack);},Mn.prototype.outputDefined=function(){return !0},Mn.prototype.serialize=function(){return ["in",this.needle.serialize(),this.haystack.serialize()]};var nn=function(t,e,r){this.type=it,this.needle=t,this.haystack=e,this.fromIndex=r;};nn.parse=function(t,e){if(t.length<=2||t.length>=5)return e.error("Expected 3 or 4 arguments, but found "+(t.length-1)+" instead.");var r=e.parse(t[1],1,_t),a=e.parse(t[2],2,_t);if(!r||!a)return null;if(!Fe(r.type,[dt,xt,it,St,_t]))return e.error("Expected first argument to be of type boolean, string, number or null, but found "+re(r.type)+" instead");if(t.length===4){var l=e.parse(t[3],3,it);return l?new nn(r,a,l):null}return new nn(r,a)},nn.prototype.evaluate=function(t){var e=this.needle.evaluate(t),r=this.haystack.evaluate(t);if(!de(e,["boolean","string","number","null"]))throw new rr("Expected first argument to be of type boolean, string, number or null, but found "+re(Oe(e))+" instead.");if(!de(r,["string","array"]))throw new rr("Expected second argument to be of type array or string, but found "+re(Oe(r))+" instead.");if(this.fromIndex){var a=this.fromIndex.evaluate(t);return r.indexOf(e,a)}return r.indexOf(e)},nn.prototype.eachChild=function(t){t(this.needle),t(this.haystack),this.fromIndex&&t(this.fromIndex);},nn.prototype.outputDefined=function(){return !1},nn.prototype.serialize=function(){if(this.fromIndex!=null&&this.fromIndex!==void 0){var t=this.fromIndex.serialize();return ["index-of",this.needle.serialize(),this.haystack.serialize(),t]}return ["index-of",this.needle.serialize(),this.haystack.serialize()]};var Dn=function(t,e,r,a,l,c){this.inputType=t,this.type=e,this.input=r,this.cases=a,this.outputs=l,this.otherwise=c;};Dn.parse=function(t,e){if(t.length<5)return e.error("Expected at least 4 arguments, but found only "+(t.length-1)+".");if(t.length%2!=1)return e.error("Expected an even number of arguments.");var r,a;e.expectedType&&e.expectedType.kind!=="value"&&(a=e.expectedType);for(var l={},c=[],h=2;h<t.length-1;h+=2){var m=t[h],g=t[h+1];Array.isArray(m)||(m=[m]);var _=e.concat(h);if(m.length===0)return _.error("Expected at least one branch label.");for(var x=0,b=m;x<b.length;x+=1){var I=b[x];if(typeof I!="number"&&typeof I!="string")return _.error("Branch labels must be numbers or strings.");if(typeof I=="number"&&Math.abs(I)>Number.MAX_SAFE_INTEGER)return _.error("Branch labels must be integers no larger than "+Number.MAX_SAFE_INTEGER+".");if(typeof I=="number"&&Math.floor(I)!==I)return _.error("Numeric branch labels must be integer values.");if(r){if(_.checkSubtype(r,Oe(I)))return null}else r=Oe(I);if(l[String(I)]!==void 0)return _.error("Branch labels must be unique.");l[String(I)]=c.length;}var E=e.parse(g,h,a);if(!E)return null;a=a||E.type,c.push(E);}var L=e.parse(t[1],1,_t);if(!L)return null;var B=e.parse(t[t.length-1],t.length-1,a);return B?L.type.kind!=="value"&&e.concat(1).checkSubtype(r,L.type)?null:new Dn(r,a,L,l,c,B):null},Dn.prototype.evaluate=function(t){var e=this.input.evaluate(t);return (Oe(e)===this.inputType&&this.outputs[this.cases[e]]||this.otherwise).evaluate(t)},Dn.prototype.eachChild=function(t){t(this.input),this.outputs.forEach(t),t(this.otherwise);},Dn.prototype.outputDefined=function(){return this.outputs.every(function(t){return t.outputDefined()})&&this.otherwise.outputDefined()},Dn.prototype.serialize=function(){for(var t=this,e=["match",this.input.serialize()],r=[],a={},l=0,c=Object.keys(this.cases).sort();l<c.length;l+=1){var h=c[l];(b=a[this.cases[h]])===void 0?(a[this.cases[h]]=r.length,r.push([this.cases[h],[h]])):r[b][1].push(h);}for(var m=function(E){return t.inputType.kind==="number"?Number(E):E},g=0,_=r;g<_.length;g+=1){var x=_[g],b=x[0],I=x[1];e.push(I.length===1?m(I[0]):I.map(m)),e.push(this.outputs[outputIndex$1].serialize());}return e.push(this.otherwise.serialize()),e};var Ln=function(t,e,r){this.type=t,this.branches=e,this.otherwise=r;};Ln.parse=function(t,e){if(t.length<4)return e.error("Expected at least 3 arguments, but found only "+(t.length-1)+".");if(t.length%2!=0)return e.error("Expected an odd number of arguments.");var r;e.expectedType&&e.expectedType.kind!=="value"&&(r=e.expectedType);for(var a=[],l=1;l<t.length-1;l+=2){var c=e.parse(t[l],l,dt);if(!c)return null;var h=e.parse(t[l+1],l+1,r);if(!h)return null;a.push([c,h]),r=r||h.type;}var m=e.parse(t[t.length-1],t.length-1,r);return m?new Ln(r,a,m):null},Ln.prototype.evaluate=function(t){for(var e=0,r=this.branches;e<r.length;e+=1){var a=r[e],l=a[1];if(a[0].evaluate(t))return l.evaluate(t)}return this.otherwise.evaluate(t)},Ln.prototype.eachChild=function(t){for(var e=0,r=this.branches;e<r.length;e+=1){var a=r[e],l=a[1];t(a[0]),t(l);}t(this.otherwise);},Ln.prototype.outputDefined=function(){return this.branches.every(function(t){return t[1].outputDefined()})&&this.otherwise.outputDefined()},Ln.prototype.serialize=function(){var t=["case"];return this.eachChild(function(e){t.push(e.serialize());}),t};var on=function(t,e,r,a){this.type=t,this.input=e,this.beginIndex=r,this.endIndex=a;};function Al(t,e){return t==="=="||t==="!="?e.kind==="boolean"||e.kind==="string"||e.kind==="number"||e.kind==="null"||e.kind==="value":e.kind==="string"||e.kind==="number"||e.kind==="value"}function Pl(t,e,r,a){return a.compare(e,r)===0}function _e(t,e,r){var a=t!=="=="&&t!=="!=";return function(){function l(c,h,m){this.type=dt,this.lhs=c,this.rhs=h,this.collator=m,this.hasUntypedArgument=c.type.kind==="value"||h.type.kind==="value";}return l.parse=function(c,h){if(c.length!==3&&c.length!==4)return h.error("Expected two or three arguments.");var m=c[0],g=h.parse(c[1],1,_t);if(!g)return null;if(!Al(m,g.type))return h.concat(1).error('"'+m+`" comparisons are not supported for type '`+re(g.type)+"'.");var _=h.parse(c[2],2,_t);if(!_)return null;if(!Al(m,_.type))return h.concat(2).error('"'+m+`" comparisons are not supported for type '`+re(_.type)+"'.");if(g.type.kind!==_.type.kind&&g.type.kind!=="value"&&_.type.kind!=="value")return h.error("Cannot compare types '"+re(g.type)+"' and '"+re(_.type)+"'.");a&&(g.type.kind==="value"&&_.type.kind!=="value"?g=new Te(_.type,[g]):g.type.kind!=="value"&&_.type.kind==="value"&&(_=new Te(g.type,[_])));var x=null;if(c.length===4){if(g.type.kind!=="string"&&_.type.kind!=="string"&&g.type.kind!=="value"&&_.type.kind!=="value")return h.error("Cannot use collator to compare non-string types.");if(!(x=h.parse(c[3],3,te)))return null}return new l(g,_,x)},l.prototype.evaluate=function(c){var h=this.lhs.evaluate(c),m=this.rhs.evaluate(c);if(a&&this.hasUntypedArgument){var g=Oe(h),_=Oe(m);if(g.kind!==_.kind||g.kind!=="string"&&g.kind!=="number")throw new rr('Expected arguments for "'+t+'" to be (string, string) or (number, number), but found ('+g.kind+", "+_.kind+") instead.")}if(this.collator&&!a&&this.hasUntypedArgument){var x=Oe(h),b=Oe(m);if(x.kind!=="string"||b.kind!=="string")return e(c,h,m)}return this.collator?r(c,h,m,this.collator.evaluate(c)):e(c,h,m)},l.prototype.eachChild=function(c){c(this.lhs),c(this.rhs),this.collator&&c(this.collator);},l.prototype.outputDefined=function(){return !0},l.prototype.serialize=function(){var c=[t];return this.eachChild(function(h){c.push(h.serialize());}),c},l}()}on.parse=function(t,e){if(t.length<=2||t.length>=5)return e.error("Expected 3 or 4 arguments, but found "+(t.length-1)+" instead.");var r=e.parse(t[1],1,_t),a=e.parse(t[2],2,it);if(!r||!a)return null;if(!Fe(r.type,[le(_t),xt,_t]))return e.error("Expected first argument to be of type array or string, but found "+re(r.type)+" instead");if(t.length===4){var l=e.parse(t[3],3,it);return l?new on(r.type,r,a,l):null}return new on(r.type,r,a)},on.prototype.evaluate=function(t){var e=this.input.evaluate(t),r=this.beginIndex.evaluate(t);if(!de(e,["string","array"]))throw new rr("Expected first argument to be of type array or string, but found "+re(Oe(e))+" instead.");if(this.endIndex){var a=this.endIndex.evaluate(t);return e.slice(r,a)}return e.slice(r)},on.prototype.eachChild=function(t){t(this.input),t(this.beginIndex),this.endIndex&&t(this.endIndex);},on.prototype.outputDefined=function(){return !1},on.prototype.serialize=function(){if(this.endIndex!=null&&this.endIndex!==void 0){var t=this.endIndex.serialize();return ["slice",this.input.serialize(),this.beginIndex.serialize(),t]}return ["slice",this.input.serialize(),this.beginIndex.serialize()]};var Ou=_e("==",function(t,e,r){return e===r},Pl),Aa=_e("!=",function(t,e,r){return e!==r},function(t,e,r,a){return !Pl(0,e,r,a)}),zl=_e("<",function(t,e,r){return e<r},function(t,e,r,a){return a.compare(e,r)<0}),Cl=_e(">",function(t,e,r){return e>r},function(t,e,r,a){return a.compare(e,r)>0}),kl=_e("<=",function(t,e,r){return e<=r},function(t,e,r,a){return a.compare(e,r)<=0}),Ml=_e(">=",function(t,e,r){return e>=r},function(t,e,r,a){return a.compare(e,r)>=0}),Bn=function(t,e,r,a,l){this.type=xt,this.number=t,this.locale=e,this.currency=r,this.minFractionDigits=a,this.maxFractionDigits=l;};Bn.parse=function(t,e){if(t.length!==3)return e.error("Expected two arguments.");var r=e.parse(t[1],1,it);if(!r)return null;var a=t[2];if(typeof a!="object"||Array.isArray(a))return e.error("NumberFormat options argument must be an object.");var l=null;if(a.locale&&!(l=e.parse(a.locale,1,xt)))return null;var c=null;if(a.currency&&!(c=e.parse(a.currency,1,xt)))return null;var h=null;if(a["min-fraction-digits"]&&!(h=e.parse(a["min-fraction-digits"],1,it)))return null;var m=null;return a["max-fraction-digits"]&&!(m=e.parse(a["max-fraction-digits"],1,it))?null:new Bn(r,l,c,h,m)},Bn.prototype.evaluate=function(t){return new Intl.NumberFormat(this.locale?this.locale.evaluate(t):[],{style:this.currency?"currency":"decimal",currency:this.currency?this.currency.evaluate(t):void 0,minimumFractionDigits:this.minFractionDigits?this.minFractionDigits.evaluate(t):void 0,maximumFractionDigits:this.maxFractionDigits?this.maxFractionDigits.evaluate(t):void 0}).format(this.number.evaluate(t))},Bn.prototype.eachChild=function(t){t(this.number),this.locale&&t(this.locale),this.currency&&t(this.currency),this.minFractionDigits&&t(this.minFractionDigits),this.maxFractionDigits&&t(this.maxFractionDigits);},Bn.prototype.outputDefined=function(){return !1},Bn.prototype.serialize=function(){var t={};return this.locale&&(t.locale=this.locale.serialize()),this.currency&&(t.currency=this.currency.serialize()),this.minFractionDigits&&(t["min-fraction-digits"]=this.minFractionDigits.serialize()),this.maxFractionDigits&&(t["max-fraction-digits"]=this.maxFractionDigits.serialize()),["number-format",this.number.serialize(),t]};var an=function(t){this.type=it,this.input=t;};an.parse=function(t,e){if(t.length!==2)return e.error("Expected 1 argument, but found "+(t.length-1)+" instead.");var r=e.parse(t[1],1);return r?r.type.kind!=="array"&&r.type.kind!=="string"&&r.type.kind!=="value"?e.error("Expected argument of type string or array, but found "+re(r.type)+" instead."):new an(r):null},an.prototype.evaluate=function(t){var e=this.input.evaluate(t);if(typeof e=="string")return e.length;if(Array.isArray(e))return e.length;throw new rr("Expected value to be of type string or array, but found "+re(Oe(e))+" instead.")},an.prototype.eachChild=function(t){t(this.input);},an.prototype.outputDefined=function(){return !1},an.prototype.serialize=function(){var t=["length"];return this.eachChild(function(e){t.push(e.serialize());}),t};var Rn={"==":Ou,"!=":Aa,">":Cl,"<":zl,">=":Ml,"<=":kl,array:Te,at:kn,boolean:Te,case:Ln,coalesce:en,collator:Ai,format:gi,image:Gr,in:Mn,"index-of":nn,interpolate:cr,"interpolate-hcl":cr,"interpolate-lab":cr,length:an,let:rn,literal:vr,match:Dn,number:Te,"number-format":Bn,object:Te,slice:on,step:Rr,string:Te,"to-boolean":ri,"to-color":ri,"to-number":ri,"to-string":ri,var:$i,within:ii};function Dl(t,e){var r=e[0],a=e[1],l=e[2],c=e[3];r=r.evaluate(t),a=a.evaluate(t),l=l.evaluate(t);var h=c?c.evaluate(t):1,m=ws(r,a,l,h);if(m)throw new rr(m);return new ue(r/255*h,a/255*h,l/255*h,h)}function Ll(t,e){return t in e}function Cs(t,e){var r=e[t];return r===void 0?null:r}function Fn(t){return {type:t}}function Bl(t){return {result:"success",value:t}}function On(t){return {result:"error",value:t}}function Un(t){return t["property-type"]==="data-driven"||t["property-type"]==="cross-faded-data-driven"}function Rl(t){return !!t.expression&&t.expression.parameters.indexOf("zoom")>-1}function Xo(t){return !!t.expression&&t.expression.interpolated}function xe(t){return t instanceof Number?"number":t instanceof String?"string":t instanceof Boolean?"boolean":Array.isArray(t)?"array":t===null?"null":typeof t}function Pa(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}function Uu(t){return t}function fo(t,e,r){return t!==void 0?t:e!==void 0?e:r!==void 0?r:void 0}function Fl(t,e,r,a,l){return fo(typeof r===l?a[r]:void 0,t.default,e.default)}function Vu(t,e,r){if(xe(r)!=="number")return fo(t.default,e.default);var a=t.stops.length;if(a===1)return t.stops[0][1];if(r<=t.stops[0][0])return t.stops[0][1];if(r>=t.stops[a-1][0])return t.stops[a-1][1];var l=Ea(t.stops.map(function(c){return c[0]}),r);return t.stops[l][1]}function Ol(t,e,r){var a=t.base!==void 0?t.base:1;if(xe(r)!=="number")return fo(t.default,e.default);var l=t.stops.length;if(l===1)return t.stops[0][1];if(r<=t.stops[0][0])return t.stops[0][1];if(r>=t.stops[l-1][0])return t.stops[l-1][1];var c=Ea(t.stops.map(function(b){return b[0]}),r),h=function(b,I,E,L){var B=L-E,q=b-E;return B===0?0:I===1?q/B:(Math.pow(I,q)-1)/(Math.pow(I,B)-1)}(r,a,t.stops[c][0],t.stops[c+1][0]),m=t.stops[c][1],g=t.stops[c+1][1],_=ho[e.type]||Uu;if(t.colorSpace&&t.colorSpace!=="rgb"){var x=El[t.colorSpace];_=function(b,I){return x.reverse(x.interpolate(x.forward(b),x.forward(I),h))};}return typeof m.evaluate=="function"?{evaluate:function(){for(var b=[],I=arguments.length;I--;)b[I]=arguments[I];var E=m.evaluate.apply(void 0,b),L=g.evaluate.apply(void 0,b);if(E!==void 0&&L!==void 0)return _(E,L,h)}}:_(m,g,h)}function za(t,e,r){return e.type==="color"?r=ue.parse(r):e.type==="formatted"?r=er.fromString(r.toString()):e.type==="resolvedImage"?r=zr.fromString(r.toString()):xe(r)===e.type||e.type==="enum"&&e.values[r]||(r=void 0),fo(r,t.default,e.default)}ur.register(Rn,{error:[{kind:"error"},[xt],function(t,e){throw new rr(e[0].evaluate(t))}],typeof:[xt,[_t],function(t,e){return re(Oe(e[0].evaluate(t)))}],"to-rgba":[le(it,4),[yt],function(t,e){return e[0].evaluate(t).toArray()}],rgb:[yt,[it,it,it],Dl],rgba:[yt,[it,it,it,it],Dl],has:{type:dt,overloads:[[[xt],function(t,e){return Ll(e[0].evaluate(t),t.properties())}],[[xt,Wt],function(t,e){var r=e[1];return Ll(e[0].evaluate(t),r.evaluate(t))}]]},get:{type:_t,overloads:[[[xt],function(t,e){return Cs(e[0].evaluate(t),t.properties())}],[[xt,Wt],function(t,e){var r=e[1];return Cs(e[0].evaluate(t),r.evaluate(t))}]]},"feature-state":[_t,[xt],function(t,e){return Cs(e[0].evaluate(t),t.featureState||{})}],properties:[Wt,[],function(t){return t.properties()}],"geometry-type":[xt,[],function(t){return t.geometryType()}],id:[_t,[],function(t){return t.id()}],zoom:[it,[],function(t){return t.globals.zoom}],"heatmap-density":[it,[],function(t){return t.globals.heatmapDensity||0}],"line-progress":[it,[],function(t){return t.globals.lineProgress||0}],accumulated:[_t,[],function(t){return t.globals.accumulated===void 0?null:t.globals.accumulated}],"+":[it,Fn(it),function(t,e){for(var r=0,a=0,l=e;a<l.length;a+=1)r+=l[a].evaluate(t);return r}],"*":[it,Fn(it),function(t,e){for(var r=1,a=0,l=e;a<l.length;a+=1)r*=l[a].evaluate(t);return r}],"-":{type:it,overloads:[[[it,it],function(t,e){var r=e[1];return e[0].evaluate(t)-r.evaluate(t)}],[[it],function(t,e){return -e[0].evaluate(t)}]]},"/":[it,[it,it],function(t,e){var r=e[1];return e[0].evaluate(t)/r.evaluate(t)}],"%":[it,[it,it],function(t,e){var r=e[1];return e[0].evaluate(t)%r.evaluate(t)}],ln2:[it,[],function(){return Math.LN2}],pi:[it,[],function(){return Math.PI}],e:[it,[],function(){return Math.E}],"^":[it,[it,it],function(t,e){var r=e[1];return Math.pow(e[0].evaluate(t),r.evaluate(t))}],sqrt:[it,[it],function(t,e){return Math.sqrt(e[0].evaluate(t))}],log10:[it,[it],function(t,e){return Math.log(e[0].evaluate(t))/Math.LN10}],ln:[it,[it],function(t,e){return Math.log(e[0].evaluate(t))}],log2:[it,[it],function(t,e){return Math.log(e[0].evaluate(t))/Math.LN2}],sin:[it,[it],function(t,e){return Math.sin(e[0].evaluate(t))}],cos:[it,[it],function(t,e){return Math.cos(e[0].evaluate(t))}],tan:[it,[it],function(t,e){return Math.tan(e[0].evaluate(t))}],asin:[it,[it],function(t,e){return Math.asin(e[0].evaluate(t))}],acos:[it,[it],function(t,e){return Math.acos(e[0].evaluate(t))}],atan:[it,[it],function(t,e){return Math.atan(e[0].evaluate(t))}],min:[it,Fn(it),function(t,e){return Math.min.apply(Math,e.map(function(r){return r.evaluate(t)}))}],max:[it,Fn(it),function(t,e){return Math.max.apply(Math,e.map(function(r){return r.evaluate(t)}))}],abs:[it,[it],function(t,e){return Math.abs(e[0].evaluate(t))}],round:[it,[it],function(t,e){var r=e[0].evaluate(t);return r<0?-Math.round(-r):Math.round(r)}],floor:[it,[it],function(t,e){return Math.floor(e[0].evaluate(t))}],ceil:[it,[it],function(t,e){return Math.ceil(e[0].evaluate(t))}],"filter-==":[dt,[xt,_t],function(t,e){var r=e[0],a=e[1];return t.properties()[r.value]===a.value}],"filter-id-==":[dt,[_t],function(t,e){var r=e[0];return t.id()===r.value}],"filter-type-==":[dt,[xt],function(t,e){var r=e[0];return t.geometryType()===r.value}],"filter-<":[dt,[xt,_t],function(t,e){var r=e[0],a=e[1],l=t.properties()[r.value],c=a.value;return typeof l==typeof c&&l<c}],"filter-id-<":[dt,[_t],function(t,e){var r=e[0],a=t.id(),l=r.value;return typeof a==typeof l&&a<l}],"filter->":[dt,[xt,_t],function(t,e){var r=e[0],a=e[1],l=t.properties()[r.value],c=a.value;return typeof l==typeof c&&l>c}],"filter-id->":[dt,[_t],function(t,e){var r=e[0],a=t.id(),l=r.value;return typeof a==typeof l&&a>l}],"filter-<=":[dt,[xt,_t],function(t,e){var r=e[0],a=e[1],l=t.properties()[r.value],c=a.value;return typeof l==typeof c&&l<=c}],"filter-id-<=":[dt,[_t],function(t,e){var r=e[0],a=t.id(),l=r.value;return typeof a==typeof l&&a<=l}],"filter->=":[dt,[xt,_t],function(t,e){var r=e[0],a=e[1],l=t.properties()[r.value],c=a.value;return typeof l==typeof c&&l>=c}],"filter-id->=":[dt,[_t],function(t,e){var r=e[0],a=t.id(),l=r.value;return typeof a==typeof l&&a>=l}],"filter-has":[dt,[_t],function(t,e){return e[0].value in t.properties()}],"filter-has-id":[dt,[],function(t){return t.id()!==null&&t.id()!==void 0}],"filter-type-in":[dt,[le(xt)],function(t,e){return e[0].value.indexOf(t.geometryType())>=0}],"filter-id-in":[dt,[le(_t)],function(t,e){return e[0].value.indexOf(t.id())>=0}],"filter-in-small":[dt,[xt,le(_t)],function(t,e){var r=e[0];return e[1].value.indexOf(t.properties()[r.value])>=0}],"filter-in-large":[dt,[xt,le(_t)],function(t,e){var r=e[0],a=e[1];return function(l,c,h,m){for(;h<=m;){var g=h+m>>1;if(c[g]===l)return !0;c[g]>l?m=g-1:h=g+1;}return !1}(t.properties()[r.value],a.value,0,a.value.length-1)}],all:{type:dt,overloads:[[[dt,dt],function(t,e){var r=e[1];return e[0].evaluate(t)&&r.evaluate(t)}],[Fn(dt),function(t,e){for(var r=0,a=e;r<a.length;r+=1)if(!a[r].evaluate(t))return !1;return !0}]]},any:{type:dt,overloads:[[[dt,dt],function(t,e){var r=e[1];return e[0].evaluate(t)||r.evaluate(t)}],[Fn(dt),function(t,e){for(var r=0,a=e;r<a.length;r+=1)if(a[r].evaluate(t))return !0;return !1}]]},"!":[dt,[dt],function(t,e){return !e[0].evaluate(t)}],"is-supported-script":[dt,[xt],function(t,e){var r=t.globals&&t.globals.isSupportedScript;return !r||r(e[0].evaluate(t))}],upcase:[xt,[xt],function(t,e){return e[0].evaluate(t).toUpperCase()}],downcase:[xt,[xt],function(t,e){return e[0].evaluate(t).toLowerCase()}],concat:[xt,Fn(_t),function(t,e){return e.map(function(r){return jo(r.evaluate(t))}).join("")}],"resolved-locale":[xt,[te],function(t,e){return e[0].evaluate(t).resolvedLocale()}]});var mo=function(t,e){this.expression=t,this._warningHistory={},this._evaluator=new Vi,this._defaultValue=e?function(r){return r.type==="color"&&Pa(r.default)?new ue(0,0,0,0):r.type==="color"?ue.parse(r.default)||null:r.default===void 0?null:r.default}(e):null,this._enumValues=e&&e.type==="enum"?e.values:null;};function Wo(t){return Array.isArray(t)&&t.length>0&&typeof t[0]=="string"&&t[0]in Rn}function Ca(t,e){var r=new tn(Rn,[],e?function(l){var c={color:yt,string:xt,number:it,enum:xt,boolean:dt,formatted:ge,resolvedImage:Ht};return l.type==="array"?le(c[l.value]||_t,l.length):c[l.type]}(e):void 0),a=r.parse(t,void 0,void 0,void 0,e&&e.type==="string"?{typeAnnotation:"coerce"}:void 0);return a?Bl(new mo(a,e)):On(r.errors)}mo.prototype.evaluateWithoutErrorHandling=function(t,e,r,a,l,c){return this._evaluator.globals=t,this._evaluator.feature=e,this._evaluator.featureState=r,this._evaluator.canonical=a,this._evaluator.availableImages=l||null,this._evaluator.formattedSection=c,this.expression.evaluate(this._evaluator)},mo.prototype.evaluate=function(t,e,r,a,l,c){this._evaluator.globals=t,this._evaluator.feature=e||null,this._evaluator.featureState=r||null,this._evaluator.canonical=a,this._evaluator.availableImages=l||null,this._evaluator.formattedSection=c||null;try{var h=this.expression.evaluate(this._evaluator);if(h==null||typeof h=="number"&&h!=h)return this._defaultValue;if(this._enumValues&&!(h in this._enumValues))throw new rr("Expected value to be one of "+Object.keys(this._enumValues).map(function(m){return JSON.stringify(m)}).join(", ")+", but found "+JSON.stringify(h)+" instead.");return h}catch(m){return this._warningHistory[m.message]||(this._warningHistory[m.message]=!0,typeof console!="undefined"&&console.warn(m.message)),this._defaultValue}};var Ko=function(t,e){this.kind=t,this._styleExpression=e,this.isStateDependent=t!=="constant"&&!Qi(e.expression);};Ko.prototype.evaluateWithoutErrorHandling=function(t,e,r,a,l,c){return this._styleExpression.evaluateWithoutErrorHandling(t,e,r,a,l,c)},Ko.prototype.evaluate=function(t,e,r,a,l,c){return this._styleExpression.evaluate(t,e,r,a,l,c)};var yo=function(t,e,r,a){this.kind=t,this.zoomStops=r,this._styleExpression=e,this.isStateDependent=t!=="camera"&&!Qi(e.expression),this.interpolationType=a;};function Ul(t,e){if((t=Ca(t,e)).result==="error")return t;var r=t.value.expression,a=Yi(r);if(!a&&!Un(e))return On([new st("","data expressions not supported")]);var l=Cn(r,["zoom"]);if(!l&&!Rl(e))return On([new st("","zoom expressions not supported")]);var c=function h(m){var g=null;if(m instanceof rn)g=h(m.result);else if(m instanceof en)for(var _=0,x=m.args;_<x.length&&!(g=h(x[_]));_+=1);else (m instanceof Rr||m instanceof cr)&&m.input instanceof ur&&m.input.name==="zoom"&&(g=m);return g instanceof st||m.eachChild(function(b){var I=h(b);I instanceof st?g=I:!g&&I?g=new st("",'"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.'):g&&I&&g!==I&&(g=new st("",'Only one zoom-based "step" or "interpolate" subexpression may be used in an expression.'));}),g}(r);return c||l?c instanceof st?On([c]):c instanceof cr&&!Xo(e)?On([new st("",'"interpolate" expressions cannot be used with this property')]):Bl(c?new yo(a?"camera":"composite",t.value,c.labels,c instanceof cr?c.interpolation:void 0):new Ko(a?"constant":"source",t.value)):On([new st("",'"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.')])}yo.prototype.evaluateWithoutErrorHandling=function(t,e,r,a,l,c){return this._styleExpression.evaluateWithoutErrorHandling(t,e,r,a,l,c)},yo.prototype.evaluate=function(t,e,r,a,l,c){return this._styleExpression.evaluate(t,e,r,a,l,c)},yo.prototype.interpolationFactor=function(t,e,r){return this.interpolationType?cr.interpolationFactor(this.interpolationType,t,e,r):0};var go=function(t,e){this._parameters=t,this._specification=e,at(this,function r(a,l){var c,h,m,g=l.type==="color",_=a.stops&&typeof a.stops[0][0]=="object",x=_||!(_||a.property!==void 0),b=a.type||(Xo(l)?"exponential":"interval");if(g&&((a=at({},a)).stops&&(a.stops=a.stops.map(function(gt){return [gt[0],ue.parse(gt[1])]})),a.default=ue.parse(a.default?a.default:l.default)),a.colorSpace&&a.colorSpace!=="rgb"&&!El[a.colorSpace])throw new Error("Unknown color space: "+a.colorSpace);if(b==="exponential")c=Ol;else if(b==="interval")c=Vu;else if(b==="categorical"){c=Fl,h=Object.create(null);for(var I=0,E=a.stops;I<E.length;I+=1){var L=E[I];h[L[0]]=L[1];}m=typeof a.stops[0][0];}else {if(b!=="identity")throw new Error('Unknown function type "'+b+'"');c=za;}if(_){for(var B={},q=[],V=0;V<a.stops.length;V++){var W=a.stops[V],J=W[0].zoom;B[J]===void 0&&(B[J]={zoom:J,type:a.type,property:a.property,default:a.default,stops:[]},q.push(J)),B[J].stops.push([W[0].value,W[1]]);}for(var Y=[],$=0,nt=q;$<nt.length;$+=1){var ut=nt[$];Y.push([B[ut].zoom,r(B[ut],l)]);}var ft={name:"linear"};return {kind:"composite",interpolationType:ft,interpolationFactor:cr.interpolationFactor.bind(void 0,ft),zoomStops:Y.map(function(gt){return gt[0]}),evaluate:function(gt,Mt){var vt=gt.zoom;return Ol({stops:Y,base:a.base},l,vt).evaluate(vt,Mt)}}}if(x){var zt=b==="exponential"?{name:"exponential",base:a.base!==void 0?a.base:1}:null;return {kind:"camera",interpolationType:zt,interpolationFactor:cr.interpolationFactor.bind(void 0,zt),zoomStops:a.stops.map(function(gt){return gt[0]}),evaluate:function(gt){return c(a,l,gt.zoom,h,m)}}}return {kind:"source",evaluate:function(gt,Mt){var vt=Mt&&Mt.properties?Mt.properties[a.property]:void 0;return vt===void 0?fo(a.default,l.default):c(a,l,vt,h,m)}}}(this._parameters,this._specification));};function _i(t){var e=t.key,r=t.value,a=t.valueSpec||{},l=t.objectElementValidators||{},c=t.style,h=t.styleSpec,m=[],g=xe(r);if(g!=="object")return [new U(e,r,"object expected, "+g+" found")];for(var _ in r){var x=_.split(".")[0],b=a[x]||a["*"],I=void 0;if(l[x])I=l[x];else if(a[x])I=ee;else if(l["*"])I=l["*"];else {if(!a["*"]){m.push(new U(e,r[_],'unknown property "'+_+'"'));continue}I=ee;}m=m.concat(I({key:(e&&e+".")+_,value:r[_],valueSpec:b,style:c,styleSpec:h,object:r,objectKey:_},r));}for(var E in a)l[E]||a[E].required&&a[E].default===void 0&&r[E]===void 0&&m.push(new U(e,r,'missing required property "'+E+'"'));return m}function Vl(t){var e=t.value,r=t.valueSpec,a=t.style,l=t.styleSpec,c=t.key,h=t.arrayElementValidator||ee;if(xe(e)!=="array")return [new U(c,e,"array expected, "+xe(e)+" found")];if(r.length&&e.length!==r.length)return [new U(c,e,"array length "+r.length+" expected, length "+e.length+" found")];if(r["min-length"]&&e.length<r["min-length"])return [new U(c,e,"array length at least "+r["min-length"]+" expected, length "+e.length+" found")];var m={type:r.value,values:r.values};l.$version<7&&(m.function=r.function),xe(r.value)==="object"&&(m=r.value);for(var g=[],_=0;_<e.length;_++)g=g.concat(h({array:e,arrayIndex:_,value:e[_],valueSpec:m,style:a,styleSpec:l,key:c+"["+_+"]"}));return g}function Nl(t){var e=t.key,r=t.value,a=t.valueSpec,l=xe(r);return l==="number"&&r!=r&&(l="NaN"),l!=="number"?[new U(e,r,"number expected, "+l+" found")]:"minimum"in a&&r<a.minimum?[new U(e,r,r+" is less than the minimum value "+a.minimum)]:"maximum"in a&&r>a.maximum?[new U(e,r,r+" is greater than the maximum value "+a.maximum)]:[]}function jl(t){var e,r,a,l=t.valueSpec,c=lt(t.value.type),h={},m=c!=="categorical"&&t.value.property===void 0,g=!m,_=xe(t.value.stops)==="array"&&xe(t.value.stops[0])==="array"&&xe(t.value.stops[0][0])==="object",x=_i({key:t.key,value:t.value,valueSpec:t.styleSpec.function,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{stops:function(E){if(c==="identity")return [new U(E.key,E.value,'identity function may not have a "stops" property')];var L=[],B=E.value;return L=L.concat(Vl({key:E.key,value:B,valueSpec:E.valueSpec,style:E.style,styleSpec:E.styleSpec,arrayElementValidator:b})),xe(B)==="array"&&B.length===0&&L.push(new U(E.key,B,"array must have at least one stop")),L},default:function(E){return ee({key:E.key,value:E.value,valueSpec:l,style:E.style,styleSpec:E.styleSpec})}}});return c==="identity"&&m&&x.push(new U(t.key,t.value,'missing required property "property"')),c==="identity"||t.value.stops||x.push(new U(t.key,t.value,'missing required property "stops"')),c==="exponential"&&t.valueSpec.expression&&!Xo(t.valueSpec)&&x.push(new U(t.key,t.value,"exponential functions not supported")),t.styleSpec.$version>=8&&(g&&!Un(t.valueSpec)?x.push(new U(t.key,t.value,"property functions not supported")):m&&!Rl(t.valueSpec)&&x.push(new U(t.key,t.value,"zoom functions not supported"))),c!=="categorical"&&!_||t.value.property!==void 0||x.push(new U(t.key,t.value,'"property" property is required')),x;function b(E){var L=[],B=E.value,q=E.key;if(xe(B)!=="array")return [new U(q,B,"array expected, "+xe(B)+" found")];if(B.length!==2)return [new U(q,B,"array length 2 expected, length "+B.length+" found")];if(_){if(xe(B[0])!=="object")return [new U(q,B,"object expected, "+xe(B[0])+" found")];if(B[0].zoom===void 0)return [new U(q,B,"object stop key must have zoom")];if(B[0].value===void 0)return [new U(q,B,"object stop key must have value")];if(a&&a>lt(B[0].zoom))return [new U(q,B[0].zoom,"stop zoom values must appear in ascending order")];lt(B[0].zoom)!==a&&(a=lt(B[0].zoom),r=void 0,h={}),L=L.concat(_i({key:q+"[0]",value:B[0],valueSpec:{zoom:{}},style:E.style,styleSpec:E.styleSpec,objectElementValidators:{zoom:Nl,value:I}}));}else L=L.concat(I({key:q+"[0]",value:B[0],valueSpec:{},style:E.style,styleSpec:E.styleSpec},B));return Wo(rt(B[1]))?L.concat([new U(q+"[1]",B[1],"expressions are not allowed in function stops.")]):L.concat(ee({key:q+"[1]",value:B[1],valueSpec:l,style:E.style,styleSpec:E.styleSpec}))}function I(E,L){var B=xe(E.value),q=lt(E.value),V=E.value!==null?E.value:L;if(e){if(B!==e)return [new U(E.key,V,B+" stop domain type must match previous stop domain type "+e)]}else e=B;if(B!=="number"&&B!=="string"&&B!=="boolean")return [new U(E.key,V,"stop domain value must be a number, string, or boolean")];if(B!=="number"&&c!=="categorical"){var W="number expected, "+B+" found";return Un(l)&&c===void 0&&(W+='\nIf you intended to use a categorical function, specify `"type": "categorical"`.'),[new U(E.key,V,W)]}return c!=="categorical"||B!=="number"||isFinite(q)&&Math.floor(q)===q?c!=="categorical"&&B==="number"&&r!==void 0&&q<r?[new U(E.key,V,"stop domain values must appear in ascending order")]:(r=q,c==="categorical"&&q in h?[new U(E.key,V,"stop domain values must be unique")]:(h[q]=!0,[])):[new U(E.key,V,"integer expected, found "+q)]}}function Vn(t){var e=(t.expressionContext==="property"?Ul:Ca)(rt(t.value),t.valueSpec);if(e.result==="error")return e.value.map(function(a){return new U(""+t.key+a.key,t.value,a.message)});var r=e.value.expression||e.value._styleExpression.expression;if(t.expressionContext==="property"&&t.propertyKey==="text-font"&&!r.outputDefined())return [new U(t.key,t.value,'Invalid data expression for "'+t.propertyKey+'". Output values must be contained as literals within the expression.')];if(t.expressionContext==="property"&&t.propertyType==="layout"&&!Qi(r))return [new U(t.key,t.value,'"feature-state" data expressions are not supported with layout properties.')];if(t.expressionContext==="filter"&&!Qi(r))return [new U(t.key,t.value,'"feature-state" data expressions are not supported with filters.')];if(t.expressionContext&&t.expressionContext.indexOf("cluster")===0){if(!Cn(r,["zoom","feature-state"]))return [new U(t.key,t.value,'"zoom" and "feature-state" expressions are not supported with cluster properties.')];if(t.expressionContext==="cluster-initial"&&!Yi(r))return [new U(t.key,t.value,"Feature data expressions are not supported with initial expression part of cluster properties.")]}return []}function Ho(t){var e=t.key,r=t.value,a=t.valueSpec,l=[];return Array.isArray(a.values)?a.values.indexOf(lt(r))===-1&&l.push(new U(e,r,"expected one of ["+a.values.join(", ")+"], "+JSON.stringify(r)+" found")):Object.keys(a.values).indexOf(lt(r))===-1&&l.push(new U(e,r,"expected one of ["+Object.keys(a.values).join(", ")+"], "+JSON.stringify(r)+" found")),l}function ka(t){if(t===!0||t===!1)return !0;if(!Array.isArray(t)||t.length===0)return !1;switch(t[0]){case"has":return t.length>=2&&t[1]!=="$id"&&t[1]!=="$type";case"in":return t.length>=3&&(typeof t[1]!="string"||Array.isArray(t[2]));case"!in":case"!has":case"none":return !1;case"==":case"!=":case">":case">=":case"<":case"<=":return t.length!==3||Array.isArray(t[1])||Array.isArray(t[2]);case"any":case"all":for(var e=0,r=t.slice(1);e<r.length;e+=1){var a=r[e];if(!ka(a)&&typeof a!="boolean")return !1}return !0;default:return !0}}go.deserialize=function(t){return new go(t._parameters,t._specification)},go.serialize=function(t){return {_parameters:t._parameters,_specification:t._specification}};var ks={type:"boolean",default:!1,transition:!1,"property-type":"data-driven",expression:{interpolated:!1,parameters:["zoom","feature"]}};function Ma(t){if(t==null)return {filter:function(){return !0},needGeometry:!1};ka(t)||(t=Da(t));var e=Ca(t,ks);if(e.result==="error")throw new Error(e.value.map(function(r){return r.key+": "+r.message}).join(", "));return {filter:function(r,a,l){return e.value.evaluate(r,a,{},l)},needGeometry:function r(a){if(!Array.isArray(a))return !1;if(a[0]==="within")return !0;for(var l=1;l<a.length;l++)if(r(a[l]))return !0;return !1}(t)}}function Nu(t,e){return t<e?-1:t>e?1:0}function Da(t){if(!t)return !0;var e,r=t[0];return t.length<=1?r!=="any":r==="=="?Ms(t[1],t[2],"=="):r==="!="?La(Ms(t[1],t[2],"==")):r==="<"||r===">"||r==="<="||r===">="?Ms(t[1],t[2],r):r==="any"?(e=t.slice(1),["any"].concat(e.map(Da))):r==="all"?["all"].concat(t.slice(1).map(Da)):r==="none"?["all"].concat(t.slice(1).map(Da).map(La)):r==="in"?ql(t[1],t.slice(2)):r==="!in"?La(ql(t[1],t.slice(2))):r==="has"?Zl(t[1]):r==="!has"?La(Zl(t[1])):r!=="within"||t}function Ms(t,e,r){switch(t){case"$type":return ["filter-type-"+r,e];case"$id":return ["filter-id-"+r,e];default:return ["filter-"+r,t,e]}}function ql(t,e){if(e.length===0)return !1;switch(t){case"$type":return ["filter-type-in",["literal",e]];case"$id":return ["filter-id-in",["literal",e]];default:return e.length>200&&!e.some(function(r){return typeof r!=typeof e[0]})?["filter-in-large",t,["literal",e.sort(Nu)]]:["filter-in-small",t,["literal",e]]}}function Zl(t){switch(t){case"$type":return !0;case"$id":return ["filter-has-id"];default:return ["filter-has",t]}}function La(t){return ["!",t]}function Ds(t){return ka(rt(t.value))?Vn(at({},t,{expressionContext:"filter",valueSpec:{value:"boolean"}})):function e(r){var a=r.value,l=r.key;if(xe(a)!=="array")return [new U(l,a,"array expected, "+xe(a)+" found")];var c,h=r.styleSpec,m=[];if(a.length<1)return [new U(l,a,"filter array must have at least 1 element")];switch(m=m.concat(Ho({key:l+"[0]",value:a[0],valueSpec:h.filter_operator,style:r.style,styleSpec:r.styleSpec})),lt(a[0])){case"<":case"<=":case">":case">=":a.length>=2&&lt(a[1])==="$type"&&m.push(new U(l,a,'"$type" cannot be use with operator "'+a[0]+'"'));case"==":case"!=":a.length!==3&&m.push(new U(l,a,'filter array for operator "'+a[0]+'" must have 3 elements'));case"in":case"!in":a.length>=2&&(c=xe(a[1]))!=="string"&&m.push(new U(l+"[1]",a[1],"string expected, "+c+" found"));for(var g=2;g<a.length;g++)c=xe(a[g]),lt(a[1])==="$type"?m=m.concat(Ho({key:l+"["+g+"]",value:a[g],valueSpec:h.geometry_type,style:r.style,styleSpec:r.styleSpec})):c!=="string"&&c!=="number"&&c!=="boolean"&&m.push(new U(l+"["+g+"]",a[g],"string, number, or boolean expected, "+c+" found"));break;case"any":case"all":case"none":for(var _=1;_<a.length;_++)m=m.concat(e({key:l+"["+_+"]",value:a[_],style:r.style,styleSpec:r.styleSpec}));break;case"has":case"!has":c=xe(a[1]),a.length!==2?m.push(new U(l,a,'filter array for "'+a[0]+'" operator must have 2 elements')):c!=="string"&&m.push(new U(l+"[1]",a[1],"string expected, "+c+" found"));break;case"within":c=xe(a[1]),a.length!==2?m.push(new U(l,a,'filter array for "'+a[0]+'" operator must have 2 elements')):c!=="object"&&m.push(new U(l+"[1]",a[1],"object expected, "+c+" found"));}return m}(t)}function Ls(t,e){var r=t.key,a=t.style,l=t.styleSpec,c=t.value,h=t.objectKey,m=l[e+"_"+t.layerType];if(!m)return [];var g=h.match(/^(.*)-transition$/);if(e==="paint"&&g&&m[g[1]]&&m[g[1]].transition)return ee({key:r,value:c,valueSpec:l.transition,style:a,styleSpec:l});var _,x=t.valueSpec||m[h];if(!x)return [new U(r,c,'unknown property "'+h+'"')];if(xe(c)==="string"&&Un(x)&&!x.tokens&&(_=/^{([^}]+)}$/.exec(c)))return [new U(r,c,'"'+h+'" does not support interpolation syntax\nUse an identity property function instead: `{ "type": "identity", "property": '+JSON.stringify(_[1])+" }`.")];var b=[];return t.layerType==="symbol"&&(h==="text-field"&&a&&!a.glyphs&&b.push(new U(r,c,'use of "text-field" requires a style "glyphs" property')),h==="text-font"&&Pa(rt(c))&&lt(c.type)==="identity"&&b.push(new U(r,c,'"text-font" does not support identity functions'))),b.concat(ee({key:t.key,value:c,valueSpec:x,style:a,styleSpec:l,expressionContext:"property",propertyType:e,propertyKey:h}))}function Bs(t){return Ls(t,"paint")}function Jo(t){return Ls(t,"layout")}function Gl(t){var e=[],r=t.value,a=t.key,l=t.style,c=t.styleSpec;r.type||r.ref||e.push(new U(a,r,'either "type" or "ref" is required'));var h,m=lt(r.type),g=lt(r.ref);if(r.id)for(var _=lt(r.id),x=0;x<t.arrayIndex;x++){var b=l.layers[x];lt(b.id)===_&&e.push(new U(a,r.id,'duplicate layer id "'+r.id+'", previously used at line '+b.id.__line__));}if("ref"in r)["type","source","source-layer","filter","layout"].forEach(function(L){L in r&&e.push(new U(a,r[L],'"'+L+'" is prohibited for ref layers'));}),l.layers.forEach(function(L){lt(L.id)===g&&(h=L);}),h?h.ref?e.push(new U(a,r.ref,"ref cannot reference another ref layer")):m=lt(h.type):e.push(new U(a,r.ref,'ref layer "'+g+'" not found'));else if(m!=="background")if(r.source){var I=l.sources&&l.sources[r.source],E=I&&lt(I.type);I?E==="vector"&&m==="raster"?e.push(new U(a,r.source,'layer "'+r.id+'" requires a raster source')):E==="raster"&&m!=="raster"?e.push(new U(a,r.source,'layer "'+r.id+'" requires a vector source')):E!=="vector"||r["source-layer"]?E==="raster-dem"&&m!=="hillshade"?e.push(new U(a,r.source,"raster-dem source can only be used with layer type 'hillshade'.")):m!=="line"||!r.paint||!r.paint["line-gradient"]||E==="geojson"&&I.lineMetrics||e.push(new U(a,r,'layer "'+r.id+'" specifies a line-gradient, which requires a GeoJSON source with `lineMetrics` enabled.')):e.push(new U(a,r,'layer "'+r.id+'" must specify a "source-layer"')):e.push(new U(a,r.source,'source "'+r.source+'" not found'));}else e.push(new U(a,r,'missing required property "source"'));return e=e.concat(_i({key:a,value:r,valueSpec:c.layer,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{"*":function(){return []},type:function(){return ee({key:a+".type",value:r.type,valueSpec:c.layer.type,style:t.style,styleSpec:t.styleSpec,object:r,objectKey:"type"})},filter:Ds,layout:function(L){return _i({layer:r,key:L.key,value:L.value,style:L.style,styleSpec:L.styleSpec,objectElementValidators:{"*":function(B){return Jo(at({layerType:m},B))}}})},paint:function(L){return _i({layer:r,key:L.key,value:L.value,style:L.style,styleSpec:L.styleSpec,objectElementValidators:{"*":function(B){return Bs(at({layerType:m},B))}}})}}}))}function Nn(t){var e=t.value,r=t.key,a=xe(e);return a!=="string"?[new U(r,e,"string expected, "+a+" found")]:[]}var Ie={promoteId:function(t){var e=t.key,r=t.value;if(xe(r)==="string")return Nn({key:e,value:r});var a=[];for(var l in r)a.push.apply(a,Nn({key:e+"."+l,value:r[l]}));return a}};function Ba(t){var e=t.value,r=t.key,a=t.styleSpec,l=t.style;if(!e.type)return [new U(r,e,'"type" is required')];var c,h=lt(e.type);switch(h){case"vector":case"raster":case"raster-dem":return _i({key:r,value:e,valueSpec:a["source_"+h.replace("-","_")],style:t.style,styleSpec:a,objectElementValidators:Ie});case"geojson":if(c=_i({key:r,value:e,valueSpec:a.source_geojson,style:l,styleSpec:a,objectElementValidators:Ie}),e.cluster)for(var m in e.clusterProperties){var g=e.clusterProperties[m],_=g[0],x=typeof _=="string"?[_,["accumulated"],["get",m]]:_;c.push.apply(c,Vn({key:r+"."+m+".map",value:g[1],expressionContext:"cluster-map"})),c.push.apply(c,Vn({key:r+"."+m+".reduce",value:x,expressionContext:"cluster-reduce"}));}return c;case"video":return _i({key:r,value:e,valueSpec:a.source_video,style:l,styleSpec:a});case"image":return _i({key:r,value:e,valueSpec:a.source_image,style:l,styleSpec:a});case"canvas":return [new U(r,null,"Please use runtime APIs to add canvas sources, rather than including them in stylesheets.","source.canvas")];default:return Ho({key:r+".type",value:e.type,valueSpec:{values:["vector","raster","raster-dem","geojson","video","image"]},style:l,styleSpec:a})}}function jn(t){var e=t.value,r=t.styleSpec,a=r.light,l=t.style,c=[],h=xe(e);if(e===void 0)return c;if(h!=="object")return c.concat([new U("light",e,"object expected, "+h+" found")]);for(var m in e){var g=m.match(/^(.*)-transition$/);c=c.concat(g&&a[g[1]]&&a[g[1]].transition?ee({key:m,value:e[m],valueSpec:r.transition,style:l,styleSpec:r}):a[m]?ee({key:m,value:e[m],valueSpec:a[m],style:l,styleSpec:r}):[new U(m,e[m],'unknown property "'+m+'"')]);}return c}var sn={"*":function(){return []},array:Vl,boolean:function(t){var e=t.value,r=t.key,a=xe(e);return a!=="boolean"?[new U(r,e,"boolean expected, "+a+" found")]:[]},number:Nl,color:function(t){var e=t.key,r=t.value,a=xe(r);return a!=="string"?[new U(e,r,"color expected, "+a+" found")]:Qt(r)===null?[new U(e,r,'color expected, "'+r+'" found')]:[]},constants:H,enum:Ho,filter:Ds,function:jl,layer:Gl,object:_i,source:Ba,light:jn,string:Nn,formatted:function(t){return Nn(t).length===0?[]:Vn(t)},resolvedImage:function(t){return Nn(t).length===0?[]:Vn(t)}};function ee(t){var e=t.value,r=t.valueSpec,a=t.styleSpec;return r.expression&&Pa(lt(e))?jl(t):r.expression&&Wo(rt(e))?Vn(t):r.type&&sn[r.type]?sn[r.type](t):_i(at({},t,{valueSpec:r.type?a[r.type]:r}))}function be(t){var e=t.value,r=t.key,a=Nn(t);return a.length||(e.indexOf("{fontstack}")===-1&&a.push(new U(r,e,'"glyphs" url must include a "{fontstack}" token')),e.indexOf("{range}")===-1&&a.push(new U(r,e,'"glyphs" url must include a "{range}" token'))),a}function Xr(t,e){e===void 0&&(e=C);var r=[];return r=r.concat(ee({key:"",value:t,valueSpec:e.$root,styleSpec:e,style:t,objectElementValidators:{glyphs:be,"*":function(){return []}}})),t.constants&&(r=r.concat(H({key:"constants",value:t.constants,style:t,styleSpec:e}))),Yo(r)}function Yo(t){return [].concat(t).sort(function(e,r){return e.line-r.line})}function _o(t){return function(){for(var e=[],r=arguments.length;r--;)e[r]=arguments[r];return Yo(t.apply(this,e))}}Xr.source=_o(Ba),Xr.light=_o(jn),Xr.layer=_o(Gl),Xr.filter=_o(Ds),Xr.paintProperty=_o(Bs),Xr.layoutProperty=_o(Jo);var Qo=Xr,ju=Qo.light,qu=Qo.paintProperty,$o=Qo.layoutProperty;function ta(t,e){var r=!1;if(e&&e.length)for(var a=0,l=e;a<l.length;a+=1)t.fire(new Z(new Error(l[a].message))),r=!0;return r}var Ni=Xe;function Xe(t,e,r){var a=this.cells=[];if(t instanceof ArrayBuffer){this.arrayBuffer=t;var l=new Int32Array(this.arrayBuffer);t=l[0],this.d=(e=l[1])+2*(r=l[2]);for(var c=0;c<this.d*this.d;c++){var h=l[3+c],m=l[3+c+1];a.push(h===m?null:l.subarray(h,m));}var g=l[3+a.length+1];this.keys=l.subarray(l[3+a.length],g),this.bboxes=l.subarray(g),this.insert=this._insertReadonly;}else {this.d=e+2*r;for(var _=0;_<this.d*this.d;_++)a.push([]);this.keys=[],this.bboxes=[];}this.n=e,this.extent=t,this.padding=r,this.scale=e/t,this.uid=0;var x=r/e*t;this.min=-x,this.max=t+x;}Xe.prototype.insert=function(t,e,r,a,l){this._forEachCell(e,r,a,l,this._insertCell,this.uid++),this.keys.push(t),this.bboxes.push(e),this.bboxes.push(r),this.bboxes.push(a),this.bboxes.push(l);},Xe.prototype._insertReadonly=function(){throw "Cannot insert into a GridIndex created from an ArrayBuffer."},Xe.prototype._insertCell=function(t,e,r,a,l,c){this.cells[l].push(c);},Xe.prototype.query=function(t,e,r,a,l){var c=this.min,h=this.max;if(t<=c&&e<=c&&h<=r&&h<=a&&!l)return Array.prototype.slice.call(this.keys);var m=[];return this._forEachCell(t,e,r,a,this._queryCell,m,{},l),m},Xe.prototype._queryCell=function(t,e,r,a,l,c,h,m){var g=this.cells[l];if(g!==null)for(var _=this.keys,x=this.bboxes,b=0;b<g.length;b++){var I=g[b];if(h[I]===void 0){var E=4*I;(m?m(x[E+0],x[E+1],x[E+2],x[E+3]):t<=x[E+2]&&e<=x[E+3]&&r>=x[E+0]&&a>=x[E+1])?(h[I]=!0,c.push(_[I])):h[I]=!1;}}},Xe.prototype._forEachCell=function(t,e,r,a,l,c,h,m){for(var g=this._convertToCellCoord(t),_=this._convertToCellCoord(e),x=this._convertToCellCoord(r),b=this._convertToCellCoord(a),I=g;I<=x;I++)for(var E=_;E<=b;E++){var L=this.d*E+I;if((!m||m(this._convertFromCellCoord(I),this._convertFromCellCoord(E),this._convertFromCellCoord(I+1),this._convertFromCellCoord(E+1)))&&l.call(this,t,e,r,a,L,c,h,m))return}},Xe.prototype._convertFromCellCoord=function(t){return (t-this.padding)/this.scale},Xe.prototype._convertToCellCoord=function(t){return Math.max(0,Math.min(this.d-1,Math.floor(t*this.scale)+this.padding))},Xe.prototype.toArrayBuffer=function(){if(this.arrayBuffer)return this.arrayBuffer;for(var t=this.cells,e=3+this.cells.length+1+1,r=0,a=0;a<this.cells.length;a++)r+=this.cells[a].length;var l=new Int32Array(e+r+this.keys.length+this.bboxes.length);l[0]=this.extent,l[1]=this.n,l[2]=this.padding;for(var c=e,h=0;h<t.length;h++){var m=t[h];l[3+h]=c,l.set(m,c),c+=m.length;}return l[3+t.length]=c,l.set(this.keys,c),l[3+t.length+1]=c+=this.keys.length,l.set(this.bboxes,c),c+=this.bboxes.length,l.buffer};var ea=Pt.ImageData,Xl=Pt.ImageBitmap,Ze={};function Tt(t,e,r){r===void 0&&(r={}),Object.defineProperty(e,"_classRegistryKey",{value:t,writeable:!1}),Ze[t]={klass:e,omit:r.omit||[],shallow:r.shallow||[]};}for(var Fr in Tt("Object",Object),Ni.serialize=function(t,e){var r=t.toArrayBuffer();return e&&e.push(r),{buffer:r}},Ni.deserialize=function(t){return new Ni(t.buffer)},Tt("Grid",Ni),Tt("Color",ue),Tt("Error",Error),Tt("ResolvedImage",zr),Tt("StylePropertyFunction",go),Tt("StyleExpression",mo,{omit:["_evaluator"]}),Tt("ZoomDependentExpression",yo),Tt("ZoomConstantExpression",Ko),Tt("CompoundExpression",ur,{omit:["_evaluate"]}),Rn)Rn[Fr]._classRegistryKey||Tt("Expression_"+Fr,Rn[Fr]);function Ra(t){return t&&typeof ArrayBuffer!="undefined"&&(t instanceof ArrayBuffer||t.constructor&&t.constructor.name==="ArrayBuffer")}function vo(t){return Xl&&t instanceof Xl}function vi(t,e){if(t==null||typeof t=="boolean"||typeof t=="number"||typeof t=="string"||t instanceof Boolean||t instanceof Number||t instanceof String||t instanceof Date||t instanceof RegExp)return t;if(Ra(t)||vo(t))return e&&e.push(t),t;if(ArrayBuffer.isView(t)){var r=t;return e&&e.push(r.buffer),r}if(t instanceof ea)return e&&e.push(t.data.buffer),t;if(Array.isArray(t)){for(var a=[],l=0,c=t;l<c.length;l+=1)a.push(vi(c[l],e));return a}if(typeof t=="object"){var h=t.constructor,m=h._classRegistryKey;if(!m)throw new Error("can't serialize object of unregistered class");var g=h.serialize?h.serialize(t,e):{};if(!h.serialize){for(var _ in t)if(t.hasOwnProperty(_)&&!(Ze[m].omit.indexOf(_)>=0)){var x=t[_];g[_]=Ze[m].shallow.indexOf(_)>=0?x:vi(x,e);}t instanceof Error&&(g.message=t.message);}if(g.$name)throw new Error("$name property is reserved for worker serialization logic.");return m!=="Object"&&(g.$name=m),g}throw new Error("can't serialize object of type "+typeof t)}function Or(t){if(t==null||typeof t=="boolean"||typeof t=="number"||typeof t=="string"||t instanceof Boolean||t instanceof Number||t instanceof String||t instanceof Date||t instanceof RegExp||Ra(t)||vo(t)||ArrayBuffer.isView(t)||t instanceof ea)return t;if(Array.isArray(t))return t.map(Or);if(typeof t=="object"){var e=t.$name||"Object",r=Ze[e].klass;if(!r)throw new Error("can't deserialize unregistered class "+e);if(r.deserialize)return r.deserialize(t);for(var a=Object.create(r.prototype),l=0,c=Object.keys(t);l<c.length;l+=1){var h=c[l];if(h!=="$name"){var m=t[h];a[h]=Ze[e].shallow.indexOf(h)>=0?m:Or(m);}}return a}throw new Error("can't deserialize object of type "+typeof t)}var Rs=function(){this.first=!0;};Rs.prototype.update=function(t,e){var r=Math.floor(t);return this.first?(this.first=!1,this.lastIntegerZoom=r,this.lastIntegerZoomTime=0,this.lastZoom=t,this.lastFloorZoom=r,!0):(this.lastFloorZoom>r?(this.lastIntegerZoom=r+1,this.lastIntegerZoomTime=e):this.lastFloorZoom<r&&(this.lastIntegerZoom=r,this.lastIntegerZoomTime=e),t!==this.lastZoom&&(this.lastZoom=t,this.lastFloorZoom=r,!0))};var mt={"Latin-1 Supplement":function(t){return t>=128&&t<=255},Arabic:function(t){return t>=1536&&t<=1791},"Arabic Supplement":function(t){return t>=1872&&t<=1919},"Arabic Extended-A":function(t){return t>=2208&&t<=2303},"Hangul Jamo":function(t){return t>=4352&&t<=4607},"Unified Canadian Aboriginal Syllabics":function(t){return t>=5120&&t<=5759},Khmer:function(t){return t>=6016&&t<=6143},"Unified Canadian Aboriginal Syllabics Extended":function(t){return t>=6320&&t<=6399},"General Punctuation":function(t){return t>=8192&&t<=8303},"Letterlike Symbols":function(t){return t>=8448&&t<=8527},"Number Forms":function(t){return t>=8528&&t<=8591},"Miscellaneous Technical":function(t){return t>=8960&&t<=9215},"Control Pictures":function(t){return t>=9216&&t<=9279},"Optical Character Recognition":function(t){return t>=9280&&t<=9311},"Enclosed Alphanumerics":function(t){return t>=9312&&t<=9471},"Geometric Shapes":function(t){return t>=9632&&t<=9727},"Miscellaneous Symbols":function(t){return t>=9728&&t<=9983},"Miscellaneous Symbols and Arrows":function(t){return t>=11008&&t<=11263},"CJK Radicals Supplement":function(t){return t>=11904&&t<=12031},"Kangxi Radicals":function(t){return t>=12032&&t<=12255},"Ideographic Description Characters":function(t){return t>=12272&&t<=12287},"CJK Symbols and Punctuation":function(t){return t>=12288&&t<=12351},Hiragana:function(t){return t>=12352&&t<=12447},Katakana:function(t){return t>=12448&&t<=12543},Bopomofo:function(t){return t>=12544&&t<=12591},"Hangul Compatibility Jamo":function(t){return t>=12592&&t<=12687},Kanbun:function(t){return t>=12688&&t<=12703},"Bopomofo Extended":function(t){return t>=12704&&t<=12735},"CJK Strokes":function(t){return t>=12736&&t<=12783},"Katakana Phonetic Extensions":function(t){return t>=12784&&t<=12799},"Enclosed CJK Letters and Months":function(t){return t>=12800&&t<=13055},"CJK Compatibility":function(t){return t>=13056&&t<=13311},"CJK Unified Ideographs Extension A":function(t){return t>=13312&&t<=19903},"Yijing Hexagram Symbols":function(t){return t>=19904&&t<=19967},"CJK Unified Ideographs":function(t){return t>=19968&&t<=40959},"Yi Syllables":function(t){return t>=40960&&t<=42127},"Yi Radicals":function(t){return t>=42128&&t<=42191},"Hangul Jamo Extended-A":function(t){return t>=43360&&t<=43391},"Hangul Syllables":function(t){return t>=44032&&t<=55215},"Hangul Jamo Extended-B":function(t){return t>=55216&&t<=55295},"Private Use Area":function(t){return t>=57344&&t<=63743},"CJK Compatibility Ideographs":function(t){return t>=63744&&t<=64255},"Arabic Presentation Forms-A":function(t){return t>=64336&&t<=65023},"Vertical Forms":function(t){return t>=65040&&t<=65055},"CJK Compatibility Forms":function(t){return t>=65072&&t<=65103},"Small Form Variants":function(t){return t>=65104&&t<=65135},"Arabic Presentation Forms-B":function(t){return t>=65136&&t<=65279},"Halfwidth and Fullwidth Forms":function(t){return t>=65280&&t<=65519}};function Fs(t){for(var e=0,r=t;e<r.length;e+=1)if(Fa(r[e].charCodeAt(0)))return !0;return !1}function Fa(t){return !(t!==746&&t!==747&&(t<4352||!(mt["Bopomofo Extended"](t)||mt.Bopomofo(t)||mt["CJK Compatibility Forms"](t)&&!(t>=65097&&t<=65103)||mt["CJK Compatibility Ideographs"](t)||mt["CJK Compatibility"](t)||mt["CJK Radicals Supplement"](t)||mt["CJK Strokes"](t)||!(!mt["CJK Symbols and Punctuation"](t)||t>=12296&&t<=12305||t>=12308&&t<=12319||t===12336)||mt["CJK Unified Ideographs Extension A"](t)||mt["CJK Unified Ideographs"](t)||mt["Enclosed CJK Letters and Months"](t)||mt["Hangul Compatibility Jamo"](t)||mt["Hangul Jamo Extended-A"](t)||mt["Hangul Jamo Extended-B"](t)||mt["Hangul Jamo"](t)||mt["Hangul Syllables"](t)||mt.Hiragana(t)||mt["Ideographic Description Characters"](t)||mt.Kanbun(t)||mt["Kangxi Radicals"](t)||mt["Katakana Phonetic Extensions"](t)||mt.Katakana(t)&&t!==12540||!(!mt["Halfwidth and Fullwidth Forms"](t)||t===65288||t===65289||t===65293||t>=65306&&t<=65310||t===65339||t===65341||t===65343||t>=65371&&t<=65503||t===65507||t>=65512&&t<=65519)||!(!mt["Small Form Variants"](t)||t>=65112&&t<=65118||t>=65123&&t<=65126)||mt["Unified Canadian Aboriginal Syllabics"](t)||mt["Unified Canadian Aboriginal Syllabics Extended"](t)||mt["Vertical Forms"](t)||mt["Yijing Hexagram Symbols"](t)||mt["Yi Syllables"](t)||mt["Yi Radicals"](t))))}function Os(t){return !(Fa(t)||function(e){return !!(mt["Latin-1 Supplement"](e)&&(e===167||e===169||e===174||e===177||e===188||e===189||e===190||e===215||e===247)||mt["General Punctuation"](e)&&(e===8214||e===8224||e===8225||e===8240||e===8241||e===8251||e===8252||e===8258||e===8263||e===8264||e===8265||e===8273)||mt["Letterlike Symbols"](e)||mt["Number Forms"](e)||mt["Miscellaneous Technical"](e)&&(e>=8960&&e<=8967||e>=8972&&e<=8991||e>=8996&&e<=9e3||e===9003||e>=9085&&e<=9114||e>=9150&&e<=9165||e===9167||e>=9169&&e<=9179||e>=9186&&e<=9215)||mt["Control Pictures"](e)&&e!==9251||mt["Optical Character Recognition"](e)||mt["Enclosed Alphanumerics"](e)||mt["Geometric Shapes"](e)||mt["Miscellaneous Symbols"](e)&&!(e>=9754&&e<=9759)||mt["Miscellaneous Symbols and Arrows"](e)&&(e>=11026&&e<=11055||e>=11088&&e<=11097||e>=11192&&e<=11243)||mt["CJK Symbols and Punctuation"](e)||mt.Katakana(e)||mt["Private Use Area"](e)||mt["CJK Compatibility Forms"](e)||mt["Small Form Variants"](e)||mt["Halfwidth and Fullwidth Forms"](e)||e===8734||e===8756||e===8757||e>=9984&&e<=10087||e>=10102&&e<=10131||e===65532||e===65533)}(t))}function ni(t){return t>=1424&&t<=2303||mt["Arabic Presentation Forms-A"](t)||mt["Arabic Presentation Forms-B"](t)}function Ur(t,e){return !(!e&&ni(t)||t>=2304&&t<=3583||t>=3840&&t<=4255||mt.Khmer(t))}function Oa(t){for(var e=0,r=t;e<r.length;e+=1)if(ni(r[e].charCodeAt(0)))return !0;return !1}var Ua=null,Vr="unavailable",ji=null,Wl=function(t){t&&typeof t=="string"&&t.indexOf("NetworkError")>-1&&(Vr="error"),Ua&&Ua(t);};function ra(){Us.fire(new O("pluginStateChange",{pluginStatus:Vr,pluginURL:ji}));}var Us=new X,Vs=function(){return Vr},xi=function(){if(Vr!=="deferred"||!ji)throw new Error("rtl-text-plugin cannot be downloaded unless a pluginURL is specified");Vr="loading",ra(),ji&&Uo({url:ji},function(t){t?Wl(t):(Vr="loaded",ra());});},Wr={applyArabicShaping:null,processBidirectionalText:null,processStyledBidirectionalText:null,isLoaded:function(){return Vr==="loaded"||Wr.applyArabicShaping!=null},isLoading:function(){return Vr==="loading"},setState:function(t){Vr=t.pluginStatus,ji=t.pluginURL;},isParsed:function(){return Wr.applyArabicShaping!=null&&Wr.processBidirectionalText!=null&&Wr.processStyledBidirectionalText!=null},getPluginURL:function(){return ji}},Jt=function(t,e){this.zoom=t,e?(this.now=e.now,this.fadeDuration=e.fadeDuration,this.zoomHistory=e.zoomHistory,this.transition=e.transition):(this.now=0,this.fadeDuration=0,this.zoomHistory=new Rs,this.transition={});};Jt.prototype.isSupportedScript=function(t){return function(e,r){for(var a=0,l=e;a<l.length;a+=1)if(!Ur(l[a].charCodeAt(0),r))return !1;return !0}(t,Wr.isLoaded())},Jt.prototype.crossFadingFactor=function(){return this.fadeDuration===0?1:Math.min((this.now-this.zoomHistory.lastIntegerZoomTime)/this.fadeDuration,1)},Jt.prototype.getCrossfadeParameters=function(){var t=this.zoom,e=t-Math.floor(t),r=this.crossFadingFactor();return t>this.zoomHistory.lastIntegerZoom?{fromScale:2,toScale:1,t:e+(1-e)*r}:{fromScale:.5,toScale:1,t:1-(1-r)*e}};var Pi=function(t,e){this.property=t,this.value=e,this.expression=function(r,a){if(Pa(r))return new go(r,a);if(Wo(r)){var l=Ul(r,a);if(l.result==="error")throw new Error(l.value.map(function(h){return h.key+": "+h.message}).join(", "));return l.value}var c=r;return typeof r=="string"&&a.type==="color"&&(c=ue.parse(r)),{kind:"constant",evaluate:function(){return c}}}(e===void 0?t.specification.default:e,t.specification);};Pi.prototype.isDataDriven=function(){return this.expression.kind==="source"||this.expression.kind==="composite"},Pi.prototype.possiblyEvaluate=function(t,e,r){return this.property.possiblyEvaluate(this,t,e,r)};var oi=function(t){this.property=t,this.value=new Pi(t,void 0);};oi.prototype.transitioned=function(t,e){return new qn(this.property,this.value,e,lr({},t.transition,this.transition),t.now)},oi.prototype.untransitioned=function(){return new qn(this.property,this.value,null,{},0)};var pr=function(t){this._properties=t,this._values=Object.create(t.defaultTransitionablePropertyValues);};pr.prototype.getValue=function(t){return pi(this._values[t].value.value)},pr.prototype.setValue=function(t,e){this._values.hasOwnProperty(t)||(this._values[t]=new oi(this._values[t].property)),this._values[t].value=new Pi(this._values[t].property,e===null?void 0:pi(e));},pr.prototype.getTransition=function(t){return pi(this._values[t].transition)},pr.prototype.setTransition=function(t,e){this._values.hasOwnProperty(t)||(this._values[t]=new oi(this._values[t].property)),this._values[t].transition=pi(e)||void 0;},pr.prototype.serialize=function(){for(var t={},e=0,r=Object.keys(this._values);e<r.length;e+=1){var a=r[e],l=this.getValue(a);l!==void 0&&(t[a]=l);var c=this.getTransition(a);c!==void 0&&(t[a+"-transition"]=c);}return t},pr.prototype.transitioned=function(t,e){for(var r=new ln(this._properties),a=0,l=Object.keys(this._values);a<l.length;a+=1){var c=l[a];r._values[c]=this._values[c].transitioned(t,e._values[c]);}return r},pr.prototype.untransitioned=function(){for(var t=new ln(this._properties),e=0,r=Object.keys(this._values);e<r.length;e+=1){var a=r[e];t._values[a]=this._values[a].untransitioned();}return t};var qn=function(t,e,r,a,l){this.property=t,this.value=e,this.begin=l+a.delay||0,this.end=this.begin+a.duration||0,t.specification.transition&&(a.delay||a.duration)&&(this.prior=r);};qn.prototype.possiblyEvaluate=function(t,e,r){var a=t.now||0,l=this.value.possiblyEvaluate(t,e,r),c=this.prior;if(c){if(a>this.end)return this.prior=null,l;if(this.value.isDataDriven())return this.prior=null,l;if(a<this.begin)return c.possiblyEvaluate(t,e,r);var h=(a-this.begin)/(this.end-this.begin);return this.property.interpolate(c.possiblyEvaluate(t,e,r),l,function(m){if(m<=0)return 0;if(m>=1)return 1;var g=m*m,_=g*m;return 4*(m<.5?_:3*(m-g)+_-.75)}(h))}return l};var ln=function(t){this._properties=t,this._values=Object.create(t.defaultTransitioningPropertyValues);};ln.prototype.possiblyEvaluate=function(t,e,r){for(var a=new ia(this._properties),l=0,c=Object.keys(this._values);l<c.length;l+=1){var h=c[l];a._values[h]=this._values[h].possiblyEvaluate(t,e,r);}return a},ln.prototype.hasTransition=function(){for(var t=0,e=Object.keys(this._values);t<e.length;t+=1)if(this._values[e[t]].prior)return !0;return !1};var bi=function(t){this._properties=t,this._values=Object.create(t.defaultPropertyValues);};bi.prototype.getValue=function(t){return pi(this._values[t].value)},bi.prototype.setValue=function(t,e){this._values[t]=new Pi(this._values[t].property,e===null?void 0:pi(e));},bi.prototype.serialize=function(){for(var t={},e=0,r=Object.keys(this._values);e<r.length;e+=1){var a=r[e],l=this.getValue(a);l!==void 0&&(t[a]=l);}return t},bi.prototype.possiblyEvaluate=function(t,e,r){for(var a=new ia(this._properties),l=0,c=Object.keys(this._values);l<c.length;l+=1){var h=c[l];a._values[h]=this._values[h].possiblyEvaluate(t,e,r);}return a};var br=function(t,e,r){this.property=t,this.value=e,this.parameters=r;};br.prototype.isConstant=function(){return this.value.kind==="constant"},br.prototype.constantOr=function(t){return this.value.kind==="constant"?this.value.value:t},br.prototype.evaluate=function(t,e,r,a){return this.property.evaluate(this.value,this.parameters,t,e,r,a)};var ia=function(t){this._properties=t,this._values=Object.create(t.defaultPossiblyEvaluatedValues);};ia.prototype.get=function(t){return this._values[t]};var Ct=function(t){this.specification=t;};Ct.prototype.possiblyEvaluate=function(t,e){return t.expression.evaluate(e)},Ct.prototype.interpolate=function(t,e,r){var a=ho[this.specification.type];return a?a(t,e,r):t};var Et=function(t,e){this.specification=t,this.overrides=e;};Et.prototype.possiblyEvaluate=function(t,e,r,a){return new br(this,t.expression.kind==="constant"||t.expression.kind==="camera"?{kind:"constant",value:t.expression.evaluate(e,null,{},r,a)}:t.expression,e)},Et.prototype.interpolate=function(t,e,r){if(t.value.kind!=="constant"||e.value.kind!=="constant")return t;if(t.value.value===void 0||e.value.value===void 0)return new br(this,{kind:"constant",value:void 0},t.parameters);var a=ho[this.specification.type];return a?new br(this,{kind:"constant",value:a(t.value.value,e.value.value,r)},t.parameters):t},Et.prototype.evaluate=function(t,e,r,a,l,c){return t.kind==="constant"?t.value:t.evaluate(e,r,a,l,c)};var Va=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.possiblyEvaluate=function(r,a,l,c){if(r.value===void 0)return new br(this,{kind:"constant",value:void 0},a);if(r.expression.kind==="constant"){var h=r.expression.evaluate(a,null,{},l,c),m=r.property.specification.type==="resolvedImage"&&typeof h!="string"?h.name:h,g=this._calculate(m,m,m,a);return new br(this,{kind:"constant",value:g},a)}if(r.expression.kind==="camera"){var _=this._calculate(r.expression.evaluate({zoom:a.zoom-1}),r.expression.evaluate({zoom:a.zoom}),r.expression.evaluate({zoom:a.zoom+1}),a);return new br(this,{kind:"constant",value:_},a)}return new br(this,r.expression,a)},e.prototype.evaluate=function(r,a,l,c,h,m){if(r.kind==="source"){var g=r.evaluate(a,l,c,h,m);return this._calculate(g,g,g,a)}return r.kind==="composite"?this._calculate(r.evaluate({zoom:Math.floor(a.zoom)-1},l,c),r.evaluate({zoom:Math.floor(a.zoom)},l,c),r.evaluate({zoom:Math.floor(a.zoom)+1},l,c),a):r.value},e.prototype._calculate=function(r,a,l,c){return c.zoom>c.zoomHistory.lastIntegerZoom?{from:r,to:a}:{from:l,to:a}},e.prototype.interpolate=function(r){return r},e}(Et),wr=function(t){this.specification=t;};wr.prototype.possiblyEvaluate=function(t,e,r,a){if(t.value!==void 0){if(t.expression.kind==="constant"){var l=t.expression.evaluate(e,null,{},r,a);return this._calculate(l,l,l,e)}return this._calculate(t.expression.evaluate(new Jt(Math.floor(e.zoom-1),e)),t.expression.evaluate(new Jt(Math.floor(e.zoom),e)),t.expression.evaluate(new Jt(Math.floor(e.zoom+1),e)),e)}},wr.prototype._calculate=function(t,e,r,a){return a.zoom>a.zoomHistory.lastIntegerZoom?{from:t,to:e}:{from:r,to:e}},wr.prototype.interpolate=function(t){return t};var wi=function(t){this.specification=t;};wi.prototype.possiblyEvaluate=function(t,e,r,a){return !!t.expression.evaluate(e,null,{},r,a)},wi.prototype.interpolate=function(){return !1};var hr=function(t){for(var e in this.properties=t,this.defaultPropertyValues={},this.defaultTransitionablePropertyValues={},this.defaultTransitioningPropertyValues={},this.defaultPossiblyEvaluatedValues={},this.overridableProperties=[],t){var r=t[e];r.specification.overridable&&this.overridableProperties.push(e);var a=this.defaultPropertyValues[e]=new Pi(r,void 0),l=this.defaultTransitionablePropertyValues[e]=new oi(r);this.defaultTransitioningPropertyValues[e]=l.untransitioned(),this.defaultPossiblyEvaluatedValues[e]=a.possiblyEvaluate({});}};Tt("DataDrivenProperty",Et),Tt("DataConstantProperty",Ct),Tt("CrossFadedDataDrivenProperty",Va),Tt("CrossFadedProperty",wr),Tt("ColorRampProperty",wi);var zi=function(t){function e(r,a){if(t.call(this),this.id=r.id,this.type=r.type,this._featureFilter={filter:function(){return !0},needGeometry:!1},r.type!=="custom"&&(this.metadata=(r=r).metadata,this.minzoom=r.minzoom,this.maxzoom=r.maxzoom,r.type!=="background"&&(this.source=r.source,this.sourceLayer=r["source-layer"],this.filter=r.filter),a.layout&&(this._unevaluatedLayout=new bi(a.layout)),a.paint)){for(var l in this._transitionablePaint=new pr(a.paint),r.paint)this.setPaintProperty(l,r.paint[l],{validate:!1});for(var c in r.layout)this.setLayoutProperty(c,r.layout[c],{validate:!1});this._transitioningPaint=this._transitionablePaint.untransitioned(),this.paint=new ia(a.paint);}}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getCrossfadeParameters=function(){return this._crossfadeParameters},e.prototype.getLayoutProperty=function(r){return r==="visibility"?this.visibility:this._unevaluatedLayout.getValue(r)},e.prototype.setLayoutProperty=function(r,a,l){l===void 0&&(l={}),a!=null&&this._validate($o,"layers."+this.id+".layout."+r,r,a,l)||(r!=="visibility"?this._unevaluatedLayout.setValue(r,a):this.visibility=a);},e.prototype.getPaintProperty=function(r){return wn(r,"-transition")?this._transitionablePaint.getTransition(r.slice(0,-"-transition".length)):this._transitionablePaint.getValue(r)},e.prototype.setPaintProperty=function(r,a,l){if(l===void 0&&(l={}),a!=null&&this._validate(qu,"layers."+this.id+".paint."+r,r,a,l))return !1;if(wn(r,"-transition"))return this._transitionablePaint.setTransition(r.slice(0,-"-transition".length),a||void 0),!1;var c=this._transitionablePaint._values[r],h=c.property.specification["property-type"]==="cross-faded-data-driven",m=c.value.isDataDriven(),g=c.value;this._transitionablePaint.setValue(r,a),this._handleSpecialPaintPropertyUpdate(r);var _=this._transitionablePaint._values[r].value;return _.isDataDriven()||m||h||this._handleOverridablePaintPropertyUpdate(r,g,_)},e.prototype._handleSpecialPaintPropertyUpdate=function(r){},e.prototype._handleOverridablePaintPropertyUpdate=function(r,a,l){return !1},e.prototype.isHidden=function(r){return !!(this.minzoom&&r<this.minzoom)||!!(this.maxzoom&&r>=this.maxzoom)||this.visibility==="none"},e.prototype.updateTransitions=function(r){this._transitioningPaint=this._transitionablePaint.transitioned(r,this._transitioningPaint);},e.prototype.hasTransition=function(){return this._transitioningPaint.hasTransition()},e.prototype.recalculate=function(r,a){r.getCrossfadeParameters&&(this._crossfadeParameters=r.getCrossfadeParameters()),this._unevaluatedLayout&&(this.layout=this._unevaluatedLayout.possiblyEvaluate(r,void 0,a)),this.paint=this._transitioningPaint.possiblyEvaluate(r,void 0,a);},e.prototype.serialize=function(){var r={id:this.id,type:this.type,source:this.source,"source-layer":this.sourceLayer,metadata:this.metadata,minzoom:this.minzoom,maxzoom:this.maxzoom,filter:this.filter,layout:this._unevaluatedLayout&&this._unevaluatedLayout.serialize(),paint:this._transitionablePaint&&this._transitionablePaint.serialize()};return this.visibility&&(r.layout=r.layout||{},r.layout.visibility=this.visibility),Ri(r,function(a,l){return !(a===void 0||l==="layout"&&!Object.keys(a).length||l==="paint"&&!Object.keys(a).length)})},e.prototype._validate=function(r,a,l,c,h){return h===void 0&&(h={}),(!h||h.validate!==!1)&&ta(this,r.call(Qo,{key:a,layerType:this.type,objectKey:l,value:c,styleSpec:C,style:{glyphs:!0,sprite:!0}}))},e.prototype.is3D=function(){return !1},e.prototype.isTileClipped=function(){return !1},e.prototype.hasOffscreenPass=function(){return !1},e.prototype.resize=function(){},e.prototype.isStateDependent=function(){for(var r in this.paint._values){var a=this.paint.get(r);if(a instanceof br&&Un(a.property.specification)&&(a.value.kind==="source"||a.value.kind==="composite")&&a.value.isStateDependent)return !0}return !1},e}(X),Ns={Int8:Int8Array,Uint8:Uint8Array,Int16:Int16Array,Uint16:Uint16Array,Int32:Int32Array,Uint32:Uint32Array,Float32:Float32Array},Na=function(t,e){this._structArray=t,this._pos1=e*this.size,this._pos2=this._pos1/2,this._pos4=this._pos1/4,this._pos8=this._pos1/8;},he=function(){this.isTransferred=!1,this.capacity=-1,this.resize(0);};function ir(t,e){e===void 0&&(e=1);var r=0,a=0;return {members:t.map(function(l){var c=Ns[l.type].BYTES_PER_ELEMENT,h=r=Kl(r,Math.max(e,c)),m=l.components||1;return a=Math.max(a,c),r+=c*m,{name:l.name,type:l.type,components:m,offset:h}}),size:Kl(r,Math.max(a,e)),alignment:e}}function Kl(t,e){return Math.ceil(t/e)*e}he.serialize=function(t,e){return t._trim(),e&&(t.isTransferred=!0,e.push(t.arrayBuffer)),{length:t.length,arrayBuffer:t.arrayBuffer}},he.deserialize=function(t){var e=Object.create(this.prototype);return e.arrayBuffer=t.arrayBuffer,e.length=t.length,e.capacity=t.arrayBuffer.byteLength/e.bytesPerElement,e._refreshViews(),e},he.prototype._trim=function(){this.length!==this.capacity&&(this.capacity=this.length,this.arrayBuffer=this.arrayBuffer.slice(0,this.length*this.bytesPerElement),this._refreshViews());},he.prototype.clear=function(){this.length=0;},he.prototype.resize=function(t){this.reserve(t),this.length=t;},he.prototype.reserve=function(t){if(t>this.capacity){this.capacity=Math.max(t,Math.floor(5*this.capacity),128),this.arrayBuffer=new ArrayBuffer(this.capacity*this.bytesPerElement);var e=this.uint8;this._refreshViews(),e&&this.uint8.set(e);}},he.prototype._refreshViews=function(){throw new Error("_refreshViews() must be implemented by each concrete StructArray layout")};var Zn=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a){var l=this.length;return this.resize(l+1),this.emplace(l,r,a)},e.prototype.emplace=function(r,a,l){var c=2*r;return this.int16[c+0]=a,this.int16[c+1]=l,r},e}(he);Zn.prototype.bytesPerElement=4,Tt("StructArrayLayout2i4",Zn);var js=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c){var h=this.length;return this.resize(h+1),this.emplace(h,r,a,l,c)},e.prototype.emplace=function(r,a,l,c,h){var m=4*r;return this.int16[m+0]=a,this.int16[m+1]=l,this.int16[m+2]=c,this.int16[m+3]=h,r},e}(he);js.prototype.bytesPerElement=8,Tt("StructArrayLayout4i8",js);var qi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c,h,m){var g=this.length;return this.resize(g+1),this.emplace(g,r,a,l,c,h,m)},e.prototype.emplace=function(r,a,l,c,h,m,g){var _=6*r;return this.int16[_+0]=a,this.int16[_+1]=l,this.int16[_+2]=c,this.int16[_+3]=h,this.int16[_+4]=m,this.int16[_+5]=g,r},e}(he);qi.prototype.bytesPerElement=12,Tt("StructArrayLayout2i4i12",qi);var Nr=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c,h,m){var g=this.length;return this.resize(g+1),this.emplace(g,r,a,l,c,h,m)},e.prototype.emplace=function(r,a,l,c,h,m,g){var _=4*r,x=8*r;return this.int16[_+0]=a,this.int16[_+1]=l,this.uint8[x+4]=c,this.uint8[x+5]=h,this.uint8[x+6]=m,this.uint8[x+7]=g,r},e}(he);Nr.prototype.bytesPerElement=8,Tt("StructArrayLayout2i4ub8",Nr);var xo=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a){var l=this.length;return this.resize(l+1),this.emplace(l,r,a)},e.prototype.emplace=function(r,a,l){var c=2*r;return this.float32[c+0]=a,this.float32[c+1]=l,r},e}(he);xo.prototype.bytesPerElement=8,Tt("StructArrayLayout2f8",xo);var Ci=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c,h,m,g,_,x,b){var I=this.length;return this.resize(I+1),this.emplace(I,r,a,l,c,h,m,g,_,x,b)},e.prototype.emplace=function(r,a,l,c,h,m,g,_,x,b,I){var E=10*r;return this.uint16[E+0]=a,this.uint16[E+1]=l,this.uint16[E+2]=c,this.uint16[E+3]=h,this.uint16[E+4]=m,this.uint16[E+5]=g,this.uint16[E+6]=_,this.uint16[E+7]=x,this.uint16[E+8]=b,this.uint16[E+9]=I,r},e}(he);Ci.prototype.bytesPerElement=20,Tt("StructArrayLayout10ui20",Ci);var ja=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c,h,m,g,_,x,b,I,E){var L=this.length;return this.resize(L+1),this.emplace(L,r,a,l,c,h,m,g,_,x,b,I,E)},e.prototype.emplace=function(r,a,l,c,h,m,g,_,x,b,I,E,L){var B=12*r;return this.int16[B+0]=a,this.int16[B+1]=l,this.int16[B+2]=c,this.int16[B+3]=h,this.uint16[B+4]=m,this.uint16[B+5]=g,this.uint16[B+6]=_,this.uint16[B+7]=x,this.int16[B+8]=b,this.int16[B+9]=I,this.int16[B+10]=E,this.int16[B+11]=L,r},e}(he);ja.prototype.bytesPerElement=24,Tt("StructArrayLayout4i4ui4i24",ja);var bo=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l){var c=this.length;return this.resize(c+1),this.emplace(c,r,a,l)},e.prototype.emplace=function(r,a,l,c){var h=3*r;return this.float32[h+0]=a,this.float32[h+1]=l,this.float32[h+2]=c,r},e}(he);bo.prototype.bytesPerElement=12,Tt("StructArrayLayout3f12",bo);var na=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r){var a=this.length;return this.resize(a+1),this.emplace(a,r)},e.prototype.emplace=function(r,a){return this.uint32[1*r+0]=a,r},e}(he);na.prototype.bytesPerElement=4,Tt("StructArrayLayout1ul4",na);var qs=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c,h,m,g,_,x){var b=this.length;return this.resize(b+1),this.emplace(b,r,a,l,c,h,m,g,_,x)},e.prototype.emplace=function(r,a,l,c,h,m,g,_,x,b){var I=10*r,E=5*r;return this.int16[I+0]=a,this.int16[I+1]=l,this.int16[I+2]=c,this.int16[I+3]=h,this.int16[I+4]=m,this.int16[I+5]=g,this.uint32[E+3]=_,this.uint16[I+8]=x,this.uint16[I+9]=b,r},e}(he);qs.prototype.bytesPerElement=20,Tt("StructArrayLayout6i1ul2ui20",qs);var wo=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c,h,m){var g=this.length;return this.resize(g+1),this.emplace(g,r,a,l,c,h,m)},e.prototype.emplace=function(r,a,l,c,h,m,g){var _=6*r;return this.int16[_+0]=a,this.int16[_+1]=l,this.int16[_+2]=c,this.int16[_+3]=h,this.int16[_+4]=m,this.int16[_+5]=g,r},e}(he);wo.prototype.bytesPerElement=12,Tt("StructArrayLayout2i2i2i12",wo);var Gn=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c,h){var m=this.length;return this.resize(m+1),this.emplace(m,r,a,l,c,h)},e.prototype.emplace=function(r,a,l,c,h,m){var g=4*r,_=8*r;return this.float32[g+0]=a,this.float32[g+1]=l,this.float32[g+2]=c,this.int16[_+6]=h,this.int16[_+7]=m,r},e}(he);Gn.prototype.bytesPerElement=16,Tt("StructArrayLayout2f1f2i16",Gn);var Zs=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c){var h=this.length;return this.resize(h+1),this.emplace(h,r,a,l,c)},e.prototype.emplace=function(r,a,l,c,h){var m=12*r,g=3*r;return this.uint8[m+0]=a,this.uint8[m+1]=l,this.float32[g+1]=c,this.float32[g+2]=h,r},e}(he);Zs.prototype.bytesPerElement=12,Tt("StructArrayLayout2ub2f12",Zs);var un=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l){var c=this.length;return this.resize(c+1),this.emplace(c,r,a,l)},e.prototype.emplace=function(r,a,l,c){var h=3*r;return this.uint16[h+0]=a,this.uint16[h+1]=l,this.uint16[h+2]=c,r},e}(he);un.prototype.bytesPerElement=6,Tt("StructArrayLayout3ui6",un);var cn=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c,h,m,g,_,x,b,I,E,L,B,q,V,W){var J=this.length;return this.resize(J+1),this.emplace(J,r,a,l,c,h,m,g,_,x,b,I,E,L,B,q,V,W)},e.prototype.emplace=function(r,a,l,c,h,m,g,_,x,b,I,E,L,B,q,V,W,J){var Y=24*r,$=12*r,nt=48*r;return this.int16[Y+0]=a,this.int16[Y+1]=l,this.uint16[Y+2]=c,this.uint16[Y+3]=h,this.uint32[$+2]=m,this.uint32[$+3]=g,this.uint32[$+4]=_,this.uint16[Y+10]=x,this.uint16[Y+11]=b,this.uint16[Y+12]=I,this.float32[$+7]=E,this.float32[$+8]=L,this.uint8[nt+36]=B,this.uint8[nt+37]=q,this.uint8[nt+38]=V,this.uint32[$+10]=W,this.int16[Y+22]=J,r},e}(he);cn.prototype.bytesPerElement=48,Tt("StructArrayLayout2i2ui3ul3ui2f3ub1ul1i48",cn);var qa=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c,h,m,g,_,x,b,I,E,L,B,q,V,W,J,Y,$,nt,ut,ft,zt,gt,Mt,vt,Xt){var Ft=this.length;return this.resize(Ft+1),this.emplace(Ft,r,a,l,c,h,m,g,_,x,b,I,E,L,B,q,V,W,J,Y,$,nt,ut,ft,zt,gt,Mt,vt,Xt)},e.prototype.emplace=function(r,a,l,c,h,m,g,_,x,b,I,E,L,B,q,V,W,J,Y,$,nt,ut,ft,zt,gt,Mt,vt,Xt,Ft){var At=34*r,Kt=17*r;return this.int16[At+0]=a,this.int16[At+1]=l,this.int16[At+2]=c,this.int16[At+3]=h,this.int16[At+4]=m,this.int16[At+5]=g,this.int16[At+6]=_,this.int16[At+7]=x,this.uint16[At+8]=b,this.uint16[At+9]=I,this.uint16[At+10]=E,this.uint16[At+11]=L,this.uint16[At+12]=B,this.uint16[At+13]=q,this.uint16[At+14]=V,this.uint16[At+15]=W,this.uint16[At+16]=J,this.uint16[At+17]=Y,this.uint16[At+18]=$,this.uint16[At+19]=nt,this.uint16[At+20]=ut,this.uint16[At+21]=ft,this.uint16[At+22]=zt,this.uint32[Kt+12]=gt,this.float32[Kt+13]=Mt,this.float32[Kt+14]=vt,this.float32[Kt+15]=Xt,this.float32[Kt+16]=Ft,r},e}(he);qa.prototype.bytesPerElement=68,Tt("StructArrayLayout8i15ui1ul4f68",qa);var pn=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r){var a=this.length;return this.resize(a+1),this.emplace(a,r)},e.prototype.emplace=function(r,a){return this.float32[1*r+0]=a,r},e}(he);pn.prototype.bytesPerElement=4,Tt("StructArrayLayout1f4",pn);var ai=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l){var c=this.length;return this.resize(c+1),this.emplace(c,r,a,l)},e.prototype.emplace=function(r,a,l,c){var h=3*r;return this.int16[h+0]=a,this.int16[h+1]=l,this.int16[h+2]=c,r},e}(he);ai.prototype.bytesPerElement=6,Tt("StructArrayLayout3i6",ai);var Gs=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l){var c=this.length;return this.resize(c+1),this.emplace(c,r,a,l)},e.prototype.emplace=function(r,a,l,c){var h=4*r;return this.uint32[2*r+0]=a,this.uint16[h+2]=l,this.uint16[h+3]=c,r},e}(he);Gs.prototype.bytesPerElement=8,Tt("StructArrayLayout1ul2ui8",Gs);var oa=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a){var l=this.length;return this.resize(l+1),this.emplace(l,r,a)},e.prototype.emplace=function(r,a,l){var c=2*r;return this.uint16[c+0]=a,this.uint16[c+1]=l,r},e}(he);oa.prototype.bytesPerElement=4,Tt("StructArrayLayout2ui4",oa);var Xs=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r){var a=this.length;return this.resize(a+1),this.emplace(a,r)},e.prototype.emplace=function(r,a){return this.uint16[1*r+0]=a,r},e}(he);Xs.prototype.bytesPerElement=2,Tt("StructArrayLayout1ui2",Xs);var Za=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(r,a,l,c){var h=this.length;return this.resize(h+1),this.emplace(h,r,a,l,c)},e.prototype.emplace=function(r,a,l,c,h){var m=4*r;return this.float32[m+0]=a,this.float32[m+1]=l,this.float32[m+2]=c,this.float32[m+3]=h,r},e}(he);Za.prototype.bytesPerElement=16,Tt("StructArrayLayout4f16",Za);var i=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e;var r={anchorPointX:{configurable:!0},anchorPointY:{configurable:!0},x1:{configurable:!0},y1:{configurable:!0},x2:{configurable:!0},y2:{configurable:!0},featureIndex:{configurable:!0},sourceLayerIndex:{configurable:!0},bucketIndex:{configurable:!0},anchorPoint:{configurable:!0}};return r.anchorPointX.get=function(){return this._structArray.int16[this._pos2+0]},r.anchorPointY.get=function(){return this._structArray.int16[this._pos2+1]},r.x1.get=function(){return this._structArray.int16[this._pos2+2]},r.y1.get=function(){return this._structArray.int16[this._pos2+3]},r.x2.get=function(){return this._structArray.int16[this._pos2+4]},r.y2.get=function(){return this._structArray.int16[this._pos2+5]},r.featureIndex.get=function(){return this._structArray.uint32[this._pos4+3]},r.sourceLayerIndex.get=function(){return this._structArray.uint16[this._pos2+8]},r.bucketIndex.get=function(){return this._structArray.uint16[this._pos2+9]},r.anchorPoint.get=function(){return new jt(this.anchorPointX,this.anchorPointY)},Object.defineProperties(e.prototype,r),e}(Na);i.prototype.size=20;var o=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.get=function(r){return new i(this,r)},e}(qs);Tt("CollisionBoxArray",o);var n=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e;var r={anchorX:{configurable:!0},anchorY:{configurable:!0},glyphStartIndex:{configurable:!0},numGlyphs:{configurable:!0},vertexStartIndex:{configurable:!0},lineStartIndex:{configurable:!0},lineLength:{configurable:!0},segment:{configurable:!0},lowerSize:{configurable:!0},upperSize:{configurable:!0},lineOffsetX:{configurable:!0},lineOffsetY:{configurable:!0},writingMode:{configurable:!0},placedOrientation:{configurable:!0},hidden:{configurable:!0},crossTileID:{configurable:!0},associatedIconIndex:{configurable:!0}};return r.anchorX.get=function(){return this._structArray.int16[this._pos2+0]},r.anchorY.get=function(){return this._structArray.int16[this._pos2+1]},r.glyphStartIndex.get=function(){return this._structArray.uint16[this._pos2+2]},r.numGlyphs.get=function(){return this._structArray.uint16[this._pos2+3]},r.vertexStartIndex.get=function(){return this._structArray.uint32[this._pos4+2]},r.lineStartIndex.get=function(){return this._structArray.uint32[this._pos4+3]},r.lineLength.get=function(){return this._structArray.uint32[this._pos4+4]},r.segment.get=function(){return this._structArray.uint16[this._pos2+10]},r.lowerSize.get=function(){return this._structArray.uint16[this._pos2+11]},r.upperSize.get=function(){return this._structArray.uint16[this._pos2+12]},r.lineOffsetX.get=function(){return this._structArray.float32[this._pos4+7]},r.lineOffsetY.get=function(){return this._structArray.float32[this._pos4+8]},r.writingMode.get=function(){return this._structArray.uint8[this._pos1+36]},r.placedOrientation.get=function(){return this._structArray.uint8[this._pos1+37]},r.placedOrientation.set=function(a){this._structArray.uint8[this._pos1+37]=a;},r.hidden.get=function(){return this._structArray.uint8[this._pos1+38]},r.hidden.set=function(a){this._structArray.uint8[this._pos1+38]=a;},r.crossTileID.get=function(){return this._structArray.uint32[this._pos4+10]},r.crossTileID.set=function(a){this._structArray.uint32[this._pos4+10]=a;},r.associatedIconIndex.get=function(){return this._structArray.int16[this._pos2+22]},Object.defineProperties(e.prototype,r),e}(Na);n.prototype.size=48;var s=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.get=function(r){return new n(this,r)},e}(cn);Tt("PlacedSymbolArray",s);var p=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e;var r={anchorX:{configurable:!0},anchorY:{configurable:!0},rightJustifiedTextSymbolIndex:{configurable:!0},centerJustifiedTextSymbolIndex:{configurable:!0},leftJustifiedTextSymbolIndex:{configurable:!0},verticalPlacedTextSymbolIndex:{configurable:!0},placedIconSymbolIndex:{configurable:!0},verticalPlacedIconSymbolIndex:{configurable:!0},key:{configurable:!0},textBoxStartIndex:{configurable:!0},textBoxEndIndex:{configurable:!0},verticalTextBoxStartIndex:{configurable:!0},verticalTextBoxEndIndex:{configurable:!0},iconBoxStartIndex:{configurable:!0},iconBoxEndIndex:{configurable:!0},verticalIconBoxStartIndex:{configurable:!0},verticalIconBoxEndIndex:{configurable:!0},featureIndex:{configurable:!0},numHorizontalGlyphVertices:{configurable:!0},numVerticalGlyphVertices:{configurable:!0},numIconVertices:{configurable:!0},numVerticalIconVertices:{configurable:!0},useRuntimeCollisionCircles:{configurable:!0},crossTileID:{configurable:!0},textBoxScale:{configurable:!0},textOffset0:{configurable:!0},textOffset1:{configurable:!0},collisionCircleDiameter:{configurable:!0}};return r.anchorX.get=function(){return this._structArray.int16[this._pos2+0]},r.anchorY.get=function(){return this._structArray.int16[this._pos2+1]},r.rightJustifiedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+2]},r.centerJustifiedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+3]},r.leftJustifiedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+4]},r.verticalPlacedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+5]},r.placedIconSymbolIndex.get=function(){return this._structArray.int16[this._pos2+6]},r.verticalPlacedIconSymbolIndex.get=function(){return this._structArray.int16[this._pos2+7]},r.key.get=function(){return this._structArray.uint16[this._pos2+8]},r.textBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+9]},r.textBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+10]},r.verticalTextBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+11]},r.verticalTextBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+12]},r.iconBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+13]},r.iconBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+14]},r.verticalIconBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+15]},r.verticalIconBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+16]},r.featureIndex.get=function(){return this._structArray.uint16[this._pos2+17]},r.numHorizontalGlyphVertices.get=function(){return this._structArray.uint16[this._pos2+18]},r.numVerticalGlyphVertices.get=function(){return this._structArray.uint16[this._pos2+19]},r.numIconVertices.get=function(){return this._structArray.uint16[this._pos2+20]},r.numVerticalIconVertices.get=function(){return this._structArray.uint16[this._pos2+21]},r.useRuntimeCollisionCircles.get=function(){return this._structArray.uint16[this._pos2+22]},r.crossTileID.get=function(){return this._structArray.uint32[this._pos4+12]},r.crossTileID.set=function(a){this._structArray.uint32[this._pos4+12]=a;},r.textBoxScale.get=function(){return this._structArray.float32[this._pos4+13]},r.textOffset0.get=function(){return this._structArray.float32[this._pos4+14]},r.textOffset1.get=function(){return this._structArray.float32[this._pos4+15]},r.collisionCircleDiameter.get=function(){return this._structArray.float32[this._pos4+16]},Object.defineProperties(e.prototype,r),e}(Na);p.prototype.size=68;var f=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.get=function(r){return new p(this,r)},e}(qa);Tt("SymbolInstanceArray",f);var d=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getoffsetX=function(r){return this.float32[1*r+0]},e}(pn);Tt("GlyphOffsetArray",d);var y=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getx=function(r){return this.int16[3*r+0]},e.prototype.gety=function(r){return this.int16[3*r+1]},e.prototype.gettileUnitDistanceFromAnchor=function(r){return this.int16[3*r+2]},e}(ai);Tt("SymbolLineVertexArray",y);var v=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e;var r={featureIndex:{configurable:!0},sourceLayerIndex:{configurable:!0},bucketIndex:{configurable:!0}};return r.featureIndex.get=function(){return this._structArray.uint32[this._pos4+0]},r.sourceLayerIndex.get=function(){return this._structArray.uint16[this._pos2+2]},r.bucketIndex.get=function(){return this._structArray.uint16[this._pos2+3]},Object.defineProperties(e.prototype,r),e}(Na);v.prototype.size=8;var S=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.get=function(r){return new v(this,r)},e}(Gs);Tt("FeatureIndexArray",S);var P=ir([{name:"a_pos",components:2,type:"Int16"}],4).members,z=function(t){t===void 0&&(t=[]),this.segments=t;};function k(t,e){return 256*(t=Lr(Math.floor(t),0,255))+Lr(Math.floor(e),0,255)}z.prototype.prepareSegment=function(t,e,r,a){var l=this.segments[this.segments.length-1];return t>z.MAX_VERTEX_ARRAY_LENGTH&&Me("Max vertices per segment is "+z.MAX_VERTEX_ARRAY_LENGTH+": bucket requested "+t),(!l||l.vertexLength+t>z.MAX_VERTEX_ARRAY_LENGTH||l.sortKey!==a)&&(l={vertexOffset:e.length,primitiveOffset:r.length,vertexLength:0,primitiveLength:0},a!==void 0&&(l.sortKey=a),this.segments.push(l)),l},z.prototype.get=function(){return this.segments},z.prototype.destroy=function(){for(var t=0,e=this.segments;t<e.length;t+=1){var r=e[t];for(var a in r.vaos)r.vaos[a].destroy();}},z.simpleSegment=function(t,e,r,a){return new z([{vertexOffset:t,primitiveOffset:e,vertexLength:r,primitiveLength:a,vaos:{},sortKey:0}])},z.MAX_VERTEX_ARRAY_LENGTH=Math.pow(2,16)-1,Tt("SegmentVector",z);var F=ir([{name:"a_pattern_from",components:4,type:"Uint16"},{name:"a_pattern_to",components:4,type:"Uint16"},{name:"a_pixel_ratio_from",components:1,type:"Uint16"},{name:"a_pixel_ratio_to",components:1,type:"Uint16"}]),R=Zr(function(t){t.exports=function(e,r){var a,l,c,h,m,g,_,x;for(l=e.length-(a=3&e.length),c=r,m=3432918353,g=461845907,x=0;x<l;)_=255&e.charCodeAt(x)|(255&e.charCodeAt(++x))<<8|(255&e.charCodeAt(++x))<<16|(255&e.charCodeAt(++x))<<24,++x,c=27492+(65535&(h=5*(65535&(c=(c^=_=(65535&(_=(_=(65535&_)*m+(((_>>>16)*m&65535)<<16)&4294967295)<<15|_>>>17))*g+(((_>>>16)*g&65535)<<16)&4294967295)<<13|c>>>19))+((5*(c>>>16)&65535)<<16)&4294967295))+((58964+(h>>>16)&65535)<<16);switch(_=0,a){case 3:_^=(255&e.charCodeAt(x+2))<<16;case 2:_^=(255&e.charCodeAt(x+1))<<8;case 1:c^=_=(65535&(_=(_=(65535&(_^=255&e.charCodeAt(x)))*m+(((_>>>16)*m&65535)<<16)&4294967295)<<15|_>>>17))*g+(((_>>>16)*g&65535)<<16)&4294967295;}return c^=e.length,c=2246822507*(65535&(c^=c>>>16))+((2246822507*(c>>>16)&65535)<<16)&4294967295,c=3266489909*(65535&(c^=c>>>13))+((3266489909*(c>>>16)&65535)<<16)&4294967295,(c^=c>>>16)>>>0};}),j=Zr(function(t){t.exports=function(e,r){for(var a,l=e.length,c=r^l,h=0;l>=4;)a=1540483477*(65535&(a=255&e.charCodeAt(h)|(255&e.charCodeAt(++h))<<8|(255&e.charCodeAt(++h))<<16|(255&e.charCodeAt(++h))<<24))+((1540483477*(a>>>16)&65535)<<16),c=1540483477*(65535&c)+((1540483477*(c>>>16)&65535)<<16)^(a=1540483477*(65535&(a^=a>>>24))+((1540483477*(a>>>16)&65535)<<16)),l-=4,++h;switch(l){case 3:c^=(255&e.charCodeAt(h+2))<<16;case 2:c^=(255&e.charCodeAt(h+1))<<8;case 1:c=1540483477*(65535&(c^=255&e.charCodeAt(h)))+((1540483477*(c>>>16)&65535)<<16);}return c=1540483477*(65535&(c^=c>>>13))+((1540483477*(c>>>16)&65535)<<16),(c^=c>>>15)>>>0};}),D=R,N=j;D.murmur3=R,D.murmur2=N;var G=function(){this.ids=[],this.positions=[],this.indexed=!1;};G.prototype.add=function(t,e,r,a){this.ids.push(tt(t)),this.positions.push(e,r,a);},G.prototype.getPositions=function(t){for(var e=tt(t),r=0,a=this.ids.length-1;r<a;){var l=r+a>>1;this.ids[l]>=e?a=l:r=l+1;}for(var c=[];this.ids[r]===e;)c.push({index:this.positions[3*r],start:this.positions[3*r+1],end:this.positions[3*r+2]}),r++;return c},G.serialize=function(t,e){var r=new Float64Array(t.ids),a=new Uint32Array(t.positions);return function l(c,h,m,g){for(;m<g;){for(var _=c[m+g>>1],x=m-1,b=g+1;;){do x++;while(c[x]<_);do b--;while(c[b]>_);if(x>=b)break;Q(c,x,b),Q(h,3*x,3*b),Q(h,3*x+1,3*b+1),Q(h,3*x+2,3*b+2);}b-m<g-b?(l(c,h,m,b),m=b+1):(l(c,h,b+1,g),g=b);}}(r,a,0,r.length-1),e&&e.push(r.buffer,a.buffer),{ids:r,positions:a}},G.deserialize=function(t){var e=new G;return e.ids=t.ids,e.positions=t.positions,e.indexed=!0,e};var K=Math.pow(2,53)-1;function tt(t){var e=+t;return !isNaN(e)&&e<=K?e:D(String(t))}function Q(t,e,r){var a=t[e];t[e]=t[r],t[r]=a;}Tt("FeaturePositionMap",G);var et=function(t,e){this.gl=t.gl,this.location=e;},ot=function(t){function e(r,a){t.call(this,r,a),this.current=0;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(r){this.current!==r&&(this.current=r,this.gl.uniform1i(this.location,r));},e}(et),ht=function(t){function e(r,a){t.call(this,r,a),this.current=0;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(r){this.current!==r&&(this.current=r,this.gl.uniform1f(this.location,r));},e}(et),pt=function(t){function e(r,a){t.call(this,r,a),this.current=[0,0];}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(r){r[0]===this.current[0]&&r[1]===this.current[1]||(this.current=r,this.gl.uniform2f(this.location,r[0],r[1]));},e}(et),bt=function(t){function e(r,a){t.call(this,r,a),this.current=[0,0,0];}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(r){r[0]===this.current[0]&&r[1]===this.current[1]&&r[2]===this.current[2]||(this.current=r,this.gl.uniform3f(this.location,r[0],r[1],r[2]));},e}(et),kt=function(t){function e(r,a){t.call(this,r,a),this.current=[0,0,0,0];}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(r){r[0]===this.current[0]&&r[1]===this.current[1]&&r[2]===this.current[2]&&r[3]===this.current[3]||(this.current=r,this.gl.uniform4f(this.location,r[0],r[1],r[2],r[3]));},e}(et),Bt=function(t){function e(r,a){t.call(this,r,a),this.current=ue.transparent;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(r){r.r===this.current.r&&r.g===this.current.g&&r.b===this.current.b&&r.a===this.current.a||(this.current=r,this.gl.uniform4f(this.location,r.r,r.g,r.b,r.a));},e}(et),Lt=new Float32Array(16),ne=function(t){function e(r,a){t.call(this,r,a),this.current=Lt;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(r){if(r[12]!==this.current[12]||r[0]!==this.current[0])return this.current=r,void this.gl.uniformMatrix4fv(this.location,!1,r);for(var a=1;a<16;a++)if(r[a]!==this.current[a]){this.current=r,this.gl.uniformMatrix4fv(this.location,!1,r);break}},e}(et);function wt(t){return [k(255*t.r,255*t.g),k(255*t.b,255*t.a)]}var Nt=function(t,e,r){this.value=t,this.uniformNames=e.map(function(a){return "u_"+a}),this.type=r;};Nt.prototype.setUniform=function(t,e,r){t.set(r.constantOr(this.value));},Nt.prototype.getBinding=function(t,e,r){return this.type==="color"?new Bt(t,e):new ht(t,e)};var Gt=function(t,e){this.uniformNames=e.map(function(r){return "u_"+r}),this.patternFrom=null,this.patternTo=null,this.pixelRatioFrom=1,this.pixelRatioTo=1;};Gt.prototype.setConstantPatternPositions=function(t,e){this.pixelRatioFrom=e.pixelRatio,this.pixelRatioTo=t.pixelRatio,this.patternFrom=e.tlbr,this.patternTo=t.tlbr;},Gt.prototype.setUniform=function(t,e,r,a){var l=a==="u_pattern_to"?this.patternTo:a==="u_pattern_from"?this.patternFrom:a==="u_pixel_ratio_to"?this.pixelRatioTo:a==="u_pixel_ratio_from"?this.pixelRatioFrom:null;l&&t.set(l);},Gt.prototype.getBinding=function(t,e,r){return r.substr(0,9)==="u_pattern"?new kt(t,e):new ht(t,e)};var Vt=function(t,e,r,a){this.expression=t,this.type=r,this.maxValue=0,this.paintVertexAttributes=e.map(function(l){return {name:"a_"+l,type:"Float32",components:r==="color"?2:1,offset:0}}),this.paintVertexArray=new a;};Vt.prototype.populatePaintArray=function(t,e,r,a,l){var c=this.paintVertexArray.length,h=this.expression.evaluate(new Jt(0),e,{},a,[],l);this.paintVertexArray.resize(t),this._setPaintValue(c,t,h);},Vt.prototype.updatePaintArray=function(t,e,r,a){var l=this.expression.evaluate({zoom:0},r,a);this._setPaintValue(t,e,l);},Vt.prototype._setPaintValue=function(t,e,r){if(this.type==="color")for(var a=wt(r),l=t;l<e;l++)this.paintVertexArray.emplace(l,a[0],a[1]);else {for(var c=t;c<e;c++)this.paintVertexArray.emplace(c,r);this.maxValue=Math.max(this.maxValue,Math.abs(r));}},Vt.prototype.upload=function(t){this.paintVertexArray&&this.paintVertexArray.arrayBuffer&&(this.paintVertexBuffer&&this.paintVertexBuffer.buffer?this.paintVertexBuffer.updateData(this.paintVertexArray):this.paintVertexBuffer=t.createVertexBuffer(this.paintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent));},Vt.prototype.destroy=function(){this.paintVertexBuffer&&this.paintVertexBuffer.destroy();};var Ut=function(t,e,r,a,l,c){this.expression=t,this.uniformNames=e.map(function(h){return "u_"+h+"_t"}),this.type=r,this.useIntegerZoom=a,this.zoom=l,this.maxValue=0,this.paintVertexAttributes=e.map(function(h){return {name:"a_"+h,type:"Float32",components:r==="color"?4:2,offset:0}}),this.paintVertexArray=new c;};Ut.prototype.populatePaintArray=function(t,e,r,a,l){var c=this.expression.evaluate(new Jt(this.zoom),e,{},a,[],l),h=this.expression.evaluate(new Jt(this.zoom+1),e,{},a,[],l),m=this.paintVertexArray.length;this.paintVertexArray.resize(t),this._setPaintValue(m,t,c,h);},Ut.prototype.updatePaintArray=function(t,e,r,a){var l=this.expression.evaluate({zoom:this.zoom},r,a),c=this.expression.evaluate({zoom:this.zoom+1},r,a);this._setPaintValue(t,e,l,c);},Ut.prototype._setPaintValue=function(t,e,r,a){if(this.type==="color")for(var l=wt(r),c=wt(a),h=t;h<e;h++)this.paintVertexArray.emplace(h,l[0],l[1],c[0],c[1]);else {for(var m=t;m<e;m++)this.paintVertexArray.emplace(m,r,a);this.maxValue=Math.max(this.maxValue,Math.abs(r),Math.abs(a));}},Ut.prototype.upload=function(t){this.paintVertexArray&&this.paintVertexArray.arrayBuffer&&(this.paintVertexBuffer&&this.paintVertexBuffer.buffer?this.paintVertexBuffer.updateData(this.paintVertexArray):this.paintVertexBuffer=t.createVertexBuffer(this.paintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent));},Ut.prototype.destroy=function(){this.paintVertexBuffer&&this.paintVertexBuffer.destroy();},Ut.prototype.setUniform=function(t,e){var r=this.useIntegerZoom?Math.floor(e.zoom):e.zoom,a=Lr(this.expression.interpolationFactor(r,this.zoom,this.zoom+1),0,1);t.set(a);},Ut.prototype.getBinding=function(t,e,r){return new ht(t,e)};var Zt=function(t,e,r,a,l,c){this.expression=t,this.type=e,this.useIntegerZoom=r,this.zoom=a,this.layerId=c,this.zoomInPaintVertexArray=new l,this.zoomOutPaintVertexArray=new l;};Zt.prototype.populatePaintArray=function(t,e,r){var a=this.zoomInPaintVertexArray.length;this.zoomInPaintVertexArray.resize(t),this.zoomOutPaintVertexArray.resize(t),this._setPaintValues(a,t,e.patterns&&e.patterns[this.layerId],r);},Zt.prototype.updatePaintArray=function(t,e,r,a,l){this._setPaintValues(t,e,r.patterns&&r.patterns[this.layerId],l);},Zt.prototype._setPaintValues=function(t,e,r,a){if(a&&r){var l=a[r.min],c=a[r.mid],h=a[r.max];if(l&&c&&h)for(var m=t;m<e;m++)this.zoomInPaintVertexArray.emplace(m,c.tl[0],c.tl[1],c.br[0],c.br[1],l.tl[0],l.tl[1],l.br[0],l.br[1],c.pixelRatio,l.pixelRatio),this.zoomOutPaintVertexArray.emplace(m,c.tl[0],c.tl[1],c.br[0],c.br[1],h.tl[0],h.tl[1],h.br[0],h.br[1],c.pixelRatio,h.pixelRatio);}},Zt.prototype.upload=function(t){this.zoomInPaintVertexArray&&this.zoomInPaintVertexArray.arrayBuffer&&this.zoomOutPaintVertexArray&&this.zoomOutPaintVertexArray.arrayBuffer&&(this.zoomInPaintVertexBuffer=t.createVertexBuffer(this.zoomInPaintVertexArray,F.members,this.expression.isStateDependent),this.zoomOutPaintVertexBuffer=t.createVertexBuffer(this.zoomOutPaintVertexArray,F.members,this.expression.isStateDependent));},Zt.prototype.destroy=function(){this.zoomOutPaintVertexBuffer&&this.zoomOutPaintVertexBuffer.destroy(),this.zoomInPaintVertexBuffer&&this.zoomInPaintVertexBuffer.destroy();};var Ot=function(t,e,r){this.binders={},this._buffers=[];var a=[];for(var l in t.paint._values)if(r(l)){var c=t.paint.get(l);if(c instanceof br&&Un(c.property.specification)){var h=Je(l,t.type),m=c.value,g=c.property.specification.type,_=c.property.useIntegerZoom,x=c.property.specification["property-type"],b=x==="cross-faded"||x==="cross-faded-data-driven";if(m.kind==="constant")this.binders[l]=b?new Gt(m.value,h):new Nt(m.value,h,g),a.push("/u_"+l);else if(m.kind==="source"||b){var I=De(l,g,"source");this.binders[l]=b?new Zt(m,g,_,e,I,t.id):new Vt(m,h,g,I),a.push("/a_"+l);}else {var E=De(l,g,"composite");this.binders[l]=new Ut(m,h,g,_,e,E),a.push("/z_"+l);}}}this.cacheKey=a.sort().join("");};Ot.prototype.getMaxValue=function(t){var e=this.binders[t];return e instanceof Vt||e instanceof Ut?e.maxValue:0},Ot.prototype.populatePaintArrays=function(t,e,r,a,l){for(var c in this.binders){var h=this.binders[c];(h instanceof Vt||h instanceof Ut||h instanceof Zt)&&h.populatePaintArray(t,e,r,a,l);}},Ot.prototype.setConstantPatternPositions=function(t,e){for(var r in this.binders){var a=this.binders[r];a instanceof Gt&&a.setConstantPatternPositions(t,e);}},Ot.prototype.updatePaintArrays=function(t,e,r,a,l){var c=!1;for(var h in t)for(var m=0,g=e.getPositions(h);m<g.length;m+=1){var _=g[m],x=r.feature(_.index);for(var b in this.binders){var I=this.binders[b];if((I instanceof Vt||I instanceof Ut||I instanceof Zt)&&I.expression.isStateDependent===!0){var E=a.paint.get(b);I.expression=E.value,I.updatePaintArray(_.start,_.end,x,t[h],l),c=!0;}}}return c},Ot.prototype.defines=function(){var t=[];for(var e in this.binders){var r=this.binders[e];(r instanceof Nt||r instanceof Gt)&&t.push.apply(t,r.uniformNames.map(function(a){return "#define HAS_UNIFORM_"+a}));}return t},Ot.prototype.getBinderAttributes=function(){var t=[];for(var e in this.binders){var r=this.binders[e];if(r instanceof Vt||r instanceof Ut)for(var a=0;a<r.paintVertexAttributes.length;a++)t.push(r.paintVertexAttributes[a].name);else if(r instanceof Zt)for(var l=0;l<F.members.length;l++)t.push(F.members[l].name);}return t},Ot.prototype.getBinderUniforms=function(){var t=[];for(var e in this.binders){var r=this.binders[e];if(r instanceof Nt||r instanceof Gt||r instanceof Ut)for(var a=0,l=r.uniformNames;a<l.length;a+=1)t.push(l[a]);}return t},Ot.prototype.getPaintVertexBuffers=function(){return this._buffers},Ot.prototype.getUniforms=function(t,e){var r=[];for(var a in this.binders){var l=this.binders[a];if(l instanceof Nt||l instanceof Gt||l instanceof Ut)for(var c=0,h=l.uniformNames;c<h.length;c+=1){var m=h[c];if(e[m]){var g=l.getBinding(t,e[m],m);r.push({name:m,property:a,binding:g});}}}return r},Ot.prototype.setUniforms=function(t,e,r,a){for(var l=0,c=e;l<c.length;l+=1){var h=c[l],m=h.name,g=h.property;this.binders[g].setUniform(h.binding,a,r.get(g),m);}},Ot.prototype.updatePaintBuffers=function(t){for(var e in this._buffers=[],this.binders){var r=this.binders[e];if(t&&r instanceof Zt){var a=t.fromScale===2?r.zoomInPaintVertexBuffer:r.zoomOutPaintVertexBuffer;a&&this._buffers.push(a);}else (r instanceof Vt||r instanceof Ut)&&r.paintVertexBuffer&&this._buffers.push(r.paintVertexBuffer);}},Ot.prototype.upload=function(t){for(var e in this.binders){var r=this.binders[e];(r instanceof Vt||r instanceof Ut||r instanceof Zt)&&r.upload(t);}this.updatePaintBuffers();},Ot.prototype.destroy=function(){for(var t in this.binders){var e=this.binders[t];(e instanceof Vt||e instanceof Ut||e instanceof Zt)&&e.destroy();}};var Rt=function(t,e,r){r===void 0&&(r=function(){return !0}),this.programConfigurations={};for(var a=0,l=t;a<l.length;a+=1){var c=l[a];this.programConfigurations[c.id]=new Ot(c,e,r);}this.needsUpload=!1,this._featureMap=new G,this._bufferOffset=0;};function Je(t,e){return {"text-opacity":["opacity"],"icon-opacity":["opacity"],"text-color":["fill_color"],"icon-color":["fill_color"],"text-halo-color":["halo_color"],"icon-halo-color":["halo_color"],"text-halo-blur":["halo_blur"],"icon-halo-blur":["halo_blur"],"text-halo-width":["halo_width"],"icon-halo-width":["halo_width"],"line-gap-width":["gapwidth"],"line-pattern":["pattern_to","pattern_from","pixel_ratio_to","pixel_ratio_from"],"fill-pattern":["pattern_to","pattern_from","pixel_ratio_to","pixel_ratio_from"],"fill-extrusion-pattern":["pattern_to","pattern_from","pixel_ratio_to","pixel_ratio_from"]}[t]||[t.replace(e+"-","").replace(/-/g,"_")]}function De(t,e,r){var a={color:{source:xo,composite:Za},number:{source:pn,composite:xo}},l=function(c){return {"line-pattern":{source:Ci,composite:Ci},"fill-pattern":{source:Ci,composite:Ci},"fill-extrusion-pattern":{source:Ci,composite:Ci}}[c]}(t);return l&&l[r]||a[e][r]}Rt.prototype.populatePaintArrays=function(t,e,r,a,l,c){for(var h in this.programConfigurations)this.programConfigurations[h].populatePaintArrays(t,e,a,l,c);e.id!==void 0&&this._featureMap.add(e.id,r,this._bufferOffset,t),this._bufferOffset=t,this.needsUpload=!0;},Rt.prototype.updatePaintArrays=function(t,e,r,a){for(var l=0,c=r;l<c.length;l+=1){var h=c[l];this.needsUpload=this.programConfigurations[h.id].updatePaintArrays(t,this._featureMap,e,h,a)||this.needsUpload;}},Rt.prototype.get=function(t){return this.programConfigurations[t]},Rt.prototype.upload=function(t){if(this.needsUpload){for(var e in this.programConfigurations)this.programConfigurations[e].upload(t);this.needsUpload=!1;}},Rt.prototype.destroy=function(){for(var t in this.programConfigurations)this.programConfigurations[t].destroy();},Tt("ConstantBinder",Nt),Tt("CrossFadedConstantBinder",Gt),Tt("SourceExpressionBinder",Vt),Tt("CrossFadedCompositeBinder",Zt),Tt("CompositeExpressionBinder",Ut),Tt("ProgramConfiguration",Ot,{omit:["_buffers"]}),Tt("ProgramConfigurationSet",Rt);var fr=Math.pow(2,14)-1,nr=-fr-1;function Ce(t){for(var e=8192/t.extent,r=t.loadGeometry(),a=0;a<r.length;a++)for(var l=r[a],c=0;c<l.length;c++){var h=l[c],m=Math.round(h.x*e),g=Math.round(h.y*e);h.x=Lr(m,nr,fr),h.y=Lr(g,nr,fr),(m<h.x||m>h.x+1||g<h.y||g>h.y+1)&&Me("Geometry exceeds allowed extent, reduce your vector tile buffer size");}return r}function Ue(t,e){return {type:t.type,id:t.id,properties:t.properties,geometry:e?Ce(t):[]}}function jr(t,e,r,a,l){t.emplaceBack(2*e+(a+1)/2,2*r+(l+1)/2);}var Sr=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map(function(e){return e.id}),this.index=t.index,this.hasPattern=!1,this.layoutVertexArray=new Zn,this.indexArray=new un,this.segments=new z,this.programConfigurations=new Rt(t.layers,t.zoom),this.stateDependentLayerIds=this.layers.filter(function(e){return e.isStateDependent()}).map(function(e){return e.id});};function hn(t,e){for(var r=0;r<t.length;r++)if(ki(e,t[r]))return !0;for(var a=0;a<e.length;a++)if(ki(t,e[a]))return !0;return !!aa(t,e)}function Cr(t,e,r){return !!ki(t,e)||!!fn(e,t,r)}function Si(t,e){if(t.length===1)return sa(e,t[0]);for(var r=0;r<e.length;r++)for(var a=e[r],l=0;l<a.length;l++)if(ki(t,a[l]))return !0;for(var c=0;c<t.length;c++)if(sa(e,t[c]))return !0;for(var h=0;h<e.length;h++)if(aa(t,e[h]))return !0;return !1}function si(t,e,r){if(t.length>1){if(aa(t,e))return !0;for(var a=0;a<e.length;a++)if(fn(e[a],t,r))return !0}for(var l=0;l<t.length;l++)if(fn(t[l],e,r))return !0;return !1}function aa(t,e){if(t.length===0||e.length===0)return !1;for(var r=0;r<t.length-1;r++)for(var a=t[r],l=t[r+1],c=0;c<e.length-1;c++)if(So(a,l,e[c],e[c+1]))return !0;return !1}function So(t,e,r,a){return Br(t,r,a)!==Br(e,r,a)&&Br(t,e,r)!==Br(t,e,a)}function fn(t,e,r){var a=r*r;if(e.length===1)return t.distSqr(e[0])<a;for(var l=1;l<e.length;l++)if(To(t,e[l-1],e[l])<a)return !0;return !1}function To(t,e,r){var a=e.distSqr(r);if(a===0)return t.distSqr(e);var l=((t.x-e.x)*(r.x-e.x)+(t.y-e.y)*(r.y-e.y))/a;return t.distSqr(l<0?e:l>1?r:r.sub(e)._mult(l)._add(e))}function sa(t,e){for(var r,a,l,c=!1,h=0;h<t.length;h++)for(var m=0,g=(r=t[h]).length-1;m<r.length;g=m++)(a=r[m]).y>e.y!=(l=r[g]).y>e.y&&e.x<(l.x-a.x)*(e.y-a.y)/(l.y-a.y)+a.x&&(c=!c);return c}function ki(t,e){for(var r=!1,a=0,l=t.length-1;a<t.length;l=a++){var c=t[a],h=t[l];c.y>e.y!=h.y>e.y&&e.x<(h.x-c.x)*(e.y-c.y)/(h.y-c.y)+c.x&&(r=!r);}return r}function la(t,e,r){var a=r[0],l=r[2];if(t.x<a.x&&e.x<a.x||t.x>l.x&&e.x>l.x||t.y<a.y&&e.y<a.y||t.y>l.y&&e.y>l.y)return !1;var c=Br(t,e,r[0]);return c!==Br(t,e,r[1])||c!==Br(t,e,r[2])||c!==Br(t,e,r[3])}function Mi(t,e,r){var a=e.paint.get(t).value;return a.kind==="constant"?a.value:r.programConfigurations.get(e.id).getMaxValue(t)}function Ye(t){return Math.sqrt(t[0]*t[0]+t[1]*t[1])}function Zi(t,e,r,a,l){if(!e[0]&&!e[1])return t;var c=jt.convert(e)._mult(l);r==="viewport"&&c._rotate(-a);for(var h=[],m=0;m<t.length;m++)h.push(t[m].sub(c));return h}Sr.prototype.populate=function(t,e,r){var a=this.layers[0],l=[],c=null;a.type==="circle"&&(c=a.layout.get("circle-sort-key"));for(var h=0,m=t;h<m.length;h+=1){var g=m[h],_=g.feature,x=g.id,b=g.index,I=g.sourceLayerIndex,E=this.layers[0]._featureFilter.needGeometry,L=Ue(_,E);if(this.layers[0]._featureFilter.filter(new Jt(this.zoom),L,r)){var B=c?c.evaluate(L,{},r):void 0,q={id:x,properties:_.properties,type:_.type,sourceLayerIndex:I,index:b,geometry:E?L.geometry:Ce(_),patterns:{},sortKey:B};l.push(q);}}c&&l.sort(function(ft,zt){return ft.sortKey-zt.sortKey});for(var V=0,W=l;V<W.length;V+=1){var J=W[V],Y=J.geometry,$=J.index,nt=J.sourceLayerIndex,ut=t[$].feature;this.addFeature(J,Y,$,r),e.featureIndex.insert(ut,Y,$,nt,this.index);}},Sr.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},Sr.prototype.isEmpty=function(){return this.layoutVertexArray.length===0},Sr.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},Sr.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,P),this.indexBuffer=t.createIndexBuffer(this.indexArray)),this.programConfigurations.upload(t),this.uploaded=!0;},Sr.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy());},Sr.prototype.addFeature=function(t,e,r,a){for(var l=0,c=e;l<c.length;l+=1)for(var h=0,m=c[l];h<m.length;h+=1){var g=m[h],_=g.x,x=g.y;if(!(_<0||_>=8192||x<0||x>=8192)){var b=this.segments.prepareSegment(4,this.layoutVertexArray,this.indexArray,t.sortKey),I=b.vertexLength;jr(this.layoutVertexArray,_,x,-1,-1),jr(this.layoutVertexArray,_,x,1,-1),jr(this.layoutVertexArray,_,x,1,1),jr(this.layoutVertexArray,_,x,-1,1),this.indexArray.emplaceBack(I,I+1,I+2),this.indexArray.emplaceBack(I,I+3,I+2),b.vertexLength+=4,b.primitiveLength+=2;}}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,{},a);},Tt("CircleBucket",Sr,{omit:["layers"]});var dn=new hr({"circle-sort-key":new Et(C.layout_circle["circle-sort-key"])}),Xn={paint:new hr({"circle-radius":new Et(C.paint_circle["circle-radius"]),"circle-color":new Et(C.paint_circle["circle-color"]),"circle-blur":new Et(C.paint_circle["circle-blur"]),"circle-opacity":new Et(C.paint_circle["circle-opacity"]),"circle-translate":new Ct(C.paint_circle["circle-translate"]),"circle-translate-anchor":new Ct(C.paint_circle["circle-translate-anchor"]),"circle-pitch-scale":new Ct(C.paint_circle["circle-pitch-scale"]),"circle-pitch-alignment":new Ct(C.paint_circle["circle-pitch-alignment"]),"circle-stroke-width":new Et(C.paint_circle["circle-stroke-width"]),"circle-stroke-color":new Et(C.paint_circle["circle-stroke-color"]),"circle-stroke-opacity":new Et(C.paint_circle["circle-stroke-opacity"])}),layout:dn},ce=typeof Float32Array!="undefined"?Float32Array:Array;function Kr(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function kr(t,e,r){var a=e[0],l=e[1],c=e[2],h=e[3],m=e[4],g=e[5],_=e[6],x=e[7],b=e[8],I=e[9],E=e[10],L=e[11],B=e[12],q=e[13],V=e[14],W=e[15],J=r[0],Y=r[1],$=r[2],nt=r[3];return t[0]=J*a+Y*m+$*b+nt*B,t[1]=J*l+Y*g+$*I+nt*q,t[2]=J*c+Y*_+$*E+nt*V,t[3]=J*h+Y*x+$*L+nt*W,t[4]=(J=r[4])*a+(Y=r[5])*m+($=r[6])*b+(nt=r[7])*B,t[5]=J*l+Y*g+$*I+nt*q,t[6]=J*c+Y*_+$*E+nt*V,t[7]=J*h+Y*x+$*L+nt*W,t[8]=(J=r[8])*a+(Y=r[9])*m+($=r[10])*b+(nt=r[11])*B,t[9]=J*l+Y*g+$*I+nt*q,t[10]=J*c+Y*_+$*E+nt*V,t[11]=J*h+Y*x+$*L+nt*W,t[12]=(J=r[12])*a+(Y=r[13])*m+($=r[14])*b+(nt=r[15])*B,t[13]=J*l+Y*g+$*I+nt*q,t[14]=J*c+Y*_+$*E+nt*V,t[15]=J*h+Y*x+$*L+nt*W,t}Math.hypot||(Math.hypot=function(){for(var t=arguments,e=0,r=arguments.length;r--;)e+=t[r]*t[r];return Math.sqrt(e)});var Wn,Zu=kr;function Ga(t,e,r){var a=e[0],l=e[1],c=e[2],h=e[3];return t[0]=r[0]*a+r[4]*l+r[8]*c+r[12]*h,t[1]=r[1]*a+r[5]*l+r[9]*c+r[13]*h,t[2]=r[2]*a+r[6]*l+r[10]*c+r[14]*h,t[3]=r[3]*a+r[7]*l+r[11]*c+r[15]*h,t}Wn=new ce(3),ce!=Float32Array&&(Wn[0]=0,Wn[1]=0,Wn[2]=0),function(){var t=new ce(4);ce!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0,t[3]=0);}();var Gu=(function(){var t=new ce(2);ce!=Float32Array&&(t[0]=0,t[1]=0);}(),function(t){function e(r){t.call(this,r,Xn);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.createBucket=function(r){return new Sr(r)},e.prototype.queryRadius=function(r){var a=r;return Mi("circle-radius",this,a)+Mi("circle-stroke-width",this,a)+Ye(this.paint.get("circle-translate"))},e.prototype.queryIntersectsFeature=function(r,a,l,c,h,m,g,_){for(var x=Zi(r,this.paint.get("circle-translate"),this.paint.get("circle-translate-anchor"),m.angle,g),b=this.paint.get("circle-radius").evaluate(a,l)+this.paint.get("circle-stroke-width").evaluate(a,l),I=this.paint.get("circle-pitch-alignment")==="map",E=I?x:function(ut,ft){return ut.map(function(zt){return ua(zt,ft)})}(x,_),L=I?b*g:b,B=0,q=c;B<q.length;B+=1)for(var V=0,W=q[B];V<W.length;V+=1){var J=W[V],Y=I?J:ua(J,_),$=L,nt=Ga([],[J.x,J.y,0,1],_);if(this.paint.get("circle-pitch-scale")==="viewport"&&this.paint.get("circle-pitch-alignment")==="map"?$*=nt[3]/m.cameraToCenterDistance:this.paint.get("circle-pitch-scale")==="map"&&this.paint.get("circle-pitch-alignment")==="viewport"&&($*=m.cameraToCenterDistance/nt[3]),Cr(E,Y,$))return !0}return !1},e}(zi));function ua(t,e){var r=Ga([],[t.x,t.y,0,1],e);return new jt(r[0]/r[3],r[1]/r[3])}var Hl=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(Sr);function Io(t,e,r,a){var l=e.width,c=e.height;if(a){if(a instanceof Uint8ClampedArray)a=new Uint8Array(a.buffer);else if(a.length!==l*c*r)throw new RangeError("mismatched image size")}else a=new Uint8Array(l*c*r);return t.width=l,t.height=c,t.data=a,t}function Xa(t,e,r){var a=e.width,l=e.height;if(a!==t.width||l!==t.height){var c=Io({},{width:a,height:l},r);Xu(t,c,{x:0,y:0},{x:0,y:0},{width:Math.min(t.width,a),height:Math.min(t.height,l)},r),t.width=a,t.height=l,t.data=c.data;}}function Xu(t,e,r,a,l,c){if(l.width===0||l.height===0)return e;if(l.width>t.width||l.height>t.height||r.x>t.width-l.width||r.y>t.height-l.height)throw new RangeError("out of range source coordinates for image copy");if(l.width>e.width||l.height>e.height||a.x>e.width-l.width||a.y>e.height-l.height)throw new RangeError("out of range destination coordinates for image copy");for(var h=t.data,m=e.data,g=0;g<l.height;g++)for(var _=((r.y+g)*t.width+r.x)*c,x=((a.y+g)*e.width+a.x)*c,b=0;b<l.width*c;b++)m[x+b]=h[_+b];return e}Tt("HeatmapBucket",Hl,{omit:["layers"]});var ca=function(t,e){Io(this,t,1,e);};ca.prototype.resize=function(t){Xa(this,t,1);},ca.prototype.clone=function(){return new ca({width:this.width,height:this.height},new Uint8Array(this.data))},ca.copy=function(t,e,r,a,l){Xu(t,e,r,a,l,1);};var qr=function(t,e){Io(this,t,4,e);};qr.prototype.resize=function(t){Xa(this,t,4);},qr.prototype.replace=function(t,e){e?this.data.set(t):this.data=t instanceof Uint8ClampedArray?new Uint8Array(t.buffer):t;},qr.prototype.clone=function(){return new qr({width:this.width,height:this.height},new Uint8Array(this.data))},qr.copy=function(t,e,r,a,l){Xu(t,e,r,a,l,4);},Tt("AlphaImage",ca),Tt("RGBAImage",qr);var qp={paint:new hr({"heatmap-radius":new Et(C.paint_heatmap["heatmap-radius"]),"heatmap-weight":new Et(C.paint_heatmap["heatmap-weight"]),"heatmap-intensity":new Ct(C.paint_heatmap["heatmap-intensity"]),"heatmap-color":new wi(C.paint_heatmap["heatmap-color"]),"heatmap-opacity":new Ct(C.paint_heatmap["heatmap-opacity"])})};function Sc(t){var e={},r=t.resolution||256,a=t.clips?t.clips.length:1,l=t.image||new qr({width:r,height:a}),c=function(L,B,q){e[t.evaluationKey]=q;var V=t.expression.evaluate(e);l.data[L+B+0]=Math.floor(255*V.r/V.a),l.data[L+B+1]=Math.floor(255*V.g/V.a),l.data[L+B+2]=Math.floor(255*V.b/V.a),l.data[L+B+3]=Math.floor(255*V.a);};if(t.clips)for(var h=0,m=0;h<a;++h,m+=4*r)for(var g=0,_=0;g<r;g++,_+=4){var x=g/(r-1),b=t.clips[h];c(m,_,b.start*(1-x)+b.end*x);}else for(var I=0,E=0;I<r;I++,E+=4)c(0,E,I/(r-1));return l}var Zp=function(t){function e(r){t.call(this,r,qp),this._updateColorRamp();}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.createBucket=function(r){return new Hl(r)},e.prototype._handleSpecialPaintPropertyUpdate=function(r){r==="heatmap-color"&&this._updateColorRamp();},e.prototype._updateColorRamp=function(){this.colorRamp=Sc({expression:this._transitionablePaint._values["heatmap-color"].value.expression,evaluationKey:"heatmapDensity",image:this.colorRamp}),this.colorRampTexture=null;},e.prototype.resize=function(){this.heatmapFbo&&(this.heatmapFbo.destroy(),this.heatmapFbo=null);},e.prototype.queryRadius=function(){return 0},e.prototype.queryIntersectsFeature=function(){return !1},e.prototype.hasOffscreenPass=function(){return this.paint.get("heatmap-opacity")!==0&&this.visibility!=="none"},e}(zi),Gp={paint:new hr({"hillshade-illumination-direction":new Ct(C.paint_hillshade["hillshade-illumination-direction"]),"hillshade-illumination-anchor":new Ct(C.paint_hillshade["hillshade-illumination-anchor"]),"hillshade-exaggeration":new Ct(C.paint_hillshade["hillshade-exaggeration"]),"hillshade-shadow-color":new Ct(C.paint_hillshade["hillshade-shadow-color"]),"hillshade-highlight-color":new Ct(C.paint_hillshade["hillshade-highlight-color"]),"hillshade-accent-color":new Ct(C.paint_hillshade["hillshade-accent-color"])})},Xp=function(t){function e(r){t.call(this,r,Gp);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.hasOffscreenPass=function(){return this.paint.get("hillshade-exaggeration")!==0&&this.visibility!=="none"},e}(zi),Wp=ir([{name:"a_pos",components:2,type:"Int16"}],4).members,Wu=Jl,Kp=Jl;function Jl(t,e,r){r=r||2;var a,l,c,h,m,g,_,x=e&&e.length,b=x?e[0]*r:t.length,I=Tc(t,0,b,r,!0),E=[];if(!I||I.next===I.prev)return E;if(x&&(I=function(B,q,V,W){var J,Y,$,nt=[];for(J=0,Y=q.length;J<Y;J++)($=Tc(B,q[J]*W,J<Y-1?q[J+1]*W:B.length,W,!1))===$.next&&($.steiner=!0),nt.push(rh($));for(nt.sort($p),J=0;J<nt.length;J++)th(nt[J],V),V=Eo(V,V.next);return V}(t,e,I,r)),t.length>80*r){a=c=t[0],l=h=t[1];for(var L=r;L<b;L+=r)(m=t[L])<a&&(a=m),(g=t[L+1])<l&&(l=g),m>c&&(c=m),g>h&&(h=g);_=(_=Math.max(c-a,h-l))!==0?1/_:0;}return Ws(I,E,r,a,l,_),E}function Tc(t,e,r,a,l){var c,h;if(l===Ju(t,e,r,a)>0)for(c=e;c<r;c+=a)h=Ac(c,t[c],t[c+1],h);else for(c=r-a;c>=e;c-=a)h=Ac(c,t[c],t[c+1],h);return h&&Yl(h,h.next)&&(Hs(h),h=h.next),h}function Eo(t,e){if(!t)return t;e||(e=t);var r,a=t;do if(r=!1,a.steiner||!Yl(a,a.next)&&We(a.prev,a,a.next)!==0)a=a.next;else {if(Hs(a),(a=e=a.prev)===a.next)break;r=!0;}while(r||a!==e);return e}function Ws(t,e,r,a,l,c,h){if(t){!h&&c&&function(x,b,I,E){var L=x;do L.z===null&&(L.z=Ku(L.x,L.y,b,I,E)),L.prevZ=L.prev,L.nextZ=L.next,L=L.next;while(L!==x);L.prevZ.nextZ=null,L.prevZ=null,function(B){var q,V,W,J,Y,$,nt,ut,ft=1;do{for(V=B,B=null,Y=null,$=0;V;){for($++,W=V,nt=0,q=0;q<ft&&(nt++,W=W.nextZ);q++);for(ut=ft;nt>0||ut>0&&W;)nt!==0&&(ut===0||!W||V.z<=W.z)?(J=V,V=V.nextZ,nt--):(J=W,W=W.nextZ,ut--),Y?Y.nextZ=J:B=J,J.prevZ=Y,Y=J;V=W;}Y.nextZ=null,ft*=2;}while($>1)}(L);}(t,a,l,c);for(var m,g,_=t;t.prev!==t.next;)if(m=t.prev,g=t.next,c?Jp(t,a,l,c):Hp(t))e.push(m.i/r),e.push(t.i/r),e.push(g.i/r),Hs(t),t=g.next,_=g.next;else if((t=g)===_){h?h===1?Ws(t=Yp(Eo(t),e,r),e,r,a,l,c,2):h===2&&Qp(t,e,r,a,l,c):Ws(Eo(t),e,r,a,l,c,1);break}}}function Hp(t){var e=t.prev,r=t,a=t.next;if(We(e,r,a)>=0)return !1;for(var l=t.next.next;l!==t.prev;){if(Wa(e.x,e.y,r.x,r.y,a.x,a.y,l.x,l.y)&&We(l.prev,l,l.next)>=0)return !1;l=l.next;}return !0}function Jp(t,e,r,a){var l=t.prev,c=t,h=t.next;if(We(l,c,h)>=0)return !1;for(var m=l.x>c.x?l.x>h.x?l.x:h.x:c.x>h.x?c.x:h.x,g=l.y>c.y?l.y>h.y?l.y:h.y:c.y>h.y?c.y:h.y,_=Ku(l.x<c.x?l.x<h.x?l.x:h.x:c.x<h.x?c.x:h.x,l.y<c.y?l.y<h.y?l.y:h.y:c.y<h.y?c.y:h.y,e,r,a),x=Ku(m,g,e,r,a),b=t.prevZ,I=t.nextZ;b&&b.z>=_&&I&&I.z<=x;){if(b!==t.prev&&b!==t.next&&Wa(l.x,l.y,c.x,c.y,h.x,h.y,b.x,b.y)&&We(b.prev,b,b.next)>=0)return !1;if(b=b.prevZ,I!==t.prev&&I!==t.next&&Wa(l.x,l.y,c.x,c.y,h.x,h.y,I.x,I.y)&&We(I.prev,I,I.next)>=0)return !1;I=I.nextZ;}for(;b&&b.z>=_;){if(b!==t.prev&&b!==t.next&&Wa(l.x,l.y,c.x,c.y,h.x,h.y,b.x,b.y)&&We(b.prev,b,b.next)>=0)return !1;b=b.prevZ;}for(;I&&I.z<=x;){if(I!==t.prev&&I!==t.next&&Wa(l.x,l.y,c.x,c.y,h.x,h.y,I.x,I.y)&&We(I.prev,I,I.next)>=0)return !1;I=I.nextZ;}return !0}function Yp(t,e,r){var a=t;do{var l=a.prev,c=a.next.next;!Yl(l,c)&&Ic(l,a,a.next,c)&&Ks(l,c)&&Ks(c,l)&&(e.push(l.i/r),e.push(a.i/r),e.push(c.i/r),Hs(a),Hs(a.next),a=t=c),a=a.next;}while(a!==t);return Eo(a)}function Qp(t,e,r,a,l,c){var h=t;do{for(var m=h.next.next;m!==h.prev;){if(h.i!==m.i&&ih(h,m)){var g=Ec(h,m);return h=Eo(h,h.next),g=Eo(g,g.next),Ws(h,e,r,a,l,c),void Ws(g,e,r,a,l,c)}m=m.next;}h=h.next;}while(h!==t)}function $p(t,e){return t.x-e.x}function th(t,e){if(e=function(a,l){var c,h=l,m=a.x,g=a.y,_=-1/0;do{if(g<=h.y&&g>=h.next.y&&h.next.y!==h.y){var x=h.x+(g-h.y)*(h.next.x-h.x)/(h.next.y-h.y);if(x<=m&&x>_){if(_=x,x===m){if(g===h.y)return h;if(g===h.next.y)return h.next}c=h.x<h.next.x?h:h.next;}}h=h.next;}while(h!==l);if(!c)return null;if(m===_)return c;var b,I=c,E=c.x,L=c.y,B=1/0;h=c;do m>=h.x&&h.x>=E&&m!==h.x&&Wa(g<L?m:_,g,E,L,g<L?_:m,g,h.x,h.y)&&(b=Math.abs(g-h.y)/(m-h.x),Ks(h,a)&&(b<B||b===B&&(h.x>c.x||h.x===c.x&&eh(c,h)))&&(c=h,B=b)),h=h.next;while(h!==I);return c}(t,e)){var r=Ec(e,t);Eo(e,e.next),Eo(r,r.next);}}function eh(t,e){return We(t.prev,t,e.prev)<0&&We(e.next,t,t.next)<0}function Ku(t,e,r,a,l){return (t=1431655765&((t=858993459&((t=252645135&((t=16711935&((t=32767*(t-r)*l)|t<<8))|t<<4))|t<<2))|t<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=32767*(e-a)*l)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function rh(t){var e=t,r=t;do(e.x<r.x||e.x===r.x&&e.y<r.y)&&(r=e),e=e.next;while(e!==t);return r}function Wa(t,e,r,a,l,c,h,m){return (l-h)*(e-m)-(t-h)*(c-m)>=0&&(t-h)*(a-m)-(r-h)*(e-m)>=0&&(r-h)*(c-m)-(l-h)*(a-m)>=0}function ih(t,e){return t.next.i!==e.i&&t.prev.i!==e.i&&!function(r,a){var l=r;do{if(l.i!==r.i&&l.next.i!==r.i&&l.i!==a.i&&l.next.i!==a.i&&Ic(l,l.next,r,a))return !0;l=l.next;}while(l!==r);return !1}(t,e)&&(Ks(t,e)&&Ks(e,t)&&function(r,a){var l=r,c=!1,h=(r.x+a.x)/2,m=(r.y+a.y)/2;do l.y>m!=l.next.y>m&&l.next.y!==l.y&&h<(l.next.x-l.x)*(m-l.y)/(l.next.y-l.y)+l.x&&(c=!c),l=l.next;while(l!==r);return c}(t,e)&&(We(t.prev,t,e.prev)||We(t,e.prev,e))||Yl(t,e)&&We(t.prev,t,t.next)>0&&We(e.prev,e,e.next)>0)}function We(t,e,r){return (e.y-t.y)*(r.x-e.x)-(e.x-t.x)*(r.y-e.y)}function Yl(t,e){return t.x===e.x&&t.y===e.y}function Ic(t,e,r,a){var l=$l(We(t,e,r)),c=$l(We(t,e,a)),h=$l(We(r,a,t)),m=$l(We(r,a,e));return l!==c&&h!==m||!(l!==0||!Ql(t,r,e))||!(c!==0||!Ql(t,a,e))||!(h!==0||!Ql(r,t,a))||!(m!==0||!Ql(r,e,a))}function Ql(t,e,r){return e.x<=Math.max(t.x,r.x)&&e.x>=Math.min(t.x,r.x)&&e.y<=Math.max(t.y,r.y)&&e.y>=Math.min(t.y,r.y)}function $l(t){return t>0?1:t<0?-1:0}function Ks(t,e){return We(t.prev,t,t.next)<0?We(t,e,t.next)>=0&&We(t,t.prev,e)>=0:We(t,e,t.prev)<0||We(t,t.next,e)<0}function Ec(t,e){var r=new Hu(t.i,t.x,t.y),a=new Hu(e.i,e.x,e.y),l=t.next,c=e.prev;return t.next=e,e.prev=t,r.next=l,l.prev=r,a.next=r,r.prev=a,c.next=a,a.prev=c,a}function Ac(t,e,r,a){var l=new Hu(t,e,r);return a?(l.next=a.next,l.prev=a,a.next.prev=l,a.next=l):(l.prev=l,l.next=l),l}function Hs(t){t.next.prev=t.prev,t.prev.next=t.next,t.prevZ&&(t.prevZ.nextZ=t.nextZ),t.nextZ&&(t.nextZ.prevZ=t.prevZ);}function Hu(t,e,r){this.i=t,this.x=e,this.y=r,this.prev=null,this.next=null,this.z=null,this.prevZ=null,this.nextZ=null,this.steiner=!1;}function Ju(t,e,r,a){for(var l=0,c=e,h=r-a;c<r;c+=a)l+=(t[h]-t[c])*(t[c+1]+t[h+1]),h=c;return l}function nh(t,e,r,a,l){!function c(h,m,g,_,x){for(;_>g;){if(_-g>600){var b=_-g+1,I=m-g+1,E=Math.log(b),L=.5*Math.exp(2*E/3),B=.5*Math.sqrt(E*L*(b-L)/b)*(I-b/2<0?-1:1);c(h,m,Math.max(g,Math.floor(m-I*L/b+B)),Math.min(_,Math.floor(m+(b-I)*L/b+B)),x);}var q=h[m],V=g,W=_;for(Js(h,g,m),x(h[_],q)>0&&Js(h,g,_);V<W;){for(Js(h,V,W),V++,W--;x(h[V],q)<0;)V++;for(;x(h[W],q)>0;)W--;}x(h[g],q)===0?Js(h,g,W):Js(h,++W,_),W<=m&&(g=W+1),m<=W&&(_=W-1);}}(t,e,r||0,a||t.length-1,l||oh);}function Js(t,e,r){var a=t[e];t[e]=t[r],t[r]=a;}function oh(t,e){return t<e?-1:t>e?1:0}function Yu(t,e){var r=t.length;if(r<=1)return [t];for(var a,l,c=[],h=0;h<r;h++){var m=_a(t[h]);m!==0&&(t[h].area=Math.abs(m),l===void 0&&(l=m<0),l===m<0?(a&&c.push(a),a=[t[h]]):a.push(t[h]));}if(a&&c.push(a),e>1)for(var g=0;g<c.length;g++)c[g].length<=e||(nh(c[g],e,1,c[g].length-1,ah),c[g]=c[g].slice(0,e));return c}function ah(t,e){return e.area-t.area}function Qu(t,e,r){for(var a=r.patternDependencies,l=!1,c=0,h=e;c<h.length;c+=1){var m=h[c].paint.get(t+"-pattern");m.isConstant()||(l=!0);var g=m.constantOr(null);g&&(l=!0,a[g.to]=!0,a[g.from]=!0);}return l}function $u(t,e,r,a,l){for(var c=l.patternDependencies,h=0,m=e;h<m.length;h+=1){var g=m[h],_=g.paint.get(t+"-pattern").value;if(_.kind!=="constant"){var x=_.evaluate({zoom:a-1},r,{},l.availableImages),b=_.evaluate({zoom:a},r,{},l.availableImages),I=_.evaluate({zoom:a+1},r,{},l.availableImages);b=b&&b.name?b.name:b,I=I&&I.name?I.name:I,c[x=x&&x.name?x.name:x]=!0,c[b]=!0,c[I]=!0,r.patterns[g.id]={min:x,mid:b,max:I};}}return r}Jl.deviation=function(t,e,r,a){var l=e&&e.length,c=Math.abs(Ju(t,0,l?e[0]*r:t.length,r));if(l)for(var h=0,m=e.length;h<m;h++)c-=Math.abs(Ju(t,e[h]*r,h<m-1?e[h+1]*r:t.length,r));var g=0;for(h=0;h<a.length;h+=3){var _=a[h]*r,x=a[h+1]*r,b=a[h+2]*r;g+=Math.abs((t[_]-t[b])*(t[x+1]-t[_+1])-(t[_]-t[x])*(t[b+1]-t[_+1]));}return c===0&&g===0?0:Math.abs((g-c)/c)},Jl.flatten=function(t){for(var e=t[0][0].length,r={vertices:[],holes:[],dimensions:e},a=0,l=0;l<t.length;l++){for(var c=0;c<t[l].length;c++)for(var h=0;h<e;h++)r.vertices.push(t[l][c][h]);l>0&&r.holes.push(a+=t[l-1].length);}return r},Wu.default=Kp;var Gi=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map(function(e){return e.id}),this.index=t.index,this.hasPattern=!1,this.patternFeatures=[],this.layoutVertexArray=new Zn,this.indexArray=new un,this.indexArray2=new oa,this.programConfigurations=new Rt(t.layers,t.zoom),this.segments=new z,this.segments2=new z,this.stateDependentLayerIds=this.layers.filter(function(e){return e.isStateDependent()}).map(function(e){return e.id});};Gi.prototype.populate=function(t,e,r){this.hasPattern=Qu("fill",this.layers,e);for(var a=this.layers[0].layout.get("fill-sort-key"),l=[],c=0,h=t;c<h.length;c+=1){var m=h[c],g=m.feature,_=m.id,x=m.index,b=m.sourceLayerIndex,I=this.layers[0]._featureFilter.needGeometry,E=Ue(g,I);if(this.layers[0]._featureFilter.filter(new Jt(this.zoom),E,r)){var L=a?a.evaluate(E,{},r,e.availableImages):void 0,B={id:_,properties:g.properties,type:g.type,sourceLayerIndex:b,index:x,geometry:I?E.geometry:Ce(g),patterns:{},sortKey:L};l.push(B);}}a&&l.sort(function(ut,ft){return ut.sortKey-ft.sortKey});for(var q=0,V=l;q<V.length;q+=1){var W=V[q],J=W.geometry,Y=W.index,$=W.sourceLayerIndex;if(this.hasPattern){var nt=$u("fill",this.layers,W,this.zoom,e);this.patternFeatures.push(nt);}else this.addFeature(W,J,Y,r,{});e.featureIndex.insert(t[Y].feature,J,Y,$,this.index);}},Gi.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},Gi.prototype.addFeatures=function(t,e,r){for(var a=0,l=this.patternFeatures;a<l.length;a+=1){var c=l[a];this.addFeature(c,c.geometry,c.index,e,r);}},Gi.prototype.isEmpty=function(){return this.layoutVertexArray.length===0},Gi.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},Gi.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,Wp),this.indexBuffer=t.createIndexBuffer(this.indexArray),this.indexBuffer2=t.createIndexBuffer(this.indexArray2)),this.programConfigurations.upload(t),this.uploaded=!0;},Gi.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.indexBuffer2.destroy(),this.programConfigurations.destroy(),this.segments.destroy(),this.segments2.destroy());},Gi.prototype.addFeature=function(t,e,r,a,l){for(var c=0,h=Yu(e,500);c<h.length;c+=1){for(var m=h[c],g=0,_=0,x=m;_<x.length;_+=1)g+=x[_].length;for(var b=this.segments.prepareSegment(g,this.layoutVertexArray,this.indexArray),I=b.vertexLength,E=[],L=[],B=0,q=m;B<q.length;B+=1){var V=q[B];if(V.length!==0){V!==m[0]&&L.push(E.length/2);var W=this.segments2.prepareSegment(V.length,this.layoutVertexArray,this.indexArray2),J=W.vertexLength;this.layoutVertexArray.emplaceBack(V[0].x,V[0].y),this.indexArray2.emplaceBack(J+V.length-1,J),E.push(V[0].x),E.push(V[0].y);for(var Y=1;Y<V.length;Y++)this.layoutVertexArray.emplaceBack(V[Y].x,V[Y].y),this.indexArray2.emplaceBack(J+Y-1,J+Y),E.push(V[Y].x),E.push(V[Y].y);W.vertexLength+=V.length,W.primitiveLength+=V.length;}}for(var $=Wu(E,L),nt=0;nt<$.length;nt+=3)this.indexArray.emplaceBack(I+$[nt],I+$[nt+1],I+$[nt+2]);b.vertexLength+=g,b.primitiveLength+=$.length/3;}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,l,a);},Tt("FillBucket",Gi,{omit:["layers","patternFeatures"]});var sh=new hr({"fill-sort-key":new Et(C.layout_fill["fill-sort-key"])}),lh={paint:new hr({"fill-antialias":new Ct(C.paint_fill["fill-antialias"]),"fill-opacity":new Et(C.paint_fill["fill-opacity"]),"fill-color":new Et(C.paint_fill["fill-color"]),"fill-outline-color":new Et(C.paint_fill["fill-outline-color"]),"fill-translate":new Ct(C.paint_fill["fill-translate"]),"fill-translate-anchor":new Ct(C.paint_fill["fill-translate-anchor"]),"fill-pattern":new Va(C.paint_fill["fill-pattern"])}),layout:sh},uh=function(t){function e(r){t.call(this,r,lh);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.recalculate=function(r,a){t.prototype.recalculate.call(this,r,a);var l=this.paint._values["fill-outline-color"];l.value.kind==="constant"&&l.value.value===void 0&&(this.paint._values["fill-outline-color"]=this.paint._values["fill-color"]);},e.prototype.createBucket=function(r){return new Gi(r)},e.prototype.queryRadius=function(){return Ye(this.paint.get("fill-translate"))},e.prototype.queryIntersectsFeature=function(r,a,l,c,h,m,g){return Si(Zi(r,this.paint.get("fill-translate"),this.paint.get("fill-translate-anchor"),m.angle,g),c)},e.prototype.isTileClipped=function(){return !0},e}(zi),ch=ir([{name:"a_pos",components:2,type:"Int16"},{name:"a_normal_ed",components:4,type:"Int16"}],4).members,Pc=Ka;function Ka(t,e,r,a,l){this.properties={},this.extent=r,this.type=0,this._pbf=t,this._geometry=-1,this._keys=a,this._values=l,t.readFields(ph,this,e);}function ph(t,e,r){t==1?e.id=r.readVarint():t==2?function(a,l){for(var c=a.readVarint()+a.pos;a.pos<c;){var h=l._keys[a.readVarint()],m=l._values[a.readVarint()];l.properties[h]=m;}}(r,e):t==3?e.type=r.readVarint():t==4&&(e._geometry=r.pos);}function hh(t){for(var e,r,a=0,l=0,c=t.length,h=c-1;l<c;h=l++)a+=((r=t[h]).x-(e=t[l]).x)*(e.y+r.y);return a}Ka.types=["Unknown","Point","LineString","Polygon"],Ka.prototype.loadGeometry=function(){var t=this._pbf;t.pos=this._geometry;for(var e,r=t.readVarint()+t.pos,a=1,l=0,c=0,h=0,m=[];t.pos<r;){if(l<=0){var g=t.readVarint();a=7&g,l=g>>3;}if(l--,a===1||a===2)c+=t.readSVarint(),h+=t.readSVarint(),a===1&&(e&&m.push(e),e=[]),e.push(new jt(c,h));else {if(a!==7)throw new Error("unknown command "+a);e&&e.push(e[0].clone());}}return e&&m.push(e),m},Ka.prototype.bbox=function(){var t=this._pbf;t.pos=this._geometry;for(var e=t.readVarint()+t.pos,r=1,a=0,l=0,c=0,h=1/0,m=-1/0,g=1/0,_=-1/0;t.pos<e;){if(a<=0){var x=t.readVarint();r=7&x,a=x>>3;}if(a--,r===1||r===2)(l+=t.readSVarint())<h&&(h=l),l>m&&(m=l),(c+=t.readSVarint())<g&&(g=c),c>_&&(_=c);else if(r!==7)throw new Error("unknown command "+r)}return [h,g,m,_]},Ka.prototype.toGeoJSON=function(t,e,r){var a,l,c=this.extent*Math.pow(2,r),h=this.extent*t,m=this.extent*e,g=this.loadGeometry(),_=Ka.types[this.type];function x(E){for(var L=0;L<E.length;L++){var B=E[L];E[L]=[360*(B.x+h)/c-180,360/Math.PI*Math.atan(Math.exp((180-360*(B.y+m)/c)*Math.PI/180))-90];}}switch(this.type){case 1:var b=[];for(a=0;a<g.length;a++)b[a]=g[a][0];x(g=b);break;case 2:for(a=0;a<g.length;a++)x(g[a]);break;case 3:for(g=function(E){var L=E.length;if(L<=1)return [E];for(var B,q,V=[],W=0;W<L;W++){var J=hh(E[W]);J!==0&&(q===void 0&&(q=J<0),q===J<0?(B&&V.push(B),B=[E[W]]):B.push(E[W]));}return B&&V.push(B),V}(g),a=0;a<g.length;a++)for(l=0;l<g[a].length;l++)x(g[a][l]);}g.length===1?g=g[0]:_="Multi"+_;var I={type:"Feature",geometry:{type:_,coordinates:g},properties:this.properties};return "id"in this&&(I.id=this.id),I};var zc=Cc;function Cc(t,e){this.version=1,this.name=null,this.extent=4096,this.length=0,this._pbf=t,this._keys=[],this._values=[],this._features=[],t.readFields(fh,this,e),this.length=this._features.length;}function fh(t,e,r){t===15?e.version=r.readVarint():t===1?e.name=r.readString():t===5?e.extent=r.readVarint():t===2?e._features.push(r.pos):t===3?e._keys.push(r.readString()):t===4&&e._values.push(function(a){for(var l=null,c=a.readVarint()+a.pos;a.pos<c;){var h=a.readVarint()>>3;l=h===1?a.readString():h===2?a.readFloat():h===3?a.readDouble():h===4?a.readVarint64():h===5?a.readVarint():h===6?a.readSVarint():h===7?a.readBoolean():null;}return l}(r));}function dh(t,e,r){if(t===3){var a=new zc(r,r.readVarint()+r.pos);a.length&&(e[a.name]=a);}}Cc.prototype.feature=function(t){if(t<0||t>=this._features.length)throw new Error("feature index out of bounds");this._pbf.pos=this._features[t];var e=this._pbf.readVarint()+this._pbf.pos;return new Pc(this._pbf,e,this.extent,this._keys,this._values)};var Ha={VectorTile:function(t,e){this.layers=t.readFields(dh,{},e);},VectorTileFeature:Pc,VectorTileLayer:zc},mh=Ha.VectorTileFeature.types,tc=Math.pow(2,13);function Ys(t,e,r,a,l,c,h,m){t.emplaceBack(e,r,2*Math.floor(a*tc)+h,l*tc*2,c*tc*2,Math.round(m));}var Xi=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map(function(e){return e.id}),this.index=t.index,this.hasPattern=!1,this.layoutVertexArray=new qi,this.indexArray=new un,this.programConfigurations=new Rt(t.layers,t.zoom),this.segments=new z,this.stateDependentLayerIds=this.layers.filter(function(e){return e.isStateDependent()}).map(function(e){return e.id});};function yh(t,e){return t.x===e.x&&(t.x<0||t.x>8192)||t.y===e.y&&(t.y<0||t.y>8192)}Xi.prototype.populate=function(t,e,r){this.features=[],this.hasPattern=Qu("fill-extrusion",this.layers,e);for(var a=0,l=t;a<l.length;a+=1){var c=l[a],h=c.feature,m=c.id,g=c.index,_=c.sourceLayerIndex,x=this.layers[0]._featureFilter.needGeometry,b=Ue(h,x);if(this.layers[0]._featureFilter.filter(new Jt(this.zoom),b,r)){var I={id:m,sourceLayerIndex:_,index:g,geometry:x?b.geometry:Ce(h),properties:h.properties,type:h.type,patterns:{}};this.hasPattern?this.features.push($u("fill-extrusion",this.layers,I,this.zoom,e)):this.addFeature(I,I.geometry,g,r,{}),e.featureIndex.insert(h,I.geometry,g,_,this.index,!0);}}},Xi.prototype.addFeatures=function(t,e,r){for(var a=0,l=this.features;a<l.length;a+=1){var c=l[a];this.addFeature(c,c.geometry,c.index,e,r);}},Xi.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},Xi.prototype.isEmpty=function(){return this.layoutVertexArray.length===0},Xi.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},Xi.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,ch),this.indexBuffer=t.createIndexBuffer(this.indexArray)),this.programConfigurations.upload(t),this.uploaded=!0;},Xi.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy());},Xi.prototype.addFeature=function(t,e,r,a,l){for(var c=0,h=Yu(e,500);c<h.length;c+=1){for(var m=h[c],g=0,_=0,x=m;_<x.length;_+=1)g+=x[_].length;for(var b=this.segments.prepareSegment(4,this.layoutVertexArray,this.indexArray),I=0,E=m;I<E.length;I+=1){var L=E[I];if(L.length!==0&&!((Kt=L).every(function(qt){return qt.x<0})||Kt.every(function(qt){return qt.x>8192})||Kt.every(function(qt){return qt.y<0})||Kt.every(function(qt){return qt.y>8192})))for(var B=0,q=0;q<L.length;q++){var V=L[q];if(q>=1){var W=L[q-1];if(!yh(V,W)){b.vertexLength+4>z.MAX_VERTEX_ARRAY_LENGTH&&(b=this.segments.prepareSegment(4,this.layoutVertexArray,this.indexArray));var J=V.sub(W)._perp()._unit(),Y=W.dist(V);B+Y>32768&&(B=0),Ys(this.layoutVertexArray,V.x,V.y,J.x,J.y,0,0,B),Ys(this.layoutVertexArray,V.x,V.y,J.x,J.y,0,1,B),Ys(this.layoutVertexArray,W.x,W.y,J.x,J.y,0,0,B+=Y),Ys(this.layoutVertexArray,W.x,W.y,J.x,J.y,0,1,B);var $=b.vertexLength;this.indexArray.emplaceBack($,$+2,$+1),this.indexArray.emplaceBack($+1,$+2,$+3),b.vertexLength+=4,b.primitiveLength+=2;}}}}if(b.vertexLength+g>z.MAX_VERTEX_ARRAY_LENGTH&&(b=this.segments.prepareSegment(g,this.layoutVertexArray,this.indexArray)),mh[t.type]==="Polygon"){for(var nt=[],ut=[],ft=b.vertexLength,zt=0,gt=m;zt<gt.length;zt+=1){var Mt=gt[zt];if(Mt.length!==0){Mt!==m[0]&&ut.push(nt.length/2);for(var vt=0;vt<Mt.length;vt++){var Xt=Mt[vt];Ys(this.layoutVertexArray,Xt.x,Xt.y,0,0,1,1,0),nt.push(Xt.x),nt.push(Xt.y);}}}for(var Ft=Wu(nt,ut),At=0;At<Ft.length;At+=3)this.indexArray.emplaceBack(ft+Ft[At],ft+Ft[At+2],ft+Ft[At+1]);b.primitiveLength+=Ft.length/3,b.vertexLength+=g;}}var Kt;this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,l,a);},Tt("FillExtrusionBucket",Xi,{omit:["layers","features"]});var gh={paint:new hr({"fill-extrusion-opacity":new Ct(C["paint_fill-extrusion"]["fill-extrusion-opacity"]),"fill-extrusion-color":new Et(C["paint_fill-extrusion"]["fill-extrusion-color"]),"fill-extrusion-translate":new Ct(C["paint_fill-extrusion"]["fill-extrusion-translate"]),"fill-extrusion-translate-anchor":new Ct(C["paint_fill-extrusion"]["fill-extrusion-translate-anchor"]),"fill-extrusion-pattern":new Va(C["paint_fill-extrusion"]["fill-extrusion-pattern"]),"fill-extrusion-height":new Et(C["paint_fill-extrusion"]["fill-extrusion-height"]),"fill-extrusion-base":new Et(C["paint_fill-extrusion"]["fill-extrusion-base"]),"fill-extrusion-vertical-gradient":new Ct(C["paint_fill-extrusion"]["fill-extrusion-vertical-gradient"])})},_h=function(t){function e(r){t.call(this,r,gh);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.createBucket=function(r){return new Xi(r)},e.prototype.queryRadius=function(){return Ye(this.paint.get("fill-extrusion-translate"))},e.prototype.is3D=function(){return !0},e.prototype.queryIntersectsFeature=function(r,a,l,c,h,m,g,_){var x=Zi(r,this.paint.get("fill-extrusion-translate"),this.paint.get("fill-extrusion-translate-anchor"),m.angle,g),b=this.paint.get("fill-extrusion-height").evaluate(a,l),I=this.paint.get("fill-extrusion-base").evaluate(a,l),E=function(B,q,V,W){for(var J=[],Y=0,$=B;Y<$.length;Y+=1){var nt=$[Y],ut=[nt.x,nt.y,0,1];Ga(ut,ut,q),J.push(new jt(ut[0]/ut[3],ut[1]/ut[3]));}return J}(x,_),L=function(B,q,V,W){for(var J=[],Y=[],$=W[8]*q,nt=W[9]*q,ut=W[10]*q,ft=W[11]*q,zt=W[8]*V,gt=W[9]*V,Mt=W[10]*V,vt=W[11]*V,Xt=0,Ft=B;Xt<Ft.length;Xt+=1){for(var At=[],Kt=[],qt=0,ie=Ft[Xt];qt<ie.length;qt+=1){var Dt=ie[qt],ae=Dt.x,Ae=Dt.y,Le=W[0]*ae+W[4]*Ae+W[12],ke=W[1]*ae+W[5]*Ae+W[13],Pe=W[2]*ae+W[6]*Ae+W[14],Be=W[3]*ae+W[7]*Ae+W[15],Qe=Pe+ut,$e=Be+ft,Ir=Le+zt,ar=ke+gt,Er=Pe+Mt,Ve=Be+vt,sr=new jt((Le+$)/$e,(ke+nt)/$e);sr.z=Qe/$e,At.push(sr);var Yt=new jt(Ir/Ve,ar/Ve);Yt.z=Er/Ve,Kt.push(Yt);}J.push(At),Y.push(Kt);}return [J,Y]}(c,I,b,_);return function(B,q,V){var W=1/0;Si(V,q)&&(W=kc(V,q[0]));for(var J=0;J<q.length;J++)for(var Y=q[J],$=B[J],nt=0;nt<Y.length-1;nt++){var ut=Y[nt],ft=[ut,Y[nt+1],$[nt+1],$[nt],ut];hn(V,ft)&&(W=Math.min(W,kc(V,ft)));}return W!==1/0&&W}(L[0],L[1],E)},e}(zi);function Qs(t,e){return t.x*e.x+t.y*e.y}function kc(t,e){if(t.length===1){for(var r,a=0,l=e[a++];!r||l.equals(r);)if(!(r=e[a++]))return 1/0;for(;a<e.length;a++){var c=e[a],h=t[0],m=r.sub(l),g=c.sub(l),_=h.sub(l),x=Qs(m,m),b=Qs(m,g),I=Qs(g,g),E=Qs(_,m),L=Qs(_,g),B=x*I-b*b,q=(I*E-b*L)/B,V=(x*L-b*E)/B,W=l.z*(1-q-V)+r.z*q+c.z*V;if(isFinite(W))return W}return 1/0}for(var J=1/0,Y=0,$=e;Y<$.length;Y+=1)J=Math.min(J,$[Y].z);return J}var vh=ir([{name:"a_pos_normal",components:2,type:"Int16"},{name:"a_data",components:4,type:"Uint8"}],4).members,xh=ir([{name:"a_uv_x",components:1,type:"Float32"},{name:"a_split_index",components:1,type:"Float32"}]).members,bh=Ha.VectorTileFeature.types,wh=Math.cos(Math.PI/180*37.5),Mc=Math.pow(2,14)/.5,Mr=function(t){var e=this;this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map(function(r){return r.id}),this.index=t.index,this.hasPattern=!1,this.patternFeatures=[],this.lineClipsArray=[],this.gradients={},this.layers.forEach(function(r){e.gradients[r.id]={};}),this.layoutVertexArray=new Nr,this.layoutVertexArray2=new xo,this.indexArray=new un,this.programConfigurations=new Rt(t.layers,t.zoom),this.segments=new z,this.maxLineLength=0,this.stateDependentLayerIds=this.layers.filter(function(r){return r.isStateDependent()}).map(function(r){return r.id});};Mr.prototype.populate=function(t,e,r){this.hasPattern=Qu("line",this.layers,e);for(var a=this.layers[0].layout.get("line-sort-key"),l=[],c=0,h=t;c<h.length;c+=1){var m=h[c],g=m.feature,_=m.id,x=m.index,b=m.sourceLayerIndex,I=this.layers[0]._featureFilter.needGeometry,E=Ue(g,I);if(this.layers[0]._featureFilter.filter(new Jt(this.zoom),E,r)){var L=a?a.evaluate(E,{},r):void 0,B={id:_,properties:g.properties,type:g.type,sourceLayerIndex:b,index:x,geometry:I?E.geometry:Ce(g),patterns:{},sortKey:L};l.push(B);}}a&&l.sort(function(ut,ft){return ut.sortKey-ft.sortKey});for(var q=0,V=l;q<V.length;q+=1){var W=V[q],J=W.geometry,Y=W.index,$=W.sourceLayerIndex;if(this.hasPattern){var nt=$u("line",this.layers,W,this.zoom,e);this.patternFeatures.push(nt);}else this.addFeature(W,J,Y,r,{});e.featureIndex.insert(t[Y].feature,J,Y,$,this.index);}},Mr.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},Mr.prototype.addFeatures=function(t,e,r){for(var a=0,l=this.patternFeatures;a<l.length;a+=1){var c=l[a];this.addFeature(c,c.geometry,c.index,e,r);}},Mr.prototype.isEmpty=function(){return this.layoutVertexArray.length===0},Mr.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},Mr.prototype.upload=function(t){this.uploaded||(this.layoutVertexArray2.length!==0&&(this.layoutVertexBuffer2=t.createVertexBuffer(this.layoutVertexArray2,xh)),this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,vh),this.indexBuffer=t.createIndexBuffer(this.indexArray)),this.programConfigurations.upload(t),this.uploaded=!0;},Mr.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy());},Mr.prototype.lineFeatureClips=function(t){if(t.properties&&t.properties.hasOwnProperty("mapbox_clip_start")&&t.properties.hasOwnProperty("mapbox_clip_end"))return {start:+t.properties.mapbox_clip_start,end:+t.properties.mapbox_clip_end}},Mr.prototype.addFeature=function(t,e,r,a,l){var c=this.layers[0].layout,h=c.get("line-join").evaluate(t,{}),m=c.get("line-cap"),g=c.get("line-miter-limit"),_=c.get("line-round-limit");this.lineClips=this.lineFeatureClips(t);for(var x=0,b=e;x<b.length;x+=1)this.addLine(b[x],t,h,m,g,_);this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,l,a);},Mr.prototype.addLine=function(t,e,r,a,l,c){if(this.distance=0,this.scaledDistance=0,this.totalDistance=0,this.lineClips){this.lineClipsArray.push(this.lineClips);for(var h=0;h<t.length-1;h++)this.totalDistance+=t[h].dist(t[h+1]);this.updateScaledDistance(),this.maxLineLength=Math.max(this.maxLineLength,this.totalDistance);}for(var m=bh[e.type]==="Polygon",g=t.length;g>=2&&t[g-1].equals(t[g-2]);)g--;for(var _=0;_<g-1&&t[_].equals(t[_+1]);)_++;if(!(g<(m?3:2))){r==="bevel"&&(l=1.05);var x,b=this.overscaling<=16?122880/(512*this.overscaling):0,I=this.segments.prepareSegment(10*g,this.layoutVertexArray,this.indexArray),E=void 0,L=void 0,B=void 0,q=void 0;this.e1=this.e2=-1,m&&(q=t[_].sub(x=t[g-2])._unit()._perp());for(var V=_;V<g;V++)if(!(L=V===g-1?m?t[_+1]:void 0:t[V+1])||!t[V].equals(L)){q&&(B=q),x&&(E=x),x=t[V],q=L?L.sub(x)._unit()._perp():B;var W=(B=B||q).add(q);W.x===0&&W.y===0||W._unit();var J=B.x*q.x+B.y*q.y,Y=W.x*q.x+W.y*q.y,$=Y!==0?1/Y:1/0,nt=2*Math.sqrt(2-2*Y),ut=Y<wh&&E&&L,ft=B.x*q.y-B.y*q.x>0;if(ut&&V>_){var zt=x.dist(E);if(zt>2*b){var gt=x.sub(x.sub(E)._mult(b/zt)._round());this.updateDistance(E,gt),this.addCurrentVertex(gt,B,0,0,I),E=gt;}}var Mt=E&&L,vt=Mt?r:m?"butt":a;if(Mt&&vt==="round"&&($<c?vt="miter":$<=2&&(vt="fakeround")),vt==="miter"&&$>l&&(vt="bevel"),vt==="bevel"&&($>2&&(vt="flipbevel"),$<l&&(vt="miter")),E&&this.updateDistance(E,x),vt==="miter")W._mult($),this.addCurrentVertex(x,W,0,0,I);else if(vt==="flipbevel"){if($>100)W=q.mult(-1);else {var Xt=$*B.add(q).mag()/B.sub(q).mag();W._perp()._mult(Xt*(ft?-1:1));}this.addCurrentVertex(x,W,0,0,I),this.addCurrentVertex(x,W.mult(-1),0,0,I);}else if(vt==="bevel"||vt==="fakeround"){var Ft=-Math.sqrt($*$-1),At=ft?Ft:0,Kt=ft?0:Ft;if(E&&this.addCurrentVertex(x,B,At,Kt,I),vt==="fakeround")for(var qt=Math.round(180*nt/Math.PI/20),ie=1;ie<qt;ie++){var Dt=ie/qt;if(Dt!==.5){var ae=Dt-.5;Dt+=Dt*ae*(Dt-1)*((1.0904+J*(J*(3.55645-1.43519*J)-3.2452))*ae*ae+(.848013+J*(.215638*J-1.06021)));}var Ae=q.sub(B)._mult(Dt)._add(B)._unit()._mult(ft?-1:1);this.addHalfVertex(x,Ae.x,Ae.y,!1,ft,0,I);}L&&this.addCurrentVertex(x,q,-At,-Kt,I);}else if(vt==="butt")this.addCurrentVertex(x,W,0,0,I);else if(vt==="square"){var Le=E?1:-1;this.addCurrentVertex(x,W,Le,Le,I);}else vt==="round"&&(E&&(this.addCurrentVertex(x,B,0,0,I),this.addCurrentVertex(x,B,1,1,I,!0)),L&&(this.addCurrentVertex(x,q,-1,-1,I,!0),this.addCurrentVertex(x,q,0,0,I)));if(ut&&V<g-1){var ke=x.dist(L);if(ke>2*b){var Pe=x.add(L.sub(x)._mult(b/ke)._round());this.updateDistance(x,Pe),this.addCurrentVertex(Pe,q,0,0,I),x=Pe;}}}}},Mr.prototype.addCurrentVertex=function(t,e,r,a,l,c){c===void 0&&(c=!1);var h=e.y*a-e.x,m=-e.y-e.x*a;this.addHalfVertex(t,e.x+e.y*r,e.y-e.x*r,c,!1,r,l),this.addHalfVertex(t,h,m,c,!0,-a,l),this.distance>Mc/2&&this.totalDistance===0&&(this.distance=0,this.addCurrentVertex(t,e,r,a,l,c));},Mr.prototype.addHalfVertex=function(t,e,r,a,l,c,h){var m=.5*(this.lineClips?this.scaledDistance*(Mc-1):this.scaledDistance);this.layoutVertexArray.emplaceBack((t.x<<1)+(a?1:0),(t.y<<1)+(l?1:0),Math.round(63*e)+128,Math.round(63*r)+128,1+(c===0?0:c<0?-1:1)|(63&m)<<2,m>>6),this.lineClips&&this.layoutVertexArray2.emplaceBack((this.scaledDistance-this.lineClips.start)/(this.lineClips.end-this.lineClips.start),this.lineClipsArray.length);var g=h.vertexLength++;this.e1>=0&&this.e2>=0&&(this.indexArray.emplaceBack(this.e1,this.e2,g),h.primitiveLength++),l?this.e2=g:this.e1=g;},Mr.prototype.updateScaledDistance=function(){this.scaledDistance=this.lineClips?this.lineClips.start+(this.lineClips.end-this.lineClips.start)*this.distance/this.totalDistance:this.distance;},Mr.prototype.updateDistance=function(t,e){this.distance+=t.dist(e),this.updateScaledDistance();},Tt("LineBucket",Mr,{omit:["layers","patternFeatures"]});var Sh=new hr({"line-cap":new Ct(C.layout_line["line-cap"]),"line-join":new Et(C.layout_line["line-join"]),"line-miter-limit":new Ct(C.layout_line["line-miter-limit"]),"line-round-limit":new Ct(C.layout_line["line-round-limit"]),"line-sort-key":new Et(C.layout_line["line-sort-key"])}),Dc={paint:new hr({"line-opacity":new Et(C.paint_line["line-opacity"]),"line-color":new Et(C.paint_line["line-color"]),"line-translate":new Ct(C.paint_line["line-translate"]),"line-translate-anchor":new Ct(C.paint_line["line-translate-anchor"]),"line-width":new Et(C.paint_line["line-width"]),"line-gap-width":new Et(C.paint_line["line-gap-width"]),"line-offset":new Et(C.paint_line["line-offset"]),"line-blur":new Et(C.paint_line["line-blur"]),"line-dasharray":new wr(C.paint_line["line-dasharray"]),"line-pattern":new Va(C.paint_line["line-pattern"]),"line-gradient":new wi(C.paint_line["line-gradient"])}),layout:Sh},Lc=new(function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.possiblyEvaluate=function(r,a){return a=new Jt(Math.floor(a.zoom),{now:a.now,fadeDuration:a.fadeDuration,zoomHistory:a.zoomHistory,transition:a.transition}),t.prototype.possiblyEvaluate.call(this,r,a)},e.prototype.evaluate=function(r,a,l,c){return a=lr({},a,{zoom:Math.floor(a.zoom)}),t.prototype.evaluate.call(this,r,a,l,c)},e}(Et))(Dc.paint.properties["line-width"].specification);Lc.useIntegerZoom=!0;var Th=function(t){function e(r){t.call(this,r,Dc),this.gradientVersion=0;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._handleSpecialPaintPropertyUpdate=function(r){r==="line-gradient"&&(this.stepInterpolant=this._transitionablePaint._values["line-gradient"].value.expression._styleExpression.expression instanceof Rr,this.gradientVersion=(this.gradientVersion+1)%vs);},e.prototype.gradientExpression=function(){return this._transitionablePaint._values["line-gradient"].value.expression},e.prototype.recalculate=function(r,a){t.prototype.recalculate.call(this,r,a),this.paint._values["line-floorwidth"]=Lc.possiblyEvaluate(this._transitioningPaint._values["line-width"].value,r);},e.prototype.createBucket=function(r){return new Mr(r)},e.prototype.queryRadius=function(r){var a=r,l=Bc(Mi("line-width",this,a),Mi("line-gap-width",this,a)),c=Mi("line-offset",this,a);return l/2+Math.abs(c)+Ye(this.paint.get("line-translate"))},e.prototype.queryIntersectsFeature=function(r,a,l,c,h,m,g){var _=Zi(r,this.paint.get("line-translate"),this.paint.get("line-translate-anchor"),m.angle,g),x=g/2*Bc(this.paint.get("line-width").evaluate(a,l),this.paint.get("line-gap-width").evaluate(a,l)),b=this.paint.get("line-offset").evaluate(a,l);return b&&(c=function(I,E){for(var L=[],B=new jt(0,0),q=0;q<I.length;q++){for(var V=I[q],W=[],J=0;J<V.length;J++){var Y=V[J],$=V[J+1],nt=J===0?B:Y.sub(V[J-1])._unit()._perp(),ut=J===V.length-1?B:$.sub(Y)._unit()._perp(),ft=nt._add(ut)._unit();ft._mult(1/(ft.x*ut.x+ft.y*ut.y)),W.push(ft._mult(E)._add(Y));}L.push(W);}return L}(c,b*g)),function(I,E,L){for(var B=0;B<E.length;B++){var q=E[B];if(I.length>=3){for(var V=0;V<q.length;V++)if(ki(I,q[V]))return !0}if(si(I,q,L))return !0}return !1}(_,c,x)},e.prototype.isTileClipped=function(){return !0},e}(zi);function Bc(t,e){return e>0?e+2*t:t}var Ih=ir([{name:"a_pos_offset",components:4,type:"Int16"},{name:"a_data",components:4,type:"Uint16"},{name:"a_pixeloffset",components:4,type:"Int16"}],4),Eh=ir([{name:"a_projected_pos",components:3,type:"Float32"}],4),Ah=(ir([{name:"a_fade_opacity",components:1,type:"Uint32"}],4),ir([{name:"a_placed",components:2,type:"Uint8"},{name:"a_shift",components:2,type:"Float32"}])),Rc=(ir([{type:"Int16",name:"anchorPointX"},{type:"Int16",name:"anchorPointY"},{type:"Int16",name:"x1"},{type:"Int16",name:"y1"},{type:"Int16",name:"x2"},{type:"Int16",name:"y2"},{type:"Uint32",name:"featureIndex"},{type:"Uint16",name:"sourceLayerIndex"},{type:"Uint16",name:"bucketIndex"}]),ir([{name:"a_pos",components:2,type:"Int16"},{name:"a_anchor_pos",components:2,type:"Int16"},{name:"a_extrude",components:2,type:"Int16"}],4)),Ph=ir([{name:"a_pos",components:2,type:"Float32"},{name:"a_radius",components:1,type:"Float32"},{name:"a_flags",components:2,type:"Int16"}],4);function zh(t,e,r){return t.sections.forEach(function(a){a.text=function(l,c,h){var m=c.layout.get("text-transform").evaluate(h,{});return m==="uppercase"?l=l.toLocaleUpperCase():m==="lowercase"&&(l=l.toLocaleLowerCase()),Wr.applyArabicShaping&&(l=Wr.applyArabicShaping(l)),l}(a.text,e,r);}),t}ir([{name:"triangle",components:3,type:"Uint16"}]),ir([{type:"Int16",name:"anchorX"},{type:"Int16",name:"anchorY"},{type:"Uint16",name:"glyphStartIndex"},{type:"Uint16",name:"numGlyphs"},{type:"Uint32",name:"vertexStartIndex"},{type:"Uint32",name:"lineStartIndex"},{type:"Uint32",name:"lineLength"},{type:"Uint16",name:"segment"},{type:"Uint16",name:"lowerSize"},{type:"Uint16",name:"upperSize"},{type:"Float32",name:"lineOffsetX"},{type:"Float32",name:"lineOffsetY"},{type:"Uint8",name:"writingMode"},{type:"Uint8",name:"placedOrientation"},{type:"Uint8",name:"hidden"},{type:"Uint32",name:"crossTileID"},{type:"Int16",name:"associatedIconIndex"}]),ir([{type:"Int16",name:"anchorX"},{type:"Int16",name:"anchorY"},{type:"Int16",name:"rightJustifiedTextSymbolIndex"},{type:"Int16",name:"centerJustifiedTextSymbolIndex"},{type:"Int16",name:"leftJustifiedTextSymbolIndex"},{type:"Int16",name:"verticalPlacedTextSymbolIndex"},{type:"Int16",name:"placedIconSymbolIndex"},{type:"Int16",name:"verticalPlacedIconSymbolIndex"},{type:"Uint16",name:"key"},{type:"Uint16",name:"textBoxStartIndex"},{type:"Uint16",name:"textBoxEndIndex"},{type:"Uint16",name:"verticalTextBoxStartIndex"},{type:"Uint16",name:"verticalTextBoxEndIndex"},{type:"Uint16",name:"iconBoxStartIndex"},{type:"Uint16",name:"iconBoxEndIndex"},{type:"Uint16",name:"verticalIconBoxStartIndex"},{type:"Uint16",name:"verticalIconBoxEndIndex"},{type:"Uint16",name:"featureIndex"},{type:"Uint16",name:"numHorizontalGlyphVertices"},{type:"Uint16",name:"numVerticalGlyphVertices"},{type:"Uint16",name:"numIconVertices"},{type:"Uint16",name:"numVerticalIconVertices"},{type:"Uint16",name:"useRuntimeCollisionCircles"},{type:"Uint32",name:"crossTileID"},{type:"Float32",name:"textBoxScale"},{type:"Float32",components:2,name:"textOffset"},{type:"Float32",name:"collisionCircleDiameter"}]),ir([{type:"Float32",name:"offsetX"}]),ir([{type:"Int16",name:"x"},{type:"Int16",name:"y"},{type:"Int16",name:"tileUnitDistanceFromAnchor"}]);var $s={"!":"\uFE15","#":"\uFF03",$:"\uFF04","%":"\uFF05","&":"\uFF06","(":"\uFE35",")":"\uFE36","*":"\uFF0A","+":"\uFF0B",",":"\uFE10","-":"\uFE32",".":"\u30FB","/":"\uFF0F",":":"\uFE13",";":"\uFE14","<":"\uFE3F","=":"\uFF1D",">":"\uFE40","?":"\uFE16","@":"\uFF20","[":"\uFE47","\\":"\uFF3C","]":"\uFE48","^":"\uFF3E",_:"\uFE33","`":"\uFF40","{":"\uFE37","|":"\u2015","}":"\uFE38","~":"\uFF5E","\xA2":"\uFFE0","\xA3":"\uFFE1","\xA5":"\uFFE5","\xA6":"\uFFE4","\xAC":"\uFFE2","\xAF":"\uFFE3","\u2013":"\uFE32","\u2014":"\uFE31","\u2018":"\uFE43","\u2019":"\uFE44","\u201C":"\uFE41","\u201D":"\uFE42","\u2026":"\uFE19","\u2027":"\u30FB","\u20A9":"\uFFE6","\u3001":"\uFE11","\u3002":"\uFE12","\u3008":"\uFE3F","\u3009":"\uFE40","\u300A":"\uFE3D","\u300B":"\uFE3E","\u300C":"\uFE41","\u300D":"\uFE42","\u300E":"\uFE43","\u300F":"\uFE44","\u3010":"\uFE3B","\u3011":"\uFE3C","\u3014":"\uFE39","\u3015":"\uFE3A","\u3016":"\uFE17","\u3017":"\uFE18","\uFF01":"\uFE15","\uFF08":"\uFE35","\uFF09":"\uFE36","\uFF0C":"\uFE10","\uFF0D":"\uFE32","\uFF0E":"\u30FB","\uFF1A":"\uFE13","\uFF1B":"\uFE14","\uFF1C":"\uFE3F","\uFF1E":"\uFE40","\uFF1F":"\uFE16","\uFF3B":"\uFE47","\uFF3D":"\uFE48","\uFF3F":"\uFE33","\uFF5B":"\uFE37","\uFF5C":"\u2015","\uFF5D":"\uFE38","\uFF5F":"\uFE35","\uFF60":"\uFE36","\uFF61":"\uFE12","\uFF62":"\uFE41","\uFF63":"\uFE42"},Fc=function(t,e,r,a,l){var c,h,m=8*l-a-1,g=(1<<m)-1,_=g>>1,x=-7,b=r?l-1:0,I=r?-1:1,E=t[e+b];for(b+=I,c=E&(1<<-x)-1,E>>=-x,x+=m;x>0;c=256*c+t[e+b],b+=I,x-=8);for(h=c&(1<<-x)-1,c>>=-x,x+=a;x>0;h=256*h+t[e+b],b+=I,x-=8);if(c===0)c=1-_;else {if(c===g)return h?NaN:1/0*(E?-1:1);h+=Math.pow(2,a),c-=_;}return (E?-1:1)*h*Math.pow(2,c-a)},Oc=function(t,e,r,a,l,c){var h,m,g,_=8*c-l-1,x=(1<<_)-1,b=x>>1,I=l===23?Math.pow(2,-24)-Math.pow(2,-77):0,E=a?0:c-1,L=a?1:-1,B=e<0||e===0&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(m=isNaN(e)?1:0,h=x):(h=Math.floor(Math.log(e)/Math.LN2),e*(g=Math.pow(2,-h))<1&&(h--,g*=2),(e+=h+b>=1?I/g:I*Math.pow(2,1-b))*g>=2&&(h++,g/=2),h+b>=x?(m=0,h=x):h+b>=1?(m=(e*g-1)*Math.pow(2,l),h+=b):(m=e*Math.pow(2,b-1)*Math.pow(2,l),h=0));l>=8;t[r+E]=255&m,E+=L,m/=256,l-=8);for(h=h<<l|m,_+=l;_>0;t[r+E]=255&h,E+=L,h/=256,_-=8);t[r+E-L]|=128*B;},tu=we;function we(t){this.buf=ArrayBuffer.isView&&ArrayBuffer.isView(t)?t:new Uint8Array(t||0),this.pos=0,this.type=0,this.length=this.buf.length;}we.Varint=0,we.Fixed64=1,we.Bytes=2,we.Fixed32=5;var Uc=typeof TextDecoder=="undefined"?null:new TextDecoder("utf8");function Kn(t){return t.type===we.Bytes?t.readVarint()+t.pos:t.pos+1}function Ja(t,e,r){return r?4294967296*e+(t>>>0):4294967296*(e>>>0)+(t>>>0)}function Vc(t,e,r){var a=e<=16383?1:e<=2097151?2:e<=268435455?3:Math.floor(Math.log(e)/(7*Math.LN2));r.realloc(a);for(var l=r.pos-1;l>=t;l--)r.buf[l+a]=r.buf[l];}function Ch(t,e){for(var r=0;r<t.length;r++)e.writeVarint(t[r]);}function kh(t,e){for(var r=0;r<t.length;r++)e.writeSVarint(t[r]);}function Mh(t,e){for(var r=0;r<t.length;r++)e.writeFloat(t[r]);}function Dh(t,e){for(var r=0;r<t.length;r++)e.writeDouble(t[r]);}function Lh(t,e){for(var r=0;r<t.length;r++)e.writeBoolean(t[r]);}function Bh(t,e){for(var r=0;r<t.length;r++)e.writeFixed32(t[r]);}function Rh(t,e){for(var r=0;r<t.length;r++)e.writeSFixed32(t[r]);}function Fh(t,e){for(var r=0;r<t.length;r++)e.writeFixed64(t[r]);}function Oh(t,e){for(var r=0;r<t.length;r++)e.writeSFixed64(t[r]);}function eu(t,e){return (t[e]|t[e+1]<<8|t[e+2]<<16)+16777216*t[e+3]}function Ya(t,e,r){t[r]=e,t[r+1]=e>>>8,t[r+2]=e>>>16,t[r+3]=e>>>24;}function Nc(t,e){return (t[e]|t[e+1]<<8|t[e+2]<<16)+(t[e+3]<<24)}function Uh(t,e,r){t===1&&r.readMessage(Vh,e);}function Vh(t,e,r){if(t===3){var a=r.readMessage(Nh,{}),l=a.width,c=a.height,h=a.left,m=a.top,g=a.advance;e.push({id:a.id,bitmap:new ca({width:l+6,height:c+6},a.bitmap),metrics:{width:l,height:c,left:h,top:m,advance:g}});}}function Nh(t,e,r){t===1?e.id=r.readVarint():t===2?e.bitmap=r.readBytes():t===3?e.width=r.readVarint():t===4?e.height=r.readVarint():t===5?e.left=r.readSVarint():t===6?e.top=r.readSVarint():t===7&&(e.advance=r.readVarint());}function jc(t){for(var e=0,r=0,a=0,l=t;a<l.length;a+=1){var c=l[a];e+=c.w*c.h,r=Math.max(r,c.w);}t.sort(function(B,q){return q.h-B.h});for(var h=[{x:0,y:0,w:Math.max(Math.ceil(Math.sqrt(e/.95)),r),h:1/0}],m=0,g=0,_=0,x=t;_<x.length;_+=1)for(var b=x[_],I=h.length-1;I>=0;I--){var E=h[I];if(!(b.w>E.w||b.h>E.h)){if(b.x=E.x,b.y=E.y,g=Math.max(g,b.y+b.h),m=Math.max(m,b.x+b.w),b.w===E.w&&b.h===E.h){var L=h.pop();I<h.length&&(h[I]=L);}else b.h===E.h?(E.x+=b.w,E.w-=b.w):b.w===E.w?(E.y+=b.h,E.h-=b.h):(h.push({x:E.x+b.w,y:E.y,w:E.w-b.w,h:b.h}),E.y+=b.h,E.h-=b.h);break}}return {w:m,h:g,fill:e/(m*g)||0}}we.prototype={destroy:function(){this.buf=null;},readFields:function(t,e,r){for(r=r||this.length;this.pos<r;){var a=this.readVarint(),l=a>>3,c=this.pos;this.type=7&a,t(l,e,this),this.pos===c&&this.skip(a);}return e},readMessage:function(t,e){return this.readFields(t,e,this.readVarint()+this.pos)},readFixed32:function(){var t=eu(this.buf,this.pos);return this.pos+=4,t},readSFixed32:function(){var t=Nc(this.buf,this.pos);return this.pos+=4,t},readFixed64:function(){var t=eu(this.buf,this.pos)+4294967296*eu(this.buf,this.pos+4);return this.pos+=8,t},readSFixed64:function(){var t=eu(this.buf,this.pos)+4294967296*Nc(this.buf,this.pos+4);return this.pos+=8,t},readFloat:function(){var t=Fc(this.buf,this.pos,!0,23,4);return this.pos+=4,t},readDouble:function(){var t=Fc(this.buf,this.pos,!0,52,8);return this.pos+=8,t},readVarint:function(t){var e,r,a=this.buf;return e=127&(r=a[this.pos++]),r<128?e:(e|=(127&(r=a[this.pos++]))<<7,r<128?e:(e|=(127&(r=a[this.pos++]))<<14,r<128?e:(e|=(127&(r=a[this.pos++]))<<21,r<128?e:function(l,c,h){var m,g,_=h.buf;if(m=(112&(g=_[h.pos++]))>>4,g<128)return Ja(l,m,c);if(m|=(127&(g=_[h.pos++]))<<3,g<128)return Ja(l,m,c);if(m|=(127&(g=_[h.pos++]))<<10,g<128)return Ja(l,m,c);if(m|=(127&(g=_[h.pos++]))<<17,g<128)return Ja(l,m,c);if(m|=(127&(g=_[h.pos++]))<<24,g<128)return Ja(l,m,c);if(m|=(1&(g=_[h.pos++]))<<31,g<128)return Ja(l,m,c);throw new Error("Expected varint not more than 10 bytes")}(e|=(15&(r=a[this.pos]))<<28,t,this))))},readVarint64:function(){return this.readVarint(!0)},readSVarint:function(){var t=this.readVarint();return t%2==1?(t+1)/-2:t/2},readBoolean:function(){return Boolean(this.readVarint())},readString:function(){var t=this.readVarint()+this.pos,e=this.pos;return this.pos=t,t-e>=12&&Uc?function(r,a,l){return Uc.decode(r.subarray(a,l))}(this.buf,e,t):function(r,a,l){for(var c="",h=a;h<l;){var m,g,_,x=r[h],b=null,I=x>239?4:x>223?3:x>191?2:1;if(h+I>l)break;I===1?x<128&&(b=x):I===2?(192&(m=r[h+1]))==128&&(b=(31&x)<<6|63&m)<=127&&(b=null):I===3?(g=r[h+2],(192&(m=r[h+1]))==128&&(192&g)==128&&((b=(15&x)<<12|(63&m)<<6|63&g)<=2047||b>=55296&&b<=57343)&&(b=null)):I===4&&(g=r[h+2],_=r[h+3],(192&(m=r[h+1]))==128&&(192&g)==128&&(192&_)==128&&((b=(15&x)<<18|(63&m)<<12|(63&g)<<6|63&_)<=65535||b>=1114112)&&(b=null)),b===null?(b=65533,I=1):b>65535&&(b-=65536,c+=String.fromCharCode(b>>>10&1023|55296),b=56320|1023&b),c+=String.fromCharCode(b),h+=I;}return c}(this.buf,e,t)},readBytes:function(){var t=this.readVarint()+this.pos,e=this.buf.subarray(this.pos,t);return this.pos=t,e},readPackedVarint:function(t,e){if(this.type!==we.Bytes)return t.push(this.readVarint(e));var r=Kn(this);for(t=t||[];this.pos<r;)t.push(this.readVarint(e));return t},readPackedSVarint:function(t){if(this.type!==we.Bytes)return t.push(this.readSVarint());var e=Kn(this);for(t=t||[];this.pos<e;)t.push(this.readSVarint());return t},readPackedBoolean:function(t){if(this.type!==we.Bytes)return t.push(this.readBoolean());var e=Kn(this);for(t=t||[];this.pos<e;)t.push(this.readBoolean());return t},readPackedFloat:function(t){if(this.type!==we.Bytes)return t.push(this.readFloat());var e=Kn(this);for(t=t||[];this.pos<e;)t.push(this.readFloat());return t},readPackedDouble:function(t){if(this.type!==we.Bytes)return t.push(this.readDouble());var e=Kn(this);for(t=t||[];this.pos<e;)t.push(this.readDouble());return t},readPackedFixed32:function(t){if(this.type!==we.Bytes)return t.push(this.readFixed32());var e=Kn(this);for(t=t||[];this.pos<e;)t.push(this.readFixed32());return t},readPackedSFixed32:function(t){if(this.type!==we.Bytes)return t.push(this.readSFixed32());var e=Kn(this);for(t=t||[];this.pos<e;)t.push(this.readSFixed32());return t},readPackedFixed64:function(t){if(this.type!==we.Bytes)return t.push(this.readFixed64());var e=Kn(this);for(t=t||[];this.pos<e;)t.push(this.readFixed64());return t},readPackedSFixed64:function(t){if(this.type!==we.Bytes)return t.push(this.readSFixed64());var e=Kn(this);for(t=t||[];this.pos<e;)t.push(this.readSFixed64());return t},skip:function(t){var e=7&t;if(e===we.Varint)for(;this.buf[this.pos++]>127;);else if(e===we.Bytes)this.pos=this.readVarint()+this.pos;else if(e===we.Fixed32)this.pos+=4;else {if(e!==we.Fixed64)throw new Error("Unimplemented type: "+e);this.pos+=8;}},writeTag:function(t,e){this.writeVarint(t<<3|e);},realloc:function(t){for(var e=this.length||16;e<this.pos+t;)e*=2;if(e!==this.length){var r=new Uint8Array(e);r.set(this.buf),this.buf=r,this.length=e;}},finish:function(){return this.length=this.pos,this.pos=0,this.buf.subarray(0,this.length)},writeFixed32:function(t){this.realloc(4),Ya(this.buf,t,this.pos),this.pos+=4;},writeSFixed32:function(t){this.realloc(4),Ya(this.buf,t,this.pos),this.pos+=4;},writeFixed64:function(t){this.realloc(8),Ya(this.buf,-1&t,this.pos),Ya(this.buf,Math.floor(t*(1/4294967296)),this.pos+4),this.pos+=8;},writeSFixed64:function(t){this.realloc(8),Ya(this.buf,-1&t,this.pos),Ya(this.buf,Math.floor(t*(1/4294967296)),this.pos+4),this.pos+=8;},writeVarint:function(t){(t=+t||0)>268435455||t<0?function(e,r){var a,l;if(e>=0?(a=e%4294967296|0,l=e/4294967296|0):(l=~(-e/4294967296),4294967295^(a=~(-e%4294967296))?a=a+1|0:(a=0,l=l+1|0)),e>=18446744073709552e3||e<-18446744073709552e3)throw new Error("Given varint doesn't fit into 10 bytes");r.realloc(10),function(c,h,m){m.buf[m.pos++]=127&c|128,c>>>=7,m.buf[m.pos++]=127&c|128,c>>>=7,m.buf[m.pos++]=127&c|128,c>>>=7,m.buf[m.pos++]=127&c|128,m.buf[m.pos]=127&(c>>>=7);}(a,0,r),function(c,h){var m=(7&c)<<4;h.buf[h.pos++]|=m|((c>>>=3)?128:0),c&&(h.buf[h.pos++]=127&c|((c>>>=7)?128:0),c&&(h.buf[h.pos++]=127&c|((c>>>=7)?128:0),c&&(h.buf[h.pos++]=127&c|((c>>>=7)?128:0),c&&(h.buf[h.pos++]=127&c|((c>>>=7)?128:0),c&&(h.buf[h.pos++]=127&c)))));}(l,r);}(t,this):(this.realloc(4),this.buf[this.pos++]=127&t|(t>127?128:0),t<=127||(this.buf[this.pos++]=127&(t>>>=7)|(t>127?128:0),t<=127||(this.buf[this.pos++]=127&(t>>>=7)|(t>127?128:0),t<=127||(this.buf[this.pos++]=t>>>7&127))));},writeSVarint:function(t){this.writeVarint(t<0?2*-t-1:2*t);},writeBoolean:function(t){this.writeVarint(Boolean(t));},writeString:function(t){t=String(t),this.realloc(4*t.length),this.pos++;var e=this.pos;this.pos=function(a,l,c){for(var h,m,g=0;g<l.length;g++){if((h=l.charCodeAt(g))>55295&&h<57344){if(!m){h>56319||g+1===l.length?(a[c++]=239,a[c++]=191,a[c++]=189):m=h;continue}if(h<56320){a[c++]=239,a[c++]=191,a[c++]=189,m=h;continue}h=m-55296<<10|h-56320|65536,m=null;}else m&&(a[c++]=239,a[c++]=191,a[c++]=189,m=null);h<128?a[c++]=h:(h<2048?a[c++]=h>>6|192:(h<65536?a[c++]=h>>12|224:(a[c++]=h>>18|240,a[c++]=h>>12&63|128),a[c++]=h>>6&63|128),a[c++]=63&h|128);}return c}(this.buf,t,this.pos);var r=this.pos-e;r>=128&&Vc(e,r,this),this.pos=e-1,this.writeVarint(r),this.pos+=r;},writeFloat:function(t){this.realloc(4),Oc(this.buf,t,this.pos,!0,23,4),this.pos+=4;},writeDouble:function(t){this.realloc(8),Oc(this.buf,t,this.pos,!0,52,8),this.pos+=8;},writeBytes:function(t){var e=t.length;this.writeVarint(e),this.realloc(e);for(var r=0;r<e;r++)this.buf[this.pos++]=t[r];},writeRawMessage:function(t,e){this.pos++;var r=this.pos;t(e,this);var a=this.pos-r;a>=128&&Vc(r,a,this),this.pos=r-1,this.writeVarint(a),this.pos+=a;},writeMessage:function(t,e,r){this.writeTag(t,we.Bytes),this.writeRawMessage(e,r);},writePackedVarint:function(t,e){e.length&&this.writeMessage(t,Ch,e);},writePackedSVarint:function(t,e){e.length&&this.writeMessage(t,kh,e);},writePackedBoolean:function(t,e){e.length&&this.writeMessage(t,Lh,e);},writePackedFloat:function(t,e){e.length&&this.writeMessage(t,Mh,e);},writePackedDouble:function(t,e){e.length&&this.writeMessage(t,Dh,e);},writePackedFixed32:function(t,e){e.length&&this.writeMessage(t,Bh,e);},writePackedSFixed32:function(t,e){e.length&&this.writeMessage(t,Rh,e);},writePackedFixed64:function(t,e){e.length&&this.writeMessage(t,Fh,e);},writePackedSFixed64:function(t,e){e.length&&this.writeMessage(t,Oh,e);},writeBytesField:function(t,e){this.writeTag(t,we.Bytes),this.writeBytes(e);},writeFixed32Field:function(t,e){this.writeTag(t,we.Fixed32),this.writeFixed32(e);},writeSFixed32Field:function(t,e){this.writeTag(t,we.Fixed32),this.writeSFixed32(e);},writeFixed64Field:function(t,e){this.writeTag(t,we.Fixed64),this.writeFixed64(e);},writeSFixed64Field:function(t,e){this.writeTag(t,we.Fixed64),this.writeSFixed64(e);},writeVarintField:function(t,e){this.writeTag(t,we.Varint),this.writeVarint(e);},writeSVarintField:function(t,e){this.writeTag(t,we.Varint),this.writeSVarint(e);},writeStringField:function(t,e){this.writeTag(t,we.Bytes),this.writeString(e);},writeFloatField:function(t,e){this.writeTag(t,we.Fixed32),this.writeFloat(e);},writeDoubleField:function(t,e){this.writeTag(t,we.Fixed64),this.writeDouble(e);},writeBooleanField:function(t,e){this.writeVarintField(t,Boolean(e));}};var ru=function(t,e){var r=e.pixelRatio,a=e.version,l=e.stretchX,c=e.stretchY,h=e.content;this.paddedRect=t,this.pixelRatio=r,this.stretchX=l,this.stretchY=c,this.content=h,this.version=a;},tl={tl:{configurable:!0},br:{configurable:!0},tlbr:{configurable:!0},displaySize:{configurable:!0}};tl.tl.get=function(){return [this.paddedRect.x+1,this.paddedRect.y+1]},tl.br.get=function(){return [this.paddedRect.x+this.paddedRect.w-1,this.paddedRect.y+this.paddedRect.h-1]},tl.tlbr.get=function(){return this.tl.concat(this.br)},tl.displaySize.get=function(){return [(this.paddedRect.w-2)/this.pixelRatio,(this.paddedRect.h-2)/this.pixelRatio]},Object.defineProperties(ru.prototype,tl);var el=function(t,e){var r={},a={};this.haveRenderCallbacks=[];var l=[];this.addImages(t,r,l),this.addImages(e,a,l);var c=jc(l),h=new qr({width:c.w||1,height:c.h||1});for(var m in t){var g=t[m],_=r[m].paddedRect;qr.copy(g.data,h,{x:0,y:0},{x:_.x+1,y:_.y+1},g.data);}for(var x in e){var b=e[x],I=a[x].paddedRect,E=I.x+1,L=I.y+1,B=b.data.width,q=b.data.height;qr.copy(b.data,h,{x:0,y:0},{x:E,y:L},b.data),qr.copy(b.data,h,{x:0,y:q-1},{x:E,y:L-1},{width:B,height:1}),qr.copy(b.data,h,{x:0,y:0},{x:E,y:L+q},{width:B,height:1}),qr.copy(b.data,h,{x:B-1,y:0},{x:E-1,y:L},{width:1,height:q}),qr.copy(b.data,h,{x:0,y:0},{x:E+B,y:L},{width:1,height:q});}this.image=h,this.iconPositions=r,this.patternPositions=a;};el.prototype.addImages=function(t,e,r){for(var a in t){var l=t[a],c={x:0,y:0,w:l.data.width+2,h:l.data.height+2};r.push(c),e[a]=new ru(c,l),l.hasRenderCallback&&this.haveRenderCallbacks.push(a);}},el.prototype.patchUpdatedImages=function(t,e){for(var r in t.dispatchRenderCallbacks(this.haveRenderCallbacks),t.updatedImages)this.patchUpdatedImage(this.iconPositions[r],t.getImage(r),e),this.patchUpdatedImage(this.patternPositions[r],t.getImage(r),e);},el.prototype.patchUpdatedImage=function(t,e,r){if(t&&e&&t.version!==e.version){t.version=e.version;var a=t.tl;r.update(e.data,void 0,{x:a[0],y:a[1]});}},Tt("ImagePosition",ru),Tt("ImageAtlas",el);var li={horizontal:1,vertical:2,horizontalOnly:3},Qa=function(){this.scale=1,this.fontStack="",this.imageName=null;};Qa.forText=function(t,e){var r=new Qa;return r.scale=t||1,r.fontStack=e,r},Qa.forImage=function(t){var e=new Qa;return e.imageName=t,e};var Tr=function(){this.text="",this.sectionIndex=[],this.sections=[],this.imageSectionID=null;};function iu(t,e,r,a,l,c,h,m,g,_,x,b,I,E,L,B){var q,V=Tr.fromFeature(t,l);b===li.vertical&&V.verticalizePunctuation();var W=Wr.processBidirectionalText,J=Wr.processStyledBidirectionalText;if(W&&V.sections.length===1){q=[];for(var Y=0,$=W(V.toString(),ec(V,_,c,e,a,E,L));Y<$.length;Y+=1){var nt=$[Y],ut=new Tr;ut.text=nt,ut.sections=V.sections;for(var ft=0;ft<nt.length;ft++)ut.sectionIndex.push(0);q.push(ut);}}else if(J){q=[];for(var zt=0,gt=J(V.text,V.sectionIndex,ec(V,_,c,e,a,E,L));zt<gt.length;zt+=1){var Mt=gt[zt],vt=new Tr;vt.text=Mt[0],vt.sectionIndex=Mt[1],vt.sections=V.sections,q.push(vt);}}else q=function(At,Kt){for(var qt=[],ie=At.text,Dt=0,ae=0,Ae=Kt;ae<Ae.length;ae+=1){var Le=Ae[ae];qt.push(At.substring(Dt,Le)),Dt=Le;}return Dt<ie.length&&qt.push(At.substring(Dt,ie.length)),qt}(V,ec(V,_,c,e,a,E,L));var Xt=[],Ft={positionedLines:Xt,text:V.toString(),top:x[1],bottom:x[1],left:x[0],right:x[0],writingMode:b,iconsInText:!1,verticalizable:!1};return function(At,Kt,qt,ie,Dt,ae,Ae,Le,ke,Pe,Be,Qe){for(var $e=0,Ir=-17,ar=0,Er=0,Ve=Le==="right"?1:Le==="left"?0:.5,sr=0,Yt=0,ve=Dt;Yt<ve.length;Yt+=1){var fe=ve[Yt];fe.trim();var oe=fe.getMaxScale(),Dr=24*(oe-1),dr={positionedGlyphs:[],lineOffset:0};At.positionedLines[sr]=dr;var Se=dr.positionedGlyphs,Ge=0;if(fe.length()){for(var mr=0;mr<fe.length();mr++){var se=fe.getSection(mr),mn=fe.getSectionIndex(mr),ui=fe.getCharCode(mr),yn=0,Ne=null,gn=null,Di=null,as=24,da=!(ke===li.horizontal||!Be&&!Fa(ui)||Be&&(nu[ui]||(Qn=ui,mt.Arabic(Qn)||mt["Arabic Supplement"](Qn)||mt["Arabic Extended-A"](Qn)||mt["Arabic Presentation Forms-A"](Qn)||mt["Arabic Presentation Forms-B"](Qn))));if(se.imageName){var ss=ie[se.imageName];if(!ss)continue;Di=se.imageName,At.iconsInText=At.iconsInText||!0,gn=ss.paddedRect;var Yn=ss.displaySize;se.scale=24*se.scale/Qe,yn=Dr+(24-Yn[1]*se.scale),as=(Ne={width:Yn[0],height:Yn[1],left:1,top:-3,advance:da?Yn[1]:Yn[0]}).advance;var ls=da?Yn[0]*se.scale-24*oe:Yn[1]*se.scale-24*oe;ls>0&&ls>Ge&&(Ge=ls);}else {var fu=qt[se.fontStack],us=fu&&fu[ui];if(us&&us.rect)gn=us.rect,Ne=us.metrics;else {var nl=Kt[se.fontStack],du=nl&&nl[ui];if(!du)continue;Ne=du.metrics;}yn=24*(oe-se.scale);}da?(At.verticalizable=!0,Se.push({glyph:ui,imageName:Di,x:$e,y:Ir+yn,vertical:da,scale:se.scale,fontStack:se.fontStack,sectionIndex:mn,metrics:Ne,rect:gn}),$e+=as*se.scale+Pe):(Se.push({glyph:ui,imageName:Di,x:$e,y:Ir+yn,vertical:da,scale:se.scale,fontStack:se.fontStack,sectionIndex:mn,metrics:Ne,rect:gn}),$e+=Ne.advance*se.scale+Pe);}Se.length!==0&&(ar=Math.max($e-Pe,ar),qh(Se,0,Se.length-1,Ve,Ge)),$e=0;var mu=ae*oe+Ge;dr.lineOffset=Math.max(Ge,Dr),Ir+=mu,Er=Math.max(mu,Er),++sr;}else Ir+=ae,++sr;}var Qn,ol=Ir- -17,cs=rc(Ae),Po=cs.horizontalAlign,ps=cs.verticalAlign;(function(yu,gu,al,sl,_u,ll,ul,cl,vu){var hs,xu=(gu-al)*_u;hs=ll!==ul?-cl*sl- -17:(-sl*vu+.5)*ul;for(var fs=0,pl=yu;fs<pl.length;fs+=1)for(var ma=0,hl=pl[fs].positionedGlyphs;ma<hl.length;ma+=1){var ds=hl[ma];ds.x+=xu,ds.y+=hs;}})(At.positionedLines,Ve,Po,ps,ar,Er,ae,ol,Dt.length),At.top+=-ps*ol,At.bottom=At.top+ol,At.left+=-Po*ar,At.right=At.left+ar;}(Ft,e,r,a,q,h,m,g,b,_,I,B),!function(At){for(var Kt=0,qt=At;Kt<qt.length;Kt+=1)if(qt[Kt].positionedGlyphs.length!==0)return !1;return !0}(Xt)&&Ft}Tr.fromFeature=function(t,e){for(var r=new Tr,a=0;a<t.sections.length;a++){var l=t.sections[a];l.image?r.addImageSection(l):r.addTextSection(l,e);}return r},Tr.prototype.length=function(){return this.text.length},Tr.prototype.getSection=function(t){return this.sections[this.sectionIndex[t]]},Tr.prototype.getSectionIndex=function(t){return this.sectionIndex[t]},Tr.prototype.getCharCode=function(t){return this.text.charCodeAt(t)},Tr.prototype.verticalizePunctuation=function(){this.text=function(t){for(var e="",r=0;r<t.length;r++){var a=t.charCodeAt(r+1)||null,l=t.charCodeAt(r-1)||null;e+=a&&Os(a)&&!$s[t[r+1]]||l&&Os(l)&&!$s[t[r-1]]||!$s[t[r]]?t[r]:$s[t[r]];}return e}(this.text);},Tr.prototype.trim=function(){for(var t=0,e=0;e<this.text.length&&nu[this.text.charCodeAt(e)];e++)t++;for(var r=this.text.length,a=this.text.length-1;a>=0&&a>=t&&nu[this.text.charCodeAt(a)];a--)r--;this.text=this.text.substring(t,r),this.sectionIndex=this.sectionIndex.slice(t,r);},Tr.prototype.substring=function(t,e){var r=new Tr;return r.text=this.text.substring(t,e),r.sectionIndex=this.sectionIndex.slice(t,e),r.sections=this.sections,r},Tr.prototype.toString=function(){return this.text},Tr.prototype.getMaxScale=function(){var t=this;return this.sectionIndex.reduce(function(e,r){return Math.max(e,t.sections[r].scale)},0)},Tr.prototype.addTextSection=function(t,e){this.text+=t.text,this.sections.push(Qa.forText(t.scale,t.fontStack||e));for(var r=this.sections.length-1,a=0;a<t.text.length;++a)this.sectionIndex.push(r);},Tr.prototype.addImageSection=function(t){var e=t.image?t.image.name:"";if(e.length!==0){var r=this.getNextImageSectionCharCode();r?(this.text+=String.fromCharCode(r),this.sections.push(Qa.forImage(e)),this.sectionIndex.push(this.sections.length-1)):Me("Reached maximum number of images 6401");}else Me("Can't add FormattedSection with an empty image.");},Tr.prototype.getNextImageSectionCharCode=function(){return this.imageSectionID?this.imageSectionID>=63743?null:++this.imageSectionID:(this.imageSectionID=57344,this.imageSectionID)};var nu={9:!0,10:!0,11:!0,12:!0,13:!0,32:!0},Hr={};function qc(t,e,r,a,l,c){if(e.imageName){var h=a[e.imageName];return h?h.displaySize[0]*e.scale*24/c+l:0}var m=r[e.fontStack],g=m&&m[t];return g?g.metrics.advance*e.scale+l:0}function Zc(t,e,r,a){var l=Math.pow(t-e,2);return a?t<e?l/2:2*l:l+Math.abs(r)*r}function jh(t,e,r){var a=0;return t===10&&(a-=1e4),r&&(a+=150),t!==40&&t!==65288||(a+=50),e!==41&&e!==65289||(a+=50),a}function Gc(t,e,r,a,l,c){for(var h=null,m=Zc(e,r,l,c),g=0,_=a;g<_.length;g+=1){var x=_[g],b=Zc(e-x.x,r,l,c)+x.badness;b<=m&&(h=x,m=b);}return {index:t,x:e,priorBreak:h,badness:m}}function ec(t,e,r,a,l,c,h){if(c!=="point")return [];if(!t)return [];for(var m,g=[],_=function(q,V,W,J,Y,$){for(var nt=0,ut=0;ut<q.length();ut++){var ft=q.getSection(ut);nt+=qc(q.getCharCode(ut),ft,J,Y,V,$);}return nt/Math.max(1,Math.ceil(nt/W))}(t,e,r,a,l,h),x=t.text.indexOf("\u200B")>=0,b=0,I=0;I<t.length();I++){var E=t.getSection(I),L=t.getCharCode(I);if(nu[L]||(b+=qc(L,E,a,l,e,h)),I<t.length()-1){var B=!((m=L)<11904||!(mt["Bopomofo Extended"](m)||mt.Bopomofo(m)||mt["CJK Compatibility Forms"](m)||mt["CJK Compatibility Ideographs"](m)||mt["CJK Compatibility"](m)||mt["CJK Radicals Supplement"](m)||mt["CJK Strokes"](m)||mt["CJK Symbols and Punctuation"](m)||mt["CJK Unified Ideographs Extension A"](m)||mt["CJK Unified Ideographs"](m)||mt["Enclosed CJK Letters and Months"](m)||mt["Halfwidth and Fullwidth Forms"](m)||mt.Hiragana(m)||mt["Ideographic Description Characters"](m)||mt["Kangxi Radicals"](m)||mt["Katakana Phonetic Extensions"](m)||mt.Katakana(m)||mt["Vertical Forms"](m)||mt["Yi Radicals"](m)||mt["Yi Syllables"](m)));(Hr[L]||B||E.imageName)&&g.push(Gc(I+1,b,_,g,jh(L,t.getCharCode(I+1),B&&x),!1));}}return function q(V){return V?q(V.priorBreak).concat(V.index):[]}(Gc(t.length(),b,_,g,0,!0))}function rc(t){var e=.5,r=.5;switch(t){case"right":case"top-right":case"bottom-right":e=1;break;case"left":case"top-left":case"bottom-left":e=0;}switch(t){case"bottom":case"bottom-right":case"bottom-left":r=1;break;case"top":case"top-right":case"top-left":r=0;}return {horizontalAlign:e,verticalAlign:r}}function qh(t,e,r,a,l){if(a||l)for(var c=t[r],h=(t[r].x+c.metrics.advance*c.scale)*a,m=e;m<=r;m++)t[m].x-=h,t[m].y+=l;}function Xc(t,e,r,a,l,c){var h,m=t.image;if(m.content){var g=m.content,_=m.pixelRatio||1;h=[g[0]/_,g[1]/_,m.displaySize[0]-g[2]/_,m.displaySize[1]-g[3]/_];}var x,b,I,E,L=e.left*c,B=e.right*c;r==="width"||r==="both"?(E=l[0]+L-a[3],b=l[0]+B+a[1]):b=(E=l[0]+(L+B-m.displaySize[0])/2)+m.displaySize[0];var q=e.top*c,V=e.bottom*c;return r==="height"||r==="both"?(x=l[1]+q-a[0],I=l[1]+V+a[2]):I=(x=l[1]+(q+V-m.displaySize[1])/2)+m.displaySize[1],{image:m,top:x,right:b,bottom:I,left:E,collisionPadding:h}}Hr[10]=!0,Hr[32]=!0,Hr[38]=!0,Hr[40]=!0,Hr[41]=!0,Hr[43]=!0,Hr[45]=!0,Hr[47]=!0,Hr[173]=!0,Hr[183]=!0,Hr[8203]=!0,Hr[8208]=!0,Hr[8211]=!0,Hr[8231]=!0;var $a=function(t){function e(r,a,l,c){t.call(this,r,a),this.angle=l,c!==void 0&&(this.segment=c);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.clone=function(){return new e(this.x,this.y,this.angle,this.segment)},e}(jt);function ic(t,e){var r=e.expression;if(r.kind==="constant")return {kind:"constant",layoutSize:r.evaluate(new Jt(t+1))};if(r.kind==="source")return {kind:"source"};for(var a=r.zoomStops,l=r.interpolationType,c=0;c<a.length&&a[c]<=t;)c++;for(var h=c=Math.max(0,c-1);h<a.length&&a[h]<t+1;)h++;h=Math.min(a.length-1,h);var m=a[c],g=a[h];return r.kind==="composite"?{kind:"composite",minZoom:m,maxZoom:g,interpolationType:l}:{kind:"camera",minZoom:m,maxZoom:g,minSize:r.evaluate(new Jt(m)),maxSize:r.evaluate(new Jt(g)),interpolationType:l}}function Wc(t,e,r){var a=e.uSize,l=r.lowerSize;return t.kind==="source"?l/128:t.kind==="composite"?qe(l/128,r.upperSize/128,e.uSizeT):a}function Kc(t,e){var r=0,a=0;if(t.kind==="constant")a=t.layoutSize;else if(t.kind!=="source"){var l=t.interpolationType,c=l?Lr(cr.interpolationFactor(l,e,t.minZoom,t.maxZoom),0,1):0;t.kind==="camera"?a=qe(t.minSize,t.maxSize,c):r=c;}return {uSizeT:r,uSize:a}}Tt("Anchor",$a);var Zh=Object.freeze({__proto__:null,getSizeData:ic,evaluateSizeForFeature:Wc,evaluateSizeForZoom:Kc,SIZE_PACK_FACTOR:128});function Hc(t,e,r,a,l){if(e.segment===void 0)return !0;for(var c=e,h=e.segment+1,m=0;m>-r/2;){if(--h<0)return !1;m-=t[h].dist(c),c=t[h];}m+=t[h].dist(t[h+1]),h++;for(var g=[],_=0;m<r/2;){var x=t[h],b=t[h+1];if(!b)return !1;var I=t[h-1].angleTo(x)-x.angleTo(b);for(I=Math.abs((I+3*Math.PI)%(2*Math.PI)-Math.PI),g.push({distance:m,angleDelta:I}),_+=I;m-g[0].distance>a;)_-=g.shift().angleDelta;if(_>l)return !1;h++,m+=x.dist(b);}return !0}function Jc(t){for(var e=0,r=0;r<t.length-1;r++)e+=t[r].dist(t[r+1]);return e}function Yc(t,e,r){return t?.6*e*r:0}function Qc(t,e){return Math.max(t?t.right-t.left:0,e?e.right-e.left:0)}function Gh(t,e,r,a,l,c){for(var h=Yc(r,l,c),m=Qc(r,a)*c,g=0,_=Jc(t)/2,x=0;x<t.length-1;x++){var b=t[x],I=t[x+1],E=b.dist(I);if(g+E>_){var L=(_-g)/E,B=qe(b.x,I.x,L),q=qe(b.y,I.y,L),V=new $a(B,q,I.angleTo(b),x);return V._round(),!h||Hc(t,V,m,h,e)?V:void 0}g+=E;}}function Xh(t,e,r,a,l,c,h,m,g){var _=Yc(a,c,h),x=Qc(a,l),b=x*h,I=t[0].x===0||t[0].x===g||t[0].y===0||t[0].y===g;return e-b<e/4&&(e=b+e/4),function E(L,B,q,V,W,J,Y,$,nt){for(var ut=J/2,ft=Jc(L),zt=0,gt=B-q,Mt=[],vt=0;vt<L.length-1;vt++){for(var Xt=L[vt],Ft=L[vt+1],At=Xt.dist(Ft),Kt=Ft.angleTo(Xt);gt+q<zt+At;){var qt=((gt+=q)-zt)/At,ie=qe(Xt.x,Ft.x,qt),Dt=qe(Xt.y,Ft.y,qt);if(ie>=0&&ie<nt&&Dt>=0&&Dt<nt&&gt-ut>=0&&gt+ut<=ft){var ae=new $a(ie,Dt,Kt,vt);ae._round(),V&&!Hc(L,ae,J,V,W)||Mt.push(ae);}}zt+=At;}return $||Mt.length||Y||(Mt=E(L,zt/2,q,V,W,J,Y,!0,nt)),Mt}(t,I?e/2*m%e:(x/2+2*c)*h*m%e,e,_,r,b,I,!1,g)}function $c(t,e,r,a,l){for(var c=[],h=0;h<t.length;h++)for(var m=t[h],g=void 0,_=0;_<m.length-1;_++){var x=m[_],b=m[_+1];x.x<e&&b.x<e||(x.x<e?x=new jt(e,x.y+(e-x.x)/(b.x-x.x)*(b.y-x.y))._round():b.x<e&&(b=new jt(e,x.y+(e-x.x)/(b.x-x.x)*(b.y-x.y))._round()),x.y<r&&b.y<r||(x.y<r?x=new jt(x.x+(r-x.y)/(b.y-x.y)*(b.x-x.x),r)._round():b.y<r&&(b=new jt(x.x+(r-x.y)/(b.y-x.y)*(b.x-x.x),r)._round()),x.x>=a&&b.x>=a||(x.x>=a?x=new jt(a,x.y+(a-x.x)/(b.x-x.x)*(b.y-x.y))._round():b.x>=a&&(b=new jt(a,x.y+(a-x.x)/(b.x-x.x)*(b.y-x.y))._round()),x.y>=l&&b.y>=l||(x.y>=l?x=new jt(x.x+(l-x.y)/(b.y-x.y)*(b.x-x.x),l)._round():b.y>=l&&(b=new jt(x.x+(l-x.y)/(b.y-x.y)*(b.x-x.x),l)._round()),g&&x.equals(g[g.length-1])||c.push(g=[x]),g.push(b)))));}return c}function tp(t,e,r,a){var l=[],c=t.image,h=c.pixelRatio,m=c.paddedRect.w-2,g=c.paddedRect.h-2,_=t.right-t.left,x=t.bottom-t.top,b=c.stretchX||[[0,m]],I=c.stretchY||[[0,g]],E=function(ie,Dt){return ie+Dt[1]-Dt[0]},L=b.reduce(E,0),B=I.reduce(E,0),q=m-L,V=g-B,W=0,J=L,Y=0,$=B,nt=0,ut=q,ft=0,zt=V;if(c.content&&a){var gt=c.content;W=ou(b,0,gt[0]),Y=ou(I,0,gt[1]),J=ou(b,gt[0],gt[2]),$=ou(I,gt[1],gt[3]),nt=gt[0]-W,ft=gt[1]-Y,ut=gt[2]-gt[0]-J,zt=gt[3]-gt[1]-$;}var Mt=function(ie,Dt,ae,Ae){var Le=au(ie.stretch-W,J,_,t.left),ke=su(ie.fixed-nt,ut,ie.stretch,L),Pe=au(Dt.stretch-Y,$,x,t.top),Be=su(Dt.fixed-ft,zt,Dt.stretch,B),Qe=au(ae.stretch-W,J,_,t.left),$e=su(ae.fixed-nt,ut,ae.stretch,L),Ir=au(Ae.stretch-Y,$,x,t.top),ar=su(Ae.fixed-ft,zt,Ae.stretch,B),Er=new jt(Le,Pe),Ve=new jt(Qe,Pe),sr=new jt(Qe,Ir),Yt=new jt(Le,Ir),ve=new jt(ke/h,Be/h),fe=new jt($e/h,ar/h),oe=e*Math.PI/180;if(oe){var Dr=Math.sin(oe),dr=Math.cos(oe),Se=[dr,-Dr,Dr,dr];Er._matMult(Se),Ve._matMult(Se),Yt._matMult(Se),sr._matMult(Se);}var Ge=ie.stretch+ie.fixed,mr=Dt.stretch+Dt.fixed;return {tl:Er,tr:Ve,bl:Yt,br:sr,tex:{x:c.paddedRect.x+1+Ge,y:c.paddedRect.y+1+mr,w:ae.stretch+ae.fixed-Ge,h:Ae.stretch+Ae.fixed-mr},writingMode:void 0,glyphOffset:[0,0],sectionIndex:0,pixelOffsetTL:ve,pixelOffsetBR:fe,minFontScaleX:ut/h/_,minFontScaleY:zt/h/x,isSDF:r}};if(a&&(c.stretchX||c.stretchY))for(var vt=ep(b,q,L),Xt=ep(I,V,B),Ft=0;Ft<vt.length-1;Ft++)for(var At=vt[Ft],Kt=vt[Ft+1],qt=0;qt<Xt.length-1;qt++)l.push(Mt(At,Xt[qt],Kt,Xt[qt+1]));else l.push(Mt({fixed:0,stretch:-1},{fixed:0,stretch:-1},{fixed:0,stretch:m+1},{fixed:0,stretch:g+1}));return l}function ou(t,e,r){for(var a=0,l=0,c=t;l<c.length;l+=1){var h=c[l];a+=Math.max(e,Math.min(r,h[1]))-Math.max(e,Math.min(r,h[0]));}return a}function ep(t,e,r){for(var a=[{fixed:-1,stretch:0}],l=0,c=t;l<c.length;l+=1){var h=c[l],m=h[0],g=h[1],_=a[a.length-1];a.push({fixed:m-_.stretch,stretch:_.stretch}),a.push({fixed:m-_.stretch,stretch:_.stretch+(g-m)});}return a.push({fixed:e+1,stretch:r}),a}function au(t,e,r,a){return t/e*r+a}function su(t,e,r,a){return t-e*r/a}var lu=function(t,e,r,a,l,c,h,m,g,_){if(this.boxStartIndex=t.length,g){var x=c.top,b=c.bottom,I=c.collisionPadding;I&&(x-=I[1],b+=I[3]);var E=b-x;E>0&&(E=Math.max(10,E),this.circleDiameter=E);}else {var L=c.top*h-m,B=c.bottom*h+m,q=c.left*h-m,V=c.right*h+m,W=c.collisionPadding;if(W&&(q-=W[0]*h,L-=W[1]*h,V+=W[2]*h,B+=W[3]*h),_){var J=new jt(q,L),Y=new jt(V,L),$=new jt(q,B),nt=new jt(V,B),ut=_*Math.PI/180;J._rotate(ut),Y._rotate(ut),$._rotate(ut),nt._rotate(ut),q=Math.min(J.x,Y.x,$.x,nt.x),V=Math.max(J.x,Y.x,$.x,nt.x),L=Math.min(J.y,Y.y,$.y,nt.y),B=Math.max(J.y,Y.y,$.y,nt.y);}t.emplaceBack(e.x,e.y,q,L,V,B,r,a,l);}this.boxEndIndex=t.length;},ts=function(t,e){if(t===void 0&&(t=[]),e===void 0&&(e=Wh),this.data=t,this.length=this.data.length,this.compare=e,this.length>0)for(var r=(this.length>>1)-1;r>=0;r--)this._down(r);};function Wh(t,e){return t<e?-1:t>e?1:0}function Kh(t,e,r){e===void 0&&(e=1),r===void 0&&(r=!1);for(var a=1/0,l=1/0,c=-1/0,h=-1/0,m=t[0],g=0;g<m.length;g++){var _=m[g];(!g||_.x<a)&&(a=_.x),(!g||_.y<l)&&(l=_.y),(!g||_.x>c)&&(c=_.x),(!g||_.y>h)&&(h=_.y);}var x=Math.min(c-a,h-l),b=x/2,I=new ts([],Hh);if(x===0)return new jt(a,l);for(var E=a;E<c;E+=x)for(var L=l;L<h;L+=x)I.push(new es(E+b,L+b,b,t));for(var B=function(W){for(var J=0,Y=0,$=0,nt=W[0],ut=0,ft=nt.length,zt=ft-1;ut<ft;zt=ut++){var gt=nt[ut],Mt=nt[zt],vt=gt.x*Mt.y-Mt.x*gt.y;Y+=(gt.x+Mt.x)*vt,$+=(gt.y+Mt.y)*vt,J+=3*vt;}return new es(Y/J,$/J,0,W)}(t),q=I.length;I.length;){var V=I.pop();(V.d>B.d||!B.d)&&(B=V,r&&console.log("found best %d after %d probes",Math.round(1e4*V.d)/1e4,q)),V.max-B.d<=e||(I.push(new es(V.p.x-(b=V.h/2),V.p.y-b,b,t)),I.push(new es(V.p.x+b,V.p.y-b,b,t)),I.push(new es(V.p.x-b,V.p.y+b,b,t)),I.push(new es(V.p.x+b,V.p.y+b,b,t)),q+=4);}return r&&(console.log("num probes: "+q),console.log("best distance: "+B.d)),B.p}function Hh(t,e){return e.max-t.max}function es(t,e,r,a){this.p=new jt(t,e),this.h=r,this.d=function(l,c){for(var h=!1,m=1/0,g=0;g<c.length;g++)for(var _=c[g],x=0,b=_.length,I=b-1;x<b;I=x++){var E=_[x],L=_[I];E.y>l.y!=L.y>l.y&&l.x<(L.x-E.x)*(l.y-E.y)/(L.y-E.y)+E.x&&(h=!h),m=Math.min(m,To(l,E,L));}return (h?1:-1)*Math.sqrt(m)}(this.p,a),this.max=this.d+this.h*Math.SQRT2;}ts.prototype.push=function(t){this.data.push(t),this.length++,this._up(this.length-1);},ts.prototype.pop=function(){if(this.length!==0){var t=this.data[0],e=this.data.pop();return this.length--,this.length>0&&(this.data[0]=e,this._down(0)),t}},ts.prototype.peek=function(){return this.data[0]},ts.prototype._up=function(t){for(var e=this.data,r=this.compare,a=e[t];t>0;){var l=t-1>>1,c=e[l];if(r(a,c)>=0)break;e[t]=c,t=l;}e[t]=a;},ts.prototype._down=function(t){for(var e=this.data,r=this.compare,a=this.length>>1,l=e[t];t<a;){var c=1+(t<<1),h=e[c],m=c+1;if(m<this.length&&r(e[m],h)<0&&(c=m,h=e[m]),r(h,l)>=0)break;e[t]=h,t=c;}e[t]=l;};var nc=Number.POSITIVE_INFINITY;function rp(t,e){return e[1]!==nc?function(r,a,l){var c=0,h=0;switch(a=Math.abs(a),l=Math.abs(l),r){case"top-right":case"top-left":case"top":h=l-7;break;case"bottom-right":case"bottom-left":case"bottom":h=7-l;}switch(r){case"top-right":case"bottom-right":case"right":c=-a;break;case"top-left":case"bottom-left":case"left":c=a;}return [c,h]}(t,e[0],e[1]):function(r,a){var l=0,c=0;a<0&&(a=0);var h=a/Math.sqrt(2);switch(r){case"top-right":case"top-left":c=h-7;break;case"bottom-right":case"bottom-left":c=7-h;break;case"bottom":c=7-a;break;case"top":c=a-7;}switch(r){case"top-right":case"bottom-right":l=-h;break;case"top-left":case"bottom-left":l=h;break;case"left":l=a;break;case"right":l=-a;}return [l,c]}(t,e[0])}function oc(t){switch(t){case"right":case"top-right":case"bottom-right":return "right";case"left":case"top-left":case"bottom-left":return "left"}return "center"}function ip(t,e,r,a,l,c,h,m,g,_,x,b,I,E,L){var B=function(Y,$,nt,ut,ft,zt,gt,Mt){for(var vt=ut.layout.get("text-rotate").evaluate(zt,{})*Math.PI/180,Xt=[],Ft=0,At=$.positionedLines;Ft<At.length;Ft+=1)for(var Kt=At[Ft],qt=0,ie=Kt.positionedGlyphs;qt<ie.length;qt+=1){var Dt=ie[qt];if(Dt.rect){var ae=Dt.rect||{},Ae=4,Le=!0,ke=1,Pe=0,Be=(ft||Mt)&&Dt.vertical,Qe=Dt.metrics.advance*Dt.scale/2;if(Mt&&$.verticalizable&&(Pe=Kt.lineOffset/2-(Dt.imageName?-(24-Dt.metrics.width*Dt.scale)/2:24*(Dt.scale-1))),Dt.imageName){var $e=gt[Dt.imageName];Le=$e.sdf,Ae=1/(ke=$e.pixelRatio);}var Ir=ft?[Dt.x+Qe,Dt.y]:[0,0],ar=ft?[0,0]:[Dt.x+Qe+nt[0],Dt.y+nt[1]-Pe],Er=[0,0];Be&&(Er=ar,ar=[0,0]);var Ve=(Dt.metrics.left-Ae)*Dt.scale-Qe+ar[0],sr=(-Dt.metrics.top-Ae)*Dt.scale+ar[1],Yt=Ve+ae.w*Dt.scale/ke,ve=sr+ae.h*Dt.scale/ke,fe=new jt(Ve,sr),oe=new jt(Yt,sr),Dr=new jt(Ve,ve),dr=new jt(Yt,ve);if(Be){var Se=new jt(-Qe,Qe- -17),Ge=-Math.PI/2,mr=12-Qe,se=new jt(22-mr,-(Dt.imageName?mr:0)),mn=new(Function.prototype.bind.apply(jt,[null].concat(Er)));fe._rotateAround(Ge,Se)._add(se)._add(mn),oe._rotateAround(Ge,Se)._add(se)._add(mn),Dr._rotateAround(Ge,Se)._add(se)._add(mn),dr._rotateAround(Ge,Se)._add(se)._add(mn);}if(vt){var ui=Math.sin(vt),yn=Math.cos(vt),Ne=[yn,-ui,ui,yn];fe._matMult(Ne),oe._matMult(Ne),Dr._matMult(Ne),dr._matMult(Ne);}var gn=new jt(0,0),Di=new jt(0,0);Xt.push({tl:fe,tr:oe,bl:Dr,br:dr,tex:ae,writingMode:$.writingMode,glyphOffset:Ir,sectionIndex:Dt.sectionIndex,isSDF:Le,pixelOffsetTL:gn,pixelOffsetBR:Di,minFontScaleX:0,minFontScaleY:0});}}return Xt}(0,r,m,l,c,h,a,t.allowVerticalPlacement),q=t.textSizeData,V=null;q.kind==="source"?(V=[128*l.layout.get("text-size").evaluate(h,{})])[0]>32640&&Me(t.layerIds[0]+': Value for "text-size" is >= 255. Reduce your "text-size".'):q.kind==="composite"&&((V=[128*E.compositeTextSizes[0].evaluate(h,{},L),128*E.compositeTextSizes[1].evaluate(h,{},L)])[0]>32640||V[1]>32640)&&Me(t.layerIds[0]+': Value for "text-size" is >= 255. Reduce your "text-size".'),t.addSymbols(t.text,B,V,m,c,h,_,e,g.lineStartIndex,g.lineLength,I,L);for(var W=0,J=x;W<J.length;W+=1)b[J[W]]=t.text.placedSymbolArray.length-1;return 4*B.length}function np(t){for(var e in t)return t[e];return null}function Jh(t,e,r,a){var l=t.compareText;if(e in l){for(var c=l[e],h=c.length-1;h>=0;h--)if(a.dist(c[h])<r)return !0}else l[e]=[];return l[e].push(a),!1}var Yh=Ha.VectorTileFeature.types,Qh=[{name:"a_fade_opacity",components:1,type:"Uint8",offset:0}];function uu(t,e,r,a,l,c,h,m,g,_,x,b,I){var E=m?Math.min(32640,Math.round(m[0])):0,L=m?Math.min(32640,Math.round(m[1])):0;t.emplaceBack(e,r,Math.round(32*a),Math.round(32*l),c,h,(E<<1)+(g?1:0),L,16*_,16*x,256*b,256*I);}function ac(t,e,r){t.emplaceBack(e.x,e.y,r),t.emplaceBack(e.x,e.y,r),t.emplaceBack(e.x,e.y,r),t.emplaceBack(e.x,e.y,r);}function $h(t){for(var e=0,r=t.sections;e<r.length;e+=1)if(Oa(r[e].text))return !0;return !1}var rs=function(t){this.layoutVertexArray=new ja,this.indexArray=new un,this.programConfigurations=t,this.segments=new z,this.dynamicLayoutVertexArray=new bo,this.opacityVertexArray=new na,this.placedSymbolArray=new s;};rs.prototype.isEmpty=function(){return this.layoutVertexArray.length===0&&this.indexArray.length===0&&this.dynamicLayoutVertexArray.length===0&&this.opacityVertexArray.length===0},rs.prototype.upload=function(t,e,r,a){this.isEmpty()||(r&&(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,Ih.members),this.indexBuffer=t.createIndexBuffer(this.indexArray,e),this.dynamicLayoutVertexBuffer=t.createVertexBuffer(this.dynamicLayoutVertexArray,Eh.members,!0),this.opacityVertexBuffer=t.createVertexBuffer(this.opacityVertexArray,Qh,!0),this.opacityVertexBuffer.itemSize=1),(r||a)&&this.programConfigurations.upload(t));},rs.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy(),this.dynamicLayoutVertexBuffer.destroy(),this.opacityVertexBuffer.destroy());},Tt("SymbolBuffers",rs);var rl=function(t,e,r){this.layoutVertexArray=new t,this.layoutAttributes=e,this.indexArray=new r,this.segments=new z,this.collisionVertexArray=new Zs;};rl.prototype.upload=function(t){this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,this.layoutAttributes),this.indexBuffer=t.createIndexBuffer(this.indexArray),this.collisionVertexBuffer=t.createVertexBuffer(this.collisionVertexArray,Ah.members,!0);},rl.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.segments.destroy(),this.collisionVertexBuffer.destroy());},Tt("CollisionBuffers",rl);var me=function(t){this.collisionBoxArray=t.collisionBoxArray,this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map(function(c){return c.id}),this.index=t.index,this.pixelRatio=t.pixelRatio,this.sourceLayerIndex=t.sourceLayerIndex,this.hasPattern=!1,this.hasRTLText=!1,this.sortKeyRanges=[],this.collisionCircleArray=[],this.placementInvProjMatrix=Kr([]),this.placementViewportMatrix=Kr([]);var e=this.layers[0]._unevaluatedLayout._values;this.textSizeData=ic(this.zoom,e["text-size"]),this.iconSizeData=ic(this.zoom,e["icon-size"]);var r=this.layers[0].layout,a=r.get("symbol-sort-key"),l=r.get("symbol-z-order");this.canOverlap=r.get("text-allow-overlap")||r.get("icon-allow-overlap")||r.get("text-ignore-placement")||r.get("icon-ignore-placement"),this.sortFeaturesByKey=l!=="viewport-y"&&a.constantOr(1)!==void 0,this.sortFeaturesByY=(l==="viewport-y"||l==="auto"&&!this.sortFeaturesByKey)&&this.canOverlap,r.get("symbol-placement")==="point"&&(this.writingModes=r.get("text-writing-mode").map(function(c){return li[c]})),this.stateDependentLayerIds=this.layers.filter(function(c){return c.isStateDependent()}).map(function(c){return c.id}),this.sourceID=t.sourceID;};me.prototype.createArrays=function(){this.text=new rs(new Rt(this.layers,this.zoom,function(t){return /^text/.test(t)})),this.icon=new rs(new Rt(this.layers,this.zoom,function(t){return /^icon/.test(t)})),this.glyphOffsetArray=new d,this.lineVertexArray=new y,this.symbolInstances=new f;},me.prototype.calculateGlyphDependencies=function(t,e,r,a,l){for(var c=0;c<t.length;c++)if(e[t.charCodeAt(c)]=!0,(r||a)&&l){var h=$s[t.charAt(c)];h&&(e[h.charCodeAt(0)]=!0);}},me.prototype.populate=function(t,e,r){var a=this.layers[0],l=a.layout,c=l.get("text-font"),h=l.get("text-field"),m=l.get("icon-image"),g=(h.value.kind!=="constant"||h.value.value instanceof er&&!h.value.value.isEmpty()||h.value.value.toString().length>0)&&(c.value.kind!=="constant"||c.value.value.length>0),_=m.value.kind!=="constant"||!!m.value.value||Object.keys(m.parameters).length>0,x=l.get("symbol-sort-key");if(this.features=[],g||_){for(var b=e.iconDependencies,I=e.glyphDependencies,E=e.availableImages,L=new Jt(this.zoom),B=0,q=t;B<q.length;B+=1){var V=q[B],W=V.feature,J=V.id,Y=V.index,$=V.sourceLayerIndex,nt=a._featureFilter.needGeometry,ut=Ue(W,nt);if(a._featureFilter.filter(L,ut,r)){nt||(ut.geometry=Ce(W));var ft=void 0;if(g){var zt=a.getValueAndResolveTokens("text-field",ut,r,E),gt=er.factory(zt);$h(gt)&&(this.hasRTLText=!0),(!this.hasRTLText||Vs()==="unavailable"||this.hasRTLText&&Wr.isParsed())&&(ft=zh(gt,a,ut));}var Mt=void 0;if(_){var vt=a.getValueAndResolveTokens("icon-image",ut,r,E);Mt=vt instanceof zr?vt:zr.fromString(vt);}if(ft||Mt){var Xt=this.sortFeaturesByKey?x.evaluate(ut,{},r):void 0;if(this.features.push({id:J,text:ft,icon:Mt,index:Y,sourceLayerIndex:$,geometry:ut.geometry,properties:W.properties,type:Yh[W.type],sortKey:Xt}),Mt&&(b[Mt.name]=!0),ft){var Ft=c.evaluate(ut,{},r).join(","),At=l.get("text-rotation-alignment")==="map"&&l.get("symbol-placement")!=="point";this.allowVerticalPlacement=this.writingModes&&this.writingModes.indexOf(li.vertical)>=0;for(var Kt=0,qt=ft.sections;Kt<qt.length;Kt+=1){var ie=qt[Kt];if(ie.image)b[ie.image.name]=!0;else {var Dt=Fs(ft.toString()),ae=ie.fontStack||Ft,Ae=I[ae]=I[ae]||{};this.calculateGlyphDependencies(ie.text,Ae,At,this.allowVerticalPlacement,Dt);}}}}}}l.get("symbol-placement")==="line"&&(this.features=function(Le){var ke={},Pe={},Be=[],Qe=0;function $e(Se){Be.push(Le[Se]),Qe++;}function Ir(Se,Ge,mr){var se=Pe[Se];return delete Pe[Se],Pe[Ge]=se,Be[se].geometry[0].pop(),Be[se].geometry[0]=Be[se].geometry[0].concat(mr[0]),se}function ar(Se,Ge,mr){var se=ke[Ge];return delete ke[Ge],ke[Se]=se,Be[se].geometry[0].shift(),Be[se].geometry[0]=mr[0].concat(Be[se].geometry[0]),se}function Er(Se,Ge,mr){var se=mr?Ge[0][Ge[0].length-1]:Ge[0][0];return Se+":"+se.x+":"+se.y}for(var Ve=0;Ve<Le.length;Ve++){var sr=Le[Ve],Yt=sr.geometry,ve=sr.text?sr.text.toString():null;if(ve){var fe=Er(ve,Yt),oe=Er(ve,Yt,!0);if(fe in Pe&&oe in ke&&Pe[fe]!==ke[oe]){var Dr=ar(fe,oe,Yt),dr=Ir(fe,oe,Be[Dr].geometry);delete ke[fe],delete Pe[oe],Pe[Er(ve,Be[dr].geometry,!0)]=dr,Be[Dr].geometry=null;}else fe in Pe?Ir(fe,oe,Yt):oe in ke?ar(fe,oe,Yt):($e(Ve),ke[fe]=Qe-1,Pe[oe]=Qe-1);}else $e(Ve);}return Be.filter(function(Se){return Se.geometry})}(this.features)),this.sortFeaturesByKey&&this.features.sort(function(Le,ke){return Le.sortKey-ke.sortKey});}},me.prototype.update=function(t,e,r){this.stateDependentLayers.length&&(this.text.programConfigurations.updatePaintArrays(t,e,this.layers,r),this.icon.programConfigurations.updatePaintArrays(t,e,this.layers,r));},me.prototype.isEmpty=function(){return this.symbolInstances.length===0&&!this.hasRTLText},me.prototype.uploadPending=function(){return !this.uploaded||this.text.programConfigurations.needsUpload||this.icon.programConfigurations.needsUpload},me.prototype.upload=function(t){!this.uploaded&&this.hasDebugData()&&(this.textCollisionBox.upload(t),this.iconCollisionBox.upload(t)),this.text.upload(t,this.sortFeaturesByY,!this.uploaded,this.text.programConfigurations.needsUpload),this.icon.upload(t,this.sortFeaturesByY,!this.uploaded,this.icon.programConfigurations.needsUpload),this.uploaded=!0;},me.prototype.destroyDebugData=function(){this.textCollisionBox.destroy(),this.iconCollisionBox.destroy();},me.prototype.destroy=function(){this.text.destroy(),this.icon.destroy(),this.hasDebugData()&&this.destroyDebugData();},me.prototype.addToLineVertexArray=function(t,e){var r=this.lineVertexArray.length;if(t.segment!==void 0){for(var a=t.dist(e[t.segment+1]),l=t.dist(e[t.segment]),c={},h=t.segment+1;h<e.length;h++)c[h]={x:e[h].x,y:e[h].y,tileUnitDistanceFromAnchor:a},h<e.length-1&&(a+=e[h+1].dist(e[h]));for(var m=t.segment||0;m>=0;m--)c[m]={x:e[m].x,y:e[m].y,tileUnitDistanceFromAnchor:l},m>0&&(l+=e[m-1].dist(e[m]));for(var g=0;g<e.length;g++){var _=c[g];this.lineVertexArray.emplaceBack(_.x,_.y,_.tileUnitDistanceFromAnchor);}}return {lineStartIndex:r,lineLength:this.lineVertexArray.length-r}},me.prototype.addSymbols=function(t,e,r,a,l,c,h,m,g,_,x,b){for(var I=t.indexArray,E=t.layoutVertexArray,L=t.segments.prepareSegment(4*e.length,E,I,this.canOverlap?c.sortKey:void 0),B=this.glyphOffsetArray.length,q=L.vertexLength,V=this.allowVerticalPlacement&&h===li.vertical?Math.PI/2:0,W=c.text&&c.text.sections,J=0;J<e.length;J++){var Y=e[J],$=Y.tl,nt=Y.tr,ut=Y.bl,ft=Y.br,zt=Y.tex,gt=Y.pixelOffsetTL,Mt=Y.pixelOffsetBR,vt=Y.minFontScaleX,Xt=Y.minFontScaleY,Ft=Y.glyphOffset,At=Y.isSDF,Kt=Y.sectionIndex,qt=L.vertexLength,ie=Ft[1];uu(E,m.x,m.y,$.x,ie+$.y,zt.x,zt.y,r,At,gt.x,gt.y,vt,Xt),uu(E,m.x,m.y,nt.x,ie+nt.y,zt.x+zt.w,zt.y,r,At,Mt.x,gt.y,vt,Xt),uu(E,m.x,m.y,ut.x,ie+ut.y,zt.x,zt.y+zt.h,r,At,gt.x,Mt.y,vt,Xt),uu(E,m.x,m.y,ft.x,ie+ft.y,zt.x+zt.w,zt.y+zt.h,r,At,Mt.x,Mt.y,vt,Xt),ac(t.dynamicLayoutVertexArray,m,V),I.emplaceBack(qt,qt+1,qt+2),I.emplaceBack(qt+1,qt+2,qt+3),L.vertexLength+=4,L.primitiveLength+=2,this.glyphOffsetArray.emplaceBack(Ft[0]),J!==e.length-1&&Kt===e[J+1].sectionIndex||t.programConfigurations.populatePaintArrays(E.length,c,c.index,{},b,W&&W[Kt]);}t.placedSymbolArray.emplaceBack(m.x,m.y,B,this.glyphOffsetArray.length-B,q,g,_,m.segment,r?r[0]:0,r?r[1]:0,a[0],a[1],h,0,!1,0,x);},me.prototype._addCollisionDebugVertex=function(t,e,r,a,l,c){return e.emplaceBack(0,0),t.emplaceBack(r.x,r.y,a,l,Math.round(c.x),Math.round(c.y))},me.prototype.addCollisionDebugVertices=function(t,e,r,a,l,c,h){var m=l.segments.prepareSegment(4,l.layoutVertexArray,l.indexArray),g=m.vertexLength,_=l.layoutVertexArray,x=l.collisionVertexArray,b=h.anchorX,I=h.anchorY;this._addCollisionDebugVertex(_,x,c,b,I,new jt(t,e)),this._addCollisionDebugVertex(_,x,c,b,I,new jt(r,e)),this._addCollisionDebugVertex(_,x,c,b,I,new jt(r,a)),this._addCollisionDebugVertex(_,x,c,b,I,new jt(t,a)),m.vertexLength+=4;var E=l.indexArray;E.emplaceBack(g,g+1),E.emplaceBack(g+1,g+2),E.emplaceBack(g+2,g+3),E.emplaceBack(g+3,g),m.primitiveLength+=4;},me.prototype.addDebugCollisionBoxes=function(t,e,r,a){for(var l=t;l<e;l++){var c=this.collisionBoxArray.get(l);this.addCollisionDebugVertices(c.x1,c.y1,c.x2,c.y2,a?this.textCollisionBox:this.iconCollisionBox,c.anchorPoint,r);}},me.prototype.generateCollisionDebugBuffers=function(){this.hasDebugData()&&this.destroyDebugData(),this.textCollisionBox=new rl(wo,Rc.members,oa),this.iconCollisionBox=new rl(wo,Rc.members,oa);for(var t=0;t<this.symbolInstances.length;t++){var e=this.symbolInstances.get(t);this.addDebugCollisionBoxes(e.textBoxStartIndex,e.textBoxEndIndex,e,!0),this.addDebugCollisionBoxes(e.verticalTextBoxStartIndex,e.verticalTextBoxEndIndex,e,!0),this.addDebugCollisionBoxes(e.iconBoxStartIndex,e.iconBoxEndIndex,e,!1),this.addDebugCollisionBoxes(e.verticalIconBoxStartIndex,e.verticalIconBoxEndIndex,e,!1);}},me.prototype._deserializeCollisionBoxesForSymbol=function(t,e,r,a,l,c,h,m,g){for(var _={},x=e;x<r;x++){var b=t.get(x);_.textBox={x1:b.x1,y1:b.y1,x2:b.x2,y2:b.y2,anchorPointX:b.anchorPointX,anchorPointY:b.anchorPointY},_.textFeatureIndex=b.featureIndex;break}for(var I=a;I<l;I++){var E=t.get(I);_.verticalTextBox={x1:E.x1,y1:E.y1,x2:E.x2,y2:E.y2,anchorPointX:E.anchorPointX,anchorPointY:E.anchorPointY},_.verticalTextFeatureIndex=E.featureIndex;break}for(var L=c;L<h;L++){var B=t.get(L);_.iconBox={x1:B.x1,y1:B.y1,x2:B.x2,y2:B.y2,anchorPointX:B.anchorPointX,anchorPointY:B.anchorPointY},_.iconFeatureIndex=B.featureIndex;break}for(var q=m;q<g;q++){var V=t.get(q);_.verticalIconBox={x1:V.x1,y1:V.y1,x2:V.x2,y2:V.y2,anchorPointX:V.anchorPointX,anchorPointY:V.anchorPointY},_.verticalIconFeatureIndex=V.featureIndex;break}return _},me.prototype.deserializeCollisionBoxes=function(t){this.collisionArrays=[];for(var e=0;e<this.symbolInstances.length;e++){var r=this.symbolInstances.get(e);this.collisionArrays.push(this._deserializeCollisionBoxesForSymbol(t,r.textBoxStartIndex,r.textBoxEndIndex,r.verticalTextBoxStartIndex,r.verticalTextBoxEndIndex,r.iconBoxStartIndex,r.iconBoxEndIndex,r.verticalIconBoxStartIndex,r.verticalIconBoxEndIndex));}},me.prototype.hasTextData=function(){return this.text.segments.get().length>0},me.prototype.hasIconData=function(){return this.icon.segments.get().length>0},me.prototype.hasDebugData=function(){return this.textCollisionBox&&this.iconCollisionBox},me.prototype.hasTextCollisionBoxData=function(){return this.hasDebugData()&&this.textCollisionBox.segments.get().length>0},me.prototype.hasIconCollisionBoxData=function(){return this.hasDebugData()&&this.iconCollisionBox.segments.get().length>0},me.prototype.addIndicesForPlacedSymbol=function(t,e){for(var r=t.placedSymbolArray.get(e),a=r.vertexStartIndex+4*r.numGlyphs,l=r.vertexStartIndex;l<a;l+=4)t.indexArray.emplaceBack(l,l+1,l+2),t.indexArray.emplaceBack(l+1,l+2,l+3);},me.prototype.getSortedSymbolIndexes=function(t){if(this.sortedAngle===t&&this.symbolInstanceIndexes!==void 0)return this.symbolInstanceIndexes;for(var e=Math.sin(t),r=Math.cos(t),a=[],l=[],c=[],h=0;h<this.symbolInstances.length;++h){c.push(h);var m=this.symbolInstances.get(h);a.push(0|Math.round(e*m.anchorX+r*m.anchorY)),l.push(m.featureIndex);}return c.sort(function(g,_){return a[g]-a[_]||l[_]-l[g]}),c},me.prototype.addToSortKeyRanges=function(t,e){var r=this.sortKeyRanges[this.sortKeyRanges.length-1];r&&r.sortKey===e?r.symbolInstanceEnd=t+1:this.sortKeyRanges.push({sortKey:e,symbolInstanceStart:t,symbolInstanceEnd:t+1});},me.prototype.sortFeatures=function(t){var e=this;if(this.sortFeaturesByY&&this.sortedAngle!==t&&!(this.text.segments.get().length>1||this.icon.segments.get().length>1)){this.symbolInstanceIndexes=this.getSortedSymbolIndexes(t),this.sortedAngle=t,this.text.indexArray.clear(),this.icon.indexArray.clear(),this.featureSortOrder=[];for(var r=0,a=this.symbolInstanceIndexes;r<a.length;r+=1){var l=this.symbolInstances.get(a[r]);this.featureSortOrder.push(l.featureIndex),[l.rightJustifiedTextSymbolIndex,l.centerJustifiedTextSymbolIndex,l.leftJustifiedTextSymbolIndex].forEach(function(c,h,m){c>=0&&m.indexOf(c)===h&&e.addIndicesForPlacedSymbol(e.text,c);}),l.verticalPlacedTextSymbolIndex>=0&&this.addIndicesForPlacedSymbol(this.text,l.verticalPlacedTextSymbolIndex),l.placedIconSymbolIndex>=0&&this.addIndicesForPlacedSymbol(this.icon,l.placedIconSymbolIndex),l.verticalPlacedIconSymbolIndex>=0&&this.addIndicesForPlacedSymbol(this.icon,l.verticalPlacedIconSymbolIndex);}this.text.indexBuffer&&this.text.indexBuffer.updateData(this.text.indexArray),this.icon.indexBuffer&&this.icon.indexBuffer.updateData(this.icon.indexArray);}},Tt("SymbolBucket",me,{omit:["layers","collisionBoxArray","features","compareText"]}),me.MAX_GLYPHS=65535,me.addDynamicAttributes=ac;var tf=new hr({"symbol-placement":new Ct(C.layout_symbol["symbol-placement"]),"symbol-spacing":new Ct(C.layout_symbol["symbol-spacing"]),"symbol-avoid-edges":new Ct(C.layout_symbol["symbol-avoid-edges"]),"symbol-sort-key":new Et(C.layout_symbol["symbol-sort-key"]),"symbol-z-order":new Ct(C.layout_symbol["symbol-z-order"]),"icon-allow-overlap":new Ct(C.layout_symbol["icon-allow-overlap"]),"icon-ignore-placement":new Ct(C.layout_symbol["icon-ignore-placement"]),"icon-optional":new Ct(C.layout_symbol["icon-optional"]),"icon-rotation-alignment":new Ct(C.layout_symbol["icon-rotation-alignment"]),"icon-size":new Et(C.layout_symbol["icon-size"]),"icon-text-fit":new Ct(C.layout_symbol["icon-text-fit"]),"icon-text-fit-padding":new Ct(C.layout_symbol["icon-text-fit-padding"]),"icon-image":new Et(C.layout_symbol["icon-image"]),"icon-rotate":new Et(C.layout_symbol["icon-rotate"]),"icon-padding":new Ct(C.layout_symbol["icon-padding"]),"icon-keep-upright":new Ct(C.layout_symbol["icon-keep-upright"]),"icon-offset":new Et(C.layout_symbol["icon-offset"]),"icon-anchor":new Et(C.layout_symbol["icon-anchor"]),"icon-pitch-alignment":new Ct(C.layout_symbol["icon-pitch-alignment"]),"text-pitch-alignment":new Ct(C.layout_symbol["text-pitch-alignment"]),"text-rotation-alignment":new Ct(C.layout_symbol["text-rotation-alignment"]),"text-field":new Et(C.layout_symbol["text-field"]),"text-font":new Et(C.layout_symbol["text-font"]),"text-size":new Et(C.layout_symbol["text-size"]),"text-max-width":new Et(C.layout_symbol["text-max-width"]),"text-line-height":new Ct(C.layout_symbol["text-line-height"]),"text-letter-spacing":new Et(C.layout_symbol["text-letter-spacing"]),"text-justify":new Et(C.layout_symbol["text-justify"]),"text-radial-offset":new Et(C.layout_symbol["text-radial-offset"]),"text-variable-anchor":new Ct(C.layout_symbol["text-variable-anchor"]),"text-anchor":new Et(C.layout_symbol["text-anchor"]),"text-max-angle":new Ct(C.layout_symbol["text-max-angle"]),"text-writing-mode":new Ct(C.layout_symbol["text-writing-mode"]),"text-rotate":new Et(C.layout_symbol["text-rotate"]),"text-padding":new Ct(C.layout_symbol["text-padding"]),"text-keep-upright":new Ct(C.layout_symbol["text-keep-upright"]),"text-transform":new Et(C.layout_symbol["text-transform"]),"text-offset":new Et(C.layout_symbol["text-offset"]),"text-allow-overlap":new Ct(C.layout_symbol["text-allow-overlap"]),"text-ignore-placement":new Ct(C.layout_symbol["text-ignore-placement"]),"text-optional":new Ct(C.layout_symbol["text-optional"])}),sc={paint:new hr({"icon-opacity":new Et(C.paint_symbol["icon-opacity"]),"icon-color":new Et(C.paint_symbol["icon-color"]),"icon-halo-color":new Et(C.paint_symbol["icon-halo-color"]),"icon-halo-width":new Et(C.paint_symbol["icon-halo-width"]),"icon-halo-blur":new Et(C.paint_symbol["icon-halo-blur"]),"icon-translate":new Ct(C.paint_symbol["icon-translate"]),"icon-translate-anchor":new Ct(C.paint_symbol["icon-translate-anchor"]),"text-opacity":new Et(C.paint_symbol["text-opacity"]),"text-color":new Et(C.paint_symbol["text-color"],{runtimeType:yt,getOverride:function(t){return t.textColor},hasOverride:function(t){return !!t.textColor}}),"text-halo-color":new Et(C.paint_symbol["text-halo-color"]),"text-halo-width":new Et(C.paint_symbol["text-halo-width"]),"text-halo-blur":new Et(C.paint_symbol["text-halo-blur"]),"text-translate":new Ct(C.paint_symbol["text-translate"]),"text-translate-anchor":new Ct(C.paint_symbol["text-translate-anchor"])}),layout:tf},is=function(t){this.type=t.property.overrides?t.property.overrides.runtimeType:St,this.defaultValue=t;};is.prototype.evaluate=function(t){if(t.formattedSection){var e=this.defaultValue.property.overrides;if(e&&e.hasOverride(t.formattedSection))return e.getOverride(t.formattedSection)}return t.feature&&t.featureState?this.defaultValue.evaluate(t.feature,t.featureState):this.defaultValue.property.specification.default},is.prototype.eachChild=function(t){this.defaultValue.isConstant()||t(this.defaultValue.value._styleExpression.expression);},is.prototype.outputDefined=function(){return !1},is.prototype.serialize=function(){return null},Tt("FormatSectionOverride",is,{omit:["defaultValue"]});var ef=function(t){function e(r){t.call(this,r,sc);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.recalculate=function(r,a){if(t.prototype.recalculate.call(this,r,a),this.layout.get("icon-rotation-alignment")==="auto"&&(this.layout._values["icon-rotation-alignment"]=this.layout.get("symbol-placement")!=="point"?"map":"viewport"),this.layout.get("text-rotation-alignment")==="auto"&&(this.layout._values["text-rotation-alignment"]=this.layout.get("symbol-placement")!=="point"?"map":"viewport"),this.layout.get("text-pitch-alignment")==="auto"&&(this.layout._values["text-pitch-alignment"]=this.layout.get("text-rotation-alignment")),this.layout.get("icon-pitch-alignment")==="auto"&&(this.layout._values["icon-pitch-alignment"]=this.layout.get("icon-rotation-alignment")),this.layout.get("symbol-placement")==="point"){var l=this.layout.get("text-writing-mode");if(l){for(var c=[],h=0,m=l;h<m.length;h+=1){var g=m[h];c.indexOf(g)<0&&c.push(g);}this.layout._values["text-writing-mode"]=c;}else this.layout._values["text-writing-mode"]=["horizontal"];}this._setPaintOverrides();},e.prototype.getValueAndResolveTokens=function(r,a,l,c){var h=this.layout.get(r).evaluate(a,{},l,c),m=this._unevaluatedLayout._values[r];return m.isDataDriven()||Wo(m.value)||!h?h:function(g,_){return _.replace(/{([^{}]+)}/g,function(x,b){return b in g?String(g[b]):""})}(a.properties,h)},e.prototype.createBucket=function(r){return new me(r)},e.prototype.queryRadius=function(){return 0},e.prototype.queryIntersectsFeature=function(){return !1},e.prototype._setPaintOverrides=function(){for(var r=0,a=sc.paint.overridableProperties;r<a.length;r+=1){var l=a[r];if(e.hasPaintOverride(this.layout,l)){var c,h=this.paint.get(l),m=new is(h),g=new mo(m,h.property.specification);c=h.value.kind==="constant"||h.value.kind==="source"?new Ko("source",g):new yo("composite",g,h.value.zoomStops,h.value._interpolationType),this.paint._values[l]=new br(h.property,c,h.parameters);}}},e.prototype._handleOverridablePaintPropertyUpdate=function(r,a,l){return !(!this.layout||a.isDataDriven()||l.isDataDriven())&&e.hasPaintOverride(this.layout,r)},e.hasPaintOverride=function(r,a){var l=r.get("text-field"),c=sc.paint.properties[a],h=!1,m=function(x){for(var b=0,I=x;b<I.length;b+=1)if(c.overrides&&c.overrides.hasOverride(I[b]))return void(h=!0)};if(l.value.kind==="constant"&&l.value.value instanceof er)m(l.value.value.sections);else if(l.value.kind==="source"){var g=function(x){h||(x instanceof vr&&Oe(x.value)===ge?m(x.value.sections):x instanceof gi?m(x.sections):x.eachChild(g));},_=l.value;_._styleExpression&&g(_._styleExpression.expression);}return h},e}(zi),rf={paint:new hr({"background-color":new Ct(C.paint_background["background-color"]),"background-pattern":new wr(C.paint_background["background-pattern"]),"background-opacity":new Ct(C.paint_background["background-opacity"])})},nf=function(t){function e(r){t.call(this,r,rf);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(zi),of={paint:new hr({"raster-opacity":new Ct(C.paint_raster["raster-opacity"]),"raster-hue-rotate":new Ct(C.paint_raster["raster-hue-rotate"]),"raster-brightness-min":new Ct(C.paint_raster["raster-brightness-min"]),"raster-brightness-max":new Ct(C.paint_raster["raster-brightness-max"]),"raster-saturation":new Ct(C.paint_raster["raster-saturation"]),"raster-contrast":new Ct(C.paint_raster["raster-contrast"]),"raster-resampling":new Ct(C.paint_raster["raster-resampling"]),"raster-fade-duration":new Ct(C.paint_raster["raster-fade-duration"])})},af=function(t){function e(r){t.call(this,r,of);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(zi),sf=function(t){function e(r){t.call(this,r,{}),this.implementation=r;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.is3D=function(){return this.implementation.renderingMode==="3d"},e.prototype.hasOffscreenPass=function(){return this.implementation.prerender!==void 0},e.prototype.recalculate=function(){},e.prototype.updateTransitions=function(){},e.prototype.hasTransition=function(){},e.prototype.serialize=function(){},e.prototype.onAdd=function(r){this.implementation.onAdd&&this.implementation.onAdd(r,r.painter.context.gl);},e.prototype.onRemove=function(r){this.implementation.onRemove&&this.implementation.onRemove(r,r.painter.context.gl);},e}(zi),lf={circle:Gu,heatmap:Zp,hillshade:Xp,fill:uh,"fill-extrusion":_h,line:Th,symbol:ef,background:nf,raster:af},op=Pt.HTMLImageElement,ap=Pt.HTMLCanvasElement,sp=Pt.HTMLVideoElement,lp=Pt.ImageData,cu=Pt.ImageBitmap,pa=function(t,e,r,a){this.context=t,this.format=r,this.texture=t.gl.createTexture(),this.update(e,a);};pa.prototype.update=function(t,e,r){var a=t.width,l=t.height,c=!(this.size&&this.size[0]===a&&this.size[1]===l||r),h=this.context,m=h.gl;if(this.useMipmap=Boolean(e&&e.useMipmap),m.bindTexture(m.TEXTURE_2D,this.texture),h.pixelStoreUnpackFlipY.set(!1),h.pixelStoreUnpack.set(1),h.pixelStoreUnpackPremultiplyAlpha.set(this.format===m.RGBA&&(!e||e.premultiply!==!1)),c)this.size=[a,l],t instanceof op||t instanceof ap||t instanceof sp||t instanceof lp||cu&&t instanceof cu?m.texImage2D(m.TEXTURE_2D,0,this.format,this.format,m.UNSIGNED_BYTE,t):m.texImage2D(m.TEXTURE_2D,0,this.format,a,l,0,this.format,m.UNSIGNED_BYTE,t.data);else {var g=r||{x:0,y:0},_=g.x,x=g.y;t instanceof op||t instanceof ap||t instanceof sp||t instanceof lp||cu&&t instanceof cu?m.texSubImage2D(m.TEXTURE_2D,0,_,x,m.RGBA,m.UNSIGNED_BYTE,t):m.texSubImage2D(m.TEXTURE_2D,0,_,x,a,l,m.RGBA,m.UNSIGNED_BYTE,t.data);}this.useMipmap&&this.isSizePowerOfTwo()&&m.generateMipmap(m.TEXTURE_2D);},pa.prototype.bind=function(t,e,r){var a=this.context.gl;a.bindTexture(a.TEXTURE_2D,this.texture),r!==a.LINEAR_MIPMAP_NEAREST||this.isSizePowerOfTwo()||(r=a.LINEAR),t!==this.filter&&(a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,t),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,r||t),this.filter=t),e!==this.wrap&&(a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,e),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,e),this.wrap=e);},pa.prototype.isSizePowerOfTwo=function(){return this.size[0]===this.size[1]&&Math.log(this.size[0])/Math.LN2%1==0},pa.prototype.destroy=function(){this.context.gl.deleteTexture(this.texture),this.texture=null;};var lc=function(t){var e=this;this._callback=t,this._triggered=!1,typeof MessageChannel!="undefined"&&(this._channel=new MessageChannel,this._channel.port2.onmessage=function(){e._triggered=!1,e._callback();});};lc.prototype.trigger=function(){var t=this;this._triggered||(this._triggered=!0,this._channel?this._channel.port1.postMessage(!0):setTimeout(function(){t._triggered=!1,t._callback();},0));},lc.prototype.remove=function(){delete this._channel,this._callback=function(){};};var ns=function(t,e,r){this.target=t,this.parent=e,this.mapId=r,this.callbacks={},this.tasks={},this.taskQueue=[],this.cancelCallbacks={},ro(["receive","process"],this),this.invoker=new lc(this.process),this.target.addEventListener("message",this.receive,!1),this.globalScope=hi()?t:Pt;};function up(t,e,r){var a=2*Math.PI*6378137/256/Math.pow(2,r);return [t*a-2*Math.PI*6378137/2,e*a-2*Math.PI*6378137/2]}ns.prototype.send=function(t,e,r,a,l){var c=this;l===void 0&&(l=!1);var h=Math.round(1e18*Math.random()).toString(36).substring(0,10);r&&(this.callbacks[h]=r);var m=va(this.globalScope)?void 0:[];return this.target.postMessage({id:h,type:t,hasCallback:!!r,targetMapId:a,mustQueue:l,sourceMapId:this.mapId,data:vi(e,m)},m),{cancel:function(){r&&delete c.callbacks[h],c.target.postMessage({id:h,type:"<cancel>",targetMapId:a,sourceMapId:c.mapId});}}},ns.prototype.receive=function(t){var e=t.data,r=e.id;if(r&&(!e.targetMapId||this.mapId===e.targetMapId))if(e.type==="<cancel>"){delete this.tasks[r];var a=this.cancelCallbacks[r];delete this.cancelCallbacks[r],a&&a();}else hi()||e.mustQueue?(this.tasks[r]=e,this.taskQueue.push(r),this.invoker.trigger()):this.processTask(r,e);},ns.prototype.process=function(){if(this.taskQueue.length){var t=this.taskQueue.shift(),e=this.tasks[t];delete this.tasks[t],this.taskQueue.length&&this.invoker.trigger(),e&&this.processTask(t,e);}},ns.prototype.processTask=function(t,e){var r=this;if(e.type==="<response>"){var a=this.callbacks[t];delete this.callbacks[t],a&&(e.error?a(Or(e.error)):a(null,Or(e.data)));}else {var l=!1,c=va(this.globalScope)?void 0:[],h=e.hasCallback?function(x,b){l=!0,delete r.cancelCallbacks[t],r.target.postMessage({id:t,type:"<response>",sourceMapId:r.mapId,error:x?vi(x):null,data:vi(b,c)},c);}:function(x){l=!0;},m=null,g=Or(e.data);if(this.parent[e.type])m=this.parent[e.type](e.sourceMapId,g,h);else if(this.parent.getWorkerSource){var _=e.type.split(".");m=this.parent.getWorkerSource(e.sourceMapId,_[0],g.source)[_[1]](g,h);}else h(new Error("Could not find function "+e.type));!l&&m&&m.cancel&&(this.cancelCallbacks[t]=m.cancel);}},ns.prototype.remove=function(){this.invoker.remove(),this.target.removeEventListener("message",this.receive,!1);};var Ke=function(t,e){t&&(e?this.setSouthWest(t).setNorthEast(e):t.length===4?this.setSouthWest([t[0],t[1]]).setNorthEast([t[2],t[3]]):this.setSouthWest(t[0]).setNorthEast(t[1]));};Ke.prototype.setNorthEast=function(t){return this._ne=t instanceof Ee?new Ee(t.lng,t.lat):Ee.convert(t),this},Ke.prototype.setSouthWest=function(t){return this._sw=t instanceof Ee?new Ee(t.lng,t.lat):Ee.convert(t),this},Ke.prototype.extend=function(t){var e,r,a=this._sw,l=this._ne;if(t instanceof Ee)e=t,r=t;else {if(!(t instanceof Ke))return Array.isArray(t)?t.length===4||t.every(Array.isArray)?this.extend(Ke.convert(t)):this.extend(Ee.convert(t)):this;if(r=t._ne,!(e=t._sw)||!r)return this}return a||l?(a.lng=Math.min(e.lng,a.lng),a.lat=Math.min(e.lat,a.lat),l.lng=Math.max(r.lng,l.lng),l.lat=Math.max(r.lat,l.lat)):(this._sw=new Ee(e.lng,e.lat),this._ne=new Ee(r.lng,r.lat)),this},Ke.prototype.getCenter=function(){return new Ee((this._sw.lng+this._ne.lng)/2,(this._sw.lat+this._ne.lat)/2)},Ke.prototype.getSouthWest=function(){return this._sw},Ke.prototype.getNorthEast=function(){return this._ne},Ke.prototype.getNorthWest=function(){return new Ee(this.getWest(),this.getNorth())},Ke.prototype.getSouthEast=function(){return new Ee(this.getEast(),this.getSouth())},Ke.prototype.getWest=function(){return this._sw.lng},Ke.prototype.getSouth=function(){return this._sw.lat},Ke.prototype.getEast=function(){return this._ne.lng},Ke.prototype.getNorth=function(){return this._ne.lat},Ke.prototype.toArray=function(){return [this._sw.toArray(),this._ne.toArray()]},Ke.prototype.toString=function(){return "LngLatBounds("+this._sw.toString()+", "+this._ne.toString()+")"},Ke.prototype.isEmpty=function(){return !(this._sw&&this._ne)},Ke.prototype.contains=function(t){var e=Ee.convert(t),r=e.lng,a=e.lat,l=this._sw.lng<=r&&r<=this._ne.lng;return this._sw.lng>this._ne.lng&&(l=this._sw.lng>=r&&r>=this._ne.lng),this._sw.lat<=a&&a<=this._ne.lat&&l},Ke.convert=function(t){return !t||t instanceof Ke?t:new Ke(t)};var Ee=function(t,e){if(isNaN(t)||isNaN(e))throw new Error("Invalid LngLat object: ("+t+", "+e+")");if(this.lng=+t,this.lat=+e,this.lat>90||this.lat<-90)throw new Error("Invalid LngLat latitude value: must be between -90 and 90")};Ee.prototype.wrap=function(){return new Ee(Mo(this.lng,-180,180),this.lat)},Ee.prototype.toArray=function(){return [this.lng,this.lat]},Ee.prototype.toString=function(){return "LngLat("+this.lng+", "+this.lat+")"},Ee.prototype.distanceTo=function(t){var e=Math.PI/180,r=this.lat*e,a=t.lat*e,l=Math.sin(r)*Math.sin(a)+Math.cos(r)*Math.cos(a)*Math.cos((t.lng-this.lng)*e);return 63710088e-1*Math.acos(Math.min(l,1))},Ee.prototype.toBounds=function(t){t===void 0&&(t=0);var e=360*t/40075017,r=e/Math.cos(Math.PI/180*this.lat);return new Ke(new Ee(this.lng-r,this.lat-e),new Ee(this.lng+r,this.lat+e))},Ee.convert=function(t){if(t instanceof Ee)return t;if(Array.isArray(t)&&(t.length===2||t.length===3))return new Ee(Number(t[0]),Number(t[1]));if(!Array.isArray(t)&&typeof t=="object"&&t!==null)return new Ee(Number("lng"in t?t.lng:t.lon),Number(t.lat));throw new Error("`LngLatLike` argument must be specified as a LngLat instance, an object {lng: <lng>, lat: <lat>}, an object {lon: <lng>, lat: <lat>}, or an array of [<lng>, <lat>]")};var cp=2*Math.PI*63710088e-1;function pp(t){return cp*Math.cos(t*Math.PI/180)}function hp(t){return (180+t)/360}function fp(t){return (180-180/Math.PI*Math.log(Math.tan(Math.PI/4+t*Math.PI/360)))/360}function dp(t,e){return t/pp(e)}function uc(t){return 360/Math.PI*Math.atan(Math.exp((180-360*t)*Math.PI/180))-90}var ha=function(t,e,r){r===void 0&&(r=0),this.x=+t,this.y=+e,this.z=+r;};ha.fromLngLat=function(t,e){e===void 0&&(e=0);var r=Ee.convert(t);return new ha(hp(r.lng),fp(r.lat),dp(e,r.lat))},ha.prototype.toLngLat=function(){return new Ee(360*this.x-180,uc(this.y))},ha.prototype.toAltitude=function(){return this.z*pp(uc(this.y))},ha.prototype.meterInMercatorCoordinateUnits=function(){return 1/cp*(t=uc(this.y),1/Math.cos(t*Math.PI/180));var t;};var fa=function(t,e,r){this.z=t,this.x=e,this.y=r,this.key=il(0,t,t,e,r);};fa.prototype.equals=function(t){return this.z===t.z&&this.x===t.x&&this.y===t.y},fa.prototype.url=function(t,e){var r,a,l,c,h,m=(a=this.y,l=this.z,c=up(256*(r=this.x),256*(a=Math.pow(2,l)-a-1),l),h=up(256*(r+1),256*(a+1),l),c[0]+","+c[1]+","+h[0]+","+h[1]),g=function(_,x,b){for(var I,E="",L=_;L>0;L--)E+=(x&(I=1<<L-1)?1:0)+(b&I?2:0);return E}(this.z,this.x,this.y);return t[(this.x+this.y)%t.length].replace("{prefix}",(this.x%16).toString(16)+(this.y%16).toString(16)).replace("{z}",String(this.z)).replace("{x}",String(this.x)).replace("{y}",String(e==="tms"?Math.pow(2,this.z)-this.y-1:this.y)).replace("{quadkey}",g).replace("{bbox-epsg-3857}",m)},fa.prototype.getTilePoint=function(t){var e=Math.pow(2,this.z);return new jt(8192*(t.x*e-this.x),8192*(t.y*e-this.y))},fa.prototype.toString=function(){return this.z+"/"+this.x+"/"+this.y};var mp=function(t,e){this.wrap=t,this.canonical=e,this.key=il(t,e.z,e.z,e.x,e.y);},He=function(t,e,r,a,l){this.overscaledZ=t,this.wrap=e,this.canonical=new fa(r,+a,+l),this.key=il(e,t,r,a,l);};function il(t,e,r,a,l){(t*=2)<0&&(t=-1*t-1);var c=1<<r;return (c*c*t+c*l+a).toString(36)+r.toString(36)+e.toString(36)}He.prototype.equals=function(t){return this.overscaledZ===t.overscaledZ&&this.wrap===t.wrap&&this.canonical.equals(t.canonical)},He.prototype.scaledTo=function(t){var e=this.canonical.z-t;return t>this.canonical.z?new He(t,this.wrap,this.canonical.z,this.canonical.x,this.canonical.y):new He(t,this.wrap,t,this.canonical.x>>e,this.canonical.y>>e)},He.prototype.calculateScaledKey=function(t,e){var r=this.canonical.z-t;return t>this.canonical.z?il(this.wrap*+e,t,this.canonical.z,this.canonical.x,this.canonical.y):il(this.wrap*+e,t,t,this.canonical.x>>r,this.canonical.y>>r)},He.prototype.isChildOf=function(t){if(t.wrap!==this.wrap)return !1;var e=this.canonical.z-t.canonical.z;return t.overscaledZ===0||t.overscaledZ<this.overscaledZ&&t.canonical.x===this.canonical.x>>e&&t.canonical.y===this.canonical.y>>e},He.prototype.children=function(t){if(this.overscaledZ>=t)return [new He(this.overscaledZ+1,this.wrap,this.canonical.z,this.canonical.x,this.canonical.y)];var e=this.canonical.z+1,r=2*this.canonical.x,a=2*this.canonical.y;return [new He(e,this.wrap,e,r,a),new He(e,this.wrap,e,r+1,a),new He(e,this.wrap,e,r,a+1),new He(e,this.wrap,e,r+1,a+1)]},He.prototype.isLessThan=function(t){return this.wrap<t.wrap||!(this.wrap>t.wrap)&&(this.overscaledZ<t.overscaledZ||!(this.overscaledZ>t.overscaledZ)&&(this.canonical.x<t.canonical.x||!(this.canonical.x>t.canonical.x)&&this.canonical.y<t.canonical.y))},He.prototype.wrapped=function(){return new He(this.overscaledZ,0,this.canonical.z,this.canonical.x,this.canonical.y)},He.prototype.unwrapTo=function(t){return new He(this.overscaledZ,t,this.canonical.z,this.canonical.x,this.canonical.y)},He.prototype.overscaleFactor=function(){return Math.pow(2,this.overscaledZ-this.canonical.z)},He.prototype.toUnwrapped=function(){return new mp(this.wrap,this.canonical)},He.prototype.toString=function(){return this.overscaledZ+"/"+this.canonical.x+"/"+this.canonical.y},He.prototype.getTilePoint=function(t){return this.canonical.getTilePoint(new ha(t.x-this.wrap,t.y))},Tt("CanonicalTileID",fa),Tt("OverscaledTileID",He,{omit:["posMatrix"]});var Hn=function(t,e,r){if(this.uid=t,e.height!==e.width)throw new RangeError("DEM tiles must be square");if(r&&r!=="mapbox"&&r!=="terrarium")return Me('"'+r+'" is not a valid encoding type. Valid types include "mapbox" and "terrarium".');this.stride=e.height;var a=this.dim=e.height-2;this.data=new Uint32Array(e.data.buffer),this.encoding=r||"mapbox";for(var l=0;l<a;l++)this.data[this._idx(-1,l)]=this.data[this._idx(0,l)],this.data[this._idx(a,l)]=this.data[this._idx(a-1,l)],this.data[this._idx(l,-1)]=this.data[this._idx(l,0)],this.data[this._idx(l,a)]=this.data[this._idx(l,a-1)];this.data[this._idx(-1,-1)]=this.data[this._idx(0,0)],this.data[this._idx(a,-1)]=this.data[this._idx(a-1,0)],this.data[this._idx(-1,a)]=this.data[this._idx(0,a-1)],this.data[this._idx(a,a)]=this.data[this._idx(a-1,a-1)];};Hn.prototype.get=function(t,e){var r=new Uint8Array(this.data.buffer),a=4*this._idx(t,e);return (this.encoding==="terrarium"?this._unpackTerrarium:this._unpackMapbox)(r[a],r[a+1],r[a+2])},Hn.prototype.getUnpackVector=function(){return this.encoding==="terrarium"?[256,1,1/256,32768]:[6553.6,25.6,.1,1e4]},Hn.prototype._idx=function(t,e){if(t<-1||t>=this.dim+1||e<-1||e>=this.dim+1)throw new RangeError("out of range source coordinates for DEM data");return (e+1)*this.stride+(t+1)},Hn.prototype._unpackMapbox=function(t,e,r){return (256*t*256+256*e+r)/10-1e4},Hn.prototype._unpackTerrarium=function(t,e,r){return 256*t+e+r/256-32768},Hn.prototype.getPixels=function(){return new qr({width:this.stride,height:this.stride},new Uint8Array(this.data.buffer))},Hn.prototype.backfillBorder=function(t,e,r){if(this.dim!==t.dim)throw new Error("dem dimension mismatch");var a=e*this.dim,l=e*this.dim+this.dim,c=r*this.dim,h=r*this.dim+this.dim;switch(e){case-1:a=l-1;break;case 1:l=a+1;}switch(r){case-1:c=h-1;break;case 1:h=c+1;}for(var m=-e*this.dim,g=-r*this.dim,_=c;_<h;_++)for(var x=a;x<l;x++)this.data[this._idx(x,_)]=t.data[this._idx(x+m,_+g)];},Tt("DEMData",Hn);var pu=function(t){this._stringToNumber={},this._numberToString=[];for(var e=0;e<t.length;e++){var r=t[e];this._stringToNumber[r]=e,this._numberToString[e]=r;}};pu.prototype.encode=function(t){return this._stringToNumber[t]},pu.prototype.decode=function(t){return this._numberToString[t]};var hu=function(t,e,r,a,l){this.type="Feature",this._vectorTileFeature=t,t._z=e,t._x=r,t._y=a,this.properties=t.properties,this.id=l;},cc={geometry:{configurable:!0}};cc.geometry.get=function(){return this._geometry===void 0&&(this._geometry=this._vectorTileFeature.toGeoJSON(this._vectorTileFeature._x,this._vectorTileFeature._y,this._vectorTileFeature._z).geometry),this._geometry},cc.geometry.set=function(t){this._geometry=t;},hu.prototype.toJSON=function(){var t={geometry:this.geometry};for(var e in this)e!=="_geometry"&&e!=="_vectorTileFeature"&&(t[e]=this[e]);return t},Object.defineProperties(hu.prototype,cc);var os=function(){this.state={},this.stateChanges={},this.deletedStates={};};os.prototype.updateState=function(t,e,r){var a=String(e);if(this.stateChanges[t]=this.stateChanges[t]||{},this.stateChanges[t][a]=this.stateChanges[t][a]||{},lr(this.stateChanges[t][a],r),this.deletedStates[t]===null)for(var l in this.deletedStates[t]={},this.state[t])l!==a&&(this.deletedStates[t][l]=null);else if(this.deletedStates[t]&&this.deletedStates[t][a]===null)for(var c in this.deletedStates[t][a]={},this.state[t][a])r[c]||(this.deletedStates[t][a][c]=null);else for(var h in r)this.deletedStates[t]&&this.deletedStates[t][a]&&this.deletedStates[t][a][h]===null&&delete this.deletedStates[t][a][h];},os.prototype.removeFeatureState=function(t,e,r){if(this.deletedStates[t]!==null){var a=String(e);if(this.deletedStates[t]=this.deletedStates[t]||{},r&&e!==void 0)this.deletedStates[t][a]!==null&&(this.deletedStates[t][a]=this.deletedStates[t][a]||{},this.deletedStates[t][a][r]=null);else if(e!==void 0)if(this.stateChanges[t]&&this.stateChanges[t][a])for(r in this.deletedStates[t][a]={},this.stateChanges[t][a])this.deletedStates[t][a][r]=null;else this.deletedStates[t][a]=null;else this.deletedStates[t]=null;}},os.prototype.getState=function(t,e){var r=String(e),a=lr({},(this.state[t]||{})[r],(this.stateChanges[t]||{})[r]);if(this.deletedStates[t]===null)return {};if(this.deletedStates[t]){var l=this.deletedStates[t][e];if(l===null)return {};for(var c in l)delete a[c];}return a},os.prototype.initializeTileState=function(t,e){t.setFeatureState(this.state,e);},os.prototype.coalesceChanges=function(t,e){var r={};for(var a in this.stateChanges){this.state[a]=this.state[a]||{};var l={};for(var c in this.stateChanges[a])this.state[a][c]||(this.state[a][c]={}),lr(this.state[a][c],this.stateChanges[a][c]),l[c]=this.state[a][c];r[a]=l;}for(var h in this.deletedStates){this.state[h]=this.state[h]||{};var m={};if(this.deletedStates[h]===null)for(var g in this.state[h])m[g]={},this.state[h][g]={};else for(var _ in this.deletedStates[h]){if(this.deletedStates[h][_]===null)this.state[h][_]={};else for(var x=0,b=Object.keys(this.deletedStates[h][_]);x<b.length;x+=1)delete this.state[h][_][b[x]];m[_]=this.state[h][_];}r[h]=r[h]||{},lr(r[h],m);}if(this.stateChanges={},this.deletedStates={},Object.keys(r).length!==0)for(var I in t)t[I].setFeatureState(r,e);};var Jn=function(t,e){this.tileID=t,this.x=t.canonical.x,this.y=t.canonical.y,this.z=t.canonical.z,this.grid=new Ni(8192,16,0),this.grid3D=new Ni(8192,16,0),this.featureIndexArray=new S,this.promoteId=e;};function yp(t,e,r,a,l){return yr(t,function(c,h){var m=e instanceof ia?e.get(h):null;return m&&m.evaluate?m.evaluate(r,a,l):m})}function gp(t){for(var e=1/0,r=1/0,a=-1/0,l=-1/0,c=0,h=t;c<h.length;c+=1){var m=h[c];e=Math.min(e,m.x),r=Math.min(r,m.y),a=Math.max(a,m.x),l=Math.max(l,m.y);}return {minX:e,minY:r,maxX:a,maxY:l}}function uf(t,e){return e-t}Jn.prototype.insert=function(t,e,r,a,l,c){var h=this.featureIndexArray.length;this.featureIndexArray.emplaceBack(r,a,l);for(var m=c?this.grid3D:this.grid,g=0;g<e.length;g++){for(var _=e[g],x=[1/0,1/0,-1/0,-1/0],b=0;b<_.length;b++){var I=_[b];x[0]=Math.min(x[0],I.x),x[1]=Math.min(x[1],I.y),x[2]=Math.max(x[2],I.x),x[3]=Math.max(x[3],I.y);}x[0]<8192&&x[1]<8192&&x[2]>=0&&x[3]>=0&&m.insert(h,x[0],x[1],x[2],x[3]);}},Jn.prototype.loadVTLayers=function(){return this.vtLayers||(this.vtLayers=new Ha.VectorTile(new tu(this.rawTileData)).layers,this.sourceLayerCoder=new pu(this.vtLayers?Object.keys(this.vtLayers).sort():["_geojsonTileLayer"])),this.vtLayers},Jn.prototype.query=function(t,e,r,a){var l=this;this.loadVTLayers();for(var c=t.params||{},h=8192/t.tileSize/t.scale,m=Ma(c.filter),g=t.queryGeometry,_=t.queryPadding*h,x=gp(g),b=this.grid.query(x.minX-_,x.minY-_,x.maxX+_,x.maxY+_),I=gp(t.cameraQueryGeometry),E=this.grid3D.query(I.minX-_,I.minY-_,I.maxX+_,I.maxY+_,function(Y,$,nt,ut){return function(ft,zt,gt,Mt,vt){for(var Xt=0,Ft=ft;Xt<Ft.length;Xt+=1){var At=Ft[Xt];if(zt<=At.x&&gt<=At.y&&Mt>=At.x&&vt>=At.y)return !0}var Kt=[new jt(zt,gt),new jt(zt,vt),new jt(Mt,vt),new jt(Mt,gt)];if(ft.length>2){for(var qt=0,ie=Kt;qt<ie.length;qt+=1)if(ki(ft,ie[qt]))return !0}for(var Dt=0;Dt<ft.length-1;Dt++)if(la(ft[Dt],ft[Dt+1],Kt))return !0;return !1}(t.cameraQueryGeometry,Y-_,$-_,nt+_,ut+_)}),L=0,B=E;L<B.length;L+=1)b.push(B[L]);b.sort(uf);for(var q,V={},W=function(Y){var $=b[Y];if($!==q){q=$;var nt=l.featureIndexArray.get($),ut=null;l.loadMatchingFeature(V,nt.bucketIndex,nt.sourceLayerIndex,nt.featureIndex,m,c.layers,c.availableImages,e,r,a,function(ft,zt,gt){return ut||(ut=Ce(ft)),zt.queryIntersectsFeature(g,ft,gt,ut,l.z,t.transform,h,t.pixelPosMatrix)});}},J=0;J<b.length;J++)W(J);return V},Jn.prototype.loadMatchingFeature=function(t,e,r,a,l,c,h,m,g,_,x){var b=this.bucketLayerIDs[e];if(!c||function(ft,zt){for(var gt=0;gt<ft.length;gt++)if(zt.indexOf(ft[gt])>=0)return !0;return !1}(c,b)){var I=this.sourceLayerCoder.decode(r),E=this.vtLayers[I].feature(a);if(l.needGeometry){var L=Ue(E,!0);if(!l.filter(new Jt(this.tileID.overscaledZ),L,this.tileID.canonical))return}else if(!l.filter(new Jt(this.tileID.overscaledZ),E))return;for(var B=this.getId(E,I),q=0;q<b.length;q++){var V=b[q];if(!(c&&c.indexOf(V)<0)){var W=m[V];if(W){var J={};B!==void 0&&_&&(J=_.getState(W.sourceLayer||"_geojsonTileLayer",B));var Y=lr({},g[V]);Y.paint=yp(Y.paint,W.paint,E,J,h),Y.layout=yp(Y.layout,W.layout,E,J,h);var $=!x||x(E,W,J);if($){var nt=new hu(E,this.z,this.x,this.y,B);nt.layer=Y;var ut=t[V];ut===void 0&&(ut=t[V]=[]),ut.push({featureIndex:a,feature:nt,intersectionZ:$});}}}}}},Jn.prototype.lookupSymbolFeatures=function(t,e,r,a,l,c,h,m){var g={};this.loadVTLayers();for(var _=Ma(l),x=0,b=t;x<b.length;x+=1)this.loadMatchingFeature(g,r,a,b[x],_,c,h,m,e);return g},Jn.prototype.hasLayer=function(t){for(var e=0,r=this.bucketLayerIDs;e<r.length;e+=1)for(var a=0,l=r[e];a<l.length;a+=1)if(t===l[a])return !0;return !1},Jn.prototype.getId=function(t,e){var r=t.id;return this.promoteId&&typeof(r=t.properties[typeof this.promoteId=="string"?this.promoteId:this.promoteId[e]])=="boolean"&&(r=Number(r)),r},Tt("FeatureIndex",Jn,{omit:["rawTileData","sourceLayerCoder"]});var or=function(t,e){this.tileID=t,this.uid=to(),this.uses=0,this.tileSize=e,this.buckets={},this.expirationTime=null,this.queryPadding=0,this.hasSymbolBuckets=!1,this.hasRTLText=!1,this.dependencies={},this.expiredRequestCount=0,this.state="loading";};or.prototype.registerFadeDuration=function(t){var e=t+this.timeAdded;e<Fi.now()||this.fadeEndTime&&e<this.fadeEndTime||(this.fadeEndTime=e);},or.prototype.wasRequested=function(){return this.state==="errored"||this.state==="loaded"||this.state==="reloading"},or.prototype.loadVectorData=function(t,e,r){if(this.hasData()&&this.unloadVectorData(),this.state="loaded",t){for(var a in t.featureIndex&&(this.latestFeatureIndex=t.featureIndex,t.rawTileData?(this.latestRawTileData=t.rawTileData,this.latestFeatureIndex.rawTileData=t.rawTileData):this.latestRawTileData&&(this.latestFeatureIndex.rawTileData=this.latestRawTileData)),this.collisionBoxArray=t.collisionBoxArray,this.buckets=function(_,x){var b={};if(!x)return b;for(var I=function(){var B=L[E],q=B.layerIds.map(function(J){return x.getLayer(J)}).filter(Boolean);if(q.length!==0){B.layers=q,B.stateDependentLayerIds&&(B.stateDependentLayers=B.stateDependentLayerIds.map(function(J){return q.filter(function(Y){return Y.id===J})[0]}));for(var V=0,W=q;V<W.length;V+=1)b[W[V].id]=B;}},E=0,L=_;E<L.length;E+=1)I();return b}(t.buckets,e.style),this.hasSymbolBuckets=!1,this.buckets){var l=this.buckets[a];if(l instanceof me){if(this.hasSymbolBuckets=!0,!r)break;l.justReloaded=!0;}}if(this.hasRTLText=!1,this.hasSymbolBuckets)for(var c in this.buckets){var h=this.buckets[c];if(h instanceof me&&h.hasRTLText){this.hasRTLText=!0,Wr.isLoading()||Wr.isLoaded()||Vs()!=="deferred"||xi();break}}for(var m in this.queryPadding=0,this.buckets){var g=this.buckets[m];this.queryPadding=Math.max(this.queryPadding,e.style.getLayer(m).queryRadius(g));}t.imageAtlas&&(this.imageAtlas=t.imageAtlas),t.glyphAtlasImage&&(this.glyphAtlasImage=t.glyphAtlasImage);}else this.collisionBoxArray=new o;},or.prototype.unloadVectorData=function(){for(var t in this.buckets)this.buckets[t].destroy();this.buckets={},this.imageAtlasTexture&&this.imageAtlasTexture.destroy(),this.imageAtlas&&(this.imageAtlas=null),this.glyphAtlasTexture&&this.glyphAtlasTexture.destroy(),this.latestFeatureIndex=null,this.state="unloaded";},or.prototype.getBucket=function(t){return this.buckets[t.id]},or.prototype.upload=function(t){for(var e in this.buckets){var r=this.buckets[e];r.uploadPending()&&r.upload(t);}var a=t.gl;this.imageAtlas&&!this.imageAtlas.uploaded&&(this.imageAtlasTexture=new pa(t,this.imageAtlas.image,a.RGBA),this.imageAtlas.uploaded=!0),this.glyphAtlasImage&&(this.glyphAtlasTexture=new pa(t,this.glyphAtlasImage,a.ALPHA),this.glyphAtlasImage=null);},or.prototype.prepare=function(t){this.imageAtlas&&this.imageAtlas.patchUpdatedImages(t,this.imageAtlasTexture);},or.prototype.queryRenderedFeatures=function(t,e,r,a,l,c,h,m,g,_){return this.latestFeatureIndex&&this.latestFeatureIndex.rawTileData?this.latestFeatureIndex.query({queryGeometry:a,cameraQueryGeometry:l,scale:c,tileSize:this.tileSize,pixelPosMatrix:_,transform:m,params:h,queryPadding:this.queryPadding*g},t,e,r):{}},or.prototype.querySourceFeatures=function(t,e){var r=this.latestFeatureIndex;if(r&&r.rawTileData){var a=r.loadVTLayers(),l=e?e.sourceLayer:"",c=a._geojsonTileLayer||a[l];if(c)for(var h=Ma(e&&e.filter),m=this.tileID.canonical,g=m.z,_=m.x,x=m.y,b={z:g,x:_,y:x},I=0;I<c.length;I++){var E=c.feature(I);if(h.needGeometry){var L=Ue(E,!0);if(!h.filter(new Jt(this.tileID.overscaledZ),L,this.tileID.canonical))continue}else if(!h.filter(new Jt(this.tileID.overscaledZ),E))continue;var B=r.getId(E,l),q=new hu(E,g,_,x,B);q.tile=b,t.push(q);}}},or.prototype.hasData=function(){return this.state==="loaded"||this.state==="reloading"||this.state==="expired"},or.prototype.patternsLoaded=function(){return this.imageAtlas&&!!Object.keys(this.imageAtlas.patternPositions).length},or.prototype.setExpiryData=function(t){var e=this.expirationTime;if(t.cacheControl){var r=no(t.cacheControl);r["max-age"]&&(this.expirationTime=Date.now()+1e3*r["max-age"]);}else t.expires&&(this.expirationTime=new Date(t.expires).getTime());if(this.expirationTime){var a=Date.now(),l=!1;if(this.expirationTime>a)l=!1;else if(e)if(this.expirationTime<e)l=!0;else {var c=this.expirationTime-e;c?this.expirationTime=a+Math.max(c,3e4):l=!0;}else l=!0;l?(this.expiredRequestCount++,this.state="expired"):this.expiredRequestCount=0;}},or.prototype.getExpiryTimeout=function(){if(this.expirationTime)return this.expiredRequestCount?1e3*(1<<Math.min(this.expiredRequestCount-1,31)):Math.min(this.expirationTime-new Date().getTime(),Math.pow(2,31)-1)},or.prototype.setFeatureState=function(t,e){if(this.latestFeatureIndex&&this.latestFeatureIndex.rawTileData&&Object.keys(t).length!==0){var r=this.latestFeatureIndex.loadVTLayers();for(var a in this.buckets)if(e.style.hasLayer(a)){var l=this.buckets[a],c=l.layers[0].sourceLayer||"_geojsonTileLayer",h=r[c],m=t[c];if(h&&m&&Object.keys(m).length!==0){l.update(m,h,this.imageAtlas&&this.imageAtlas.patternPositions||{});var g=e&&e.style&&e.style.getLayer(a);g&&(this.queryPadding=Math.max(this.queryPadding,g.queryRadius(l)));}}}},or.prototype.holdingForFade=function(){return this.symbolFadeHoldUntil!==void 0},or.prototype.symbolFadeFinished=function(){return !this.symbolFadeHoldUntil||this.symbolFadeHoldUntil<Fi.now()},or.prototype.clearFadeHold=function(){this.symbolFadeHoldUntil=void 0;},or.prototype.setHoldDuration=function(t){this.symbolFadeHoldUntil=Fi.now()+t;},or.prototype.setDependencies=function(t,e){for(var r={},a=0,l=e;a<l.length;a+=1)r[l[a]]=!0;this.dependencies[t]=r;},or.prototype.hasDependency=function(t,e){for(var r=0,a=t;r<a.length;r+=1){var l=this.dependencies[a[r]];if(l){for(var c=0,h=e;c<h.length;c+=1)if(l[h[c]])return !0}}return !1};var Ao=Pt.performance,_p=function(t){this._marks={start:[t.url,"start"].join("#"),end:[t.url,"end"].join("#"),measure:t.url.toString()},Ao.mark(this._marks.start);};_p.prototype.finish=function(){Ao.mark(this._marks.end);var t=Ao.getEntriesByName(this._marks.measure);return t.length===0&&(Ao.measure(this._marks.measure,this._marks.start,this._marks.end),t=Ao.getEntriesByName(this._marks.measure),Ao.clearMarks(this._marks.start),Ao.clearMarks(this._marks.end),Ao.clearMeasures(this._marks.measure)),t},u.Actor=ns,u.AlphaImage=ca,u.CanonicalTileID=fa,u.CollisionBoxArray=o,u.Color=ue,u.DEMData=Hn,u.DataConstantProperty=Ct,u.DictionaryCoder=pu,u.EXTENT=8192,u.ErrorEvent=Z,u.EvaluationParameters=Jt,u.Event=O,u.Evented=X,u.FeatureIndex=Jn,u.FillBucket=Gi,u.FillExtrusionBucket=Xi,u.ImageAtlas=el,u.ImagePosition=ru,u.LineBucket=Mr,u.LngLat=Ee,u.LngLatBounds=Ke,u.MercatorCoordinate=ha,u.ONE_EM=24,u.OverscaledTileID=He,u.Point=jt,u.Point$1=jt,u.Properties=hr,u.Protobuf=tu,u.RGBAImage=qr,u.RequestManager=Ar,u.RequestPerformance=_p,u.ResourceType=Sa,u.SegmentVector=z,u.SourceFeatureState=os,u.StructArrayLayout1ui2=Xs,u.StructArrayLayout2f1f2i16=Gn,u.StructArrayLayout2i4=Zn,u.StructArrayLayout3ui6=un,u.StructArrayLayout4i8=js,u.SymbolBucket=me,u.Texture=pa,u.Tile=or,u.Transitionable=pr,u.Uniform1f=ht,u.Uniform1i=ot,u.Uniform2f=pt,u.Uniform3f=bt,u.Uniform4f=kt,u.UniformColor=Bt,u.UniformMatrix4f=ne,u.UnwrappedTileID=mp,u.ValidationError=U,u.WritingMode=li,u.ZoomHistory=Rs,u.add=function(t,e,r){return t[0]=e[0]+r[0],t[1]=e[1]+r[1],t[2]=e[2]+r[2],t},u.addDynamicAttributes=ac,u.asyncAll=function(t,e,r){if(!t.length)return r(null,[]);var a=t.length,l=new Array(t.length),c=null;t.forEach(function(h,m){e(h,function(g,_){g&&(c=g),l[m]=_,--a==0&&r(c,l);});});},u.bezier=Jr,u.bindAll=ro,u.browser=Fi,u.cacheEntryPossiblyAdded=function(t){++Fo>wa&&(t.getActor().send("enforceCacheSizeLimit",lo),Fo=0);},u.clamp=Lr,u.clearTileCache=function(t){var e=Pt.caches.delete("mapbox-tiles");t&&e.catch(t).then(function(){return t()});},u.clipLine=$c,u.clone=function(t){var e=new ce(16);return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e},u.clone$1=pi,u.clone$2=function(t){var e=new ce(3);return e[0]=t[0],e[1]=t[1],e[2]=t[2],e},u.collisionCircleLayout=Ph,u.config=ye,u.create=function(){var t=new ce(16);return ce!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t},u.create$1=function(){var t=new ce(9);return ce!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[5]=0,t[6]=0,t[7]=0),t[0]=1,t[4]=1,t[8]=1,t},u.create$2=function(){var t=new ce(4);return ce!=Float32Array&&(t[1]=0,t[2]=0),t[0]=1,t[3]=1,t},u.createCommonjsModule=Zr,u.createExpression=Ca,u.createLayout=ir,u.createStyleLayer=function(t){return t.type==="custom"?new sf(t):new lf[t.type](t)},u.cross=function(t,e,r){var a=e[0],l=e[1],c=e[2],h=r[0],m=r[1],g=r[2];return t[0]=l*g-c*m,t[1]=c*h-a*g,t[2]=a*m-l*h,t},u.deepEqual=function t(e,r){if(Array.isArray(e)){if(!Array.isArray(r)||e.length!==r.length)return !1;for(var a=0;a<e.length;a++)if(!t(e[a],r[a]))return !1;return !0}if(typeof e=="object"&&e!==null&&r!==null){if(typeof r!="object")return !1;if(Object.keys(e).length!==Object.keys(r).length)return !1;for(var l in e)if(!t(e[l],r[l]))return !1;return !0}return e===r},u.dot=function(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]},u.dot$1=function(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]+t[3]*e[3]},u.ease=bn,u.emitValidationErrors=ta,u.endsWith=wn,u.enforceCacheSizeLimit=function(t){uo(),ti&&ti.then(function(e){e.keys().then(function(r){for(var a=0;a<r.length-t;a++)e.delete(r[a]);});});},u.evaluateSizeForFeature=Wc,u.evaluateSizeForZoom=Kc,u.evaluateVariableOffset=rp,u.evented=Us,u.extend=lr,u.featureFilter=Ma,u.filterObject=Ri,u.fromRotation=function(t,e){var r=Math.sin(e),a=Math.cos(e);return t[0]=a,t[1]=r,t[2]=0,t[3]=-r,t[4]=a,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},u.getAnchorAlignment=rc,u.getAnchorJustification=oc,u.getArrayBuffer=Uo,u.getImage=T,u.getJSON=function(t,e){return co(lr(t,{type:"json"}),e)},u.getRTLTextPluginStatus=Vs,u.getReferrer=Pn,u.getVideo=function(t,e){var r,a,l=Pt.document.createElement("video");l.muted=!0,l.onloadstart=function(){e(null,l);};for(var c=0;c<t.length;c++){var h=Pt.document.createElement("source");r=t[c],a=void 0,(a=Pt.document.createElement("a")).href=r,(a.protocol!==Pt.document.location.protocol||a.host!==Pt.document.location.host)&&(l.crossOrigin="Anonymous"),h.src=t[c],l.appendChild(h);}return {cancel:function(){}}},u.identity=Kr,u.invert=function(t,e){var r=e[0],a=e[1],l=e[2],c=e[3],h=e[4],m=e[5],g=e[6],_=e[7],x=e[8],b=e[9],I=e[10],E=e[11],L=e[12],B=e[13],q=e[14],V=e[15],W=r*m-a*h,J=r*g-l*h,Y=r*_-c*h,$=a*g-l*m,nt=a*_-c*m,ut=l*_-c*g,ft=x*B-b*L,zt=x*q-I*L,gt=x*V-E*L,Mt=b*q-I*B,vt=b*V-E*B,Xt=I*V-E*q,Ft=W*Xt-J*vt+Y*Mt+$*gt-nt*zt+ut*ft;return Ft?(t[0]=(m*Xt-g*vt+_*Mt)*(Ft=1/Ft),t[1]=(l*vt-a*Xt-c*Mt)*Ft,t[2]=(B*ut-q*nt+V*$)*Ft,t[3]=(I*nt-b*ut-E*$)*Ft,t[4]=(g*gt-h*Xt-_*zt)*Ft,t[5]=(r*Xt-l*gt+c*zt)*Ft,t[6]=(q*Y-L*ut-V*J)*Ft,t[7]=(x*ut-I*Y+E*J)*Ft,t[8]=(h*vt-m*gt+_*ft)*Ft,t[9]=(a*gt-r*vt-c*ft)*Ft,t[10]=(L*nt-B*Y+V*W)*Ft,t[11]=(b*Y-x*nt-E*W)*Ft,t[12]=(m*zt-h*Mt-g*ft)*Ft,t[13]=(r*Mt-a*zt+l*ft)*Ft,t[14]=(B*J-L*$-q*W)*Ft,t[15]=(x*$-b*J+I*W)*Ft,t):null},u.isChar=mt,u.isMapboxURL=Yr,u.keysDifference=function(t,e){var r=[];for(var a in t)a in e||r.push(a);return r},u.makeRequest=co,u.mapObject=yr,u.mercatorXfromLng=hp,u.mercatorYfromLat=fp,u.mercatorZfromAltitude=dp,u.mul=Zu,u.multiply=kr,u.mvt=Ha,u.nextPowerOfTwo=function(t){return t<=1?1:Math.pow(2,Math.ceil(Math.log(t)/Math.LN2))},u.normalize=function(t,e){var r=e[0],a=e[1],l=e[2],c=r*r+a*a+l*l;return c>0&&(c=1/Math.sqrt(c)),t[0]=e[0]*c,t[1]=e[1]*c,t[2]=e[2]*c,t},u.number=qe,u.offscreenCanvasSupported=Oo,u.ortho=function(t,e,r,a,l,c,h){var m=1/(e-r),g=1/(a-l),_=1/(c-h);return t[0]=-2*m,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=-2*g,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=2*_,t[11]=0,t[12]=(e+r)*m,t[13]=(l+a)*g,t[14]=(h+c)*_,t[15]=1,t},u.parseGlyphPBF=function(t){return new tu(t).readFields(Uh,[])},u.pbf=tu,u.performSymbolLayout=function(t,e,r,a,l,c,h){t.createArrays(),t.tilePixelRatio=8192/(512*t.overscaling),t.compareText={},t.iconsNeedLinear=!1;var m=t.layers[0].layout,g=t.layers[0]._unevaluatedLayout._values,_={};if(t.textSizeData.kind==="composite"){var x=t.textSizeData,b=x.maxZoom;_.compositeTextSizes=[g["text-size"].possiblyEvaluate(new Jt(x.minZoom),h),g["text-size"].possiblyEvaluate(new Jt(b),h)];}if(t.iconSizeData.kind==="composite"){var I=t.iconSizeData,E=I.maxZoom;_.compositeIconSizes=[g["icon-size"].possiblyEvaluate(new Jt(I.minZoom),h),g["icon-size"].possiblyEvaluate(new Jt(E),h)];}_.layoutTextSize=g["text-size"].possiblyEvaluate(new Jt(t.zoom+1),h),_.layoutIconSize=g["icon-size"].possiblyEvaluate(new Jt(t.zoom+1),h),_.textMaxSize=g["text-size"].possiblyEvaluate(new Jt(18));for(var L=24*m.get("text-line-height"),B=m.get("text-rotation-alignment")==="map"&&m.get("symbol-placement")!=="point",q=m.get("text-keep-upright"),V=m.get("text-size"),W=function(){var $=Y[J],nt=m.get("text-font").evaluate($,{},h).join(","),ut=V.evaluate($,{},h),ft=_.layoutTextSize.evaluate($,{},h),zt=_.layoutIconSize.evaluate($,{},h),gt={horizontal:{},vertical:void 0},Mt=$.text,vt=[0,0];if(Mt){var Xt=Mt.toString(),Ft=24*m.get("text-letter-spacing").evaluate($,{},h),At=function(Yt){for(var ve=0,fe=Yt;ve<fe.length;ve+=1)if(oe=fe[ve].charCodeAt(0),mt.Arabic(oe)||mt["Arabic Supplement"](oe)||mt["Arabic Extended-A"](oe)||mt["Arabic Presentation Forms-A"](oe)||mt["Arabic Presentation Forms-B"](oe))return !1;var oe;return !0}(Xt)?Ft:0,Kt=m.get("text-anchor").evaluate($,{},h),qt=m.get("text-variable-anchor");if(!qt){var ie=m.get("text-radial-offset").evaluate($,{},h);vt=ie?rp(Kt,[24*ie,nc]):m.get("text-offset").evaluate($,{},h).map(function(Yt){return 24*Yt});}var Dt=B?"center":m.get("text-justify").evaluate($,{},h),ae=m.get("symbol-placement"),Ae=ae==="point"?24*m.get("text-max-width").evaluate($,{},h):0,Le=function(){t.allowVerticalPlacement&&Fs(Xt)&&(gt.vertical=iu(Mt,e,r,l,nt,Ae,L,Kt,"left",At,vt,li.vertical,!0,ae,ft,ut));};if(!B&&qt){for(var ke=Dt==="auto"?qt.map(function(Yt){return oc(Yt)}):[Dt],Pe=!1,Be=0;Be<ke.length;Be++){var Qe=ke[Be];if(!gt.horizontal[Qe])if(Pe)gt.horizontal[Qe]=gt.horizontal[0];else {var $e=iu(Mt,e,r,l,nt,Ae,L,"center",Qe,At,vt,li.horizontal,!1,ae,ft,ut);$e&&(gt.horizontal[Qe]=$e,Pe=$e.positionedLines.length===1);}}Le();}else {Dt==="auto"&&(Dt=oc(Kt));var Ir=iu(Mt,e,r,l,nt,Ae,L,Kt,Dt,At,vt,li.horizontal,!1,ae,ft,ut);Ir&&(gt.horizontal[Dt]=Ir),Le(),Fs(Xt)&&B&&q&&(gt.vertical=iu(Mt,e,r,l,nt,Ae,L,Kt,Dt,At,vt,li.vertical,!1,ae,ft,ut));}}var ar=void 0,Er=!1;if($.icon&&$.icon.name){var Ve=a[$.icon.name];Ve&&(ar=function(Yt,ve,fe){var oe=rc(fe),Dr=ve[0]-Yt.displaySize[0]*oe.horizontalAlign,dr=ve[1]-Yt.displaySize[1]*oe.verticalAlign;return {image:Yt,top:dr,bottom:dr+Yt.displaySize[1],left:Dr,right:Dr+Yt.displaySize[0]}}(l[$.icon.name],m.get("icon-offset").evaluate($,{},h),m.get("icon-anchor").evaluate($,{},h)),Er=Ve.sdf,t.sdfIcons===void 0?t.sdfIcons=Ve.sdf:t.sdfIcons!==Ve.sdf&&Me("Style sheet warning: Cannot mix SDF and non-SDF icons in one buffer"),(Ve.pixelRatio!==t.pixelRatio||m.get("icon-rotate").constantOr(1)!==0)&&(t.iconsNeedLinear=!0));}var sr=np(gt.horizontal)||gt.vertical;t.iconsInText=!!sr&&sr.iconsInText,(sr||ar)&&function(Yt,ve,fe,oe,Dr,dr,Se,Ge,mr,se,mn){var ui=dr.textMaxSize.evaluate(ve,{});ui===void 0&&(ui=Se);var yn,Ne=Yt.layers[0].layout,gn=Ne.get("icon-offset").evaluate(ve,{},mn),Di=np(fe.horizontal),as=Se/24,da=Yt.tilePixelRatio*as,ss=Yt.tilePixelRatio*ui/24,Yn=Yt.tilePixelRatio*Ge,ls=Yt.tilePixelRatio*Ne.get("symbol-spacing"),fu=Ne.get("text-padding")*Yt.tilePixelRatio,us=Ne.get("icon-padding")*Yt.tilePixelRatio,nl=Ne.get("text-max-angle")/180*Math.PI,du=Ne.get("text-rotation-alignment")==="map"&&Ne.get("symbol-placement")!=="point",mu=Ne.get("icon-rotation-alignment")==="map"&&Ne.get("symbol-placement")!=="point",Qn=Ne.get("symbol-placement"),ol=ls/2,cs=Ne.get("icon-text-fit");oe&&cs!=="none"&&(Yt.allowVerticalPlacement&&fe.vertical&&(yn=Xc(oe,fe.vertical,cs,Ne.get("icon-text-fit-padding"),gn,as)),Di&&(oe=Xc(oe,Di,cs,Ne.get("icon-text-fit-padding"),gn,as)));var Po=function(cf,fl){fl.x<0||fl.x>=8192||fl.y<0||fl.y>=8192||function(je,Wi,pf,zo,dc,bp,bu,_n,wu,dl,Su,Tu,mc,wp,ml,Sp,Tp,Ip,Ep,Ap,ci,Iu,Pp,vn,hf){var zp,ya,ms,ys,gs,_s=je.addToLineVertexArray(Wi,pf),Cp=0,kp=0,Mp=0,Dp=0,yc=-1,gc=-1,$n={},Lp=D(""),_c=0,vc=0;if(_n._unevaluatedLayout.getValue("text-radial-offset")===void 0?(_c=(zp=_n.layout.get("text-offset").evaluate(ci,{},vn).map(function(gl){return 24*gl}))[0],vc=zp[1]):(_c=24*_n.layout.get("text-radial-offset").evaluate(ci,{},vn),vc=nc),je.allowVerticalPlacement&&zo.vertical){var Bp=_n.layout.get("text-rotate").evaluate(ci,{},vn)+90;ys=new lu(wu,Wi,dl,Su,Tu,zo.vertical,mc,wp,ml,Bp),bu&&(gs=new lu(wu,Wi,dl,Su,Tu,bu,Tp,Ip,ml,Bp));}if(dc){var xc=_n.layout.get("icon-rotate").evaluate(ci,{}),Rp=_n.layout.get("icon-text-fit")!=="none",Fp=tp(dc,xc,Pp,Rp),bc=bu?tp(bu,xc,Pp,Rp):void 0;ms=new lu(wu,Wi,dl,Su,Tu,dc,Tp,Ip,!1,xc),Cp=4*Fp.length;var Op=je.iconSizeData,yl=null;Op.kind==="source"?(yl=[128*_n.layout.get("icon-size").evaluate(ci,{})])[0]>32640&&Me(je.layerIds[0]+': Value for "icon-size" is >= 255. Reduce your "icon-size".'):Op.kind==="composite"&&((yl=[128*Iu.compositeIconSizes[0].evaluate(ci,{},vn),128*Iu.compositeIconSizes[1].evaluate(ci,{},vn)])[0]>32640||yl[1]>32640)&&Me(je.layerIds[0]+': Value for "icon-size" is >= 255. Reduce your "icon-size".'),je.addSymbols(je.icon,Fp,yl,Ap,Ep,ci,!1,Wi,_s.lineStartIndex,_s.lineLength,-1,vn),yc=je.icon.placedSymbolArray.length-1,bc&&(kp=4*bc.length,je.addSymbols(je.icon,bc,yl,Ap,Ep,ci,li.vertical,Wi,_s.lineStartIndex,_s.lineLength,-1,vn),gc=je.icon.placedSymbolArray.length-1);}for(var Up in zo.horizontal){var Eu=zo.horizontal[Up];if(!ya){Lp=D(Eu.text);var ff=_n.layout.get("text-rotate").evaluate(ci,{},vn);ya=new lu(wu,Wi,dl,Su,Tu,Eu,mc,wp,ml,ff);}var Vp=Eu.positionedLines.length===1;if(Mp+=ip(je,Wi,Eu,bp,_n,ml,ci,Sp,_s,zo.vertical?li.horizontal:li.horizontalOnly,Vp?Object.keys(zo.horizontal):[Up],$n,yc,Iu,vn),Vp)break}zo.vertical&&(Dp+=ip(je,Wi,zo.vertical,bp,_n,ml,ci,Sp,_s,li.vertical,["vertical"],$n,gc,Iu,vn));var df=ya?ya.boxStartIndex:je.collisionBoxArray.length,mf=ya?ya.boxEndIndex:je.collisionBoxArray.length,yf=ys?ys.boxStartIndex:je.collisionBoxArray.length,gf=ys?ys.boxEndIndex:je.collisionBoxArray.length,_f=ms?ms.boxStartIndex:je.collisionBoxArray.length,vf=ms?ms.boxEndIndex:je.collisionBoxArray.length,xf=gs?gs.boxStartIndex:je.collisionBoxArray.length,bf=gs?gs.boxEndIndex:je.collisionBoxArray.length,xn=-1,Au=function(gl,jp){return gl&&gl.circleDiameter?Math.max(gl.circleDiameter,jp):jp};xn=Au(ya,xn),xn=Au(ys,xn),xn=Au(ms,xn);var Np=(xn=Au(gs,xn))>-1?1:0;Np&&(xn*=hf/24),je.glyphOffsetArray.length>=me.MAX_GLYPHS&&Me("Too many glyphs being rendered in a tile. See https://github.com/mapbox/mapbox-gl-js/issues/2907"),ci.sortKey!==void 0&&je.addToSortKeyRanges(je.symbolInstances.length,ci.sortKey),je.symbolInstances.emplaceBack(Wi.x,Wi.y,$n.right>=0?$n.right:-1,$n.center>=0?$n.center:-1,$n.left>=0?$n.left:-1,$n.vertical||-1,yc,gc,Lp,df,mf,yf,gf,_f,vf,xf,bf,dl,Mp,Dp,Cp,kp,Np,0,mc,_c,vc,xn);}(Yt,fl,cf,fe,oe,Dr,yn,Yt.layers[0],Yt.collisionBoxArray,ve.index,ve.sourceLayerIndex,Yt.index,da,fu,du,mr,Yn,us,mu,gn,ve,dr,se,mn,Se);};if(Qn==="line")for(var ps=0,yu=$c(ve.geometry,0,0,8192,8192);ps<yu.length;ps+=1)for(var gu=yu[ps],al=0,sl=Xh(gu,ls,nl,fe.vertical||Di,oe,24,ss,Yt.overscaling,8192);al<sl.length;al+=1){var _u=sl[al];Di&&Jh(Yt,Di.text,ol,_u)||Po(gu,_u);}else if(Qn==="line-center")for(var ll=0,ul=ve.geometry;ll<ul.length;ll+=1){var cl=ul[ll];if(cl.length>1){var vu=Gh(cl,nl,fe.vertical||Di,oe,24,ss);vu&&Po(cl,vu);}}else if(ve.type==="Polygon")for(var hs=0,xu=Yu(ve.geometry,0);hs<xu.length;hs+=1){var fs=xu[hs],pl=Kh(fs,16);Po(fs[0],new $a(pl.x,pl.y,0));}else if(ve.type==="LineString")for(var ma=0,hl=ve.geometry;ma<hl.length;ma+=1){var ds=hl[ma];Po(ds,new $a(ds[0].x,ds[0].y,0));}else if(ve.type==="Point")for(var pc=0,vp=ve.geometry;pc<vp.length;pc+=1)for(var hc=0,xp=vp[pc];hc<xp.length;hc+=1){var fc=xp[hc];Po([fc],new $a(fc.x,fc.y,0));}}(t,$,gt,ar,a,_,ft,zt,vt,Er,h);},J=0,Y=t.features;J<Y.length;J+=1)W();c&&t.generateCollisionDebugBuffers();},u.perspective=function(t,e,r,a,l){var c,h=1/Math.tan(e/2);return t[0]=h/r,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=h,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=-1,t[12]=0,t[13]=0,t[15]=0,l!=null&&l!==1/0?(t[10]=(l+a)*(c=1/(a-l)),t[14]=2*l*a*c):(t[10]=-1,t[14]=-2*a),t},u.pick=function(t,e){for(var r={},a=0;a<e.length;a++){var l=e[a];l in t&&(r[l]=t[l]);}return r},u.plugin=Wr,u.polygonIntersectsPolygon=hn,u.postMapLoadEvent=Bo,u.postTurnstileEvent=ba,u.potpack=jc,u.refProperties=["type","source","source-layer","minzoom","maxzoom","filter","layout"],u.register=Tt,u.registerForPluginStateChange=function(t){return t({pluginStatus:Vr,pluginURL:ji}),Us.on("pluginStateChange",t),t},u.renderColorRamp=Sc,u.rotate=function(t,e,r){var a=e[0],l=e[1],c=e[2],h=e[3],m=Math.sin(r),g=Math.cos(r);return t[0]=a*g+c*m,t[1]=l*g+h*m,t[2]=a*-m+c*g,t[3]=l*-m+h*g,t},u.rotateX=function(t,e,r){var a=Math.sin(r),l=Math.cos(r),c=e[4],h=e[5],m=e[6],g=e[7],_=e[8],x=e[9],b=e[10],I=e[11];return e!==t&&(t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[4]=c*l+_*a,t[5]=h*l+x*a,t[6]=m*l+b*a,t[7]=g*l+I*a,t[8]=_*l-c*a,t[9]=x*l-h*a,t[10]=b*l-m*a,t[11]=I*l-g*a,t},u.rotateZ=function(t,e,r){var a=Math.sin(r),l=Math.cos(r),c=e[0],h=e[1],m=e[2],g=e[3],_=e[4],x=e[5],b=e[6],I=e[7];return e!==t&&(t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[0]=c*l+_*a,t[1]=h*l+x*a,t[2]=m*l+b*a,t[3]=g*l+I*a,t[4]=_*l-c*a,t[5]=x*l-h*a,t[6]=b*l-m*a,t[7]=I*l-g*a,t},u.scale=function(t,e,r){var a=r[0],l=r[1],c=r[2];return t[0]=e[0]*a,t[1]=e[1]*a,t[2]=e[2]*a,t[3]=e[3]*a,t[4]=e[4]*l,t[5]=e[5]*l,t[6]=e[6]*l,t[7]=e[7]*l,t[8]=e[8]*c,t[9]=e[9]*c,t[10]=e[10]*c,t[11]=e[11]*c,t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t},u.scale$1=function(t,e,r){return t[0]=e[0]*r,t[1]=e[1]*r,t[2]=e[2]*r,t[3]=e[3]*r,t},u.scale$2=function(t,e,r){return t[0]=e[0]*r,t[1]=e[1]*r,t[2]=e[2]*r,t},u.setCacheLimits=function(t,e){lo=t,wa=e;},u.setRTLTextPlugin=function(t,e,r){if(r===void 0&&(r=!1),Vr==="deferred"||Vr==="loading"||Vr==="loaded")throw new Error("setRTLTextPlugin cannot be called multiple times.");ji=Fi.resolveURL(t),Vr="deferred",Ua=e,ra(),r||xi();},u.sphericalToCartesian=function(t){var e=t[0],r=t[1],a=t[2];return r+=90,r*=Math.PI/180,a*=Math.PI/180,{x:e*Math.cos(r)*Math.sin(a),y:e*Math.sin(r)*Math.sin(a),z:e*Math.cos(a)}},u.sqrLen=function(t){var e=t[0],r=t[1];return e*e+r*r},u.styleSpec=C,u.sub=function(t,e,r){return t[0]=e[0]-r[0],t[1]=e[1]-r[1],t[2]=e[2]-r[2],t},u.symbolSize=Zh,u.transformMat3=function(t,e,r){var a=e[0],l=e[1],c=e[2];return t[0]=a*r[0]+l*r[3]+c*r[6],t[1]=a*r[1]+l*r[4]+c*r[7],t[2]=a*r[2]+l*r[5]+c*r[8],t},u.transformMat4=Ga,u.translate=function(t,e,r){var a,l,c,h,m,g,_,x,b,I,E,L,B=r[0],q=r[1],V=r[2];return e===t?(t[12]=e[0]*B+e[4]*q+e[8]*V+e[12],t[13]=e[1]*B+e[5]*q+e[9]*V+e[13],t[14]=e[2]*B+e[6]*q+e[10]*V+e[14],t[15]=e[3]*B+e[7]*q+e[11]*V+e[15]):(l=e[1],c=e[2],h=e[3],m=e[4],g=e[5],_=e[6],x=e[7],b=e[8],I=e[9],E=e[10],L=e[11],t[0]=a=e[0],t[1]=l,t[2]=c,t[3]=h,t[4]=m,t[5]=g,t[6]=_,t[7]=x,t[8]=b,t[9]=I,t[10]=E,t[11]=L,t[12]=a*B+m*q+b*V+e[12],t[13]=l*B+g*q+I*V+e[13],t[14]=c*B+_*q+E*V+e[14],t[15]=h*B+x*q+L*V+e[15]),t},u.triggerPluginCompletionEvent=Wl,u.uniqueId=to,u.validateCustomStyleLayer=function(t){var e=[],r=t.id;return r===void 0&&e.push({message:"layers."+r+': missing required property "id"'}),t.render===void 0&&e.push({message:"layers."+r+': missing required method "render"'}),t.renderingMode&&t.renderingMode!=="2d"&&t.renderingMode!=="3d"&&e.push({message:"layers."+r+': property "renderingMode" must be either "2d" or "3d"'}),e},u.validateLight=ju,u.validateStyle=Qo,u.values=function(t){var e=[];for(var r in t)e.push(t[r]);return e},u.vectorTile=Ha,u.version="1.13.2",u.warnOnce=Me,u.webpSupported=Ei,u.window=Pt,u.wrap=Mo;}),zu(["./shared"],function(u){function Zr(w){var T=typeof w;if(T==="number"||T==="boolean"||T==="string"||w==null)return JSON.stringify(w);if(Array.isArray(w)){for(var A="[",M=0,O=w;M<O.length;M+=1)A+=Zr(O[M])+",";return A+"]"}for(var Z=Object.keys(w).sort(),X="{",C=0;C<Z.length;C++)X+=JSON.stringify(Z[C])+":"+Zr(w[Z[C]])+",";return X+"}"}function ct(w){for(var T="",A=0,M=u.refProperties;A<M.length;A+=1)T+="/"+Zr(w[M[A]]);return T}var tr=function(w){this.keyCache={},w&&this.replace(w);};tr.prototype.replace=function(w){this._layerConfigs={},this._layers={},this.update(w,[]);},tr.prototype.update=function(w,T){for(var A=this,M=0,O=w;M<O.length;M+=1){var Z=O[M];this._layerConfigs[Z.id]=Z;var X=this._layers[Z.id]=u.createStyleLayer(Z);X._featureFilter=u.featureFilter(X.filter),this.keyCache[Z.id]&&delete this.keyCache[Z.id];}for(var C=0,U=T;C<U.length;C+=1){var H=U[C];delete this.keyCache[H],delete this._layerConfigs[H],delete this._layers[H];}this.familiesBySource={};for(var at=0,lt=function(dt,yt){for(var Wt={},_t=0;_t<dt.length;_t++){var te=yt&&yt[dt[_t].id]||ct(dt[_t]);yt&&(yt[dt[_t].id]=te);var ge=Wt[te];ge||(ge=Wt[te]=[]),ge.push(dt[_t]);}var Ht=[];for(var le in Wt)Ht.push(Wt[le]);return Ht}(u.values(this._layerConfigs),this.keyCache);at<lt.length;at+=1){var rt=lt[at].map(function(dt){return A._layers[dt.id]}),st=rt[0];if(st.visibility!=="none"){var It=st.source||"",St=this.familiesBySource[It];St||(St=this.familiesBySource[It]={});var it=st.sourceLayer||"_geojsonTileLayer",xt=St[it];xt||(xt=St[it]=[]),xt.push(rt);}}};var jt=function(w){var T={},A=[];for(var M in w){var O=w[M],Z=T[M]={};for(var X in O){var C=O[+X];if(C&&C.bitmap.width!==0&&C.bitmap.height!==0){var U={x:0,y:0,w:C.bitmap.width+2,h:C.bitmap.height+2};A.push(U),Z[X]={rect:U,metrics:C.metrics};}}}var H=u.potpack(A),at=new u.AlphaImage({width:H.w||1,height:H.h||1});for(var lt in w){var rt=w[lt];for(var st in rt){var It=rt[+st];if(It&&It.bitmap.width!==0&&It.bitmap.height!==0){var St=T[lt][st].rect;u.AlphaImage.copy(It.bitmap,at,{x:0,y:0},{x:St.x+1,y:St.y+1},It.bitmap);}}}this.image=at,this.positions=T;};u.register("GlyphAtlas",jt);var Ti=function(w){this.tileID=new u.OverscaledTileID(w.tileID.overscaledZ,w.tileID.wrap,w.tileID.canonical.z,w.tileID.canonical.x,w.tileID.canonical.y),this.uid=w.uid,this.zoom=w.zoom,this.pixelRatio=w.pixelRatio,this.tileSize=w.tileSize,this.source=w.source,this.overscaling=this.tileID.overscaleFactor(),this.showCollisionBoxes=w.showCollisionBoxes,this.collectResourceTiming=!!w.collectResourceTiming,this.returnDependencies=!!w.returnDependencies,this.promoteId=w.promoteId;};function Pt(w,T,A){for(var M=new u.EvaluationParameters(T),O=0,Z=w;O<Z.length;O+=1)Z[O].recalculate(M,A);}function vs(w,T){var A=u.getArrayBuffer(w.request,function(M,O,Z,X){M?T(M):O&&T(null,{vectorTile:new u.vectorTile.VectorTile(new u.pbf(O)),rawData:O,cacheControl:Z,expires:X});});return function(){A.cancel(),T();}}Ti.prototype.parse=function(w,T,A,M,O){var Z=this;this.status="parsing",this.data=w,this.collisionBoxArray=new u.CollisionBoxArray;var X=new u.DictionaryCoder(Object.keys(w.layers).sort()),C=new u.FeatureIndex(this.tileID,this.promoteId);C.bucketLayerIDs=[];var U,H,at,lt,rt={},st={featureIndex:C,iconDependencies:{},patternDependencies:{},glyphDependencies:{},availableImages:A},It=T.familiesBySource[this.source];for(var St in It){var it=w.layers[St];if(it){it.version===1&&u.warnOnce('Vector tile source "'+this.source+'" layer "'+St+'" does not use vector tile spec v2 and therefore may have some rendering errors.');for(var xt=X.encode(St),dt=[],yt=0;yt<it.length;yt++){var Wt=it.feature(yt),_t=C.getId(Wt,St);dt.push({feature:Wt,id:_t,index:yt,sourceLayerIndex:xt});}for(var te=0,ge=It[St];te<ge.length;te+=1){var Ht=ge[te],le=Ht[0];le.minzoom&&this.zoom<Math.floor(le.minzoom)||le.maxzoom&&this.zoom>=le.maxzoom||le.visibility!=="none"&&(Pt(Ht,this.zoom,A),(rt[le.id]=le.createBucket({index:C.bucketLayerIDs.length,layers:Ht,zoom:this.zoom,pixelRatio:this.pixelRatio,overscaling:this.overscaling,collisionBoxArray:this.collisionBoxArray,sourceLayerIndex:xt,sourceID:this.source})).populate(dt,st,this.tileID.canonical),C.bucketLayerIDs.push(Ht.map(function(de){return de.id})));}}}var re=u.mapObject(st.glyphDependencies,function(de){return Object.keys(de).map(Number)});Object.keys(re).length?M.send("getGlyphs",{uid:this.uid,stacks:re},function(de,Qt){U||(U=de,H=Qt,Fe.call(Z));}):H={};var _r=Object.keys(st.iconDependencies);_r.length?M.send("getImages",{icons:_r,source:this.source,tileID:this.tileID,type:"icons"},function(de,Qt){U||(U=de,at=Qt,Fe.call(Z));}):at={};var pe=Object.keys(st.patternDependencies);function Fe(){if(U)return O(U);if(H&&at&&lt){var de=new jt(H),Qt=new u.ImageAtlas(at,lt);for(var ue in rt){var Pr=rt[ue];Pr instanceof u.SymbolBucket?(Pt(Pr.layers,this.zoom,A),u.performSymbolLayout(Pr,H,de.positions,at,Qt.iconPositions,this.showCollisionBoxes,this.tileID.canonical)):Pr.hasPattern&&(Pr instanceof u.LineBucket||Pr instanceof u.FillBucket||Pr instanceof u.FillExtrusionBucket)&&(Pt(Pr.layers,this.zoom,A),Pr.addFeatures(st,this.tileID.canonical,Qt.patternPositions));}this.status="done",O(null,{buckets:u.values(rt).filter(function(Vo){return !Vo.isEmpty()}),featureIndex:C,collisionBoxArray:this.collisionBoxArray,glyphAtlasImage:de.image,imageAtlas:Qt,glyphMap:this.returnDependencies?H:null,iconMap:this.returnDependencies?at:null,glyphPositions:this.returnDependencies?de.positions:null});}}pe.length?M.send("getImages",{icons:pe,source:this.source,tileID:this.tileID,type:"patterns"},function(de,Qt){U||(U=de,lt=Qt,Fe.call(Z));}):lt={},Fe.call(this);};var Jr=function(w,T,A,M){this.actor=w,this.layerIndex=T,this.availableImages=A,this.loadVectorData=M||vs,this.loading={},this.loaded={};};Jr.prototype.loadTile=function(w,T){var A=this,M=w.uid;this.loading||(this.loading={});var O=!!(w&&w.request&&w.request.collectResourceTiming)&&new u.RequestPerformance(w.request),Z=this.loading[M]=new Ti(w);Z.abort=this.loadVectorData(w,function(X,C){if(delete A.loading[M],X||!C)return Z.status="done",A.loaded[M]=Z,T(X);var U=C.rawData,H={};C.expires&&(H.expires=C.expires),C.cacheControl&&(H.cacheControl=C.cacheControl);var at={};if(O){var lt=O.finish();lt&&(at.resourceTiming=JSON.parse(JSON.stringify(lt)));}Z.vectorTile=C.vectorTile,Z.parse(C.vectorTile,A.layerIndex,A.availableImages,A.actor,function(rt,st){if(rt||!st)return T(rt);T(null,u.extend({rawTileData:U.slice(0)},st,H,at));}),A.loaded=A.loaded||{},A.loaded[M]=Z;});},Jr.prototype.reloadTile=function(w,T){var A=this,M=this.loaded,O=w.uid,Z=this;if(M&&M[O]){var X=M[O];X.showCollisionBoxes=w.showCollisionBoxes;var C=function(U,H){var at=X.reloadCallback;at&&(delete X.reloadCallback,X.parse(X.vectorTile,Z.layerIndex,A.availableImages,Z.actor,at)),T(U,H);};X.status==="parsing"?X.reloadCallback=C:X.status==="done"&&(X.vectorTile?X.parse(X.vectorTile,this.layerIndex,this.availableImages,this.actor,C):C());}},Jr.prototype.abortTile=function(w,T){var A=this.loading,M=w.uid;A&&A[M]&&A[M].abort&&(A[M].abort(),delete A[M]),T();},Jr.prototype.removeTile=function(w,T){var A=this.loaded,M=w.uid;A&&A[M]&&delete A[M],T();};var bn=u.window.ImageBitmap,Lr=function(){this.loaded={};};function Mo(w,T){if(w.length!==0){lr(w[0],T);for(var A=1;A<w.length;A++)lr(w[A],!T);}}function lr(w,T){for(var A=0,M=0,O=w.length,Z=O-1;M<O;Z=M++)A+=(w[M][0]-w[Z][0])*(w[Z][1]+w[M][1]);A>=0!=!!T&&w.reverse();}Lr.prototype.loadTile=function(w,T){var A=w.uid,M=w.encoding,O=w.rawImageData,Z=bn&&O instanceof bn?this.getImageData(O):O,X=new u.DEMData(A,Z,M);this.loaded=this.loaded||{},this.loaded[A]=X,T(null,X);},Lr.prototype.getImageData=function(w){this.offscreenCanvas&&this.offscreenCanvasContext||(this.offscreenCanvas=new OffscreenCanvas(w.width,w.height),this.offscreenCanvasContext=this.offscreenCanvas.getContext("2d")),this.offscreenCanvas.width=w.width,this.offscreenCanvas.height=w.height,this.offscreenCanvasContext.drawImage(w,0,0,w.width,w.height);var T=this.offscreenCanvasContext.getImageData(-1,-1,w.width+2,w.height+2);return this.offscreenCanvasContext.clearRect(0,0,this.offscreenCanvas.width,this.offscreenCanvas.height),new u.RGBAImage({width:T.width,height:T.height},T.data)},Lr.prototype.removeTile=function(w){var T=this.loaded,A=w.uid;T&&T[A]&&delete T[A];};var ga=u.vectorTile.VectorTileFeature.prototype.toGeoJSON,to=function(w){this._feature=w,this.extent=u.EXTENT,this.type=w.type,this.properties=w.tags,"id"in w&&!isNaN(w.id)&&(this.id=parseInt(w.id,10));};to.prototype.loadGeometry=function(){if(this._feature.type===1){for(var w=[],T=0,A=this._feature.geometry;T<A.length;T+=1){var M=A[T];w.push([new u.Point$1(M[0],M[1])]);}return w}for(var O=[],Z=0,X=this._feature.geometry;Z<X.length;Z+=1){for(var C=[],U=0,H=X[Z];U<H.length;U+=1){var at=H[U];C.push(new u.Point$1(at[0],at[1]));}O.push(C);}return O},to.prototype.toGeoJSON=function(w,T,A){return ga.call(this,w,T,A)};var Bi=function(w){this.layers={_geojsonTileLayer:this},this.name="_geojsonTileLayer",this.extent=u.EXTENT,this.length=w.length,this._features=w;};Bi.prototype.feature=function(w){return new to(this._features[w])};var eo=u.vectorTile.VectorTileFeature,ro=wn;function wn(w,T){this.options=T||{},this.features=w,this.length=w.length;}function yr(w,T){this.id=typeof w.id=="number"?w.id:void 0,this.type=w.type,this.rawGeometry=w.type===1?[w.geometry]:w.geometry,this.properties=w.tags,this.extent=T||4096;}wn.prototype.feature=function(w){return new yr(this.features[w],this.options.extent)},yr.prototype.loadGeometry=function(){var w=this.rawGeometry;this.geometry=[];for(var T=0;T<w.length;T++){for(var A=w[T],M=[],O=0;O<A.length;O++)M.push(new u.Point$1(A[O][0],A[O][1]));this.geometry.push(M);}return this.geometry},yr.prototype.bbox=function(){this.geometry||this.loadGeometry();for(var w=this.geometry,T=1/0,A=-1/0,M=1/0,O=-1/0,Z=0;Z<w.length;Z++)for(var X=w[Z],C=0;C<X.length;C++){var U=X[C];T=Math.min(T,U.x),A=Math.max(A,U.x),M=Math.min(M,U.y),O=Math.max(O,U.y);}return [T,M,A,O]},yr.prototype.toGeoJSON=eo.prototype.toGeoJSON;var Ri=io,pi=ro;function io(w){var T=new u.pbf;return function(A,M){for(var O in A.layers)M.writeMessage(3,Me,A.layers[O]);}(w,T),T.finish()}function Me(w,T){var A;T.writeVarintField(15,w.version||1),T.writeStringField(1,w.name||""),T.writeVarintField(5,w.extent||4096);var M={keys:[],values:[],keycache:{},valuecache:{}};for(A=0;A<w.length;A++)M.feature=w.feature(A),T.writeMessage(2,Br,M);var O=M.keys;for(A=0;A<O.length;A++)T.writeStringField(3,O[A]);var Z=M.values;for(A=0;A<Z.length;A++)T.writeMessage(4,va,Z[A]);}function Br(w,T){var A=w.feature;A.id!==void 0&&T.writeVarintField(1,A.id),T.writeMessage(2,_a,w),T.writeVarintField(3,A.type),T.writeMessage(4,oo,A);}function _a(w,T){var A=w.feature,M=w.keys,O=w.values,Z=w.keycache,X=w.valuecache;for(var C in A.properties){var U=Z[C];U===void 0&&(M.push(C),Z[C]=U=M.length-1),T.writeVarint(U);var H=A.properties[C],at=typeof H;at!=="string"&&at!=="boolean"&&at!=="number"&&(H=JSON.stringify(H));var lt=at+":"+H,rt=X[lt];rt===void 0&&(O.push(H),X[lt]=rt=O.length-1),T.writeVarint(rt);}}function hi(w,T){return (T<<3)+(7&w)}function no(w){return w<<1^w>>31}function oo(w,T){for(var A=w.loadGeometry(),M=w.type,O=0,Z=0,X=A.length,C=0;C<X;C++){var U=A[C],H=1;M===1&&(H=U.length),T.writeVarint(hi(1,H));for(var at=M===3?U.length-1:U.length,lt=0;lt<at;lt++){lt===1&&M!==1&&T.writeVarint(hi(2,at-1));var rt=U[lt].x-O,st=U[lt].y-Z;T.writeVarint(no(rt)),T.writeVarint(no(st)),O+=rt,Z+=st;}M===3&&T.writeVarint(hi(7,1));}}function va(w,T){var A=typeof w;A==="string"?T.writeStringField(1,w):A==="boolean"?T.writeBooleanField(7,w):A==="number"&&(w%1!=0?T.writeDoubleField(3,w):w<0?T.writeSVarintField(6,w):T.writeVarintField(5,w));}function Ki(w,T,A,M){fi(w,A,M),fi(T,2*A,2*M),fi(T,2*A+1,2*M+1);}function fi(w,T,A){var M=w[T];w[T]=w[A],w[A]=M;}function Ii(w,T,A,M){var O=w-A,Z=T-M;return O*O+Z*Z}Ri.fromVectorTileJs=io,Ri.fromGeojsonVt=function(w,T){T=T||{};var A={};for(var M in w)A[M]=new ro(w[M].features,T),A[M].name=M,A[M].version=T.version,A[M].extent=T.extent;return io({layers:A})},Ri.GeoJSONWrapper=pi;var Sn=function(w){return w[0]},Tn=function(w){return w[1]},Hi=function(w,T,A,M,O){T===void 0&&(T=Sn),A===void 0&&(A=Tn),M===void 0&&(M=64),O===void 0&&(O=Float64Array),this.nodeSize=M,this.points=w;for(var Z=w.length<65536?Uint16Array:Uint32Array,X=this.ids=new Z(w.length),C=this.coords=new O(2*w.length),U=0;U<w.length;U++)X[U]=U,C[2*U]=T(w[U]),C[2*U+1]=A(w[U]);!function H(at,lt,rt,st,It,St){if(!(It-st<=rt)){var it=st+It>>1;!function xt(dt,yt,Wt,_t,te,ge){for(;te>_t;){if(te-_t>600){var Ht=te-_t+1,le=Wt-_t+1,re=Math.log(Ht),_r=.5*Math.exp(2*re/3),pe=.5*Math.sqrt(re*_r*(Ht-_r)/Ht)*(le-Ht/2<0?-1:1);xt(dt,yt,Wt,Math.max(_t,Math.floor(Wt-le*_r/Ht+pe)),Math.min(te,Math.floor(Wt+(Ht-le)*_r/Ht+pe)),ge);}var Fe=yt[2*Wt+ge],de=_t,Qt=te;for(Ki(dt,yt,_t,Wt),yt[2*te+ge]>Fe&&Ki(dt,yt,_t,te);de<Qt;){for(Ki(dt,yt,de,Qt),de++,Qt--;yt[2*de+ge]<Fe;)de++;for(;yt[2*Qt+ge]>Fe;)Qt--;}yt[2*_t+ge]===Fe?Ki(dt,yt,_t,Qt):Ki(dt,yt,++Qt,te),Qt<=Wt&&(_t=Qt+1),Wt<=Qt&&(te=Qt-1);}}(at,lt,it,st,It,St%2),H(at,lt,rt,st,it-1,St+1),H(at,lt,rt,it+1,It,St+1);}}(X,C,M,0,X.length-1,0);};Hi.prototype.range=function(w,T,A,M){return function(O,Z,X,C,U,H,at){for(var lt,rt,st=[0,O.length-1,0],It=[];st.length;){var St=st.pop(),it=st.pop(),xt=st.pop();if(it-xt<=at)for(var dt=xt;dt<=it;dt++)rt=Z[2*dt+1],(lt=Z[2*dt])>=X&&lt<=U&&rt>=C&&rt<=H&&It.push(O[dt]);else {var yt=Math.floor((xt+it)/2);rt=Z[2*yt+1],(lt=Z[2*yt])>=X&&lt<=U&&rt>=C&&rt<=H&&It.push(O[yt]);var Wt=(St+1)%2;(St===0?X<=lt:C<=rt)&&(st.push(xt),st.push(yt-1),st.push(Wt)),(St===0?U>=lt:H>=rt)&&(st.push(yt+1),st.push(it),st.push(Wt));}}return It}(this.ids,this.coords,w,T,A,M,this.nodeSize)},Hi.prototype.within=function(w,T,A){return function(M,O,Z,X,C,U){for(var H=[0,M.length-1,0],at=[],lt=C*C;H.length;){var rt=H.pop(),st=H.pop(),It=H.pop();if(st-It<=U)for(var St=It;St<=st;St++)Ii(O[2*St],O[2*St+1],Z,X)<=lt&&at.push(M[St]);else {var it=Math.floor((It+st)/2),xt=O[2*it],dt=O[2*it+1];Ii(xt,dt,Z,X)<=lt&&at.push(M[it]);var yt=(rt+1)%2;(rt===0?Z-C<=xt:X-C<=dt)&&(H.push(It),H.push(it-1),H.push(yt)),(rt===0?Z+C>=xt:X+C>=dt)&&(H.push(it+1),H.push(st),H.push(yt));}}return at}(this.ids,this.coords,w,T,A,this.nodeSize)};var xs={minZoom:0,maxZoom:16,minPoints:2,radius:40,extent:512,nodeSize:64,log:!1,generateId:!1,reduce:null,map:function(w){return w}},gr=function(w){this.options=Ji(Object.create(xs),w),this.trees=new Array(this.options.maxZoom+1);};function Fi(w,T,A,M,O){return {x:w,y:T,zoom:1/0,id:A,parentId:-1,numPoints:M,properties:O}}function ye(w,T){var A=w.geometry.coordinates,M=A[1];return {x:di(A[0]),y:$t(M),zoom:1/0,index:T,parentId:-1}}function Ei(w){return {type:"Feature",id:w.id,properties:ao(w),geometry:{type:"Point",coordinates:[(M=w.x,360*(M-.5)),(T=w.y,A=(180-360*T)*Math.PI/180,360*Math.atan(Math.exp(A))/Math.PI-90)]}};var T,A,M;}function ao(w){var T=w.numPoints,A=T>=1e4?Math.round(T/1e3)+"k":T>=1e3?Math.round(T/100)/10+"k":T;return Ji(Ji({},w.properties),{cluster:!0,cluster_id:w.id,point_count:T,point_count_abbreviated:A})}function di(w){return w/360+.5}function $t(w){var T=Math.sin(w*Math.PI/180),A=.5-.25*Math.log((1+T)/(1-T))/Math.PI;return A<0?0:A>1?1:A}function Ji(w,T){for(var A in T)w[A]=T[A];return w}function Ar(w){return w.x}function Yr(w){return w.y}function bs(w,T,A,M,O,Z){var X=O-A,C=Z-M;if(X!==0||C!==0){var U=((w-A)*X+(T-M)*C)/(X*X+C*C);U>1?(A=O,M=Z):U>0&&(A+=X*U,M+=C*U);}return (X=w-A)*X+(C=T-M)*C}function mi(w,T,A,M){var O={id:w===void 0?null:w,type:T,geometry:A,tags:M,minX:1/0,minY:1/0,maxX:-1/0,maxY:-1/0};return function(Z){var X=Z.geometry,C=Z.type;if(C==="Point"||C==="MultiPoint"||C==="LineString")Do(Z,X);else if(C==="Polygon"||C==="MultiLineString")for(var U=0;U<X.length;U++)Do(Z,X[U]);else if(C==="MultiPolygon")for(U=0;U<X.length;U++)for(var H=0;H<X[U].length;H++)Do(Z,X[U][H]);}(O),O}function Do(w,T){for(var A=0;A<T.length;A+=3)w.minX=Math.min(w.minX,T[A]),w.minY=Math.min(w.minY,T[A+1]),w.maxX=Math.max(w.maxX,T[A]),w.maxY=Math.max(w.maxY,T[A+1]);}function Qr(w,T,A,M){if(T.geometry){var O=T.geometry.coordinates,Z=T.geometry.type,X=Math.pow(A.tolerance/((1<<A.maxZoom)*A.extent),2),C=[],U=T.id;if(A.promoteId?U=T.properties[A.promoteId]:A.generateId&&(U=M||0),Z==="Point")In(O,C);else if(Z==="MultiPoint")for(var H=0;H<O.length;H++)In(O[H],C);else if(Z==="LineString")so(O,C,X,!1);else if(Z==="MultiLineString"){if(A.lineMetrics){for(H=0;H<O.length;H++)so(O[H],C=[],X,!1),w.push(mi(U,"LineString",C,T.properties));return}$r(O,C,X,!1);}else if(Z==="Polygon")$r(O,C,X,!0);else {if(Z!=="MultiPolygon"){if(Z==="GeometryCollection"){for(H=0;H<T.geometry.geometries.length;H++)Qr(w,{id:U,geometry:T.geometry.geometries[H],properties:T.properties},A,M);return}throw new Error("Input data is not a valid GeoJSON object.")}for(H=0;H<O.length;H++){var at=[];$r(O[H],at,X,!0),C.push(at);}}w.push(mi(U,Z,C,T.properties));}}function In(w,T){T.push(ti(w[0])),T.push(En(w[1])),T.push(0);}function so(w,T,A,M){for(var O,Z,X=0,C=0;C<w.length;C++){var U=ti(w[C][0]),H=En(w[C][1]);T.push(U),T.push(H),T.push(0),C>0&&(X+=M?(O*H-U*Z)/2:Math.sqrt(Math.pow(U-O,2)+Math.pow(H-Z,2))),O=U,Z=H;}var at=T.length-3;T[2]=1,function lt(rt,st,It,St){for(var it,xt=St,dt=It-st>>1,yt=It-st,Wt=rt[st],_t=rt[st+1],te=rt[It],ge=rt[It+1],Ht=st+3;Ht<It;Ht+=3){var le=bs(rt[Ht],rt[Ht+1],Wt,_t,te,ge);if(le>xt)it=Ht,xt=le;else if(le===xt){var re=Math.abs(Ht-dt);re<yt&&(it=Ht,yt=re);}}xt>St&&(it-st>3&&lt(rt,st,it,St),rt[it+2]=xt,It-it>3&&lt(rt,it,It,St));}(T,0,at,A),T[at+2]=1,T.size=Math.abs(X),T.start=0,T.end=T.size;}function $r(w,T,A,M){for(var O=0;O<w.length;O++){var Z=[];so(w[O],Z,A,M),T.push(Z);}}function ti(w){return w/360+.5}function En(w){var T=Math.sin(w*Math.PI/180),A=.5-.25*Math.log((1+T)/(1-T))/Math.PI;return A<0?0:A>1?1:A}function yi(w,T,A,M,O,Z,X,C){if(M/=T,Z>=(A/=T)&&X<M)return w;if(X<A||Z>=M)return null;for(var U=[],H=0;H<w.length;H++){var at=w[H],lt=at.geometry,rt=at.type,st=O===0?at.minX:at.minY,It=O===0?at.maxX:at.maxY;if(st>=A&&It<M)U.push(at);else if(!(It<A||st>=M)){var St=[];if(rt==="Point"||rt==="MultiPoint")xa(lt,St,A,M,O);else if(rt==="LineString")ba(lt,St,A,M,O,!1,C.lineMetrics);else if(rt==="MultiLineString")Bo(lt,St,A,M,O,!1);else if(rt==="Polygon")Bo(lt,St,A,M,O,!0);else if(rt==="MultiPolygon")for(var it=0;it<lt.length;it++){var xt=[];Bo(lt[it],xt,A,M,O,!0),xt.length&&St.push(xt);}if(St.length){if(C.lineMetrics&&rt==="LineString"){for(it=0;it<St.length;it++)U.push(mi(at.id,rt,St[it],at.tags));continue}rt!=="LineString"&&rt!=="MultiLineString"||(St.length===1?(rt="LineString",St=St[0]):rt="MultiLineString"),rt!=="Point"&&rt!=="MultiPoint"||(rt=St.length===3?"Point":"MultiPoint"),U.push(mi(at.id,rt,St,at.tags));}}}return U.length?U:null}function xa(w,T,A,M,O){for(var Z=0;Z<w.length;Z+=3){var X=w[Z+O];X>=A&&X<=M&&(T.push(w[Z]),T.push(w[Z+1]),T.push(w[Z+2]));}}function ba(w,T,A,M,O,Z,X){for(var C,U,H=Lo(w),at=O===0?wa:uo,lt=w.start,rt=0;rt<w.length-3;rt+=3){var st=w[rt],It=w[rt+1],St=w[rt+2],it=w[rt+3],xt=w[rt+4],dt=O===0?st:It,yt=O===0?it:xt,Wt=!1;X&&(C=Math.sqrt(Math.pow(st-it,2)+Math.pow(It-xt,2))),dt<A?yt>A&&(U=at(H,st,It,it,xt,A),X&&(H.start=lt+C*U)):dt>M?yt<M&&(U=at(H,st,It,it,xt,M),X&&(H.start=lt+C*U)):lo(H,st,It,St),yt<A&&dt>=A&&(U=at(H,st,It,it,xt,A),Wt=!0),yt>M&&dt<=M&&(U=at(H,st,It,it,xt,M),Wt=!0),!Z&&Wt&&(X&&(H.end=lt+C*U),T.push(H),H=Lo(w)),X&&(lt+=C);}var _t=w.length-3;st=w[_t],It=w[_t+1],St=w[_t+2],(dt=O===0?st:It)>=A&&dt<=M&&lo(H,st,It,St),_t=H.length-3,Z&&_t>=3&&(H[_t]!==H[0]||H[_t+1]!==H[1])&&lo(H,H[0],H[1],H[2]),H.length&&T.push(H);}function Lo(w){var T=[];return T.size=w.size,T.start=w.start,T.end=w.end,T}function Bo(w,T,A,M,O,Z){for(var X=0;X<w.length;X++)ba(w[X],T,A,M,O,Z,!1);}function lo(w,T,A,M){w.push(T),w.push(A),w.push(M);}function wa(w,T,A,M,O,Z){var X=(Z-T)/(M-T);return w.push(Z),w.push(A+(O-A)*X),w.push(1),X}function uo(w,T,A,M,O,Z){var X=(Z-A)/(O-A);return w.push(T+(M-T)*X),w.push(Z),w.push(1),X}function Ro(w,T){for(var A=[],M=0;M<w.length;M++){var O,Z=w[M],X=Z.type;if(X==="Point"||X==="MultiPoint"||X==="LineString")O=An(Z.geometry,T);else if(X==="MultiLineString"||X==="Polygon"){O=[];for(var C=0;C<Z.geometry.length;C++)O.push(An(Z.geometry[C],T));}else if(X==="MultiPolygon")for(O=[],C=0;C<Z.geometry.length;C++){for(var U=[],H=0;H<Z.geometry[C].length;H++)U.push(An(Z.geometry[C][H],T));O.push(U);}A.push(mi(Z.id,X,O,Z.tags));}return A}function An(w,T){var A=[];A.size=w.size,w.start!==void 0&&(A.start=w.start,A.end=w.end);for(var M=0;M<w.length;M+=3)A.push(w[M]+T,w[M+1],w[M+2]);return A}function Fo(w,T){if(w.transformed)return w;var A,M,O,Z=1<<w.z,X=w.x,C=w.y;for(A=0;A<w.features.length;A++){var U=w.features[A],H=U.geometry,at=U.type;if(U.geometry=[],at===1)for(M=0;M<H.length;M+=2)U.geometry.push(Oo(H[M],H[M+1],T,Z,X,C));else for(M=0;M<H.length;M++){var lt=[];for(O=0;O<H[M].length;O+=2)lt.push(Oo(H[M][O],H[M][O+1],T,Z,X,C));U.geometry.push(lt);}}return w.transformed=!0,w}function Oo(w,T,A,M,O,Z){return [Math.round(A*(w*M-O)),Math.round(A*(T*M-Z))]}function Sa(w,T,A,M,O){for(var Z=T===O.maxZoom?0:O.tolerance/((1<<T)*O.extent),X={features:[],numPoints:0,numSimplified:0,numFeatures:0,source:null,x:A,y:M,z:T,transformed:!1,minX:2,minY:1,maxX:-1,maxY:0},C=0;C<w.length;C++){X.numFeatures++,Ta(X,w[C],Z,O);var U=w[C].minX,H=w[C].minY,at=w[C].maxX,lt=w[C].maxY;U<X.minX&&(X.minX=U),H<X.minY&&(X.minY=H),at>X.maxX&&(X.maxX=at),lt>X.maxY&&(X.maxY=lt);}return X}function Ta(w,T,A,M){var O=T.geometry,Z=T.type,X=[];if(Z==="Point"||Z==="MultiPoint")for(var C=0;C<O.length;C+=3)X.push(O[C]),X.push(O[C+1]),w.numPoints++,w.numSimplified++;else if(Z==="LineString")Pn(X,O,w,A,!1,!1);else if(Z==="MultiLineString"||Z==="Polygon")for(C=0;C<O.length;C++)Pn(X,O[C],w,A,Z==="Polygon",C===0);else if(Z==="MultiPolygon")for(var U=0;U<O.length;U++){var H=O[U];for(C=0;C<H.length;C++)Pn(X,H[C],w,A,!0,C===0);}if(X.length){var at=T.tags||null;if(Z==="LineString"&&M.lineMetrics){for(var lt in at={},T.tags)at[lt]=T.tags[lt];at.mapbox_clip_start=O.start/O.size,at.mapbox_clip_end=O.end/O.size;}var rt={geometry:X,type:Z==="Polygon"||Z==="MultiPolygon"?3:Z==="LineString"||Z==="MultiLineString"?2:1,tags:at};T.id!==null&&(rt.id=T.id),w.features.push(rt);}}function Pn(w,T,A,M,O,Z){var X=M*M;if(M>0&&T.size<(O?X:M))A.numPoints+=T.length/3;else {for(var C=[],U=0;U<T.length;U+=3)(M===0||T[U+2]>X)&&(A.numSimplified++,C.push(T[U]),C.push(T[U+1])),A.numPoints++;O&&function(H,at){for(var lt=0,rt=0,st=H.length,It=st-2;rt<st;It=rt,rt+=2)lt+=(H[rt]-H[It])*(H[rt+1]+H[It+1]);if(lt>0===at)for(rt=0,st=H.length;rt<st/2;rt+=2){var St=H[rt],it=H[rt+1];H[rt]=H[st-2-rt],H[rt+1]=H[st-1-rt],H[st-2-rt]=St,H[st-1-rt]=it;}}(C,Z),w.push(C);}}function Oi(w,T){var A=(T=this.options=function(O,Z){for(var X in Z)O[X]=Z[X];return O}(Object.create(this.options),T)).debug;if(A&&console.time("preprocess data"),T.maxZoom<0||T.maxZoom>24)throw new Error("maxZoom should be in the 0-24 range");if(T.promoteId&&T.generateId)throw new Error("promoteId and generateId cannot be used together.");var M=function(O,Z){var X=[];if(O.type==="FeatureCollection")for(var C=0;C<O.features.length;C++)Qr(X,O.features[C],Z,C);else Qr(X,O.type==="Feature"?O:{geometry:O},Z);return X}(w,T);this.tiles={},this.tileCoords=[],A&&(console.timeEnd("preprocess data"),console.log("index: maxZoom: %d, maxPoints: %d",T.indexMaxZoom,T.indexMaxPoints),console.time("generate tiles"),this.stats={},this.total=0),(M=function(O,Z){var X=Z.buffer/Z.extent,C=O,U=yi(O,1,-1-X,X,0,-1,2,Z),H=yi(O,1,1-X,2+X,0,-1,2,Z);return (U||H)&&(C=yi(O,1,-X,1+X,0,-1,2,Z)||[],U&&(C=Ro(U,1).concat(C)),H&&(C=C.concat(Ro(H,-1)))),C}(M,T)).length&&this.splitTile(M,0,0,0),A&&(M.length&&console.log("features: %d, points: %d",this.tiles[0].numFeatures,this.tiles[0].numPoints),console.timeEnd("generate tiles"),console.log("tiles generated:",this.total,JSON.stringify(this.stats)));}function Ui(w,T,A){return 32*((1<<w)*A+T)+w}function co(w,T){var A=w.tileID.canonical;if(!this._geoJSONIndex)return T(null,null);var M=this._geoJSONIndex.getTile(A.z,A.x,A.y);if(!M)return T(null,null);var O=new Bi(M.features),Z=Ri(O);Z.byteOffset===0&&Z.byteLength===Z.buffer.byteLength||(Z=new Uint8Array(Z)),T(null,{vectorTile:O,rawData:Z.buffer});}gr.prototype.load=function(w){var T=this.options,A=T.log,M=T.minZoom,O=T.maxZoom,Z=T.nodeSize;A&&console.time("total time");var X="prepare "+w.length+" points";A&&console.time(X),this.points=w;for(var C=[],U=0;U<w.length;U++)w[U].geometry&&C.push(ye(w[U],U));this.trees[O+1]=new Hi(C,Ar,Yr,Z,Float32Array),A&&console.timeEnd(X);for(var H=O;H>=M;H--){var at=+Date.now();C=this._cluster(C,H),this.trees[H]=new Hi(C,Ar,Yr,Z,Float32Array),A&&console.log("z%d: %d clusters in %dms",H,C.length,+Date.now()-at);}return A&&console.timeEnd("total time"),this},gr.prototype.getClusters=function(w,T){var A=((w[0]+180)%360+360)%360-180,M=Math.max(-90,Math.min(90,w[1])),O=w[2]===180?180:((w[2]+180)%360+360)%360-180,Z=Math.max(-90,Math.min(90,w[3]));if(w[2]-w[0]>=360)A=-180,O=180;else if(A>O){var X=this.getClusters([A,M,180,Z],T),C=this.getClusters([-180,M,O,Z],T);return X.concat(C)}for(var U=this.trees[this._limitZoom(T)],H=[],at=0,lt=U.range(di(A),$t(Z),di(O),$t(M));at<lt.length;at+=1){var rt=U.points[lt[at]];H.push(rt.numPoints?Ei(rt):this.points[rt.index]);}return H},gr.prototype.getChildren=function(w){var T=this._getOriginId(w),A=this._getOriginZoom(w),M="No cluster with the specified id.",O=this.trees[A];if(!O)throw new Error(M);var Z=O.points[T];if(!Z)throw new Error(M);for(var X=this.options.radius/(this.options.extent*Math.pow(2,A-1)),C=[],U=0,H=O.within(Z.x,Z.y,X);U<H.length;U+=1){var at=O.points[H[U]];at.parentId===w&&C.push(at.numPoints?Ei(at):this.points[at.index]);}if(C.length===0)throw new Error(M);return C},gr.prototype.getLeaves=function(w,T,A){var M=[];return this._appendLeaves(M,w,T=T||10,A=A||0,0),M},gr.prototype.getTile=function(w,T,A){var M=this.trees[this._limitZoom(w)],O=Math.pow(2,w),Z=this.options,X=Z.radius/Z.extent,C=(A-X)/O,U=(A+1+X)/O,H={features:[]};return this._addTileFeatures(M.range((T-X)/O,C,(T+1+X)/O,U),M.points,T,A,O,H),T===0&&this._addTileFeatures(M.range(1-X/O,C,1,U),M.points,O,A,O,H),T===O-1&&this._addTileFeatures(M.range(0,C,X/O,U),M.points,-1,A,O,H),H.features.length?H:null},gr.prototype.getClusterExpansionZoom=function(w){for(var T=this._getOriginZoom(w)-1;T<=this.options.maxZoom;){var A=this.getChildren(w);if(T++,A.length!==1)break;w=A[0].properties.cluster_id;}return T},gr.prototype._appendLeaves=function(w,T,A,M,O){for(var Z=0,X=this.getChildren(T);Z<X.length;Z+=1){var C=X[Z],U=C.properties;if(U&&U.cluster?O+U.point_count<=M?O+=U.point_count:O=this._appendLeaves(w,U.cluster_id,A,M,O):O<M?O++:w.push(C),w.length===A)break}return O},gr.prototype._addTileFeatures=function(w,T,A,M,O,Z){for(var X=0,C=w;X<C.length;X+=1){var U=T[C[X]],H=U.numPoints,at={type:1,geometry:[[Math.round(this.options.extent*(U.x*O-A)),Math.round(this.options.extent*(U.y*O-M))]],tags:H?ao(U):this.points[U.index].properties},lt=void 0;H?lt=U.id:this.options.generateId?lt=U.index:this.points[U.index].id&&(lt=this.points[U.index].id),lt!==void 0&&(at.id=lt),Z.features.push(at);}},gr.prototype._limitZoom=function(w){return Math.max(this.options.minZoom,Math.min(+w,this.options.maxZoom+1))},gr.prototype._cluster=function(w,T){for(var A=[],M=this.options,O=M.reduce,Z=M.minPoints,X=M.radius/(M.extent*Math.pow(2,T)),C=0;C<w.length;C++){var U=w[C];if(!(U.zoom<=T)){U.zoom=T;for(var H=this.trees[T+1],at=H.within(U.x,U.y,X),lt=U.numPoints||1,rt=lt,st=0,It=at;st<It.length;st+=1){var St=H.points[It[st]];St.zoom>T&&(rt+=St.numPoints||1);}if(rt>=Z){for(var it=U.x*lt,xt=U.y*lt,dt=O&&lt>1?this._map(U,!0):null,yt=(C<<5)+(T+1)+this.points.length,Wt=0,_t=at;Wt<_t.length;Wt+=1){var te=H.points[_t[Wt]];if(!(te.zoom<=T)){te.zoom=T;var ge=te.numPoints||1;it+=te.x*ge,xt+=te.y*ge,te.parentId=yt,O&&(dt||(dt=this._map(U,!0)),O(dt,this._map(te)));}}U.parentId=yt,A.push(Fi(it/rt,xt/rt,yt,rt,dt));}else if(A.push(U),rt>1)for(var Ht=0,le=at;Ht<le.length;Ht+=1){var re=H.points[le[Ht]];re.zoom<=T||(re.zoom=T,A.push(re));}}}return A},gr.prototype._getOriginId=function(w){return w-this.points.length>>5},gr.prototype._getOriginZoom=function(w){return (w-this.points.length)%32},gr.prototype._map=function(w,T){if(w.numPoints)return T?Ji({},w.properties):w.properties;var A=this.points[w.index].properties,M=this.options.map(A);return T&&M===A?Ji({},M):M},Oi.prototype.options={maxZoom:14,indexMaxZoom:5,indexMaxPoints:1e5,tolerance:3,extent:4096,buffer:64,lineMetrics:!1,promoteId:null,generateId:!1,debug:0},Oi.prototype.splitTile=function(w,T,A,M,O,Z,X){for(var C=[w,T,A,M],U=this.options,H=U.debug;C.length;){M=C.pop(),A=C.pop(),T=C.pop(),w=C.pop();var at=1<<T,lt=Ui(T,A,M),rt=this.tiles[lt];if(!rt&&(H>1&&console.time("creation"),rt=this.tiles[lt]=Sa(w,T,A,M,U),this.tileCoords.push({z:T,x:A,y:M}),H)){H>1&&(console.log("tile z%d-%d-%d (features: %d, points: %d, simplified: %d)",T,A,M,rt.numFeatures,rt.numPoints,rt.numSimplified),console.timeEnd("creation"));var st="z"+T;this.stats[st]=(this.stats[st]||0)+1,this.total++;}if(rt.source=w,O){if(T===U.maxZoom||T===O)continue;var It=1<<O-T;if(A!==Math.floor(Z/It)||M!==Math.floor(X/It))continue}else if(T===U.indexMaxZoom||rt.numPoints<=U.indexMaxPoints)continue;if(rt.source=null,w.length!==0){H>1&&console.time("clipping");var St,it,xt,dt,yt,Wt,_t=.5*U.buffer/U.extent,te=.5-_t,ge=.5+_t,Ht=1+_t;St=it=xt=dt=null,yt=yi(w,at,A-_t,A+ge,0,rt.minX,rt.maxX,U),Wt=yi(w,at,A+te,A+Ht,0,rt.minX,rt.maxX,U),w=null,yt&&(St=yi(yt,at,M-_t,M+ge,1,rt.minY,rt.maxY,U),it=yi(yt,at,M+te,M+Ht,1,rt.minY,rt.maxY,U),yt=null),Wt&&(xt=yi(Wt,at,M-_t,M+ge,1,rt.minY,rt.maxY,U),dt=yi(Wt,at,M+te,M+Ht,1,rt.minY,rt.maxY,U),Wt=null),H>1&&console.timeEnd("clipping"),C.push(St||[],T+1,2*A,2*M),C.push(it||[],T+1,2*A,2*M+1),C.push(xt||[],T+1,2*A+1,2*M),C.push(dt||[],T+1,2*A+1,2*M+1);}}},Oi.prototype.getTile=function(w,T,A){var M=this.options,O=M.extent,Z=M.debug;if(w<0||w>24)return null;var X=1<<w,C=Ui(w,T=(T%X+X)%X,A);if(this.tiles[C])return Fo(this.tiles[C],O);Z>1&&console.log("drilling down to z%d-%d-%d",w,T,A);for(var U,H=w,at=T,lt=A;!U&&H>0;)H--,at=Math.floor(at/2),lt=Math.floor(lt/2),U=this.tiles[Ui(H,at,lt)];return U&&U.source?(Z>1&&console.log("found parent tile z%d-%d-%d",H,at,lt),Z>1&&console.time("drilling down"),this.splitTile(U.source,H,at,lt,w,T,A),Z>1&&console.timeEnd("drilling down"),this.tiles[C]?Fo(this.tiles[C],O):null):null};var Uo=function(w){function T(A,M,O,Z){w.call(this,A,M,O,co),Z&&(this.loadGeoJSON=Z);}return w&&(T.__proto__=w),(T.prototype=Object.create(w&&w.prototype)).constructor=T,T.prototype.loadData=function(A,M){this._pendingCallback&&this._pendingCallback(null,{abandoned:!0}),this._pendingCallback=M,this._pendingLoadDataParams=A,this._state&&this._state!=="Idle"?this._state="NeedsLoadData":(this._state="Coalescing",this._loadData());},T.prototype._loadData=function(){var A=this;if(this._pendingCallback&&this._pendingLoadDataParams){var M=this._pendingCallback,O=this._pendingLoadDataParams;delete this._pendingCallback,delete this._pendingLoadDataParams;var Z=!!(O&&O.request&&O.request.collectResourceTiming)&&new u.RequestPerformance(O.request);this.loadGeoJSON(O,function(X,C){if(X||!C)return M(X);if(typeof C!="object")return M(new Error("Input data given to '"+O.source+"' is not a valid GeoJSON object."));!function rt(st,It){var St,it=st&&st.type;if(it==="FeatureCollection")for(St=0;St<st.features.length;St++)rt(st.features[St],It);else if(it==="GeometryCollection")for(St=0;St<st.geometries.length;St++)rt(st.geometries[St],It);else if(it==="Feature")rt(st.geometry,It);else if(it==="Polygon")Mo(st.coordinates,It);else if(it==="MultiPolygon")for(St=0;St<st.coordinates.length;St++)Mo(st.coordinates[St],It);return st}(C,!0);try{if(O.filter){var U=u.createExpression(O.filter,{type:"boolean","property-type":"data-driven",overridable:!1,transition:!1});if(U.result==="error")throw new Error(U.value.map(function(rt){return rt.key+": "+rt.message}).join(", "));var H=C.features.filter(function(rt){return U.value.evaluate({zoom:0},rt)});C={type:"FeatureCollection",features:H};}A._geoJSONIndex=O.cluster?new gr(function(rt){var st=rt.superclusterOptions,It=rt.clusterProperties;if(!It||!st)return st;for(var St={},it={},xt={accumulated:null,zoom:0},dt={properties:null},yt=Object.keys(It),Wt=0,_t=yt;Wt<_t.length;Wt+=1){var te=_t[Wt],ge=It[te],Ht=ge[0],le=u.createExpression(ge[1]),re=u.createExpression(typeof Ht=="string"?[Ht,["accumulated"],["get",te]]:Ht);St[te]=le.value,it[te]=re.value;}return st.map=function(_r){dt.properties=_r;for(var pe={},Fe=0,de=yt;Fe<de.length;Fe+=1){var Qt=de[Fe];pe[Qt]=St[Qt].evaluate(xt,dt);}return pe},st.reduce=function(_r,pe){dt.properties=pe;for(var Fe=0,de=yt;Fe<de.length;Fe+=1){var Qt=de[Fe];xt.accumulated=_r[Qt],_r[Qt]=it[Qt].evaluate(xt,dt);}},st}(O)).load(C.features):function(rt,st){return new Oi(rt,st)}(C,O.geojsonVtOptions);}catch(rt){return M(rt)}A.loaded={};var at={};if(Z){var lt=Z.finish();lt&&(at.resourceTiming={},at.resourceTiming[O.source]=JSON.parse(JSON.stringify(lt)));}M(null,at);});}},T.prototype.coalesce=function(){this._state==="Coalescing"?this._state="Idle":this._state==="NeedsLoadData"&&(this._state="Coalescing",this._loadData());},T.prototype.reloadTile=function(A,M){var O=this.loaded;return O&&O[A.uid]?w.prototype.reloadTile.call(this,A,M):this.loadTile(A,M)},T.prototype.loadGeoJSON=function(A,M){if(A.request)u.getJSON(A.request,M);else {if(typeof A.data!="string")return M(new Error("Input data given to '"+A.source+"' is not a valid GeoJSON object."));try{return M(null,JSON.parse(A.data))}catch(O){return M(new Error("Input data given to '"+A.source+"' is not a valid GeoJSON object."))}}},T.prototype.removeSource=function(A,M){this._pendingCallback&&this._pendingCallback(null,{abandoned:!0}),M();},T.prototype.getClusterExpansionZoom=function(A,M){try{M(null,this._geoJSONIndex.getClusterExpansionZoom(A.clusterId));}catch(O){M(O);}},T.prototype.getClusterChildren=function(A,M){try{M(null,this._geoJSONIndex.getChildren(A.clusterId));}catch(O){M(O);}},T.prototype.getClusterLeaves=function(A,M){try{M(null,this._geoJSONIndex.getLeaves(A.clusterId,A.limit,A.offset));}catch(O){M(O);}},T}(Jr),Re=function(w){var T=this;this.self=w,this.actor=new u.Actor(w,this),this.layerIndexes={},this.availableImages={},this.workerSourceTypes={vector:Jr,geojson:Uo},this.workerSources={},this.demWorkerSources={},this.self.registerWorkerSource=function(A,M){if(T.workerSourceTypes[A])throw new Error('Worker source with name "'+A+'" already registered.');T.workerSourceTypes[A]=M;},this.self.registerRTLTextPlugin=function(A){if(u.plugin.isParsed())throw new Error("RTL text plugin already registered.");u.plugin.applyArabicShaping=A.applyArabicShaping,u.plugin.processBidirectionalText=A.processBidirectionalText,u.plugin.processStyledBidirectionalText=A.processStyledBidirectionalText;};};return Re.prototype.setReferrer=function(w,T){this.referrer=T;},Re.prototype.setImages=function(w,T,A){for(var M in this.availableImages[w]=T,this.workerSources[w]){var O=this.workerSources[w][M];for(var Z in O)O[Z].availableImages=T;}A();},Re.prototype.setLayers=function(w,T,A){this.getLayerIndex(w).replace(T),A();},Re.prototype.updateLayers=function(w,T,A){this.getLayerIndex(w).update(T.layers,T.removedIds),A();},Re.prototype.loadTile=function(w,T,A){this.getWorkerSource(w,T.type,T.source).loadTile(T,A);},Re.prototype.loadDEMTile=function(w,T,A){this.getDEMWorkerSource(w,T.source).loadTile(T,A);},Re.prototype.reloadTile=function(w,T,A){this.getWorkerSource(w,T.type,T.source).reloadTile(T,A);},Re.prototype.abortTile=function(w,T,A){this.getWorkerSource(w,T.type,T.source).abortTile(T,A);},Re.prototype.removeTile=function(w,T,A){this.getWorkerSource(w,T.type,T.source).removeTile(T,A);},Re.prototype.removeDEMTile=function(w,T){this.getDEMWorkerSource(w,T.source).removeTile(T);},Re.prototype.removeSource=function(w,T,A){if(this.workerSources[w]&&this.workerSources[w][T.type]&&this.workerSources[w][T.type][T.source]){var M=this.workerSources[w][T.type][T.source];delete this.workerSources[w][T.type][T.source],M.removeSource!==void 0?M.removeSource(T,A):A();}},Re.prototype.loadWorkerSource=function(w,T,A){try{this.self.importScripts(T.url),A();}catch(M){A(M.toString());}},Re.prototype.syncRTLPluginState=function(w,T,A){try{u.plugin.setState(T);var M=u.plugin.getPluginURL();if(u.plugin.isLoaded()&&!u.plugin.isParsed()&&M!=null){this.self.importScripts(M);var O=u.plugin.isParsed();A(O?void 0:new Error("RTL Text Plugin failed to import scripts from "+M),O);}}catch(Z){A(Z.toString());}},Re.prototype.getAvailableImages=function(w){var T=this.availableImages[w];return T||(T=[]),T},Re.prototype.getLayerIndex=function(w){var T=this.layerIndexes[w];return T||(T=this.layerIndexes[w]=new tr),T},Re.prototype.getWorkerSource=function(w,T,A){var M=this;return this.workerSources[w]||(this.workerSources[w]={}),this.workerSources[w][T]||(this.workerSources[w][T]={}),this.workerSources[w][T][A]||(this.workerSources[w][T][A]=new this.workerSourceTypes[T]({send:function(O,Z,X){M.actor.send(O,Z,X,w);}},this.getLayerIndex(w),this.getAvailableImages(w))),this.workerSources[w][T][A]},Re.prototype.getDEMWorkerSource=function(w,T){return this.demWorkerSources[w]||(this.demWorkerSources[w]={}),this.demWorkerSources[w][T]||(this.demWorkerSources[w][T]=new Lr),this.demWorkerSources[w][T]},Re.prototype.enforceCacheSizeLimit=function(w,T){u.enforceCacheSizeLimit(T);},typeof WorkerGlobalScope!="undefined"&&typeof self!="undefined"&&self instanceof WorkerGlobalScope&&(self.worker=new Re(self)),Re}),zu(["./shared"],function(u){var Zr=u.createCommonjsModule(function(i){function o(p){return !n(p)}function n(p){return typeof window=="undefined"||typeof document=="undefined"?"not a browser":Array.prototype&&Array.prototype.every&&Array.prototype.filter&&Array.prototype.forEach&&Array.prototype.indexOf&&Array.prototype.lastIndexOf&&Array.prototype.map&&Array.prototype.some&&Array.prototype.reduce&&Array.prototype.reduceRight&&Array.isArray?Function.prototype&&Function.prototype.bind?Object.keys&&Object.create&&Object.getPrototypeOf&&Object.getOwnPropertyNames&&Object.isSealed&&Object.isFrozen&&Object.isExtensible&&Object.getOwnPropertyDescriptor&&Object.defineProperty&&Object.defineProperties&&Object.seal&&Object.freeze&&Object.preventExtensions?"JSON"in window&&"parse"in JSON&&"stringify"in JSON?function(){if(!("Worker"in window&&"Blob"in window&&"URL"in window))return !1;var d,y,v=new Blob([""],{type:"text/javascript"}),S=URL.createObjectURL(v);try{y=new Worker(S),d=!0;}catch(P){d=!1;}return y&&y.terminate(),URL.revokeObjectURL(S),d}()?"Uint8ClampedArray"in window?ArrayBuffer.isView?function(){var d=document.createElement("canvas");d.width=d.height=1;var y=d.getContext("2d");if(!y)return !1;var v=y.getImageData(0,0,1,1);return v&&v.width===d.width}()?(s[f=p&&p.failIfMajorPerformanceCaveat]===void 0&&(s[f]=function(d){var y=function(S){var P=document.createElement("canvas"),z=Object.create(o.webGLContextAttributes);return z.failIfMajorPerformanceCaveat=S,P.probablySupportsContext?P.probablySupportsContext("webgl",z)||P.probablySupportsContext("experimental-webgl",z):P.supportsContext?P.supportsContext("webgl",z)||P.supportsContext("experimental-webgl",z):P.getContext("webgl",z)||P.getContext("experimental-webgl",z)}(d);if(!y)return !1;var v=y.createShader(y.VERTEX_SHADER);return !(!v||y.isContextLost())&&(y.shaderSource(v,"void main() {}"),y.compileShader(v),y.getShaderParameter(v,y.COMPILE_STATUS)===!0)}(f)),s[f]?void 0:"insufficient WebGL support"):"insufficient Canvas/getImageData support":"insufficient ArrayBuffer support":"insufficient Uint8ClampedArray support":"insufficient worker support":"insufficient JSON support":"insufficient Object support":"insufficient Function support":"insufficent Array support";var f;}i.exports?i.exports=o:window&&(window.mapboxgl=window.mapboxgl||{},window.mapboxgl.supported=o,window.mapboxgl.notSupportedReason=n);var s={};o.webGLContextAttributes={antialias:!1,alpha:!0,stencil:!0,depth:!0};}),ct={create:function(i,o,n){var s=u.window.document.createElement(i);return o!==void 0&&(s.className=o),n&&n.appendChild(s),s},createNS:function(i,o){return u.window.document.createElementNS(i,o)}},tr=u.window.document&&u.window.document.documentElement.style;function jt(i){if(!tr)return i[0];for(var o=0;o<i.length;o++)if(i[o]in tr)return i[o];return i[0]}var Ti,Pt=jt(["userSelect","MozUserSelect","WebkitUserSelect","msUserSelect"]);ct.disableDrag=function(){tr&&Pt&&(Ti=tr[Pt],tr[Pt]="none");},ct.enableDrag=function(){tr&&Pt&&(tr[Pt]=Ti);};var vs=jt(["transform","WebkitTransform"]);ct.setTransform=function(i,o){i.style[vs]=o;};var Jr=!1;try{var bn=Object.defineProperty({},"passive",{get:function(){Jr=!0;}});u.window.addEventListener("test",bn,bn),u.window.removeEventListener("test",bn,bn);}catch(i){Jr=!1;}ct.addEventListener=function(i,o,n,s){s===void 0&&(s={}),i.addEventListener(o,n,"passive"in s&&Jr?s:s.capture);},ct.removeEventListener=function(i,o,n,s){s===void 0&&(s={}),i.removeEventListener(o,n,"passive"in s&&Jr?s:s.capture);};var Lr=function(i){i.preventDefault(),i.stopPropagation(),u.window.removeEventListener("click",Lr,!0);};function Mo(i){var o=i.userImage;return !!(o&&o.render&&o.render())&&(i.data.replace(new Uint8Array(o.data.buffer)),!0)}ct.suppressClick=function(){u.window.addEventListener("click",Lr,!0),u.window.setTimeout(function(){u.window.removeEventListener("click",Lr,!0);},0);},ct.mousePos=function(i,o){var n=i.getBoundingClientRect();return new u.Point(o.clientX-n.left-i.clientLeft,o.clientY-n.top-i.clientTop)},ct.touchPos=function(i,o){for(var n=i.getBoundingClientRect(),s=[],p=0;p<o.length;p++)s.push(new u.Point(o[p].clientX-n.left-i.clientLeft,o[p].clientY-n.top-i.clientTop));return s},ct.mouseButton=function(i){return u.window.InstallTrigger!==void 0&&i.button===2&&i.ctrlKey&&u.window.navigator.platform.toUpperCase().indexOf("MAC")>=0?0:i.button},ct.remove=function(i){i.parentNode&&i.parentNode.removeChild(i);};var lr=function(i){function o(){i.call(this),this.images={},this.updatedImages={},this.callbackDispatchedThisFrame={},this.loaded=!1,this.requestors=[],this.patterns={},this.atlasImage=new u.RGBAImage({width:1,height:1}),this.dirty=!0;}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.isLoaded=function(){return this.loaded},o.prototype.setLoaded=function(n){if(this.loaded!==n&&(this.loaded=n,n)){for(var s=0,p=this.requestors;s<p.length;s+=1){var f=p[s];this._notify(f.ids,f.callback);}this.requestors=[];}},o.prototype.getImage=function(n){return this.images[n]},o.prototype.addImage=function(n,s){this._validate(n,s)&&(this.images[n]=s);},o.prototype._validate=function(n,s){var p=!0;return this._validateStretch(s.stretchX,s.data&&s.data.width)||(this.fire(new u.ErrorEvent(new Error('Image "'+n+'" has invalid "stretchX" value'))),p=!1),this._validateStretch(s.stretchY,s.data&&s.data.height)||(this.fire(new u.ErrorEvent(new Error('Image "'+n+'" has invalid "stretchY" value'))),p=!1),this._validateContent(s.content,s)||(this.fire(new u.ErrorEvent(new Error('Image "'+n+'" has invalid "content" value'))),p=!1),p},o.prototype._validateStretch=function(n,s){if(!n)return !0;for(var p=0,f=0,d=n;f<d.length;f+=1){var y=d[f];if(y[0]<p||y[1]<y[0]||s<y[1])return !1;p=y[1];}return !0},o.prototype._validateContent=function(n,s){return !(n&&(n.length!==4||n[0]<0||s.data.width<n[0]||n[1]<0||s.data.height<n[1]||n[2]<0||s.data.width<n[2]||n[3]<0||s.data.height<n[3]||n[2]<n[0]||n[3]<n[1]))},o.prototype.updateImage=function(n,s){s.version=this.images[n].version+1,this.images[n]=s,this.updatedImages[n]=!0;},o.prototype.removeImage=function(n){var s=this.images[n];delete this.images[n],delete this.patterns[n],s.userImage&&s.userImage.onRemove&&s.userImage.onRemove();},o.prototype.listImages=function(){return Object.keys(this.images)},o.prototype.getImages=function(n,s){var p=!0;if(!this.isLoaded())for(var f=0,d=n;f<d.length;f+=1)this.images[d[f]]||(p=!1);this.isLoaded()||p?this._notify(n,s):this.requestors.push({ids:n,callback:s});},o.prototype._notify=function(n,s){for(var p={},f=0,d=n;f<d.length;f+=1){var y=d[f];this.images[y]||this.fire(new u.Event("styleimagemissing",{id:y}));var v=this.images[y];v?p[y]={data:v.data.clone(),pixelRatio:v.pixelRatio,sdf:v.sdf,version:v.version,stretchX:v.stretchX,stretchY:v.stretchY,content:v.content,hasRenderCallback:Boolean(v.userImage&&v.userImage.render)}:u.warnOnce('Image "'+y+'" could not be loaded. Please make sure you have added the image with map.addImage() or a "sprite" property in your style. You can provide missing images by listening for the "styleimagemissing" map event.');}s(null,p);},o.prototype.getPixelSize=function(){var n=this.atlasImage;return {width:n.width,height:n.height}},o.prototype.getPattern=function(n){var s=this.patterns[n],p=this.getImage(n);if(!p)return null;if(s&&s.position.version===p.version)return s.position;if(s)s.position.version=p.version;else {var f={w:p.data.width+2,h:p.data.height+2,x:0,y:0},d=new u.ImagePosition(f,p);this.patterns[n]={bin:f,position:d};}return this._updatePatternAtlas(),this.patterns[n].position},o.prototype.bind=function(n){var s=n.gl;this.atlasTexture?this.dirty&&(this.atlasTexture.update(this.atlasImage),this.dirty=!1):this.atlasTexture=new u.Texture(n,this.atlasImage,s.RGBA),this.atlasTexture.bind(s.LINEAR,s.CLAMP_TO_EDGE);},o.prototype._updatePatternAtlas=function(){var n=[];for(var s in this.patterns)n.push(this.patterns[s].bin);var p=u.potpack(n),f=p.w,d=p.h,y=this.atlasImage;for(var v in y.resize({width:f||1,height:d||1}),this.patterns){var S=this.patterns[v].bin,P=S.x+1,z=S.y+1,k=this.images[v].data,F=k.width,R=k.height;u.RGBAImage.copy(k,y,{x:0,y:0},{x:P,y:z},{width:F,height:R}),u.RGBAImage.copy(k,y,{x:0,y:R-1},{x:P,y:z-1},{width:F,height:1}),u.RGBAImage.copy(k,y,{x:0,y:0},{x:P,y:z+R},{width:F,height:1}),u.RGBAImage.copy(k,y,{x:F-1,y:0},{x:P-1,y:z},{width:1,height:R}),u.RGBAImage.copy(k,y,{x:0,y:0},{x:P+F,y:z},{width:1,height:R});}this.dirty=!0;},o.prototype.beginFrame=function(){this.callbackDispatchedThisFrame={};},o.prototype.dispatchRenderCallbacks=function(n){for(var s=0,p=n;s<p.length;s+=1){var f=p[s];if(!this.callbackDispatchedThisFrame[f]){this.callbackDispatchedThisFrame[f]=!0;var d=this.images[f];Mo(d)&&this.updateImage(f,d);}}},o}(u.Evented),ga=eo,to=eo,Bi=1e20;function eo(i,o,n,s,p,f){this.fontSize=i||24,this.buffer=o===void 0?3:o,this.cutoff=s||.25,this.fontFamily=p||"sans-serif",this.fontWeight=f||"normal",this.radius=n||8;var d=this.size=this.fontSize+2*this.buffer;this.canvas=document.createElement("canvas"),this.canvas.width=this.canvas.height=d,this.ctx=this.canvas.getContext("2d"),this.ctx.font=this.fontWeight+" "+this.fontSize+"px "+this.fontFamily,this.ctx.textBaseline="middle",this.ctx.fillStyle="black",this.gridOuter=new Float64Array(d*d),this.gridInner=new Float64Array(d*d),this.f=new Float64Array(d),this.d=new Float64Array(d),this.z=new Float64Array(d+1),this.v=new Int16Array(d),this.middle=Math.round(d/2*(navigator.userAgent.indexOf("Gecko/")>=0?1.2:1));}function ro(i,o,n,s,p,f,d){for(var y=0;y<o;y++){for(var v=0;v<n;v++)s[v]=i[v*o+y];for(wn(s,p,f,d,n),v=0;v<n;v++)i[v*o+y]=p[v];}for(v=0;v<n;v++){for(y=0;y<o;y++)s[y]=i[v*o+y];for(wn(s,p,f,d,o),y=0;y<o;y++)i[v*o+y]=Math.sqrt(p[y]);}}function wn(i,o,n,s,p){n[0]=0,s[0]=-Bi,s[1]=+Bi;for(var f=1,d=0;f<p;f++){for(var y=(i[f]+f*f-(i[n[d]]+n[d]*n[d]))/(2*f-2*n[d]);y<=s[d];)d--,y=(i[f]+f*f-(i[n[d]]+n[d]*n[d]))/(2*f-2*n[d]);n[++d]=f,s[d]=y,s[d+1]=+Bi;}for(f=0,d=0;f<p;f++){for(;s[d+1]<f;)d++;o[f]=(f-n[d])*(f-n[d])+i[n[d]];}}eo.prototype.draw=function(i){this.ctx.clearRect(0,0,this.size,this.size),this.ctx.fillText(i,this.buffer,this.middle);for(var o=this.ctx.getImageData(0,0,this.size,this.size),n=new Uint8ClampedArray(this.size*this.size),s=0;s<this.size*this.size;s++){var p=o.data[4*s+3]/255;this.gridOuter[s]=p===1?0:p===0?Bi:Math.pow(Math.max(0,.5-p),2),this.gridInner[s]=p===1?Bi:p===0?0:Math.pow(Math.max(0,p-.5),2);}for(ro(this.gridOuter,this.size,this.size,this.f,this.d,this.v,this.z),ro(this.gridInner,this.size,this.size,this.f,this.d,this.v,this.z),s=0;s<this.size*this.size;s++)n[s]=Math.max(0,Math.min(255,Math.round(255-255*((this.gridOuter[s]-this.gridInner[s])/this.radius+this.cutoff))));return n},ga.default=to;var yr=function(i,o){this.requestManager=i,this.localIdeographFontFamily=o,this.entries={};};yr.prototype.setURL=function(i){this.url=i;},yr.prototype.getGlyphs=function(i,o){var n=this,s=[];for(var p in i)for(var f=0,d=i[p];f<d.length;f+=1)s.push({stack:p,id:d[f]});u.asyncAll(s,function(y,v){var S=y.stack,P=y.id,z=n.entries[S];z||(z=n.entries[S]={glyphs:{},requests:{},ranges:{}});var k=z.glyphs[P];if(k===void 0){if(k=n._tinySDF(z,S,P))return z.glyphs[P]=k,void v(null,{stack:S,id:P,glyph:k});var F=Math.floor(P/256);if(256*F>65535)v(new Error("glyphs > 65535 not supported"));else if(z.ranges[F])v(null,{stack:S,id:P,glyph:k});else {var R=z.requests[F];R||(R=z.requests[F]=[],yr.loadGlyphRange(S,F,n.url,n.requestManager,function(j,D){if(D){for(var N in D)n._doesCharSupportLocalGlyph(+N)||(z.glyphs[+N]=D[+N]);z.ranges[F]=!0;}for(var G=0,K=R;G<K.length;G+=1)(0, K[G])(j,D);delete z.requests[F];})),R.push(function(j,D){j?v(j):D&&v(null,{stack:S,id:P,glyph:D[P]||null});});}}else v(null,{stack:S,id:P,glyph:k});},function(y,v){if(y)o(y);else if(v){for(var S={},P=0,z=v;P<z.length;P+=1){var k=z[P],F=k.stack,R=k.id,j=k.glyph;(S[F]||(S[F]={}))[R]=j&&{id:j.id,bitmap:j.bitmap.clone(),metrics:j.metrics};}o(null,S);}});},yr.prototype._doesCharSupportLocalGlyph=function(i){return !!this.localIdeographFontFamily&&(u.isChar["CJK Unified Ideographs"](i)||u.isChar["Hangul Syllables"](i)||u.isChar.Hiragana(i)||u.isChar.Katakana(i))},yr.prototype._tinySDF=function(i,o,n){var s=this.localIdeographFontFamily;if(s&&this._doesCharSupportLocalGlyph(n)){var p=i.tinySDF;if(!p){var f="400";/bold/i.test(o)?f="900":/medium/i.test(o)?f="500":/light/i.test(o)&&(f="200"),p=i.tinySDF=new yr.TinySDF(24,3,8,.25,s,f);}return {id:n,bitmap:new u.AlphaImage({width:30,height:30},p.draw(String.fromCharCode(n))),metrics:{width:24,height:24,left:0,top:-8,advance:24}}}},yr.loadGlyphRange=function(i,o,n,s,p){var f=256*o,d=f+255,y=s.transformRequest(s.normalizeGlyphsURL(n).replace("{fontstack}",i).replace("{range}",f+"-"+d),u.ResourceType.Glyphs);u.getArrayBuffer(y,function(v,S){if(v)p(v);else if(S){for(var P={},z=0,k=u.parseGlyphPBF(S);z<k.length;z+=1){var F=k[z];P[F.id]=F;}p(null,P);}});},yr.TinySDF=ga;var Ri=function(){this.specification=u.styleSpec.light.position;};Ri.prototype.possiblyEvaluate=function(i,o){return u.sphericalToCartesian(i.expression.evaluate(o))},Ri.prototype.interpolate=function(i,o,n){return {x:u.number(i.x,o.x,n),y:u.number(i.y,o.y,n),z:u.number(i.z,o.z,n)}};var pi=new u.Properties({anchor:new u.DataConstantProperty(u.styleSpec.light.anchor),position:new Ri,color:new u.DataConstantProperty(u.styleSpec.light.color),intensity:new u.DataConstantProperty(u.styleSpec.light.intensity)}),io=function(i){function o(n){i.call(this),this._transitionable=new u.Transitionable(pi),this.setLight(n),this._transitioning=this._transitionable.untransitioned();}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getLight=function(){return this._transitionable.serialize()},o.prototype.setLight=function(n,s){if(s===void 0&&(s={}),!this._validate(u.validateLight,n,s))for(var p in n){var f=n[p];u.endsWith(p,"-transition")?this._transitionable.setTransition(p.slice(0,-"-transition".length),f):this._transitionable.setValue(p,f);}},o.prototype.updateTransitions=function(n){this._transitioning=this._transitionable.transitioned(n,this._transitioning);},o.prototype.hasTransition=function(){return this._transitioning.hasTransition()},o.prototype.recalculate=function(n){this.properties=this._transitioning.possiblyEvaluate(n);},o.prototype._validate=function(n,s,p){return (!p||p.validate!==!1)&&u.emitValidationErrors(this,n.call(u.validateStyle,u.extend({value:s,style:{glyphs:!0,sprite:!0},styleSpec:u.styleSpec})))},o}(u.Evented),Me=function(i,o){this.width=i,this.height=o,this.nextRow=0,this.data=new Uint8Array(this.width*this.height),this.dashEntry={};};Me.prototype.getDash=function(i,o){var n=i.join(",")+String(o);return this.dashEntry[n]||(this.dashEntry[n]=this.addDash(i,o)),this.dashEntry[n]},Me.prototype.getDashRanges=function(i,o,n){var s=[],p=i.length%2==1?-i[i.length-1]*n:0,f=i[0]*n,d=!0;s.push({left:p,right:f,isDash:d,zeroLength:i[0]===0});for(var y=i[0],v=1;v<i.length;v++){var S=i[v];s.push({left:p=y*n,right:f=(y+=S)*n,isDash:d=!d,zeroLength:S===0});}return s},Me.prototype.addRoundDash=function(i,o,n){for(var s=o/2,p=-n;p<=n;p++)for(var f=this.width*(this.nextRow+n+p),d=0,y=i[d],v=0;v<this.width;v++){v/y.right>1&&(y=i[++d]);var S=Math.abs(v-y.left),P=Math.abs(v-y.right),z=Math.min(S,P),k=void 0,F=p/n*(s+1);if(y.isDash){var R=s-Math.abs(F);k=Math.sqrt(z*z+R*R);}else k=s-Math.sqrt(z*z+F*F);this.data[f+v]=Math.max(0,Math.min(255,k+128));}},Me.prototype.addRegularDash=function(i){for(var o=i.length-1;o>=0;--o){var n=i[o],s=i[o+1];n.zeroLength?i.splice(o,1):s&&s.isDash===n.isDash&&(s.left=n.left,i.splice(o,1));}var p=i[0],f=i[i.length-1];p.isDash===f.isDash&&(p.left=f.left-this.width,f.right=p.right+this.width);for(var d=this.width*this.nextRow,y=0,v=i[y],S=0;S<this.width;S++){S/v.right>1&&(v=i[++y]);var P=Math.abs(S-v.left),z=Math.abs(S-v.right),k=Math.min(P,z);this.data[d+S]=Math.max(0,Math.min(255,(v.isDash?k:-k)+128));}},Me.prototype.addDash=function(i,o){var n=o?7:0,s=2*n+1;if(this.nextRow+s>this.height)return u.warnOnce("LineAtlas out of space"),null;for(var p=0,f=0;f<i.length;f++)p+=i[f];if(p!==0){var d=this.width/p,y=this.getDashRanges(i,this.width,d);o?this.addRoundDash(y,d,n):this.addRegularDash(y);}var v={y:(this.nextRow+n+.5)/this.height,height:2*n/this.height,width:p};return this.nextRow+=s,this.dirty=!0,v},Me.prototype.bind=function(i){var o=i.gl;this.texture?(o.bindTexture(o.TEXTURE_2D,this.texture),this.dirty&&(this.dirty=!1,o.texSubImage2D(o.TEXTURE_2D,0,0,0,this.width,this.height,o.ALPHA,o.UNSIGNED_BYTE,this.data))):(this.texture=o.createTexture(),o.bindTexture(o.TEXTURE_2D,this.texture),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.REPEAT),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.REPEAT),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.LINEAR),o.texImage2D(o.TEXTURE_2D,0,o.ALPHA,this.width,this.height,0,o.ALPHA,o.UNSIGNED_BYTE,this.data));};var Br=function i(o,n){this.workerPool=o,this.actors=[],this.currentActor=0,this.id=u.uniqueId();for(var s=this.workerPool.acquire(this.id),p=0;p<s.length;p++){var f=new i.Actor(s[p],n,this.id);f.name="Worker "+p,this.actors.push(f);}};function _a(i,o,n){var s=function(p,f){if(p)return n(p);if(f){var d=u.pick(u.extend(f,i),["tiles","minzoom","maxzoom","attribution","mapbox_logo","bounds","scheme","tileSize","encoding"]);f.vector_layers&&(d.vectorLayers=f.vector_layers,d.vectorLayerIds=d.vectorLayers.map(function(y){return y.id})),d.tiles=o.canonicalizeTileset(d,i.url),n(null,d);}};return i.url?u.getJSON(o.transformRequest(o.normalizeSourceURL(i.url),u.ResourceType.Source),s):u.browser.frame(function(){return s(null,i)})}Br.prototype.broadcast=function(i,o,n){u.asyncAll(this.actors,function(s,p){s.send(i,o,p);},n=n||function(){});},Br.prototype.getActor=function(){return this.currentActor=(this.currentActor+1)%this.actors.length,this.actors[this.currentActor]},Br.prototype.remove=function(){this.actors.forEach(function(i){i.remove();}),this.actors=[],this.workerPool.release(this.id);},Br.Actor=u.Actor;var hi=function(i,o,n){this.bounds=u.LngLatBounds.convert(this.validateBounds(i)),this.minzoom=o||0,this.maxzoom=n||24;};hi.prototype.validateBounds=function(i){return Array.isArray(i)&&i.length===4?[Math.max(-180,i[0]),Math.max(-90,i[1]),Math.min(180,i[2]),Math.min(90,i[3])]:[-180,-90,180,90]},hi.prototype.contains=function(i){var o=Math.pow(2,i.z),n=Math.floor(u.mercatorXfromLng(this.bounds.getWest())*o),s=Math.floor(u.mercatorYfromLat(this.bounds.getNorth())*o),p=Math.ceil(u.mercatorXfromLng(this.bounds.getEast())*o),f=Math.ceil(u.mercatorYfromLat(this.bounds.getSouth())*o);return i.x>=n&&i.x<p&&i.y>=s&&i.y<f};var no=function(i){function o(n,s,p,f){if(i.call(this),this.id=n,this.dispatcher=p,this.type="vector",this.minzoom=0,this.maxzoom=22,this.scheme="xyz",this.tileSize=512,this.reparseOverscaled=!0,this.isTileClipped=!0,this._loaded=!1,u.extend(this,u.pick(s,["url","scheme","tileSize","promoteId"])),this._options=u.extend({type:"vector"},s),this._collectResourceTiming=s.collectResourceTiming,this.tileSize!==512)throw new Error("vector tile sources must have a tileSize of 512");this.setEventedParent(f);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.load=function(){var n=this;this._loaded=!1,this.fire(new u.Event("dataloading",{dataType:"source"})),this._tileJSONRequest=_a(this._options,this.map._requestManager,function(s,p){n._tileJSONRequest=null,n._loaded=!0,s?n.fire(new u.ErrorEvent(s)):p&&(u.extend(n,p),p.bounds&&(n.tileBounds=new hi(p.bounds,n.minzoom,n.maxzoom)),u.postTurnstileEvent(p.tiles,n.map._requestManager._customAccessToken),u.postMapLoadEvent(p.tiles,n.map._getMapId(),n.map._requestManager._skuToken,n.map._requestManager._customAccessToken),n.fire(new u.Event("data",{dataType:"source",sourceDataType:"metadata"})),n.fire(new u.Event("data",{dataType:"source",sourceDataType:"content"})));});},o.prototype.loaded=function(){return this._loaded},o.prototype.hasTile=function(n){return !this.tileBounds||this.tileBounds.contains(n.canonical)},o.prototype.onAdd=function(n){this.map=n,this.load();},o.prototype.setSourceProperty=function(n){this._tileJSONRequest&&this._tileJSONRequest.cancel(),n(),this.map.style.sourceCaches[this.id].clearTiles(),this.load();},o.prototype.setTiles=function(n){var s=this;return this.setSourceProperty(function(){s._options.tiles=n;}),this},o.prototype.setUrl=function(n){var s=this;return this.setSourceProperty(function(){s.url=n,s._options.url=n;}),this},o.prototype.onRemove=function(){this._tileJSONRequest&&(this._tileJSONRequest.cancel(),this._tileJSONRequest=null);},o.prototype.serialize=function(){return u.extend({},this._options)},o.prototype.loadTile=function(n,s){var p=this.map._requestManager.normalizeTileURL(n.tileID.canonical.url(this.tiles,this.scheme)),f={request:this.map._requestManager.transformRequest(p,u.ResourceType.Tile),uid:n.uid,tileID:n.tileID,zoom:n.tileID.overscaledZ,tileSize:this.tileSize*n.tileID.overscaleFactor(),type:this.type,source:this.id,pixelRatio:u.browser.devicePixelRatio,showCollisionBoxes:this.map.showCollisionBoxes,promoteId:this.promoteId};function d(y,v){return delete n.request,n.aborted?s(null):y&&y.status!==404?s(y):(v&&v.resourceTiming&&(n.resourceTiming=v.resourceTiming),this.map._refreshExpiredTiles&&v&&n.setExpiryData(v),n.loadVectorData(v,this.map.painter),u.cacheEntryPossiblyAdded(this.dispatcher),s(null),void(n.reloadCallback&&(this.loadTile(n,n.reloadCallback),n.reloadCallback=null)))}f.request.collectResourceTiming=this._collectResourceTiming,n.actor&&n.state!=="expired"?n.state==="loading"?n.reloadCallback=s:n.request=n.actor.send("reloadTile",f,d.bind(this)):(n.actor=this.dispatcher.getActor(),n.request=n.actor.send("loadTile",f,d.bind(this)));},o.prototype.abortTile=function(n){n.request&&(n.request.cancel(),delete n.request),n.actor&&n.actor.send("abortTile",{uid:n.uid,type:this.type,source:this.id},void 0);},o.prototype.unloadTile=function(n){n.unloadVectorData(),n.actor&&n.actor.send("removeTile",{uid:n.uid,type:this.type,source:this.id},void 0);},o.prototype.hasTransition=function(){return !1},o}(u.Evented),oo=function(i){function o(n,s,p,f){i.call(this),this.id=n,this.dispatcher=p,this.setEventedParent(f),this.type="raster",this.minzoom=0,this.maxzoom=22,this.roundZoom=!0,this.scheme="xyz",this.tileSize=512,this._loaded=!1,this._options=u.extend({type:"raster"},s),u.extend(this,u.pick(s,["url","scheme","tileSize"]));}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.load=function(){var n=this;this._loaded=!1,this.fire(new u.Event("dataloading",{dataType:"source"})),this._tileJSONRequest=_a(this._options,this.map._requestManager,function(s,p){n._tileJSONRequest=null,n._loaded=!0,s?n.fire(new u.ErrorEvent(s)):p&&(u.extend(n,p),p.bounds&&(n.tileBounds=new hi(p.bounds,n.minzoom,n.maxzoom)),u.postTurnstileEvent(p.tiles),u.postMapLoadEvent(p.tiles,n.map._getMapId(),n.map._requestManager._skuToken),n.fire(new u.Event("data",{dataType:"source",sourceDataType:"metadata"})),n.fire(new u.Event("data",{dataType:"source",sourceDataType:"content"})));});},o.prototype.loaded=function(){return this._loaded},o.prototype.onAdd=function(n){this.map=n,this.load();},o.prototype.onRemove=function(){this._tileJSONRequest&&(this._tileJSONRequest.cancel(),this._tileJSONRequest=null);},o.prototype.serialize=function(){return u.extend({},this._options)},o.prototype.hasTile=function(n){return !this.tileBounds||this.tileBounds.contains(n.canonical)},o.prototype.loadTile=function(n,s){var p=this,f=this.map._requestManager.normalizeTileURL(n.tileID.canonical.url(this.tiles,this.scheme),this.tileSize);n.request=u.getImage(this.map._requestManager.transformRequest(f,u.ResourceType.Tile),function(d,y){if(delete n.request,n.aborted)n.state="unloaded",s(null);else if(d)n.state="errored",s(d);else if(y){p.map._refreshExpiredTiles&&n.setExpiryData(y),delete y.cacheControl,delete y.expires;var v=p.map.painter.context,S=v.gl;n.texture=p.map.painter.getTileTexture(y.width),n.texture?n.texture.update(y,{useMipmap:!0}):(n.texture=new u.Texture(v,y,S.RGBA,{useMipmap:!0}),n.texture.bind(S.LINEAR,S.CLAMP_TO_EDGE,S.LINEAR_MIPMAP_NEAREST),v.extTextureFilterAnisotropic&&S.texParameterf(S.TEXTURE_2D,v.extTextureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT,v.extTextureFilterAnisotropicMax)),n.state="loaded",u.cacheEntryPossiblyAdded(p.dispatcher),s(null);}});},o.prototype.abortTile=function(n,s){n.request&&(n.request.cancel(),delete n.request),s();},o.prototype.unloadTile=function(n,s){n.texture&&this.map.painter.saveTileTexture(n.texture),s();},o.prototype.hasTransition=function(){return !1},o}(u.Evented),va=function(i){function o(n,s,p,f){i.call(this,n,s,p,f),this.type="raster-dem",this.maxzoom=22,this._options=u.extend({type:"raster-dem"},s),this.encoding=s.encoding||"mapbox";}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.serialize=function(){return {type:"raster-dem",url:this.url,tileSize:this.tileSize,tiles:this.tiles,bounds:this.bounds,encoding:this.encoding}},o.prototype.loadTile=function(n,s){var p=this.map._requestManager.normalizeTileURL(n.tileID.canonical.url(this.tiles,this.scheme),this.tileSize);function f(d,y){d&&(n.state="errored",s(d)),y&&(n.dem=y,n.needsHillshadePrepare=!0,n.state="loaded",s(null));}n.request=u.getImage(this.map._requestManager.transformRequest(p,u.ResourceType.Tile),function(d,y){if(delete n.request,n.aborted)n.state="unloaded",s(null);else if(d)n.state="errored",s(d);else if(y){this.map._refreshExpiredTiles&&n.setExpiryData(y),delete y.cacheControl,delete y.expires;var v=u.window.ImageBitmap&&y instanceof u.window.ImageBitmap&&u.offscreenCanvasSupported()?y:u.browser.getImageData(y,1),S={uid:n.uid,coord:n.tileID,source:this.id,rawImageData:v,encoding:this.encoding};n.actor&&n.state!=="expired"||(n.actor=this.dispatcher.getActor(),n.actor.send("loadDEMTile",S,f.bind(this)));}}.bind(this)),n.neighboringTiles=this._getNeighboringTiles(n.tileID);},o.prototype._getNeighboringTiles=function(n){var s=n.canonical,p=Math.pow(2,s.z),f=(s.x-1+p)%p,d=s.x===0?n.wrap-1:n.wrap,y=(s.x+1+p)%p,v=s.x+1===p?n.wrap+1:n.wrap,S={};return S[new u.OverscaledTileID(n.overscaledZ,d,s.z,f,s.y).key]={backfilled:!1},S[new u.OverscaledTileID(n.overscaledZ,v,s.z,y,s.y).key]={backfilled:!1},s.y>0&&(S[new u.OverscaledTileID(n.overscaledZ,d,s.z,f,s.y-1).key]={backfilled:!1},S[new u.OverscaledTileID(n.overscaledZ,n.wrap,s.z,s.x,s.y-1).key]={backfilled:!1},S[new u.OverscaledTileID(n.overscaledZ,v,s.z,y,s.y-1).key]={backfilled:!1}),s.y+1<p&&(S[new u.OverscaledTileID(n.overscaledZ,d,s.z,f,s.y+1).key]={backfilled:!1},S[new u.OverscaledTileID(n.overscaledZ,n.wrap,s.z,s.x,s.y+1).key]={backfilled:!1},S[new u.OverscaledTileID(n.overscaledZ,v,s.z,y,s.y+1).key]={backfilled:!1}),S},o.prototype.unloadTile=function(n){n.demTexture&&this.map.painter.saveTileTexture(n.demTexture),n.fbo&&(n.fbo.destroy(),delete n.fbo),n.dem&&delete n.dem,delete n.neighboringTiles,n.state="unloaded",n.actor&&n.actor.send("removeDEMTile",{uid:n.uid,source:this.id});},o}(oo),Ki=function(i){function o(n,s,p,f){i.call(this),this.id=n,this.type="geojson",this.minzoom=0,this.maxzoom=18,this.tileSize=512,this.isTileClipped=!0,this.reparseOverscaled=!0,this._removed=!1,this._loaded=!1,this.actor=p.getActor(),this.setEventedParent(f),this._data=s.data,this._options=u.extend({},s),this._collectResourceTiming=s.collectResourceTiming,this._resourceTiming=[],s.maxzoom!==void 0&&(this.maxzoom=s.maxzoom),s.type&&(this.type=s.type),s.attribution&&(this.attribution=s.attribution),this.promoteId=s.promoteId;var d=u.EXTENT/this.tileSize;this.workerOptions=u.extend({source:this.id,cluster:s.cluster||!1,geojsonVtOptions:{buffer:(s.buffer!==void 0?s.buffer:128)*d,tolerance:(s.tolerance!==void 0?s.tolerance:.375)*d,extent:u.EXTENT,maxZoom:this.maxzoom,lineMetrics:s.lineMetrics||!1,generateId:s.generateId||!1},superclusterOptions:{maxZoom:s.clusterMaxZoom!==void 0?Math.min(s.clusterMaxZoom,this.maxzoom-1):this.maxzoom-1,minPoints:Math.max(2,s.clusterMinPoints||2),extent:u.EXTENT,radius:(s.clusterRadius||50)*d,log:!1,generateId:s.generateId||!1},clusterProperties:s.clusterProperties,filter:s.filter},s.workerOptions);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.load=function(){var n=this;this.fire(new u.Event("dataloading",{dataType:"source"})),this._updateWorkerData(function(s){if(s)n.fire(new u.ErrorEvent(s));else {var p={dataType:"source",sourceDataType:"metadata"};n._collectResourceTiming&&n._resourceTiming&&n._resourceTiming.length>0&&(p.resourceTiming=n._resourceTiming,n._resourceTiming=[]),n.fire(new u.Event("data",p));}});},o.prototype.onAdd=function(n){this.map=n,this.load();},o.prototype.setData=function(n){var s=this;return this._data=n,this.fire(new u.Event("dataloading",{dataType:"source"})),this._updateWorkerData(function(p){if(p)s.fire(new u.ErrorEvent(p));else {var f={dataType:"source",sourceDataType:"content"};s._collectResourceTiming&&s._resourceTiming&&s._resourceTiming.length>0&&(f.resourceTiming=s._resourceTiming,s._resourceTiming=[]),s.fire(new u.Event("data",f));}}),this},o.prototype.getClusterExpansionZoom=function(n,s){return this.actor.send("geojson.getClusterExpansionZoom",{clusterId:n,source:this.id},s),this},o.prototype.getClusterChildren=function(n,s){return this.actor.send("geojson.getClusterChildren",{clusterId:n,source:this.id},s),this},o.prototype.getClusterLeaves=function(n,s,p,f){return this.actor.send("geojson.getClusterLeaves",{source:this.id,clusterId:n,limit:s,offset:p},f),this},o.prototype._updateWorkerData=function(n){var s=this;this._loaded=!1;var p=u.extend({},this.workerOptions),f=this._data;typeof f=="string"?(p.request=this.map._requestManager.transformRequest(u.browser.resolveURL(f),u.ResourceType.Source),p.request.collectResourceTiming=this._collectResourceTiming):p.data=JSON.stringify(f),this.actor.send(this.type+".loadData",p,function(d,y){s._removed||y&&y.abandoned||(s._loaded=!0,y&&y.resourceTiming&&y.resourceTiming[s.id]&&(s._resourceTiming=y.resourceTiming[s.id].slice(0)),s.actor.send(s.type+".coalesce",{source:p.source},null),n(d));});},o.prototype.loaded=function(){return this._loaded},o.prototype.loadTile=function(n,s){var p=this,f=n.actor?"reloadTile":"loadTile";n.actor=this.actor,n.request=this.actor.send(f,{type:this.type,uid:n.uid,tileID:n.tileID,zoom:n.tileID.overscaledZ,maxZoom:this.maxzoom,tileSize:this.tileSize,source:this.id,pixelRatio:u.browser.devicePixelRatio,showCollisionBoxes:this.map.showCollisionBoxes,promoteId:this.promoteId},function(d,y){return delete n.request,n.unloadVectorData(),n.aborted?s(null):d?s(d):(n.loadVectorData(y,p.map.painter,f==="reloadTile"),s(null))});},o.prototype.abortTile=function(n){n.request&&(n.request.cancel(),delete n.request),n.aborted=!0;},o.prototype.unloadTile=function(n){n.unloadVectorData(),this.actor.send("removeTile",{uid:n.uid,type:this.type,source:this.id});},o.prototype.onRemove=function(){this._removed=!0,this.actor.send("removeSource",{type:this.type,source:this.id});},o.prototype.serialize=function(){return u.extend({},this._options,{type:this.type,data:this._data})},o.prototype.hasTransition=function(){return !1},o}(u.Evented),fi=u.createLayout([{name:"a_pos",type:"Int16",components:2},{name:"a_texture_pos",type:"Int16",components:2}]),Ii=function(i){function o(n,s,p,f){i.call(this),this.id=n,this.dispatcher=p,this.coordinates=s.coordinates,this.type="image",this.minzoom=0,this.maxzoom=22,this.tileSize=512,this.tiles={},this._loaded=!1,this.setEventedParent(f),this.options=s;}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.load=function(n,s){var p=this;this._loaded=!1,this.fire(new u.Event("dataloading",{dataType:"source"})),this.url=this.options.url,u.getImage(this.map._requestManager.transformRequest(this.url,u.ResourceType.Image),function(f,d){p._loaded=!0,f?p.fire(new u.ErrorEvent(f)):d&&(p.image=d,n&&(p.coordinates=n),s&&s(),p._finishLoading());});},o.prototype.loaded=function(){return this._loaded},o.prototype.updateImage=function(n){var s=this;return this.image&&n.url?(this.options.url=n.url,this.load(n.coordinates,function(){s.texture=null;}),this):this},o.prototype._finishLoading=function(){this.map&&(this.setCoordinates(this.coordinates),this.fire(new u.Event("data",{dataType:"source",sourceDataType:"metadata"})));},o.prototype.onAdd=function(n){this.map=n,this.load();},o.prototype.setCoordinates=function(n){var s=this;this.coordinates=n;var p=n.map(u.MercatorCoordinate.fromLngLat);this.tileID=function(d){for(var y=1/0,v=1/0,S=-1/0,P=-1/0,z=0,k=d;z<k.length;z+=1){var F=k[z];y=Math.min(y,F.x),v=Math.min(v,F.y),S=Math.max(S,F.x),P=Math.max(P,F.y);}var R=Math.max(S-y,P-v),j=Math.max(0,Math.floor(-Math.log(R)/Math.LN2)),D=Math.pow(2,j);return new u.CanonicalTileID(j,Math.floor((y+S)/2*D),Math.floor((v+P)/2*D))}(p),this.minzoom=this.maxzoom=this.tileID.z;var f=p.map(function(d){return s.tileID.getTilePoint(d)._round()});return this._boundsArray=new u.StructArrayLayout4i8,this._boundsArray.emplaceBack(f[0].x,f[0].y,0,0),this._boundsArray.emplaceBack(f[1].x,f[1].y,u.EXTENT,0),this._boundsArray.emplaceBack(f[3].x,f[3].y,0,u.EXTENT),this._boundsArray.emplaceBack(f[2].x,f[2].y,u.EXTENT,u.EXTENT),this.boundsBuffer&&(this.boundsBuffer.destroy(),delete this.boundsBuffer),this.fire(new u.Event("data",{dataType:"source",sourceDataType:"content"})),this},o.prototype.prepare=function(){if(Object.keys(this.tiles).length!==0&&this.image){var n=this.map.painter.context,s=n.gl;for(var p in this.boundsBuffer||(this.boundsBuffer=n.createVertexBuffer(this._boundsArray,fi.members)),this.boundsSegments||(this.boundsSegments=u.SegmentVector.simpleSegment(0,0,4,2)),this.texture||(this.texture=new u.Texture(n,this.image,s.RGBA),this.texture.bind(s.LINEAR,s.CLAMP_TO_EDGE)),this.tiles){var f=this.tiles[p];f.state!=="loaded"&&(f.state="loaded",f.texture=this.texture);}}},o.prototype.loadTile=function(n,s){this.tileID&&this.tileID.equals(n.tileID.canonical)?(this.tiles[String(n.tileID.wrap)]=n,n.buckets={},s(null)):(n.state="errored",s(null));},o.prototype.serialize=function(){return {type:"image",url:this.options.url,coordinates:this.coordinates}},o.prototype.hasTransition=function(){return !1},o}(u.Evented),Sn=function(i){function o(n,s,p,f){i.call(this,n,s,p,f),this.roundZoom=!0,this.type="video",this.options=s;}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.load=function(){var n=this;this._loaded=!1;var s=this.options;this.urls=[];for(var p=0,f=s.urls;p<f.length;p+=1)this.urls.push(this.map._requestManager.transformRequest(f[p],u.ResourceType.Source).url);u.getVideo(this.urls,function(d,y){n._loaded=!0,d?n.fire(new u.ErrorEvent(d)):y&&(n.video=y,n.video.loop=!0,n.video.addEventListener("playing",function(){n.map.triggerRepaint();}),n.map&&n.video.play(),n._finishLoading());});},o.prototype.pause=function(){this.video&&this.video.pause();},o.prototype.play=function(){this.video&&this.video.play();},o.prototype.seek=function(n){if(this.video){var s=this.video.seekable;n<s.start(0)||n>s.end(0)?this.fire(new u.ErrorEvent(new u.ValidationError("sources."+this.id,null,"Playback for this video can be set only between the "+s.start(0)+" and "+s.end(0)+"-second mark."))):this.video.currentTime=n;}},o.prototype.getVideo=function(){return this.video},o.prototype.onAdd=function(n){this.map||(this.map=n,this.load(),this.video&&(this.video.play(),this.setCoordinates(this.coordinates)));},o.prototype.prepare=function(){if(!(Object.keys(this.tiles).length===0||this.video.readyState<2)){var n=this.map.painter.context,s=n.gl;for(var p in this.boundsBuffer||(this.boundsBuffer=n.createVertexBuffer(this._boundsArray,fi.members)),this.boundsSegments||(this.boundsSegments=u.SegmentVector.simpleSegment(0,0,4,2)),this.texture?this.video.paused||(this.texture.bind(s.LINEAR,s.CLAMP_TO_EDGE),s.texSubImage2D(s.TEXTURE_2D,0,0,0,s.RGBA,s.UNSIGNED_BYTE,this.video)):(this.texture=new u.Texture(n,this.video,s.RGBA),this.texture.bind(s.LINEAR,s.CLAMP_TO_EDGE)),this.tiles){var f=this.tiles[p];f.state!=="loaded"&&(f.state="loaded",f.texture=this.texture);}}},o.prototype.serialize=function(){return {type:"video",urls:this.urls,coordinates:this.coordinates}},o.prototype.hasTransition=function(){return this.video&&!this.video.paused},o}(Ii),Tn=function(i){function o(n,s,p,f){i.call(this,n,s,p,f),s.coordinates?Array.isArray(s.coordinates)&&s.coordinates.length===4&&!s.coordinates.some(function(d){return !Array.isArray(d)||d.length!==2||d.some(function(y){return typeof y!="number"})})||this.fire(new u.ErrorEvent(new u.ValidationError("sources."+n,null,'"coordinates" property must be an array of 4 longitude/latitude array pairs'))):this.fire(new u.ErrorEvent(new u.ValidationError("sources."+n,null,'missing required property "coordinates"'))),s.animate&&typeof s.animate!="boolean"&&this.fire(new u.ErrorEvent(new u.ValidationError("sources."+n,null,'optional "animate" property must be a boolean value'))),s.canvas?typeof s.canvas=="string"||s.canvas instanceof u.window.HTMLCanvasElement||this.fire(new u.ErrorEvent(new u.ValidationError("sources."+n,null,'"canvas" must be either a string representing the ID of the canvas element from which to read, or an HTMLCanvasElement instance'))):this.fire(new u.ErrorEvent(new u.ValidationError("sources."+n,null,'missing required property "canvas"'))),this.options=s,this.animate=s.animate===void 0||s.animate;}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.load=function(){this._loaded=!0,this.canvas||(this.canvas=this.options.canvas instanceof u.window.HTMLCanvasElement?this.options.canvas:u.window.document.getElementById(this.options.canvas)),this.width=this.canvas.width,this.height=this.canvas.height,this._hasInvalidDimensions()?this.fire(new u.ErrorEvent(new Error("Canvas dimensions cannot be less than or equal to zero."))):(this.play=function(){this._playing=!0,this.map.triggerRepaint();},this.pause=function(){this._playing&&(this.prepare(),this._playing=!1);},this._finishLoading());},o.prototype.getCanvas=function(){return this.canvas},o.prototype.onAdd=function(n){this.map=n,this.load(),this.canvas&&this.animate&&this.play();},o.prototype.onRemove=function(){this.pause();},o.prototype.prepare=function(){var n=!1;if(this.canvas.width!==this.width&&(this.width=this.canvas.width,n=!0),this.canvas.height!==this.height&&(this.height=this.canvas.height,n=!0),!this._hasInvalidDimensions()&&Object.keys(this.tiles).length!==0){var s=this.map.painter.context,p=s.gl;for(var f in this.boundsBuffer||(this.boundsBuffer=s.createVertexBuffer(this._boundsArray,fi.members)),this.boundsSegments||(this.boundsSegments=u.SegmentVector.simpleSegment(0,0,4,2)),this.texture?(n||this._playing)&&this.texture.update(this.canvas,{premultiply:!0}):this.texture=new u.Texture(s,this.canvas,p.RGBA,{premultiply:!0}),this.tiles){var d=this.tiles[f];d.state!=="loaded"&&(d.state="loaded",d.texture=this.texture);}}},o.prototype.serialize=function(){return {type:"canvas",coordinates:this.coordinates}},o.prototype.hasTransition=function(){return this._playing},o.prototype._hasInvalidDimensions=function(){for(var n=0,s=[this.canvas.width,this.canvas.height];n<s.length;n+=1){var p=s[n];if(isNaN(p)||p<=0)return !0}return !1},o}(Ii),Hi={vector:no,raster:oo,"raster-dem":va,geojson:Ki,video:Sn,image:Ii,canvas:Tn};function xs(i,o){var n=u.identity([]);return u.translate(n,n,[1,1,0]),u.scale(n,n,[.5*i.width,.5*i.height,1]),u.multiply(n,n,i.calculatePosMatrix(o.toUnwrapped()))}function gr(i,o,n,s,p,f){var d=function(j,D,N){if(j)for(var G=0,K=j;G<K.length;G+=1){var tt=D[K[G]];if(tt&&tt.source===N&&tt.type==="fill-extrusion")return !0}else for(var Q in D){var et=D[Q];if(et.source===N&&et.type==="fill-extrusion")return !0}return !1}(p&&p.layers,o,i.id),y=f.maxPitchScaleFactor(),v=i.tilesIn(s,y,d);v.sort(Fi);for(var S=[],P=0,z=v;P<z.length;P+=1){var k=z[P];S.push({wrappedTileID:k.tileID.wrapped().key,queryResults:k.tile.queryRenderedFeatures(o,n,i._state,k.queryGeometry,k.cameraQueryGeometry,k.scale,p,f,y,xs(i.transform,k.tileID))});}var F=function(j){for(var D={},N={},G=0,K=j;G<K.length;G+=1){var tt=K[G],Q=tt.queryResults,et=tt.wrappedTileID,ot=N[et]=N[et]||{};for(var ht in Q)for(var pt=Q[ht],bt=ot[ht]=ot[ht]||{},kt=D[ht]=D[ht]||[],Bt=0,Lt=pt;Bt<Lt.length;Bt+=1){var ne=Lt[Bt];bt[ne.featureIndex]||(bt[ne.featureIndex]=!0,kt.push(ne));}}return D}(S);for(var R in F)F[R].forEach(function(j){var D=j.feature,N=i.getFeatureState(D.layer["source-layer"],D.id);D.source=D.layer.source,D.layer["source-layer"]&&(D.sourceLayer=D.layer["source-layer"]),D.state=N;});return F}function Fi(i,o){var n=i.tileID,s=o.tileID;return n.overscaledZ-s.overscaledZ||n.canonical.y-s.canonical.y||n.wrap-s.wrap||n.canonical.x-s.canonical.x}var ye=function(i,o){this.max=i,this.onRemove=o,this.reset();};ye.prototype.reset=function(){for(var i in this.data)for(var o=0,n=this.data[i];o<n.length;o+=1){var s=n[o];s.timeout&&clearTimeout(s.timeout),this.onRemove(s.value);}return this.data={},this.order=[],this},ye.prototype.add=function(i,o,n){var s=this,p=i.wrapped().key;this.data[p]===void 0&&(this.data[p]=[]);var f={value:o,timeout:void 0};if(n!==void 0&&(f.timeout=setTimeout(function(){s.remove(i,f);},n)),this.data[p].push(f),this.order.push(p),this.order.length>this.max){var d=this._getAndRemoveByKey(this.order[0]);d&&this.onRemove(d);}return this},ye.prototype.has=function(i){return i.wrapped().key in this.data},ye.prototype.getAndRemove=function(i){return this.has(i)?this._getAndRemoveByKey(i.wrapped().key):null},ye.prototype._getAndRemoveByKey=function(i){var o=this.data[i].shift();return o.timeout&&clearTimeout(o.timeout),this.data[i].length===0&&delete this.data[i],this.order.splice(this.order.indexOf(i),1),o.value},ye.prototype.getByKey=function(i){var o=this.data[i];return o?o[0].value:null},ye.prototype.get=function(i){return this.has(i)?this.data[i.wrapped().key][0].value:null},ye.prototype.remove=function(i,o){if(!this.has(i))return this;var n=i.wrapped().key,s=o===void 0?0:this.data[n].indexOf(o),p=this.data[n][s];return this.data[n].splice(s,1),p.timeout&&clearTimeout(p.timeout),this.data[n].length===0&&delete this.data[n],this.onRemove(p.value),this.order.splice(this.order.indexOf(n),1),this},ye.prototype.setMaxSize=function(i){for(this.max=i;this.order.length>this.max;){var o=this._getAndRemoveByKey(this.order[0]);o&&this.onRemove(o);}return this},ye.prototype.filter=function(i){var o=[];for(var n in this.data)for(var s=0,p=this.data[n];s<p.length;s+=1){var f=p[s];i(f.value)||o.push(f);}for(var d=0,y=o;d<y.length;d+=1){var v=y[d];this.remove(v.value.tileID,v);}};var Ei=function(i,o,n){this.context=i;var s=i.gl;this.buffer=s.createBuffer(),this.dynamicDraw=Boolean(n),this.context.unbindVAO(),i.bindElementBuffer.set(this.buffer),s.bufferData(s.ELEMENT_ARRAY_BUFFER,o.arrayBuffer,this.dynamicDraw?s.DYNAMIC_DRAW:s.STATIC_DRAW),this.dynamicDraw||delete o.arrayBuffer;};Ei.prototype.bind=function(){this.context.bindElementBuffer.set(this.buffer);},Ei.prototype.updateData=function(i){var o=this.context.gl;this.context.unbindVAO(),this.bind(),o.bufferSubData(o.ELEMENT_ARRAY_BUFFER,0,i.arrayBuffer);},Ei.prototype.destroy=function(){this.buffer&&(this.context.gl.deleteBuffer(this.buffer),delete this.buffer);};var ao={Int8:"BYTE",Uint8:"UNSIGNED_BYTE",Int16:"SHORT",Uint16:"UNSIGNED_SHORT",Int32:"INT",Uint32:"UNSIGNED_INT",Float32:"FLOAT"},di=function(i,o,n,s){this.length=o.length,this.attributes=n,this.itemSize=o.bytesPerElement,this.dynamicDraw=s,this.context=i;var p=i.gl;this.buffer=p.createBuffer(),i.bindVertexBuffer.set(this.buffer),p.bufferData(p.ARRAY_BUFFER,o.arrayBuffer,this.dynamicDraw?p.DYNAMIC_DRAW:p.STATIC_DRAW),this.dynamicDraw||delete o.arrayBuffer;};di.prototype.bind=function(){this.context.bindVertexBuffer.set(this.buffer);},di.prototype.updateData=function(i){var o=this.context.gl;this.bind(),o.bufferSubData(o.ARRAY_BUFFER,0,i.arrayBuffer);},di.prototype.enableAttributes=function(i,o){for(var n=0;n<this.attributes.length;n++){var s=o.attributes[this.attributes[n].name];s!==void 0&&i.enableVertexAttribArray(s);}},di.prototype.setVertexAttribPointers=function(i,o,n){for(var s=0;s<this.attributes.length;s++){var p=this.attributes[s],f=o.attributes[p.name];f!==void 0&&i.vertexAttribPointer(f,p.components,i[ao[p.type]],!1,this.itemSize,p.offset+this.itemSize*(n||0));}},di.prototype.destroy=function(){this.buffer&&(this.context.gl.deleteBuffer(this.buffer),delete this.buffer);};var $t=function(i){this.gl=i.gl,this.default=this.getDefault(),this.current=this.default,this.dirty=!1;};$t.prototype.get=function(){return this.current},$t.prototype.set=function(i){},$t.prototype.getDefault=function(){return this.default},$t.prototype.setDefault=function(){this.set(this.default);};var Ji=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return u.Color.transparent},o.prototype.set=function(n){var s=this.current;(n.r!==s.r||n.g!==s.g||n.b!==s.b||n.a!==s.a||this.dirty)&&(this.gl.clearColor(n.r,n.g,n.b,n.a),this.current=n,this.dirty=!1);},o}($t),Ar=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return 1},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.clearDepth(n),this.current=n,this.dirty=!1);},o}($t),Yr=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return 0},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.clearStencil(n),this.current=n,this.dirty=!1);},o}($t),bs=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return [!0,!0,!0,!0]},o.prototype.set=function(n){var s=this.current;(n[0]!==s[0]||n[1]!==s[1]||n[2]!==s[2]||n[3]!==s[3]||this.dirty)&&(this.gl.colorMask(n[0],n[1],n[2],n[3]),this.current=n,this.dirty=!1);},o}($t),mi=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return !0},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.depthMask(n),this.current=n,this.dirty=!1);},o}($t),Do=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return 255},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.stencilMask(n),this.current=n,this.dirty=!1);},o}($t),Qr=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return {func:this.gl.ALWAYS,ref:0,mask:255}},o.prototype.set=function(n){var s=this.current;(n.func!==s.func||n.ref!==s.ref||n.mask!==s.mask||this.dirty)&&(this.gl.stencilFunc(n.func,n.ref,n.mask),this.current=n,this.dirty=!1);},o}($t),In=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){var n=this.gl;return [n.KEEP,n.KEEP,n.KEEP]},o.prototype.set=function(n){var s=this.current;(n[0]!==s[0]||n[1]!==s[1]||n[2]!==s[2]||this.dirty)&&(this.gl.stencilOp(n[0],n[1],n[2]),this.current=n,this.dirty=!1);},o}($t),so=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return !1},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;n?s.enable(s.STENCIL_TEST):s.disable(s.STENCIL_TEST),this.current=n,this.dirty=!1;}},o}($t),$r=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return [0,1]},o.prototype.set=function(n){var s=this.current;(n[0]!==s[0]||n[1]!==s[1]||this.dirty)&&(this.gl.depthRange(n[0],n[1]),this.current=n,this.dirty=!1);},o}($t),ti=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return !1},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;n?s.enable(s.DEPTH_TEST):s.disable(s.DEPTH_TEST),this.current=n,this.dirty=!1;}},o}($t),En=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return this.gl.LESS},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.depthFunc(n),this.current=n,this.dirty=!1);},o}($t),yi=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return !1},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;n?s.enable(s.BLEND):s.disable(s.BLEND),this.current=n,this.dirty=!1;}},o}($t),xa=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){var n=this.gl;return [n.ONE,n.ZERO]},o.prototype.set=function(n){var s=this.current;(n[0]!==s[0]||n[1]!==s[1]||this.dirty)&&(this.gl.blendFunc(n[0],n[1]),this.current=n,this.dirty=!1);},o}($t),ba=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return u.Color.transparent},o.prototype.set=function(n){var s=this.current;(n.r!==s.r||n.g!==s.g||n.b!==s.b||n.a!==s.a||this.dirty)&&(this.gl.blendColor(n.r,n.g,n.b,n.a),this.current=n,this.dirty=!1);},o}($t),Lo=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return this.gl.FUNC_ADD},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.blendEquation(n),this.current=n,this.dirty=!1);},o}($t),Bo=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return !1},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;n?s.enable(s.CULL_FACE):s.disable(s.CULL_FACE),this.current=n,this.dirty=!1;}},o}($t),lo=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return this.gl.BACK},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.cullFace(n),this.current=n,this.dirty=!1);},o}($t),wa=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return this.gl.CCW},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.frontFace(n),this.current=n,this.dirty=!1);},o}($t),uo=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return null},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.useProgram(n),this.current=n,this.dirty=!1);},o}($t),Ro=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return this.gl.TEXTURE0},o.prototype.set=function(n){(n!==this.current||this.dirty)&&(this.gl.activeTexture(n),this.current=n,this.dirty=!1);},o}($t),An=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){var n=this.gl;return [0,0,n.drawingBufferWidth,n.drawingBufferHeight]},o.prototype.set=function(n){var s=this.current;(n[0]!==s[0]||n[1]!==s[1]||n[2]!==s[2]||n[3]!==s[3]||this.dirty)&&(this.gl.viewport(n[0],n[1],n[2],n[3]),this.current=n,this.dirty=!1);},o}($t),Fo=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return null},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;s.bindFramebuffer(s.FRAMEBUFFER,n),this.current=n,this.dirty=!1;}},o}($t),Oo=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return null},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;s.bindRenderbuffer(s.RENDERBUFFER,n),this.current=n,this.dirty=!1;}},o}($t),Sa=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return null},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;s.bindTexture(s.TEXTURE_2D,n),this.current=n,this.dirty=!1;}},o}($t),Ta=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return null},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;s.bindBuffer(s.ARRAY_BUFFER,n),this.current=n,this.dirty=!1;}},o}($t),Pn=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return null},o.prototype.set=function(n){var s=this.gl;s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,n),this.current=n,this.dirty=!1;},o}($t),Oi=function(i){function o(n){i.call(this,n),this.vao=n.extVertexArrayObject;}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return null},o.prototype.set=function(n){this.vao&&(n!==this.current||this.dirty)&&(this.vao.bindVertexArrayOES(n),this.current=n,this.dirty=!1);},o}($t),Ui=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return 4},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;s.pixelStorei(s.UNPACK_ALIGNMENT,n),this.current=n,this.dirty=!1;}},o}($t),co=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return !1},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,n),this.current=n,this.dirty=!1;}},o}($t),Uo=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return !1},o.prototype.set=function(n){if(n!==this.current||this.dirty){var s=this.gl;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,n),this.current=n,this.dirty=!1;}},o}($t),Re=function(i){function o(n,s){i.call(this,n),this.context=n,this.parent=s;}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getDefault=function(){return null},o}($t),w=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.setDirty=function(){this.dirty=!0;},o.prototype.set=function(n){if(n!==this.current||this.dirty){this.context.bindFramebuffer.set(this.parent);var s=this.gl;s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,n,0),this.current=n,this.dirty=!1;}},o}(Re),T=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.set=function(n){if(n!==this.current||this.dirty){this.context.bindFramebuffer.set(this.parent);var s=this.gl;s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.RENDERBUFFER,n),this.current=n,this.dirty=!1;}},o}(Re),A=function(i,o,n,s){this.context=i,this.width=o,this.height=n;var p=this.framebuffer=i.gl.createFramebuffer();this.colorAttachment=new w(i,p),s&&(this.depthAttachment=new T(i,p));};A.prototype.destroy=function(){var i=this.context.gl,o=this.colorAttachment.get();if(o&&i.deleteTexture(o),this.depthAttachment){var n=this.depthAttachment.get();n&&i.deleteRenderbuffer(n);}i.deleteFramebuffer(this.framebuffer);};var M=function(i,o,n){this.func=i,this.mask=o,this.range=n;};M.ReadOnly=!1,M.ReadWrite=!0,M.disabled=new M(519,M.ReadOnly,[0,1]);var O=function(i,o,n,s,p,f){this.test=i,this.ref=o,this.mask=n,this.fail=s,this.depthFail=p,this.pass=f;};O.disabled=new O({func:519,mask:0},0,0,7680,7680,7680);var Z=function(i,o,n){this.blendFunction=i,this.blendColor=o,this.mask=n;};Z.disabled=new Z(Z.Replace=[1,0],u.Color.transparent,[!1,!1,!1,!1]),Z.unblended=new Z(Z.Replace,u.Color.transparent,[!0,!0,!0,!0]),Z.alphaBlended=new Z([1,771],u.Color.transparent,[!0,!0,!0,!0]);var X=function(i,o,n){this.enable=i,this.mode=o,this.frontFace=n;};X.disabled=new X(!1,1029,2305),X.backCCW=new X(!0,1029,2305);var C=function(i){this.gl=i,this.extVertexArrayObject=this.gl.getExtension("OES_vertex_array_object"),this.clearColor=new Ji(this),this.clearDepth=new Ar(this),this.clearStencil=new Yr(this),this.colorMask=new bs(this),this.depthMask=new mi(this),this.stencilMask=new Do(this),this.stencilFunc=new Qr(this),this.stencilOp=new In(this),this.stencilTest=new so(this),this.depthRange=new $r(this),this.depthTest=new ti(this),this.depthFunc=new En(this),this.blend=new yi(this),this.blendFunc=new xa(this),this.blendColor=new ba(this),this.blendEquation=new Lo(this),this.cullFace=new Bo(this),this.cullFaceSide=new lo(this),this.frontFace=new wa(this),this.program=new uo(this),this.activeTexture=new Ro(this),this.viewport=new An(this),this.bindFramebuffer=new Fo(this),this.bindRenderbuffer=new Oo(this),this.bindTexture=new Sa(this),this.bindVertexBuffer=new Ta(this),this.bindElementBuffer=new Pn(this),this.bindVertexArrayOES=this.extVertexArrayObject&&new Oi(this),this.pixelStoreUnpack=new Ui(this),this.pixelStoreUnpackPremultiplyAlpha=new co(this),this.pixelStoreUnpackFlipY=new Uo(this),this.extTextureFilterAnisotropic=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic"),this.extTextureFilterAnisotropic&&(this.extTextureFilterAnisotropicMax=i.getParameter(this.extTextureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)),this.extTextureHalfFloat=i.getExtension("OES_texture_half_float"),this.extTextureHalfFloat&&(i.getExtension("OES_texture_half_float_linear"),this.extRenderToTextureHalfFloat=i.getExtension("EXT_color_buffer_half_float")),this.extTimerQuery=i.getExtension("EXT_disjoint_timer_query"),this.maxTextureSize=i.getParameter(i.MAX_TEXTURE_SIZE);};C.prototype.setDefault=function(){this.unbindVAO(),this.clearColor.setDefault(),this.clearDepth.setDefault(),this.clearStencil.setDefault(),this.colorMask.setDefault(),this.depthMask.setDefault(),this.stencilMask.setDefault(),this.stencilFunc.setDefault(),this.stencilOp.setDefault(),this.stencilTest.setDefault(),this.depthRange.setDefault(),this.depthTest.setDefault(),this.depthFunc.setDefault(),this.blend.setDefault(),this.blendFunc.setDefault(),this.blendColor.setDefault(),this.blendEquation.setDefault(),this.cullFace.setDefault(),this.cullFaceSide.setDefault(),this.frontFace.setDefault(),this.program.setDefault(),this.activeTexture.setDefault(),this.bindFramebuffer.setDefault(),this.pixelStoreUnpack.setDefault(),this.pixelStoreUnpackPremultiplyAlpha.setDefault(),this.pixelStoreUnpackFlipY.setDefault();},C.prototype.setDirty=function(){this.clearColor.dirty=!0,this.clearDepth.dirty=!0,this.clearStencil.dirty=!0,this.colorMask.dirty=!0,this.depthMask.dirty=!0,this.stencilMask.dirty=!0,this.stencilFunc.dirty=!0,this.stencilOp.dirty=!0,this.stencilTest.dirty=!0,this.depthRange.dirty=!0,this.depthTest.dirty=!0,this.depthFunc.dirty=!0,this.blend.dirty=!0,this.blendFunc.dirty=!0,this.blendColor.dirty=!0,this.blendEquation.dirty=!0,this.cullFace.dirty=!0,this.cullFaceSide.dirty=!0,this.frontFace.dirty=!0,this.program.dirty=!0,this.activeTexture.dirty=!0,this.viewport.dirty=!0,this.bindFramebuffer.dirty=!0,this.bindRenderbuffer.dirty=!0,this.bindTexture.dirty=!0,this.bindVertexBuffer.dirty=!0,this.bindElementBuffer.dirty=!0,this.extVertexArrayObject&&(this.bindVertexArrayOES.dirty=!0),this.pixelStoreUnpack.dirty=!0,this.pixelStoreUnpackPremultiplyAlpha.dirty=!0,this.pixelStoreUnpackFlipY.dirty=!0;},C.prototype.createIndexBuffer=function(i,o){return new Ei(this,i,o)},C.prototype.createVertexBuffer=function(i,o,n){return new di(this,i,o,n)},C.prototype.createRenderbuffer=function(i,o,n){var s=this.gl,p=s.createRenderbuffer();return this.bindRenderbuffer.set(p),s.renderbufferStorage(s.RENDERBUFFER,i,o,n),this.bindRenderbuffer.set(null),p},C.prototype.createFramebuffer=function(i,o,n){return new A(this,i,o,n)},C.prototype.clear=function(i){var o=i.color,n=i.depth,s=this.gl,p=0;o&&(p|=s.COLOR_BUFFER_BIT,this.clearColor.set(o),this.colorMask.set([!0,!0,!0,!0])),n!==void 0&&(p|=s.DEPTH_BUFFER_BIT,this.depthRange.set([0,1]),this.clearDepth.set(n),this.depthMask.set(!0)),s.clear(p);},C.prototype.setCullFace=function(i){i.enable===!1?this.cullFace.set(!1):(this.cullFace.set(!0),this.cullFaceSide.set(i.mode),this.frontFace.set(i.frontFace));},C.prototype.setDepthMode=function(i){i.func!==this.gl.ALWAYS||i.mask?(this.depthTest.set(!0),this.depthFunc.set(i.func),this.depthMask.set(i.mask),this.depthRange.set(i.range)):this.depthTest.set(!1);},C.prototype.setStencilMode=function(i){i.test.func!==this.gl.ALWAYS||i.mask?(this.stencilTest.set(!0),this.stencilMask.set(i.mask),this.stencilOp.set([i.fail,i.depthFail,i.pass]),this.stencilFunc.set({func:i.test.func,ref:i.ref,mask:i.test.mask})):this.stencilTest.set(!1);},C.prototype.setColorMode=function(i){u.deepEqual(i.blendFunction,Z.Replace)?this.blend.set(!1):(this.blend.set(!0),this.blendFunc.set(i.blendFunction),this.blendColor.set(i.blendColor)),this.colorMask.set(i.mask);},C.prototype.unbindVAO=function(){this.extVertexArrayObject&&this.bindVertexArrayOES.set(null);};var U=function(i){function o(n,s,p){var f=this;i.call(this),this.id=n,this.dispatcher=p,this.on("data",function(d){d.dataType==="source"&&d.sourceDataType==="metadata"&&(f._sourceLoaded=!0),f._sourceLoaded&&!f._paused&&d.dataType==="source"&&d.sourceDataType==="content"&&(f.reload(),f.transform&&f.update(f.transform));}),this.on("error",function(){f._sourceErrored=!0;}),this._source=function(d,y,v,S){var P=new Hi[y.type](d,y,v,S);if(P.id!==d)throw new Error("Expected Source id to be "+d+" instead of "+P.id);return u.bindAll(["load","abort","unload","serialize","prepare"],P),P}(n,s,p,this),this._tiles={},this._cache=new ye(0,this._unloadTile.bind(this)),this._timers={},this._cacheTimers={},this._maxTileCacheSize=null,this._loadedParentTiles={},this._coveredTiles={},this._state=new u.SourceFeatureState;}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.onAdd=function(n){this.map=n,this._maxTileCacheSize=n?n._maxTileCacheSize:null,this._source&&this._source.onAdd&&this._source.onAdd(n);},o.prototype.onRemove=function(n){this._source&&this._source.onRemove&&this._source.onRemove(n);},o.prototype.loaded=function(){if(this._sourceErrored)return !0;if(!this._sourceLoaded)return !1;if(!this._source.loaded())return !1;for(var n in this._tiles){var s=this._tiles[n];if(s.state!=="loaded"&&s.state!=="errored")return !1}return !0},o.prototype.getSource=function(){return this._source},o.prototype.pause=function(){this._paused=!0;},o.prototype.resume=function(){if(this._paused){var n=this._shouldReloadOnResume;this._paused=!1,this._shouldReloadOnResume=!1,n&&this.reload(),this.transform&&this.update(this.transform);}},o.prototype._loadTile=function(n,s){return this._source.loadTile(n,s)},o.prototype._unloadTile=function(n){if(this._source.unloadTile)return this._source.unloadTile(n,function(){})},o.prototype._abortTile=function(n){if(this._source.abortTile)return this._source.abortTile(n,function(){})},o.prototype.serialize=function(){return this._source.serialize()},o.prototype.prepare=function(n){for(var s in this._source.prepare&&this._source.prepare(),this._state.coalesceChanges(this._tiles,this.map?this.map.painter:null),this._tiles){var p=this._tiles[s];p.upload(n),p.prepare(this.map.style.imageManager);}},o.prototype.getIds=function(){return u.values(this._tiles).map(function(n){return n.tileID}).sort(H).map(function(n){return n.key})},o.prototype.getRenderableIds=function(n){var s=this,p=[];for(var f in this._tiles)this._isIdRenderable(f,n)&&p.push(this._tiles[f]);return n?p.sort(function(d,y){var v=d.tileID,S=y.tileID,P=new u.Point(v.canonical.x,v.canonical.y)._rotate(s.transform.angle),z=new u.Point(S.canonical.x,S.canonical.y)._rotate(s.transform.angle);return v.overscaledZ-S.overscaledZ||z.y-P.y||z.x-P.x}).map(function(d){return d.tileID.key}):p.map(function(d){return d.tileID}).sort(H).map(function(d){return d.key})},o.prototype.hasRenderableParent=function(n){var s=this.findLoadedParent(n,0);return !!s&&this._isIdRenderable(s.tileID.key)},o.prototype._isIdRenderable=function(n,s){return this._tiles[n]&&this._tiles[n].hasData()&&!this._coveredTiles[n]&&(s||!this._tiles[n].holdingForFade())},o.prototype.reload=function(){if(this._paused)this._shouldReloadOnResume=!0;else for(var n in this._cache.reset(),this._tiles)this._tiles[n].state!=="errored"&&this._reloadTile(n,"reloading");},o.prototype._reloadTile=function(n,s){var p=this._tiles[n];p&&(p.state!=="loading"&&(p.state=s),this._loadTile(p,this._tileLoaded.bind(this,p,n,s)));},o.prototype._tileLoaded=function(n,s,p,f){if(f)return n.state="errored",void(f.status!==404?this._source.fire(new u.ErrorEvent(f,{tile:n})):this.update(this.transform));n.timeAdded=u.browser.now(),p==="expired"&&(n.refreshedUponExpiration=!0),this._setTileReloadTimer(s,n),this.getSource().type==="raster-dem"&&n.dem&&this._backfillDEM(n),this._state.initializeTileState(n,this.map?this.map.painter:null),this._source.fire(new u.Event("data",{dataType:"source",tile:n,coord:n.tileID}));},o.prototype._backfillDEM=function(n){for(var s=this.getRenderableIds(),p=0;p<s.length;p++){var f=s[p];if(n.neighboringTiles&&n.neighboringTiles[f]){var d=this.getTileByID(f);y(n,d),y(d,n);}}function y(v,S){v.needsHillshadePrepare=!0;var P=S.tileID.canonical.x-v.tileID.canonical.x,z=S.tileID.canonical.y-v.tileID.canonical.y,k=Math.pow(2,v.tileID.canonical.z),F=S.tileID.key;P===0&&z===0||Math.abs(z)>1||(Math.abs(P)>1&&(Math.abs(P+k)===1?P+=k:Math.abs(P-k)===1&&(P-=k)),S.dem&&v.dem&&(v.dem.backfillBorder(S.dem,P,z),v.neighboringTiles&&v.neighboringTiles[F]&&(v.neighboringTiles[F].backfilled=!0)));}},o.prototype.getTile=function(n){return this.getTileByID(n.key)},o.prototype.getTileByID=function(n){return this._tiles[n]},o.prototype._retainLoadedChildren=function(n,s,p,f){for(var d in this._tiles){var y=this._tiles[d];if(!(f[d]||!y.hasData()||y.tileID.overscaledZ<=s||y.tileID.overscaledZ>p)){for(var v=y.tileID;y&&y.tileID.overscaledZ>s+1;){var S=y.tileID.scaledTo(y.tileID.overscaledZ-1);(y=this._tiles[S.key])&&y.hasData()&&(v=S);}for(var P=v;P.overscaledZ>s;)if(n[(P=P.scaledTo(P.overscaledZ-1)).key]){f[v.key]=v;break}}}},o.prototype.findLoadedParent=function(n,s){if(n.key in this._loadedParentTiles){var p=this._loadedParentTiles[n.key];return p&&p.tileID.overscaledZ>=s?p:null}for(var f=n.overscaledZ-1;f>=s;f--){var d=n.scaledTo(f),y=this._getLoadedTile(d);if(y)return y}},o.prototype._getLoadedTile=function(n){var s=this._tiles[n.key];return s&&s.hasData()?s:this._cache.getByKey(n.wrapped().key)},o.prototype.updateCacheSize=function(n){var s=Math.ceil(n.width/this._source.tileSize)+1,p=Math.ceil(n.height/this._source.tileSize)+1,f=Math.floor(s*p*5),d=typeof this._maxTileCacheSize=="number"?Math.min(this._maxTileCacheSize,f):f;this._cache.setMaxSize(d);},o.prototype.handleWrapJump=function(n){var s=Math.round((n-(this._prevLng===void 0?n:this._prevLng))/360);if(this._prevLng=n,s){var p={};for(var f in this._tiles){var d=this._tiles[f];d.tileID=d.tileID.unwrapTo(d.tileID.wrap+s),p[d.tileID.key]=d;}for(var y in this._tiles=p,this._timers)clearTimeout(this._timers[y]),delete this._timers[y];for(var v in this._tiles)this._setTileReloadTimer(v,this._tiles[v]);}},o.prototype.update=function(n){var s=this;if(this.transform=n,this._sourceLoaded&&!this._paused){var p;this.updateCacheSize(n),this.handleWrapJump(this.transform.center.lng),this._coveredTiles={},this.used?this._source.tileID?p=n.getVisibleUnwrappedCoordinates(this._source.tileID).map(function(ot){return new u.OverscaledTileID(ot.canonical.z,ot.wrap,ot.canonical.z,ot.canonical.x,ot.canonical.y)}):(p=n.coveringTiles({tileSize:this._source.tileSize,minzoom:this._source.minzoom,maxzoom:this._source.maxzoom,roundZoom:this._source.roundZoom,reparseOverscaled:this._source.reparseOverscaled}),this._source.hasTile&&(p=p.filter(function(ot){return s._source.hasTile(ot)}))):p=[];var f=n.coveringZoomLevel(this._source),d=Math.max(f-o.maxOverzooming,this._source.minzoom),y=Math.max(f+o.maxUnderzooming,this._source.minzoom),v=this._updateRetainedTiles(p,f);if(at(this._source.type)){for(var S={},P={},z=0,k=Object.keys(v);z<k.length;z+=1){var F=k[z],R=v[F],j=this._tiles[F];if(j&&!(j.fadeEndTime&&j.fadeEndTime<=u.browser.now())){var D=this.findLoadedParent(R,d);D&&(this._addTile(D.tileID),S[D.tileID.key]=D.tileID),P[F]=R;}}for(var N in this._retainLoadedChildren(P,f,y,v),S)v[N]||(this._coveredTiles[N]=!0,v[N]=S[N]);}for(var G in v)this._tiles[G].clearFadeHold();for(var K=0,tt=u.keysDifference(this._tiles,v);K<tt.length;K+=1){var Q=tt[K],et=this._tiles[Q];et.hasSymbolBuckets&&!et.holdingForFade()?et.setHoldDuration(this.map._fadeDuration):et.hasSymbolBuckets&&!et.symbolFadeFinished()||this._removeTile(Q);}this._updateLoadedParentTileCache();}},o.prototype.releaseSymbolFadeTiles=function(){for(var n in this._tiles)this._tiles[n].holdingForFade()&&this._removeTile(n);},o.prototype._updateRetainedTiles=function(n,s){for(var p={},f={},d=Math.max(s-o.maxOverzooming,this._source.minzoom),y=Math.max(s+o.maxUnderzooming,this._source.minzoom),v={},S=0,P=n;S<P.length;S+=1){var z=P[S],k=this._addTile(z);p[z.key]=z,k.hasData()||s<this._source.maxzoom&&(v[z.key]=z);}this._retainLoadedChildren(v,s,y,p);for(var F=0,R=n;F<R.length;F+=1){var j=R[F],D=this._tiles[j.key];if(!D.hasData()){if(s+1>this._source.maxzoom){var N=j.children(this._source.maxzoom)[0],G=this.getTile(N);if(G&&G.hasData()){p[N.key]=N;continue}}else {var K=j.children(this._source.maxzoom);if(p[K[0].key]&&p[K[1].key]&&p[K[2].key]&&p[K[3].key])continue}for(var tt=D.wasRequested(),Q=j.overscaledZ-1;Q>=d;--Q){var et=j.scaledTo(Q);if(f[et.key])break;if(f[et.key]=!0,!(D=this.getTile(et))&&tt&&(D=this._addTile(et)),D&&(p[et.key]=et,tt=D.wasRequested(),D.hasData()))break}}}return p},o.prototype._updateLoadedParentTileCache=function(){for(var n in this._loadedParentTiles={},this._tiles){for(var s=[],p=void 0,f=this._tiles[n].tileID;f.overscaledZ>0;){if(f.key in this._loadedParentTiles){p=this._loadedParentTiles[f.key];break}s.push(f.key);var d=f.scaledTo(f.overscaledZ-1);if(p=this._getLoadedTile(d))break;f=d;}for(var y=0,v=s;y<v.length;y+=1)this._loadedParentTiles[v[y]]=p;}},o.prototype._addTile=function(n){var s=this._tiles[n.key];if(s)return s;(s=this._cache.getAndRemove(n))&&(this._setTileReloadTimer(n.key,s),s.tileID=n,this._state.initializeTileState(s,this.map?this.map.painter:null),this._cacheTimers[n.key]&&(clearTimeout(this._cacheTimers[n.key]),delete this._cacheTimers[n.key],this._setTileReloadTimer(n.key,s)));var p=Boolean(s);return p||(s=new u.Tile(n,this._source.tileSize*n.overscaleFactor()),this._loadTile(s,this._tileLoaded.bind(this,s,n.key,s.state))),s?(s.uses++,this._tiles[n.key]=s,p||this._source.fire(new u.Event("dataloading",{tile:s,coord:s.tileID,dataType:"source"})),s):null},o.prototype._setTileReloadTimer=function(n,s){var p=this;n in this._timers&&(clearTimeout(this._timers[n]),delete this._timers[n]);var f=s.getExpiryTimeout();f&&(this._timers[n]=setTimeout(function(){p._reloadTile(n,"expired"),delete p._timers[n];},f));},o.prototype._removeTile=function(n){var s=this._tiles[n];s&&(s.uses--,delete this._tiles[n],this._timers[n]&&(clearTimeout(this._timers[n]),delete this._timers[n]),s.uses>0||(s.hasData()&&s.state!=="reloading"?this._cache.add(s.tileID,s,s.getExpiryTimeout()):(s.aborted=!0,this._abortTile(s),this._unloadTile(s))));},o.prototype.clearTiles=function(){for(var n in this._shouldReloadOnResume=!1,this._paused=!1,this._tiles)this._removeTile(n);this._cache.reset();},o.prototype.tilesIn=function(n,s,p){var f=this,d=[],y=this.transform;if(!y)return d;for(var v=p?y.getCameraQueryGeometry(n):n,S=n.map(function(Q){return y.pointCoordinate(Q)}),P=v.map(function(Q){return y.pointCoordinate(Q)}),z=this.getIds(),k=1/0,F=1/0,R=-1/0,j=-1/0,D=0,N=P;D<N.length;D+=1){var G=N[D];k=Math.min(k,G.x),F=Math.min(F,G.y),R=Math.max(R,G.x),j=Math.max(j,G.y);}for(var K=function(Q){var et=f._tiles[z[Q]];if(!et.holdingForFade()){var ot=et.tileID,ht=Math.pow(2,y.zoom-et.tileID.overscaledZ),pt=s*et.queryPadding*u.EXTENT/et.tileSize/ht,bt=[ot.getTilePoint(new u.MercatorCoordinate(k,F)),ot.getTilePoint(new u.MercatorCoordinate(R,j))];if(bt[0].x-pt<u.EXTENT&&bt[0].y-pt<u.EXTENT&&bt[1].x+pt>=0&&bt[1].y+pt>=0){var kt=S.map(function(Lt){return ot.getTilePoint(Lt)}),Bt=P.map(function(Lt){return ot.getTilePoint(Lt)});d.push({tile:et,tileID:ot,queryGeometry:kt,cameraQueryGeometry:Bt,scale:ht});}}},tt=0;tt<z.length;tt++)K(tt);return d},o.prototype.getVisibleCoordinates=function(n){for(var s=this,p=this.getRenderableIds(n).map(function(v){return s._tiles[v].tileID}),f=0,d=p;f<d.length;f+=1){var y=d[f];y.posMatrix=this.transform.calculatePosMatrix(y.toUnwrapped());}return p},o.prototype.hasTransition=function(){if(this._source.hasTransition())return !0;if(at(this._source.type))for(var n in this._tiles){var s=this._tiles[n];if(s.fadeEndTime!==void 0&&s.fadeEndTime>=u.browser.now())return !0}return !1},o.prototype.setFeatureState=function(n,s,p){this._state.updateState(n=n||"_geojsonTileLayer",s,p);},o.prototype.removeFeatureState=function(n,s,p){this._state.removeFeatureState(n=n||"_geojsonTileLayer",s,p);},o.prototype.getFeatureState=function(n,s){return this._state.getState(n=n||"_geojsonTileLayer",s)},o.prototype.setDependencies=function(n,s,p){var f=this._tiles[n];f&&f.setDependencies(s,p);},o.prototype.reloadTilesForDependencies=function(n,s){for(var p in this._tiles)this._tiles[p].hasDependency(n,s)&&this._reloadTile(p,"reloading");this._cache.filter(function(f){return !f.hasDependency(n,s)});},o}(u.Evented);function H(i,o){var n=Math.abs(2*i.wrap)-+(i.wrap<0),s=Math.abs(2*o.wrap)-+(o.wrap<0);return i.overscaledZ-o.overscaledZ||s-n||o.canonical.y-i.canonical.y||o.canonical.x-i.canonical.x}function at(i){return i==="raster"||i==="image"||i==="video"}function lt(){return new u.window.Worker(Za.workerUrl)}U.maxOverzooming=10,U.maxUnderzooming=3;var rt="mapboxgl_preloaded_worker_pool",st=function(){this.active={};};st.prototype.acquire=function(i){if(!this.workers)for(this.workers=[];this.workers.length<st.workerCount;)this.workers.push(new lt);return this.active[i]=!0,this.workers.slice()},st.prototype.release=function(i){delete this.active[i],this.numActive()===0&&(this.workers.forEach(function(o){o.terminate();}),this.workers=null);},st.prototype.isPreloaded=function(){return !!this.active[rt]},st.prototype.numActive=function(){return Object.keys(this.active).length};var It,St=Math.floor(u.browser.hardwareConcurrency/2);function it(){return It||(It=new st),It}function xt(i,o){var n={};for(var s in i)s!=="ref"&&(n[s]=i[s]);return u.refProperties.forEach(function(p){p in o&&(n[p]=o[p]);}),n}function dt(i){i=i.slice();for(var o=Object.create(null),n=0;n<i.length;n++)o[i[n].id]=i[n];for(var s=0;s<i.length;s++)"ref"in i[s]&&(i[s]=xt(i[s],o[i[s].ref]));return i}st.workerCount=Math.max(Math.min(St,6),1);var yt={setStyle:"setStyle",addLayer:"addLayer",removeLayer:"removeLayer",setPaintProperty:"setPaintProperty",setLayoutProperty:"setLayoutProperty",setFilter:"setFilter",addSource:"addSource",removeSource:"removeSource",setGeoJSONSourceData:"setGeoJSONSourceData",setLayerZoomRange:"setLayerZoomRange",setLayerProperty:"setLayerProperty",setCenter:"setCenter",setZoom:"setZoom",setBearing:"setBearing",setPitch:"setPitch",setSprite:"setSprite",setGlyphs:"setGlyphs",setTransition:"setTransition",setLight:"setLight"};function Wt(i,o,n){n.push({command:yt.addSource,args:[i,o[i]]});}function _t(i,o,n){o.push({command:yt.removeSource,args:[i]}),n[i]=!0;}function te(i,o,n,s){_t(i,n,s),Wt(i,o,n);}function ge(i,o,n){var s;for(s in i[n])if(i[n].hasOwnProperty(s)&&s!=="data"&&!u.deepEqual(i[n][s],o[n][s]))return !1;for(s in o[n])if(o[n].hasOwnProperty(s)&&s!=="data"&&!u.deepEqual(i[n][s],o[n][s]))return !1;return !0}function Ht(i,o,n,s,p,f){var d;for(d in o=o||{},i=i||{})i.hasOwnProperty(d)&&(u.deepEqual(i[d],o[d])||n.push({command:f,args:[s,d,o[d],p]}));for(d in o)o.hasOwnProperty(d)&&!i.hasOwnProperty(d)&&(u.deepEqual(i[d],o[d])||n.push({command:f,args:[s,d,o[d],p]}));}function le(i){return i.id}function re(i,o){return i[o.id]=o,i}var _r=function(i,o){this.reset(i,o);};_r.prototype.reset=function(i,o){this.points=i||[],this._distances=[0];for(var n=1;n<this.points.length;n++)this._distances[n]=this._distances[n-1]+this.points[n].dist(this.points[n-1]);this.length=this._distances[this._distances.length-1],this.padding=Math.min(o||0,.5*this.length),this.paddedLength=this.length-2*this.padding;},_r.prototype.lerp=function(i){if(this.points.length===1)return this.points[0];i=u.clamp(i,0,1);for(var o=1,n=this._distances[o],s=i*this.paddedLength+this.padding;n<s&&o<this._distances.length;)n=this._distances[++o];var p=o-1,f=this._distances[p],d=n-f,y=d>0?(s-f)/d:0;return this.points[p].mult(1-y).add(this.points[o].mult(y))};var pe=function(i,o,n){var s=this.boxCells=[],p=this.circleCells=[];this.xCellCount=Math.ceil(i/n),this.yCellCount=Math.ceil(o/n);for(var f=0;f<this.xCellCount*this.yCellCount;f++)s.push([]),p.push([]);this.circleKeys=[],this.boxKeys=[],this.bboxes=[],this.circles=[],this.width=i,this.height=o,this.xScale=this.xCellCount/i,this.yScale=this.yCellCount/o,this.boxUid=0,this.circleUid=0;};function Fe(i,o,n,s,p){var f=u.create();return o?(u.scale(f,f,[1/p,1/p,1]),n||u.rotateZ(f,f,s.angle)):u.multiply(f,s.labelPlaneMatrix,i),f}function de(i,o,n,s,p){if(o){var f=u.clone(i);return u.scale(f,f,[p,p,1]),n||u.rotateZ(f,f,-s.angle),f}return s.glCoordMatrix}function Qt(i,o){var n=[i.x,i.y,0,1];rr(n,n,o);var s=n[3];return {point:new u.Point(n[0]/s,n[1]/s),signedDistanceFromCamera:s}}function ue(i,o){return .5+i/o*.5}function Pr(i,o){var n=i[0]/i[3],s=i[1]/i[3];return n>=-o[0]&&n<=o[0]&&s>=-o[1]&&s<=o[1]}function Vo(i,o,n,s,p,f,d,y){var v=s?i.textSizeData:i.iconSizeData,S=u.evaluateSizeForZoom(v,n.transform.zoom),P=[256/n.width*2+1,256/n.height*2+1],z=s?i.text.dynamicLayoutVertexArray:i.icon.dynamicLayoutVertexArray;z.clear();for(var k=i.lineVertexArray,F=s?i.text.placedSymbolArray:i.icon.placedSymbolArray,R=n.transform.width/n.transform.height,j=!1,D=0;D<F.length;D++){var N=F.get(D);if(N.hidden||N.writingMode===u.WritingMode.vertical&&!j)vr(N.numGlyphs,z);else {j=!1;var G=[N.anchorX,N.anchorY,0,1];if(u.transformMat4(G,G,o),Pr(G,P)){var K=ue(n.transform.cameraToCenterDistance,G[3]),tt=u.evaluateSizeForFeature(v,S,N),Q=d?tt/K:tt*K,et=new u.Point(N.anchorX,N.anchorY),ot=Qt(et,p).point,ht={},pt=ws(N,Q,!1,y,o,p,f,i.glyphOffsetArray,k,z,ot,et,ht,R);j=pt.useVertical,(pt.notEnoughRoom||j||pt.needsFlipping&&ws(N,Q,!0,y,o,p,f,i.glyphOffsetArray,k,z,ot,et,ht,R).notEnoughRoom)&&vr(N.numGlyphs,z);}else vr(N.numGlyphs,z);}}s?i.text.dynamicLayoutVertexBuffer.updateData(z):i.icon.dynamicLayoutVertexBuffer.updateData(z);}function er(i,o,n,s,p,f,d,y,v,S,P){var z=y.glyphStartIndex+y.numGlyphs,k=y.lineStartIndex,F=y.lineStartIndex+y.lineLength,R=o.getoffsetX(y.glyphStartIndex),j=o.getoffsetX(z-1),D=Oe(i*R,n,s,p,f,d,y.segment,k,F,v,S,P);if(!D)return null;var N=Oe(i*j,n,s,p,f,d,y.segment,k,F,v,S,P);return N?{first:D,last:N}:null}function zr(i,o,n,s){return i===u.WritingMode.horizontal&&Math.abs(n.y-o.y)>Math.abs(n.x-o.x)*s?{useVertical:!0}:(i===u.WritingMode.vertical?o.y<n.y:o.x>n.x)?{needsFlipping:!0}:null}function ws(i,o,n,s,p,f,d,y,v,S,P,z,k,F){var R,j=o/24,D=i.lineOffsetX*j,N=i.lineOffsetY*j;if(i.numGlyphs>1){var G=i.glyphStartIndex+i.numGlyphs,K=i.lineStartIndex,tt=i.lineStartIndex+i.lineLength,Q=er(j,y,D,N,n,P,z,i,v,f,k);if(!Q)return {notEnoughRoom:!0};var et=Qt(Q.first.point,d).point,ot=Qt(Q.last.point,d).point;if(s&&!n){var ht=zr(i.writingMode,et,ot,F);if(ht)return ht}R=[Q.first];for(var pt=i.glyphStartIndex+1;pt<G-1;pt++)R.push(Oe(j*y.getoffsetX(pt),D,N,n,P,z,i.segment,K,tt,v,f,k));R.push(Q.last);}else {if(s&&!n){var bt=Qt(z,p).point,kt=i.lineStartIndex+i.segment+1,Bt=new u.Point(v.getx(kt),v.gety(kt)),Lt=Qt(Bt,p),ne=Lt.signedDistanceFromCamera>0?Lt.point:No(z,Bt,bt,1,p),wt=zr(i.writingMode,bt,ne,F);if(wt)return wt}var Nt=Oe(j*y.getoffsetX(i.glyphStartIndex),D,N,n,P,z,i.segment,i.lineStartIndex,i.lineStartIndex+i.lineLength,v,f,k);if(!Nt)return {notEnoughRoom:!0};R=[Nt];}for(var Gt=0,Vt=R;Gt<Vt.length;Gt+=1){var Ut=Vt[Gt];u.addDynamicAttributes(S,Ut.point,Ut.angle);}return {}}function No(i,o,n,s,p){var f=Qt(i.add(i.sub(o)._unit()),p).point,d=n.sub(f);return n.add(d._mult(s/d.mag()))}function Oe(i,o,n,s,p,f,d,y,v,S,P,z){var k=s?i-o:i+o,F=k>0?1:-1,R=0;s&&(F*=-1,R=Math.PI),F<0&&(R+=Math.PI);for(var j=F>0?y+d:y+d+1,D=p,N=p,G=0,K=0,tt=Math.abs(k),Q=[];G+K<=tt;){if((j+=F)<y||j>=v)return null;if(N=D,Q.push(D),(D=z[j])===void 0){var et=new u.Point(S.getx(j),S.gety(j)),ot=Qt(et,P);if(ot.signedDistanceFromCamera>0)D=z[j]=ot.point;else {var ht=j-F;D=No(G===0?f:new u.Point(S.getx(ht),S.gety(ht)),et,N,tt-G+1,P);}}G+=K,K=N.dist(D);}var pt=(tt-G)/K,bt=D.sub(N),kt=bt.mult(pt)._add(N);kt._add(bt._unit()._perp()._mult(n*F));var Bt=R+Math.atan2(D.y-N.y,D.x-N.x);return Q.push(kt),{point:kt,angle:Bt,path:Q}}pe.prototype.keysLength=function(){return this.boxKeys.length+this.circleKeys.length},pe.prototype.insert=function(i,o,n,s,p){this._forEachCell(o,n,s,p,this._insertBoxCell,this.boxUid++),this.boxKeys.push(i),this.bboxes.push(o),this.bboxes.push(n),this.bboxes.push(s),this.bboxes.push(p);},pe.prototype.insertCircle=function(i,o,n,s){this._forEachCell(o-s,n-s,o+s,n+s,this._insertCircleCell,this.circleUid++),this.circleKeys.push(i),this.circles.push(o),this.circles.push(n),this.circles.push(s);},pe.prototype._insertBoxCell=function(i,o,n,s,p,f){this.boxCells[p].push(f);},pe.prototype._insertCircleCell=function(i,o,n,s,p,f){this.circleCells[p].push(f);},pe.prototype._query=function(i,o,n,s,p,f){if(n<0||i>this.width||s<0||o>this.height)return !p&&[];var d=[];if(i<=0&&o<=0&&this.width<=n&&this.height<=s){if(p)return !0;for(var y=0;y<this.boxKeys.length;y++)d.push({key:this.boxKeys[y],x1:this.bboxes[4*y],y1:this.bboxes[4*y+1],x2:this.bboxes[4*y+2],y2:this.bboxes[4*y+3]});for(var v=0;v<this.circleKeys.length;v++){var S=this.circles[3*v],P=this.circles[3*v+1],z=this.circles[3*v+2];d.push({key:this.circleKeys[v],x1:S-z,y1:P-z,x2:S+z,y2:P+z});}return f?d.filter(f):d}return this._forEachCell(i,o,n,s,this._queryCell,d,{hitTest:p,seenUids:{box:{},circle:{}}},f),p?d.length>0:d},pe.prototype._queryCircle=function(i,o,n,s,p){var f=i-n,d=i+n,y=o-n,v=o+n;if(d<0||f>this.width||v<0||y>this.height)return !s&&[];var S=[];return this._forEachCell(f,y,d,v,this._queryCellCircle,S,{hitTest:s,circle:{x:i,y:o,radius:n},seenUids:{box:{},circle:{}}},p),s?S.length>0:S},pe.prototype.query=function(i,o,n,s,p){return this._query(i,o,n,s,!1,p)},pe.prototype.hitTest=function(i,o,n,s,p){return this._query(i,o,n,s,!0,p)},pe.prototype.hitTestCircle=function(i,o,n,s){return this._queryCircle(i,o,n,!0,s)},pe.prototype._queryCell=function(i,o,n,s,p,f,d,y){var v=d.seenUids,S=this.boxCells[p];if(S!==null)for(var P=this.bboxes,z=0,k=S;z<k.length;z+=1){var F=k[z];if(!v.box[F]){v.box[F]=!0;var R=4*F;if(i<=P[R+2]&&o<=P[R+3]&&n>=P[R+0]&&s>=P[R+1]&&(!y||y(this.boxKeys[F]))){if(d.hitTest)return f.push(!0),!0;f.push({key:this.boxKeys[F],x1:P[R],y1:P[R+1],x2:P[R+2],y2:P[R+3]});}}}var j=this.circleCells[p];if(j!==null)for(var D=this.circles,N=0,G=j;N<G.length;N+=1){var K=G[N];if(!v.circle[K]){v.circle[K]=!0;var tt=3*K;if(this._circleAndRectCollide(D[tt],D[tt+1],D[tt+2],i,o,n,s)&&(!y||y(this.circleKeys[K]))){if(d.hitTest)return f.push(!0),!0;var Q=D[tt],et=D[tt+1],ot=D[tt+2];f.push({key:this.circleKeys[K],x1:Q-ot,y1:et-ot,x2:Q+ot,y2:et+ot});}}}},pe.prototype._queryCellCircle=function(i,o,n,s,p,f,d,y){var v=d.circle,S=d.seenUids,P=this.boxCells[p];if(P!==null)for(var z=this.bboxes,k=0,F=P;k<F.length;k+=1){var R=F[k];if(!S.box[R]){S.box[R]=!0;var j=4*R;if(this._circleAndRectCollide(v.x,v.y,v.radius,z[j+0],z[j+1],z[j+2],z[j+3])&&(!y||y(this.boxKeys[R])))return f.push(!0),!0}}var D=this.circleCells[p];if(D!==null)for(var N=this.circles,G=0,K=D;G<K.length;G+=1){var tt=K[G];if(!S.circle[tt]){S.circle[tt]=!0;var Q=3*tt;if(this._circlesCollide(N[Q],N[Q+1],N[Q+2],v.x,v.y,v.radius)&&(!y||y(this.circleKeys[tt])))return f.push(!0),!0}}},pe.prototype._forEachCell=function(i,o,n,s,p,f,d,y){for(var v=this._convertToXCellCoord(i),S=this._convertToYCellCoord(o),P=this._convertToXCellCoord(n),z=this._convertToYCellCoord(s),k=v;k<=P;k++)for(var F=S;F<=z;F++)if(p.call(this,i,o,n,s,this.xCellCount*F+k,f,d,y))return},pe.prototype._convertToXCellCoord=function(i){return Math.max(0,Math.min(this.xCellCount-1,Math.floor(i*this.xScale)))},pe.prototype._convertToYCellCoord=function(i){return Math.max(0,Math.min(this.yCellCount-1,Math.floor(i*this.yScale)))},pe.prototype._circlesCollide=function(i,o,n,s,p,f){var d=s-i,y=p-o,v=n+f;return v*v>d*d+y*y},pe.prototype._circleAndRectCollide=function(i,o,n,s,p,f,d){var y=(f-s)/2,v=Math.abs(i-(s+y));if(v>y+n)return !1;var S=(d-p)/2,P=Math.abs(o-(p+S));if(P>S+n)return !1;if(v<=y||P<=S)return !0;var z=v-y,k=P-S;return z*z+k*k<=n*n};var jo=new Float32Array([-1/0,-1/0,0,-1/0,-1/0,0,-1/0,-1/0,0,-1/0,-1/0,0]);function vr(i,o){for(var n=0;n<i;n++){var s=o.length;o.resize(s+4),o.float32.set(jo,3*s);}}function rr(i,o,n){var s=o[0],p=o[1];return i[0]=n[0]*s+n[4]*p+n[12],i[1]=n[1]*s+n[5]*p+n[13],i[3]=n[3]*s+n[7]*p+n[15],i}var ei=function(i,o,n){o===void 0&&(o=new pe(i.width+200,i.height+200,25)),n===void 0&&(n=new pe(i.width+200,i.height+200,25)),this.transform=i,this.grid=o,this.ignoredGrid=n,this.pitchfactor=Math.cos(i._pitch)*i.cameraToCenterDistance,this.screenRightBoundary=i.width+100,this.screenBottomBoundary=i.height+100,this.gridRightBoundary=i.width+200,this.gridBottomBoundary=i.height+200;};function Te(i,o,n){return o*(u.EXTENT/(i.tileSize*Math.pow(2,n-i.tileID.overscaledZ)))}ei.prototype.placeCollisionBox=function(i,o,n,s,p){var f=this.projectAndGetPerspectiveRatio(s,i.anchorPointX,i.anchorPointY),d=n*f.perspectiveRatio,y=i.x1*d+f.point.x,v=i.y1*d+f.point.y,S=i.x2*d+f.point.x,P=i.y2*d+f.point.y;return !this.isInsideGrid(y,v,S,P)||!o&&this.grid.hitTest(y,v,S,P,p)?{box:[],offscreen:!1}:{box:[y,v,S,P],offscreen:this.isOffscreen(y,v,S,P)}},ei.prototype.placeCollisionCircles=function(i,o,n,s,p,f,d,y,v,S,P,z,k){var F=[],R=new u.Point(o.anchorX,o.anchorY),j=Qt(R,f),D=ue(this.transform.cameraToCenterDistance,j.signedDistanceFromCamera),N=(S?p/D:p*D)/u.ONE_EM,G=Qt(R,d).point,K=er(N,s,o.lineOffsetX*N,o.lineOffsetY*N,!1,G,R,o,n,d,{}),tt=!1,Q=!1,et=!0;if(K){for(var ot=.5*z*D+k,ht=new u.Point(-100,-100),pt=new u.Point(this.screenRightBoundary,this.screenBottomBoundary),bt=new _r,kt=K.first,Bt=K.last,Lt=[],ne=kt.path.length-1;ne>=1;ne--)Lt.push(kt.path[ne]);for(var wt=1;wt<Bt.path.length;wt++)Lt.push(Bt.path[wt]);var Nt=2.5*ot;if(y){var Gt=Lt.map(function(si){return Qt(si,y)});Lt=Gt.some(function(si){return si.signedDistanceFromCamera<=0})?[]:Gt.map(function(si){return si.point});}var Vt=[];if(Lt.length>0){for(var Ut=Lt[0].clone(),Zt=Lt[0].clone(),Ot=1;Ot<Lt.length;Ot++)Ut.x=Math.min(Ut.x,Lt[Ot].x),Ut.y=Math.min(Ut.y,Lt[Ot].y),Zt.x=Math.max(Zt.x,Lt[Ot].x),Zt.y=Math.max(Zt.y,Lt[Ot].y);Vt=Ut.x>=ht.x&&Zt.x<=pt.x&&Ut.y>=ht.y&&Zt.y<=pt.y?[Lt]:Zt.x<ht.x||Ut.x>pt.x||Zt.y<ht.y||Ut.y>pt.y?[]:u.clipLine([Lt],ht.x,ht.y,pt.x,pt.y);}for(var Rt=0,Je=Vt;Rt<Je.length;Rt+=1){var De;bt.reset(Je[Rt],.25*ot),De=bt.length<=.5*ot?1:Math.ceil(bt.paddedLength/Nt)+1;for(var fr=0;fr<De;fr++){var nr=fr/Math.max(De-1,1),Ce=bt.lerp(nr),Ue=Ce.x+100,jr=Ce.y+100;F.push(Ue,jr,ot,0);var Sr=Ue-ot,hn=jr-ot,Cr=Ue+ot,Si=jr+ot;if(et=et&&this.isOffscreen(Sr,hn,Cr,Si),Q=Q||this.isInsideGrid(Sr,hn,Cr,Si),!i&&this.grid.hitTestCircle(Ue,jr,ot,P)&&(tt=!0,!v))return {circles:[],offscreen:!1,collisionDetected:tt}}}}return {circles:!v&&tt||!Q?[]:F,offscreen:et,collisionDetected:tt}},ei.prototype.queryRenderedSymbols=function(i){if(i.length===0||this.grid.keysLength()===0&&this.ignoredGrid.keysLength()===0)return {};for(var o=[],n=1/0,s=1/0,p=-1/0,f=-1/0,d=0,y=i;d<y.length;d+=1){var v=y[d],S=new u.Point(v.x+100,v.y+100);n=Math.min(n,S.x),s=Math.min(s,S.y),p=Math.max(p,S.x),f=Math.max(f,S.y),o.push(S);}for(var P={},z={},k=0,F=this.grid.query(n,s,p,f).concat(this.ignoredGrid.query(n,s,p,f));k<F.length;k+=1){var R=F[k],j=R.key;if(P[j.bucketInstanceId]===void 0&&(P[j.bucketInstanceId]={}),!P[j.bucketInstanceId][j.featureIndex]){var D=[new u.Point(R.x1,R.y1),new u.Point(R.x2,R.y1),new u.Point(R.x2,R.y2),new u.Point(R.x1,R.y2)];u.polygonIntersectsPolygon(o,D)&&(P[j.bucketInstanceId][j.featureIndex]=!0,z[j.bucketInstanceId]===void 0&&(z[j.bucketInstanceId]=[]),z[j.bucketInstanceId].push(j.featureIndex));}}return z},ei.prototype.insertCollisionBox=function(i,o,n,s,p){(o?this.ignoredGrid:this.grid).insert({bucketInstanceId:n,featureIndex:s,collisionGroupID:p},i[0],i[1],i[2],i[3]);},ei.prototype.insertCollisionCircles=function(i,o,n,s,p){for(var f=o?this.ignoredGrid:this.grid,d={bucketInstanceId:n,featureIndex:s,collisionGroupID:p},y=0;y<i.length;y+=4)f.insertCircle(d,i[y],i[y+1],i[y+2]);},ei.prototype.projectAndGetPerspectiveRatio=function(i,o,n){var s=[o,n,0,1];return rr(s,s,i),{point:new u.Point((s[0]/s[3]+1)/2*this.transform.width+100,(-s[1]/s[3]+1)/2*this.transform.height+100),perspectiveRatio:.5+this.transform.cameraToCenterDistance/s[3]*.5}},ei.prototype.isOffscreen=function(i,o,n,s){return n<100||i>=this.screenRightBoundary||s<100||o>this.screenBottomBoundary},ei.prototype.isInsideGrid=function(i,o,n,s){return n>=0&&i<this.gridRightBoundary&&s>=0&&o<this.gridBottomBoundary},ei.prototype.getViewportMatrix=function(){var i=u.identity([]);return u.translate(i,i,[-100,-100,0]),i};var gi=function(i,o,n,s){this.opacity=i?Math.max(0,Math.min(1,i.opacity+(i.placed?o:-o))):s&&n?1:0,this.placed=n;};gi.prototype.isHidden=function(){return this.opacity===0&&!this.placed};var Gr=function(i,o,n,s,p){this.text=new gi(i?i.text:null,o,n,p),this.icon=new gi(i?i.icon:null,o,s,p);};Gr.prototype.isHidden=function(){return this.text.isHidden()&&this.icon.isHidden()};var _l=function(i,o,n){this.text=i,this.icon=o,this.skipFade=n;},ri=function(){this.invProjMatrix=u.create(),this.viewportMatrix=u.create(),this.circles=[];},Cu=function(i,o,n,s,p){this.bucketInstanceId=i,this.featureIndex=o,this.sourceLayerIndex=n,this.bucketIndex=s,this.tileID=p;},Vi=function(i){this.crossSourceCollisions=i,this.maxGroupID=0,this.collisionGroups={};};function ur(i,o,n,s,p){var f=u.getAnchorAlignment(i),d=-(f.horizontalAlign-.5)*o,y=-(f.verticalAlign-.5)*n,v=u.evaluateVariableOffset(i,s);return new u.Point(d+v[0]*p,y+v[1]*p)}function Ai(i,o,n,s,p,f){var d=i.x1,y=i.x2,v=i.y1,S=i.y2,P=i.anchorPointX,z=i.anchorPointY,k=new u.Point(o,n);return s&&k._rotate(p?f:-f),{x1:d+k.x,y1:v+k.y,x2:y+k.x,y2:S+k.y,anchorPointX:P,anchorPointY:z}}Vi.prototype.get=function(i){if(this.crossSourceCollisions)return {ID:0,predicate:null};if(!this.collisionGroups[i]){var o=++this.maxGroupID;this.collisionGroups[i]={ID:o,predicate:function(n){return n.collisionGroupID===o}};}return this.collisionGroups[i]};var xr=function(i,o,n,s){this.transform=i.clone(),this.collisionIndex=new ei(this.transform),this.placements={},this.opacities={},this.variableOffsets={},this.stale=!1,this.commitTime=0,this.fadeDuration=o,this.retainedQueryData={},this.collisionGroups=new Vi(n),this.collisionCircleArrays={},this.prevPlacement=s,s&&(s.prevPlacement=void 0),this.placedOrientations={};};function zn(i,o,n,s,p){i.emplaceBack(o?1:0,n?1:0,s||0,p||0),i.emplaceBack(o?1:0,n?1:0,s||0,p||0),i.emplaceBack(o?1:0,n?1:0,s||0,p||0),i.emplaceBack(o?1:0,n?1:0,s||0,p||0);}xr.prototype.getBucketParts=function(i,o,n,s){var p=n.getBucket(o),f=n.latestFeatureIndex;if(p&&f&&o.id===p.layerIds[0]){var d=n.collisionBoxArray,y=p.layers[0].layout,v=Math.pow(2,this.transform.zoom-n.tileID.overscaledZ),S=n.tileSize/u.EXTENT,P=this.transform.calculatePosMatrix(n.tileID.toUnwrapped()),z=y.get("text-pitch-alignment")==="map",k=y.get("text-rotation-alignment")==="map",F=Te(n,1,this.transform.zoom),R=Fe(P,z,k,this.transform,F),j=null;if(z){var D=de(P,z,k,this.transform,F);j=u.multiply([],this.transform.labelPlaneMatrix,D);}this.retainedQueryData[p.bucketInstanceId]=new Cu(p.bucketInstanceId,f,p.sourceLayerIndex,p.index,n.tileID);var N={bucket:p,layout:y,posMatrix:P,textLabelPlaneMatrix:R,labelToScreenMatrix:j,scale:v,textPixelRatio:S,holdingForFade:n.holdingForFade(),collisionBoxArray:d,partiallyEvaluatedTextSize:u.evaluateSizeForZoom(p.textSizeData,this.transform.zoom),collisionGroup:this.collisionGroups.get(p.sourceID)};if(s)for(var G=0,K=p.sortKeyRanges;G<K.length;G+=1){var tt=K[G];i.push({sortKey:tt.sortKey,symbolInstanceStart:tt.symbolInstanceStart,symbolInstanceEnd:tt.symbolInstanceEnd,parameters:N});}else i.push({symbolInstanceStart:0,symbolInstanceEnd:p.symbolInstances.length,parameters:N});}},xr.prototype.attemptAnchorPlacement=function(i,o,n,s,p,f,d,y,v,S,P,z,k,F,R){var j,D=[z.textOffset0,z.textOffset1],N=ur(i,n,s,D,p),G=this.collisionIndex.placeCollisionBox(Ai(o,N.x,N.y,f,d,this.transform.angle),P,y,v,S.predicate);if(!R||this.collisionIndex.placeCollisionBox(Ai(R,N.x,N.y,f,d,this.transform.angle),P,y,v,S.predicate).box.length!==0)return G.box.length>0?(this.prevPlacement&&this.prevPlacement.variableOffsets[z.crossTileID]&&this.prevPlacement.placements[z.crossTileID]&&this.prevPlacement.placements[z.crossTileID].text&&(j=this.prevPlacement.variableOffsets[z.crossTileID].anchor),this.variableOffsets[z.crossTileID]={textOffset:D,width:n,height:s,anchor:i,textBoxScale:p,prevAnchor:j},this.markUsedJustification(k,i,z,F),k.allowVerticalPlacement&&(this.markUsedOrientation(k,F,z),this.placedOrientations[z.crossTileID]=F),{shift:N,placedGlyphBoxes:G}):void 0},xr.prototype.placeLayerBucketPart=function(i,o,n){var s=this,p=i.parameters,f=p.bucket,d=p.layout,y=p.posMatrix,v=p.textLabelPlaneMatrix,S=p.labelToScreenMatrix,P=p.textPixelRatio,z=p.holdingForFade,k=p.collisionBoxArray,F=p.partiallyEvaluatedTextSize,R=p.collisionGroup,j=d.get("text-optional"),D=d.get("icon-optional"),N=d.get("text-allow-overlap"),G=d.get("icon-allow-overlap"),K=d.get("text-rotation-alignment")==="map",tt=d.get("text-pitch-alignment")==="map",Q=d.get("icon-text-fit")!=="none",et=d.get("symbol-z-order")==="viewport-y",ot=N&&(G||!f.hasIconData()||D),ht=G&&(N||!f.hasTextData()||j);!f.collisionArrays&&k&&f.deserializeCollisionBoxes(k);var pt=function(wt,Nt){if(!o[wt.crossTileID])if(z)s.placements[wt.crossTileID]=new _l(!1,!1,!1);else {var Gt,Vt=!1,Ut=!1,Zt=!0,Ot=null,Rt={box:null,offscreen:null},Je={box:null,offscreen:null},De=null,fr=null,nr=0,Ce=0,Ue=0;Nt.textFeatureIndex?nr=Nt.textFeatureIndex:wt.useRuntimeCollisionCircles&&(nr=wt.featureIndex),Nt.verticalTextFeatureIndex&&(Ce=Nt.verticalTextFeatureIndex);var jr=Nt.textBox;if(jr){var Sr=function(ce){var Kr=u.WritingMode.horizontal;if(f.allowVerticalPlacement&&!ce&&s.prevPlacement){var kr=s.prevPlacement.placedOrientations[wt.crossTileID];kr&&(s.placedOrientations[wt.crossTileID]=kr,s.markUsedOrientation(f,Kr=kr,wt));}return Kr},hn=function(ce,Kr){if(f.allowVerticalPlacement&&wt.numVerticalGlyphVertices>0&&Nt.verticalTextBox)for(var kr=0,Wn=f.writingModes;kr<Wn.length&&(Wn[kr]===u.WritingMode.vertical?(Rt=Kr(),Je=Rt):Rt=ce(),!(Rt&&Rt.box&&Rt.box.length));kr+=1);else Rt=ce();};if(d.get("text-variable-anchor")){var Cr=d.get("text-variable-anchor");if(s.prevPlacement&&s.prevPlacement.variableOffsets[wt.crossTileID]){var Si=s.prevPlacement.variableOffsets[wt.crossTileID];Cr.indexOf(Si.anchor)>0&&(Cr=Cr.filter(function(ce){return ce!==Si.anchor})).unshift(Si.anchor);}var si=function(ce,Kr,kr){for(var Wn=ce.x2-ce.x1,Zu=ce.y2-ce.y1,Ga=wt.textBoxScale,Gu=Q&&!G?Kr:null,ua={box:[],offscreen:!1},Hl=N?2*Cr.length:Cr.length,Io=0;Io<Hl;++Io){var Xa=s.attemptAnchorPlacement(Cr[Io%Cr.length],ce,Wn,Zu,Ga,K,tt,P,y,R,Io>=Cr.length,wt,f,kr,Gu);if(Xa&&(ua=Xa.placedGlyphBoxes)&&ua.box&&ua.box.length){Vt=!0,Ot=Xa.shift;break}}return ua};hn(function(){return si(jr,Nt.iconBox,u.WritingMode.horizontal)},function(){var ce=Nt.verticalTextBox;return f.allowVerticalPlacement&&!(Rt&&Rt.box&&Rt.box.length)&&wt.numVerticalGlyphVertices>0&&ce?si(ce,Nt.verticalIconBox,u.WritingMode.vertical):{box:null,offscreen:null}}),Rt&&(Vt=Rt.box,Zt=Rt.offscreen);var aa=Sr(Rt&&Rt.box);if(!Vt&&s.prevPlacement){var So=s.prevPlacement.variableOffsets[wt.crossTileID];So&&(s.variableOffsets[wt.crossTileID]=So,s.markUsedJustification(f,So.anchor,wt,aa));}}else {var fn=function(ce,Kr){var kr=s.collisionIndex.placeCollisionBox(ce,N,P,y,R.predicate);return kr&&kr.box&&kr.box.length&&(s.markUsedOrientation(f,Kr,wt),s.placedOrientations[wt.crossTileID]=Kr),kr};hn(function(){return fn(jr,u.WritingMode.horizontal)},function(){var ce=Nt.verticalTextBox;return f.allowVerticalPlacement&&wt.numVerticalGlyphVertices>0&&ce?fn(ce,u.WritingMode.vertical):{box:null,offscreen:null}}),Sr(Rt&&Rt.box&&Rt.box.length);}}if(Vt=(Gt=Rt)&&Gt.box&&Gt.box.length>0,Zt=Gt&&Gt.offscreen,wt.useRuntimeCollisionCircles){var To=f.text.placedSymbolArray.get(wt.centerJustifiedTextSymbolIndex),sa=u.evaluateSizeForFeature(f.textSizeData,F,To),ki=d.get("text-padding");De=s.collisionIndex.placeCollisionCircles(N,To,f.lineVertexArray,f.glyphOffsetArray,sa,y,v,S,n,tt,R.predicate,wt.collisionCircleDiameter,ki),Vt=N||De.circles.length>0&&!De.collisionDetected,Zt=Zt&&De.offscreen;}if(Nt.iconFeatureIndex&&(Ue=Nt.iconFeatureIndex),Nt.iconBox){var la=function(ce){var Kr=Q&&Ot?Ai(ce,Ot.x,Ot.y,K,tt,s.transform.angle):ce;return s.collisionIndex.placeCollisionBox(Kr,G,P,y,R.predicate)};Ut=Je&&Je.box&&Je.box.length&&Nt.verticalIconBox?(fr=la(Nt.verticalIconBox)).box.length>0:(fr=la(Nt.iconBox)).box.length>0,Zt=Zt&&fr.offscreen;}var Mi=j||wt.numHorizontalGlyphVertices===0&&wt.numVerticalGlyphVertices===0,Ye=D||wt.numIconVertices===0;if(Mi||Ye?Ye?Mi||(Ut=Ut&&Vt):Vt=Ut&&Vt:Ut=Vt=Ut&&Vt,Vt&&Gt&&Gt.box&&s.collisionIndex.insertCollisionBox(Gt.box,d.get("text-ignore-placement"),f.bucketInstanceId,Je&&Je.box&&Ce?Ce:nr,R.ID),Ut&&fr&&s.collisionIndex.insertCollisionBox(fr.box,d.get("icon-ignore-placement"),f.bucketInstanceId,Ue,R.ID),De&&(Vt&&s.collisionIndex.insertCollisionCircles(De.circles,d.get("text-ignore-placement"),f.bucketInstanceId,nr,R.ID),n)){var Zi=f.bucketInstanceId,dn=s.collisionCircleArrays[Zi];dn===void 0&&(dn=s.collisionCircleArrays[Zi]=new ri);for(var Xn=0;Xn<De.circles.length;Xn+=4)dn.circles.push(De.circles[Xn+0]),dn.circles.push(De.circles[Xn+1]),dn.circles.push(De.circles[Xn+2]),dn.circles.push(De.collisionDetected?1:0);}s.placements[wt.crossTileID]=new _l(Vt||ot,Ut||ht,Zt||f.justReloaded),o[wt.crossTileID]=!0;}};if(et)for(var bt=f.getSortedSymbolIndexes(this.transform.angle),kt=bt.length-1;kt>=0;--kt){var Bt=bt[kt];pt(f.symbolInstances.get(Bt),f.collisionArrays[Bt]);}else for(var Lt=i.symbolInstanceStart;Lt<i.symbolInstanceEnd;Lt++)pt(f.symbolInstances.get(Lt),f.collisionArrays[Lt]);if(n&&f.bucketInstanceId in this.collisionCircleArrays){var ne=this.collisionCircleArrays[f.bucketInstanceId];u.invert(ne.invProjMatrix,y),ne.viewportMatrix=this.collisionIndex.getViewportMatrix();}f.justReloaded=!1;},xr.prototype.markUsedJustification=function(i,o,n,s){var p;p=s===u.WritingMode.vertical?n.verticalPlacedTextSymbolIndex:{left:n.leftJustifiedTextSymbolIndex,center:n.centerJustifiedTextSymbolIndex,right:n.rightJustifiedTextSymbolIndex}[u.getAnchorJustification(o)];for(var f=0,d=[n.leftJustifiedTextSymbolIndex,n.centerJustifiedTextSymbolIndex,n.rightJustifiedTextSymbolIndex,n.verticalPlacedTextSymbolIndex];f<d.length;f+=1){var y=d[f];y>=0&&(i.text.placedSymbolArray.get(y).crossTileID=p>=0&&y!==p?0:n.crossTileID);}},xr.prototype.markUsedOrientation=function(i,o,n){for(var s=o===u.WritingMode.horizontal||o===u.WritingMode.horizontalOnly?o:0,p=o===u.WritingMode.vertical?o:0,f=0,d=[n.leftJustifiedTextSymbolIndex,n.centerJustifiedTextSymbolIndex,n.rightJustifiedTextSymbolIndex];f<d.length;f+=1)i.text.placedSymbolArray.get(d[f]).placedOrientation=s;n.verticalPlacedTextSymbolIndex&&(i.text.placedSymbolArray.get(n.verticalPlacedTextSymbolIndex).placedOrientation=p);},xr.prototype.commit=function(i){this.commitTime=i,this.zoomAtLastRecencyCheck=this.transform.zoom;var o=this.prevPlacement,n=!1;this.prevZoomAdjustment=o?o.zoomAdjustment(this.transform.zoom):0;var s=o?o.symbolFadeChange(i):1,p=o?o.opacities:{},f=o?o.variableOffsets:{},d=o?o.placedOrientations:{};for(var y in this.placements){var v=this.placements[y],S=p[y];S?(this.opacities[y]=new Gr(S,s,v.text,v.icon),n=n||v.text!==S.text.placed||v.icon!==S.icon.placed):(this.opacities[y]=new Gr(null,s,v.text,v.icon,v.skipFade),n=n||v.text||v.icon);}for(var P in p){var z=p[P];if(!this.opacities[P]){var k=new Gr(z,s,!1,!1);k.isHidden()||(this.opacities[P]=k,n=n||z.text.placed||z.icon.placed);}}for(var F in f)this.variableOffsets[F]||!this.opacities[F]||this.opacities[F].isHidden()||(this.variableOffsets[F]=f[F]);for(var R in d)this.placedOrientations[R]||!this.opacities[R]||this.opacities[R].isHidden()||(this.placedOrientations[R]=d[R]);n?this.lastPlacementChangeTime=i:typeof this.lastPlacementChangeTime!="number"&&(this.lastPlacementChangeTime=o?o.lastPlacementChangeTime:i);},xr.prototype.updateLayerOpacities=function(i,o){for(var n={},s=0,p=o;s<p.length;s+=1){var f=p[s],d=f.getBucket(i);d&&f.latestFeatureIndex&&i.id===d.layerIds[0]&&this.updateBucketOpacities(d,n,f.collisionBoxArray);}},xr.prototype.updateBucketOpacities=function(i,o,n){var s=this;i.hasTextData()&&i.text.opacityVertexArray.clear(),i.hasIconData()&&i.icon.opacityVertexArray.clear(),i.hasIconCollisionBoxData()&&i.iconCollisionBox.collisionVertexArray.clear(),i.hasTextCollisionBoxData()&&i.textCollisionBox.collisionVertexArray.clear();var p=i.layers[0].layout,f=new Gr(null,0,!1,!1,!0),d=p.get("text-allow-overlap"),y=p.get("icon-allow-overlap"),v=p.get("text-variable-anchor"),S=p.get("text-rotation-alignment")==="map",P=p.get("text-pitch-alignment")==="map",z=p.get("icon-text-fit")!=="none",k=new Gr(null,0,d&&(y||!i.hasIconData()||p.get("icon-optional")),y&&(d||!i.hasTextData()||p.get("text-optional")),!0);!i.collisionArrays&&n&&(i.hasIconCollisionBoxData()||i.hasTextCollisionBoxData())&&i.deserializeCollisionBoxes(n);for(var F=function(N,G,K){for(var tt=0;tt<G/4;tt++)N.opacityVertexArray.emplaceBack(K);},R=function(N){var G=i.symbolInstances.get(N),K=G.numHorizontalGlyphVertices,tt=G.numVerticalGlyphVertices,Q=G.crossTileID,et=s.opacities[Q];o[Q]?et=f:et||(s.opacities[Q]=et=k),o[Q]=!0;var ot=G.numIconVertices>0,ht=s.placedOrientations[G.crossTileID],pt=ht===u.WritingMode.vertical,bt=ht===u.WritingMode.horizontal||ht===u.WritingMode.horizontalOnly;if(K>0||tt>0){var kt=bl(et.text);F(i.text,K,pt?po:kt),F(i.text,tt,bt?po:kt);var Bt=et.text.isHidden();[G.rightJustifiedTextSymbolIndex,G.centerJustifiedTextSymbolIndex,G.leftJustifiedTextSymbolIndex].forEach(function(Rt){Rt>=0&&(i.text.placedSymbolArray.get(Rt).hidden=Bt||pt?1:0);}),G.verticalPlacedTextSymbolIndex>=0&&(i.text.placedSymbolArray.get(G.verticalPlacedTextSymbolIndex).hidden=Bt||bt?1:0);var Lt=s.variableOffsets[G.crossTileID];Lt&&s.markUsedJustification(i,Lt.anchor,G,ht);var ne=s.placedOrientations[G.crossTileID];ne&&(s.markUsedJustification(i,"left",G,ne),s.markUsedOrientation(i,ne,G));}if(ot){var wt=bl(et.icon),Nt=!(z&&G.verticalPlacedIconSymbolIndex&&pt);G.placedIconSymbolIndex>=0&&(F(i.icon,G.numIconVertices,Nt?wt:po),i.icon.placedSymbolArray.get(G.placedIconSymbolIndex).hidden=et.icon.isHidden()),G.verticalPlacedIconSymbolIndex>=0&&(F(i.icon,G.numVerticalIconVertices,Nt?po:wt),i.icon.placedSymbolArray.get(G.verticalPlacedIconSymbolIndex).hidden=et.icon.isHidden());}if(i.hasIconCollisionBoxData()||i.hasTextCollisionBoxData()){var Gt=i.collisionArrays[N];if(Gt){var Vt=new u.Point(0,0);if(Gt.textBox||Gt.verticalTextBox){var Ut=!0;if(v){var Zt=s.variableOffsets[Q];Zt?(Vt=ur(Zt.anchor,Zt.width,Zt.height,Zt.textOffset,Zt.textBoxScale),S&&Vt._rotate(P?s.transform.angle:-s.transform.angle)):Ut=!1;}Gt.textBox&&zn(i.textCollisionBox.collisionVertexArray,et.text.placed,!Ut||pt,Vt.x,Vt.y),Gt.verticalTextBox&&zn(i.textCollisionBox.collisionVertexArray,et.text.placed,!Ut||bt,Vt.x,Vt.y);}var Ot=Boolean(!bt&&Gt.verticalIconBox);Gt.iconBox&&zn(i.iconCollisionBox.collisionVertexArray,et.icon.placed,Ot,z?Vt.x:0,z?Vt.y:0),Gt.verticalIconBox&&zn(i.iconCollisionBox.collisionVertexArray,et.icon.placed,!Ot,z?Vt.x:0,z?Vt.y:0);}}},j=0;j<i.symbolInstances.length;j++)R(j);if(i.sortFeatures(this.transform.angle),this.retainedQueryData[i.bucketInstanceId]&&(this.retainedQueryData[i.bucketInstanceId].featureSortOrder=i.featureSortOrder),i.hasTextData()&&i.text.opacityVertexBuffer&&i.text.opacityVertexBuffer.updateData(i.text.opacityVertexArray),i.hasIconData()&&i.icon.opacityVertexBuffer&&i.icon.opacityVertexBuffer.updateData(i.icon.opacityVertexArray),i.hasIconCollisionBoxData()&&i.iconCollisionBox.collisionVertexBuffer&&i.iconCollisionBox.collisionVertexBuffer.updateData(i.iconCollisionBox.collisionVertexArray),i.hasTextCollisionBoxData()&&i.textCollisionBox.collisionVertexBuffer&&i.textCollisionBox.collisionVertexBuffer.updateData(i.textCollisionBox.collisionVertexArray),i.bucketInstanceId in this.collisionCircleArrays){var D=this.collisionCircleArrays[i.bucketInstanceId];i.placementInvProjMatrix=D.invProjMatrix,i.placementViewportMatrix=D.viewportMatrix,i.collisionCircleArray=D.circles,delete this.collisionCircleArrays[i.bucketInstanceId];}},xr.prototype.symbolFadeChange=function(i){return this.fadeDuration===0?1:(i-this.commitTime)/this.fadeDuration+this.prevZoomAdjustment},xr.prototype.zoomAdjustment=function(i){return Math.max(0,(this.transform.zoom-i)/1.5)},xr.prototype.hasTransitions=function(i){return this.stale||i-this.lastPlacementChangeTime<this.fadeDuration},xr.prototype.stillRecent=function(i,o){var n=this.zoomAtLastRecencyCheck===o?1-this.zoomAdjustment(o):1;return this.zoomAtLastRecencyCheck=o,this.commitTime+this.fadeDuration*n>i},xr.prototype.setStale=function(){this.stale=!0;};var ku=Math.pow(2,25),Mu=Math.pow(2,24),Ss=Math.pow(2,17),Du=Math.pow(2,16),vl=Math.pow(2,9),Lu=Math.pow(2,8),xl=Math.pow(2,1);function bl(i){if(i.opacity===0&&!i.placed)return 0;if(i.opacity===1&&i.placed)return 4294967295;var o=i.placed?1:0,n=Math.floor(127*i.opacity);return n*ku+o*Mu+n*Ss+o*Du+n*vl+o*Lu+n*xl+o}var po=0,Ts=function(i){this._sortAcrossTiles=i.layout.get("symbol-z-order")!=="viewport-y"&&i.layout.get("symbol-sort-key").constantOr(1)!==void 0,this._currentTileIndex=0,this._currentPartIndex=0,this._seenCrossTileIDs={},this._bucketParts=[];};Ts.prototype.continuePlacement=function(i,o,n,s,p){for(var f=this._bucketParts;this._currentTileIndex<i.length;)if(o.getBucketParts(f,s,i[this._currentTileIndex],this._sortAcrossTiles),this._currentTileIndex++,p())return !0;for(this._sortAcrossTiles&&(this._sortAcrossTiles=!1,f.sort(function(d,y){return d.sortKey-y.sortKey}));this._currentPartIndex<f.length;)if(o.placeLayerBucketPart(f[this._currentPartIndex],this._seenCrossTileIDs,n),this._currentPartIndex++,p())return !0;return !1};var qo=function(i,o,n,s,p,f,d){this.placement=new xr(i,p,f,d),this._currentPlacementIndex=o.length-1,this._forceFullPlacement=n,this._showCollisionBoxes=s,this._done=!1;};qo.prototype.isDone=function(){return this._done},qo.prototype.continuePlacement=function(i,o,n){for(var s=this,p=u.browser.now(),f=function(){var v=u.browser.now()-p;return !s._forceFullPlacement&&v>2};this._currentPlacementIndex>=0;){var d=o[i[this._currentPlacementIndex]],y=this.placement.collisionIndex.transform.zoom;if(d.type==="symbol"&&(!d.minzoom||d.minzoom<=y)&&(!d.maxzoom||d.maxzoom>y)){if(this._inProgressLayer||(this._inProgressLayer=new Ts(d)),this._inProgressLayer.continuePlacement(n[d.source],this.placement,this._showCollisionBoxes,d,f))return;delete this._inProgressLayer;}this._currentPlacementIndex--;}this._done=!0;},qo.prototype.commit=function(i){return this.placement.commit(i),this.placement};var wl=512/u.EXTENT/2,Ia=function(i,o,n){this.tileID=i,this.indexedSymbolInstances={},this.bucketInstanceId=n;for(var s=0;s<o.length;s++){var p=o.get(s),f=p.key;this.indexedSymbolInstances[f]||(this.indexedSymbolInstances[f]=[]),this.indexedSymbolInstances[f].push({crossTileID:p.crossTileID,coord:this.getScaledCoordinates(p,i)});}};Ia.prototype.getScaledCoordinates=function(i,o){var n=wl/Math.pow(2,o.canonical.z-this.tileID.canonical.z);return {x:Math.floor((o.canonical.x*u.EXTENT+i.anchorX)*n),y:Math.floor((o.canonical.y*u.EXTENT+i.anchorY)*n)}},Ia.prototype.findMatches=function(i,o,n){for(var s=this.tileID.canonical.z<o.canonical.z?1:Math.pow(2,this.tileID.canonical.z-o.canonical.z),p=0;p<i.length;p++){var f=i.get(p);if(!f.crossTileID){var d=this.indexedSymbolInstances[f.key];if(d)for(var y=this.getScaledCoordinates(f,o),v=0,S=d;v<S.length;v+=1){var P=S[v];if(Math.abs(P.coord.x-y.x)<=s&&Math.abs(P.coord.y-y.y)<=s&&!n[P.crossTileID]){n[P.crossTileID]=!0,f.crossTileID=P.crossTileID;break}}}}};var ii=function(){this.maxCrossTileID=0;};ii.prototype.generate=function(){return ++this.maxCrossTileID};var Yi=function(){this.indexes={},this.usedCrossTileIDs={},this.lng=0;};Yi.prototype.handleWrapJump=function(i){var o=Math.round((i-this.lng)/360);if(o!==0)for(var n in this.indexes){var s=this.indexes[n],p={};for(var f in s){var d=s[f];d.tileID=d.tileID.unwrapTo(d.tileID.wrap+o),p[d.tileID.key]=d;}this.indexes[n]=p;}this.lng=i;},Yi.prototype.addBucket=function(i,o,n){if(this.indexes[i.overscaledZ]&&this.indexes[i.overscaledZ][i.key]){if(this.indexes[i.overscaledZ][i.key].bucketInstanceId===o.bucketInstanceId)return !1;this.removeBucketCrossTileIDs(i.overscaledZ,this.indexes[i.overscaledZ][i.key]);}for(var s=0;s<o.symbolInstances.length;s++)o.symbolInstances.get(s).crossTileID=0;this.usedCrossTileIDs[i.overscaledZ]||(this.usedCrossTileIDs[i.overscaledZ]={});var p=this.usedCrossTileIDs[i.overscaledZ];for(var f in this.indexes){var d=this.indexes[f];if(Number(f)>i.overscaledZ)for(var y in d){var v=d[y];v.tileID.isChildOf(i)&&v.findMatches(o.symbolInstances,i,p);}else {var S=d[i.scaledTo(Number(f)).key];S&&S.findMatches(o.symbolInstances,i,p);}}for(var P=0;P<o.symbolInstances.length;P++){var z=o.symbolInstances.get(P);z.crossTileID||(z.crossTileID=n.generate(),p[z.crossTileID]=!0);}return this.indexes[i.overscaledZ]===void 0&&(this.indexes[i.overscaledZ]={}),this.indexes[i.overscaledZ][i.key]=new Ia(i,o.symbolInstances,o.bucketInstanceId),!0},Yi.prototype.removeBucketCrossTileIDs=function(i,o){for(var n in o.indexedSymbolInstances)for(var s=0,p=o.indexedSymbolInstances[n];s<p.length;s+=1)delete this.usedCrossTileIDs[i][p[s].crossTileID];},Yi.prototype.removeStaleBuckets=function(i){var o=!1;for(var n in this.indexes){var s=this.indexes[n];for(var p in s)i[s[p].bucketInstanceId]||(this.removeBucketCrossTileIDs(n,s[p]),delete s[p],o=!0);}return o};var Qi=function(){this.layerIndexes={},this.crossTileIDs=new ii,this.maxBucketInstanceId=0,this.bucketsInCurrentPlacement={};};Qi.prototype.addLayer=function(i,o,n){var s=this.layerIndexes[i.id];s===void 0&&(s=this.layerIndexes[i.id]=new Yi);var p=!1,f={};s.handleWrapJump(n);for(var d=0,y=o;d<y.length;d+=1){var v=y[d],S=v.getBucket(i);S&&i.id===S.layerIds[0]&&(S.bucketInstanceId||(S.bucketInstanceId=++this.maxBucketInstanceId),s.addBucket(v.tileID,S,this.crossTileIDs)&&(p=!0),f[S.bucketInstanceId]=!0);}return s.removeStaleBuckets(f)&&(p=!0),p},Qi.prototype.pruneUnusedLayers=function(i){var o={};for(var n in i.forEach(function(s){o[s]=!0;}),this.layerIndexes)o[n]||delete this.layerIndexes[n];};var Cn=function(i,o){return u.emitValidationErrors(i,o&&o.filter(function(n){return n.identifier!=="source.canvas"}))},$i=u.pick(yt,["addLayer","removeLayer","setPaintProperty","setLayoutProperty","setFilter","addSource","removeSource","setLayerZoomRange","setLight","setTransition","setGeoJSONSourceData"]),tn=u.pick(yt,["setCenter","setZoom","setBearing","setPitch"]),Ea=function(){var i={},o=u.styleSpec.$version;for(var n in u.styleSpec.$root){var s,p=u.styleSpec.$root[n];p.required&&((s=n==="version"?o:p.type==="array"?[]:{})!=null&&(i[n]=s));}return i}(),Rr=function(i){function o(n,s){var p=this;s===void 0&&(s={}),i.call(this),this.map=n,this.dispatcher=new Br(it(),this),this.imageManager=new lr,this.imageManager.setEventedParent(this),this.glyphManager=new yr(n._requestManager,s.localIdeographFontFamily),this.lineAtlas=new Me(256,512),this.crossTileSymbolIndex=new Qi,this._layers={},this._serializedLayers={},this._order=[],this.sourceCaches={},this.zoomHistory=new u.ZoomHistory,this._loaded=!1,this._availableImages=[],this._resetUpdates(),this.dispatcher.broadcast("setReferrer",u.getReferrer());var f=this;this._rtlTextPluginCallback=o.registerForPluginStateChange(function(d){f.dispatcher.broadcast("syncRTLPluginState",{pluginStatus:d.pluginStatus,pluginURL:d.pluginURL},function(y,v){if(u.triggerPluginCompletionEvent(y),v&&v.every(function(P){return P}))for(var S in f.sourceCaches)f.sourceCaches[S].reload();});}),this.on("data",function(d){if(d.dataType==="source"&&d.sourceDataType==="metadata"){var y=p.sourceCaches[d.sourceId];if(y){var v=y.getSource();if(v&&v.vectorLayerIds)for(var S in p._layers){var P=p._layers[S];P.source===v.id&&p._validateLayer(P);}}}});}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.loadURL=function(n,s){var p=this;s===void 0&&(s={}),this.fire(new u.Event("dataloading",{dataType:"style"}));var f=typeof s.validate=="boolean"?s.validate:!u.isMapboxURL(n);n=this.map._requestManager.normalizeStyleURL(n,s.accessToken);var d=this.map._requestManager.transformRequest(n,u.ResourceType.Style);this._request=u.getJSON(d,function(y,v){p._request=null,y?p.fire(new u.ErrorEvent(y)):v&&p._load(v,f);});},o.prototype.loadJSON=function(n,s){var p=this;s===void 0&&(s={}),this.fire(new u.Event("dataloading",{dataType:"style"})),this._request=u.browser.frame(function(){p._request=null,p._load(n,s.validate!==!1);});},o.prototype.loadEmpty=function(){this.fire(new u.Event("dataloading",{dataType:"style"})),this._load(Ea,!1);},o.prototype._load=function(n,s){if(!s||!Cn(this,u.validateStyle(n))){for(var p in this._loaded=!0,this.stylesheet=n,n.sources)this.addSource(p,n.sources[p],{validate:!1});n.sprite?this._loadSprite(n.sprite):this.imageManager.setLoaded(!0),this.glyphManager.setURL(n.glyphs);var f=dt(this.stylesheet.layers);this._order=f.map(function(S){return S.id}),this._layers={},this._serializedLayers={};for(var d=0,y=f;d<y.length;d+=1){var v=y[d];(v=u.createStyleLayer(v)).setEventedParent(this,{layer:{id:v.id}}),this._layers[v.id]=v,this._serializedLayers[v.id]=v.serialize();}this.dispatcher.broadcast("setLayers",this._serializeLayers(this._order)),this.light=new io(this.stylesheet.light),this.fire(new u.Event("data",{dataType:"style"})),this.fire(new u.Event("style.load"));}},o.prototype._loadSprite=function(n){var s=this;this._spriteRequest=function(p,f,d){var y,v,S,P=u.browser.devicePixelRatio>1?"@2x":"",z=u.getJSON(f.transformRequest(f.normalizeSpriteURL(p,P,".json"),u.ResourceType.SpriteJSON),function(R,j){z=null,S||(S=R,y=j,F());}),k=u.getImage(f.transformRequest(f.normalizeSpriteURL(p,P,".png"),u.ResourceType.SpriteImage),function(R,j){k=null,S||(S=R,v=j,F());});function F(){if(S)d(S);else if(y&&v){var R=u.browser.getImageData(v),j={};for(var D in y){var N=y[D],G=N.width,K=N.height,tt=N.x,Q=N.y,et=N.sdf,ot=N.pixelRatio,ht=N.stretchX,pt=N.stretchY,bt=N.content,kt=new u.RGBAImage({width:G,height:K});u.RGBAImage.copy(R,kt,{x:tt,y:Q},{x:0,y:0},{width:G,height:K}),j[D]={data:kt,pixelRatio:ot,sdf:et,stretchX:ht,stretchY:pt,content:bt};}d(null,j);}}return {cancel:function(){z&&(z.cancel(),z=null),k&&(k.cancel(),k=null);}}}(n,this.map._requestManager,function(p,f){if(s._spriteRequest=null,p)s.fire(new u.ErrorEvent(p));else if(f)for(var d in f)s.imageManager.addImage(d,f[d]);s.imageManager.setLoaded(!0),s._availableImages=s.imageManager.listImages(),s.dispatcher.broadcast("setImages",s._availableImages),s.fire(new u.Event("data",{dataType:"style"}));});},o.prototype._validateLayer=function(n){var s=this.sourceCaches[n.source];if(s){var p=n.sourceLayer;if(p){var f=s.getSource();(f.type==="geojson"||f.vectorLayerIds&&f.vectorLayerIds.indexOf(p)===-1)&&this.fire(new u.ErrorEvent(new Error('Source layer "'+p+'" does not exist on source "'+f.id+'" as specified by style layer "'+n.id+'"')));}}},o.prototype.loaded=function(){if(!this._loaded)return !1;if(Object.keys(this._updatedSources).length)return !1;for(var n in this.sourceCaches)if(!this.sourceCaches[n].loaded())return !1;return !!this.imageManager.isLoaded()},o.prototype._serializeLayers=function(n){for(var s=[],p=0,f=n;p<f.length;p+=1){var d=this._layers[f[p]];d.type!=="custom"&&s.push(d.serialize());}return s},o.prototype.hasTransitions=function(){if(this.light&&this.light.hasTransition())return !0;for(var n in this.sourceCaches)if(this.sourceCaches[n].hasTransition())return !0;for(var s in this._layers)if(this._layers[s].hasTransition())return !0;return !1},o.prototype._checkLoaded=function(){if(!this._loaded)throw new Error("Style is not done loading")},o.prototype.update=function(n){if(this._loaded){var s=this._changed;if(this._changed){var p=Object.keys(this._updatedLayers),f=Object.keys(this._removedLayers);for(var d in (p.length||f.length)&&this._updateWorkerLayers(p,f),this._updatedSources){var y=this._updatedSources[d];y==="reload"?this._reloadSource(d):y==="clear"&&this._clearSource(d);}for(var v in this._updateTilesForChangedImages(),this._updatedPaintProps)this._layers[v].updateTransitions(n);this.light.updateTransitions(n),this._resetUpdates();}var S={};for(var P in this.sourceCaches){var z=this.sourceCaches[P];S[P]=z.used,z.used=!1;}for(var k=0,F=this._order;k<F.length;k+=1){var R=this._layers[F[k]];R.recalculate(n,this._availableImages),!R.isHidden(n.zoom)&&R.source&&(this.sourceCaches[R.source].used=!0);}for(var j in S){var D=this.sourceCaches[j];S[j]!==D.used&&D.fire(new u.Event("data",{sourceDataType:"visibility",dataType:"source",sourceId:j}));}this.light.recalculate(n),this.z=n.zoom,s&&this.fire(new u.Event("data",{dataType:"style"}));}},o.prototype._updateTilesForChangedImages=function(){var n=Object.keys(this._changedImages);if(n.length){for(var s in this.sourceCaches)this.sourceCaches[s].reloadTilesForDependencies(["icons","patterns"],n);this._changedImages={};}},o.prototype._updateWorkerLayers=function(n,s){this.dispatcher.broadcast("updateLayers",{layers:this._serializeLayers(n),removedIds:s});},o.prototype._resetUpdates=function(){this._changed=!1,this._updatedLayers={},this._removedLayers={},this._updatedSources={},this._updatedPaintProps={},this._changedImages={};},o.prototype.setState=function(n){var s=this;if(this._checkLoaded(),Cn(this,u.validateStyle(n)))return !1;(n=u.clone$1(n)).layers=dt(n.layers);var p=function(d,y){if(!d)return [{command:yt.setStyle,args:[y]}];var v=[];try{if(!u.deepEqual(d.version,y.version))return [{command:yt.setStyle,args:[y]}];u.deepEqual(d.center,y.center)||v.push({command:yt.setCenter,args:[y.center]}),u.deepEqual(d.zoom,y.zoom)||v.push({command:yt.setZoom,args:[y.zoom]}),u.deepEqual(d.bearing,y.bearing)||v.push({command:yt.setBearing,args:[y.bearing]}),u.deepEqual(d.pitch,y.pitch)||v.push({command:yt.setPitch,args:[y.pitch]}),u.deepEqual(d.sprite,y.sprite)||v.push({command:yt.setSprite,args:[y.sprite]}),u.deepEqual(d.glyphs,y.glyphs)||v.push({command:yt.setGlyphs,args:[y.glyphs]}),u.deepEqual(d.transition,y.transition)||v.push({command:yt.setTransition,args:[y.transition]}),u.deepEqual(d.light,y.light)||v.push({command:yt.setLight,args:[y.light]});var S={},P=[];!function(k,F,R,j){var D;for(D in F=F||{},k=k||{})k.hasOwnProperty(D)&&(F.hasOwnProperty(D)||_t(D,R,j));for(D in F)F.hasOwnProperty(D)&&(k.hasOwnProperty(D)?u.deepEqual(k[D],F[D])||(k[D].type==="geojson"&&F[D].type==="geojson"&&ge(k,F,D)?R.push({command:yt.setGeoJSONSourceData,args:[D,F[D].data]}):te(D,F,R,j)):Wt(D,F,R));}(d.sources,y.sources,P,S);var z=[];d.layers&&d.layers.forEach(function(k){S[k.source]?v.push({command:yt.removeLayer,args:[k.id]}):z.push(k);}),v=v.concat(P),function(k,F,R){F=F||[];var j,D,N,G,K,tt,Q,et=(k=k||[]).map(le),ot=F.map(le),ht=k.reduce(re,{}),pt=F.reduce(re,{}),bt=et.slice(),kt=Object.create(null);for(j=0,D=0;j<et.length;j++)pt.hasOwnProperty(N=et[j])?D++:(R.push({command:yt.removeLayer,args:[N]}),bt.splice(bt.indexOf(N,D),1));for(j=0,D=0;j<ot.length;j++)bt[bt.length-1-j]!==(N=ot[ot.length-1-j])&&(ht.hasOwnProperty(N)?(R.push({command:yt.removeLayer,args:[N]}),bt.splice(bt.lastIndexOf(N,bt.length-D),1)):D++,R.push({command:yt.addLayer,args:[pt[N],tt=bt[bt.length-j]]}),bt.splice(bt.length-j,0,N),kt[N]=!0);for(j=0;j<ot.length;j++)if(G=ht[N=ot[j]],K=pt[N],!kt[N]&&!u.deepEqual(G,K))if(u.deepEqual(G.source,K.source)&&u.deepEqual(G["source-layer"],K["source-layer"])&&u.deepEqual(G.type,K.type)){for(Q in Ht(G.layout,K.layout,R,N,null,yt.setLayoutProperty),Ht(G.paint,K.paint,R,N,null,yt.setPaintProperty),u.deepEqual(G.filter,K.filter)||R.push({command:yt.setFilter,args:[N,K.filter]}),u.deepEqual(G.minzoom,K.minzoom)&&u.deepEqual(G.maxzoom,K.maxzoom)||R.push({command:yt.setLayerZoomRange,args:[N,K.minzoom,K.maxzoom]}),G)G.hasOwnProperty(Q)&&Q!=="layout"&&Q!=="paint"&&Q!=="filter"&&Q!=="metadata"&&Q!=="minzoom"&&Q!=="maxzoom"&&(Q.indexOf("paint.")===0?Ht(G[Q],K[Q],R,N,Q.slice(6),yt.setPaintProperty):u.deepEqual(G[Q],K[Q])||R.push({command:yt.setLayerProperty,args:[N,Q,K[Q]]}));for(Q in K)K.hasOwnProperty(Q)&&!G.hasOwnProperty(Q)&&Q!=="layout"&&Q!=="paint"&&Q!=="filter"&&Q!=="metadata"&&Q!=="minzoom"&&Q!=="maxzoom"&&(Q.indexOf("paint.")===0?Ht(G[Q],K[Q],R,N,Q.slice(6),yt.setPaintProperty):u.deepEqual(G[Q],K[Q])||R.push({command:yt.setLayerProperty,args:[N,Q,K[Q]]}));}else R.push({command:yt.removeLayer,args:[N]}),tt=bt[bt.lastIndexOf(N)+1],R.push({command:yt.addLayer,args:[K,tt]});}(z,y.layers,v);}catch(k){console.warn("Unable to compute style diff:",k),v=[{command:yt.setStyle,args:[y]}];}return v}(this.serialize(),n).filter(function(d){return !(d.command in tn)});if(p.length===0)return !1;var f=p.filter(function(d){return !(d.command in $i)});if(f.length>0)throw new Error("Unimplemented: "+f.map(function(d){return d.command}).join(", ")+".");return p.forEach(function(d){d.command!=="setTransition"&&s[d.command].apply(s,d.args);}),this.stylesheet=n,!0},o.prototype.addImage=function(n,s){if(this.getImage(n))return this.fire(new u.ErrorEvent(new Error("An image with this name already exists.")));this.imageManager.addImage(n,s),this._afterImageUpdated(n);},o.prototype.updateImage=function(n,s){this.imageManager.updateImage(n,s);},o.prototype.getImage=function(n){return this.imageManager.getImage(n)},o.prototype.removeImage=function(n){if(!this.getImage(n))return this.fire(new u.ErrorEvent(new Error("No image with this name exists.")));this.imageManager.removeImage(n),this._afterImageUpdated(n);},o.prototype._afterImageUpdated=function(n){this._availableImages=this.imageManager.listImages(),this._changedImages[n]=!0,this._changed=!0,this.dispatcher.broadcast("setImages",this._availableImages),this.fire(new u.Event("data",{dataType:"style"}));},o.prototype.listImages=function(){return this._checkLoaded(),this.imageManager.listImages()},o.prototype.addSource=function(n,s,p){var f=this;if(p===void 0&&(p={}),this._checkLoaded(),this.sourceCaches[n]!==void 0)throw new Error("There is already a source with this ID");if(!s.type)throw new Error("The type property must be defined, but only the following properties were given: "+Object.keys(s).join(", ")+".");if(!(["vector","raster","geojson","video","image"].indexOf(s.type)>=0&&this._validate(u.validateStyle.source,"sources."+n,s,null,p))){this.map&&this.map._collectResourceTiming&&(s.collectResourceTiming=!0);var d=this.sourceCaches[n]=new U(n,s,this.dispatcher);d.style=this,d.setEventedParent(this,function(){return {isSourceLoaded:f.loaded(),source:d.serialize(),sourceId:n}}),d.onAdd(this.map),this._changed=!0;}},o.prototype.removeSource=function(n){if(this._checkLoaded(),this.sourceCaches[n]===void 0)throw new Error("There is no source with this ID");for(var s in this._layers)if(this._layers[s].source===n)return this.fire(new u.ErrorEvent(new Error('Source "'+n+'" cannot be removed while layer "'+s+'" is using it.')));var p=this.sourceCaches[n];delete this.sourceCaches[n],delete this._updatedSources[n],p.fire(new u.Event("data",{sourceDataType:"metadata",dataType:"source",sourceId:n})),p.setEventedParent(null),p.clearTiles(),p.onRemove&&p.onRemove(this.map),this._changed=!0;},o.prototype.setGeoJSONSourceData=function(n,s){this._checkLoaded(),this.sourceCaches[n].getSource().setData(s),this._changed=!0;},o.prototype.getSource=function(n){return this.sourceCaches[n]&&this.sourceCaches[n].getSource()},o.prototype.addLayer=function(n,s,p){p===void 0&&(p={}),this._checkLoaded();var f=n.id;if(this.getLayer(f))this.fire(new u.ErrorEvent(new Error('Layer with id "'+f+'" already exists on this map')));else {var d;if(n.type==="custom"){if(Cn(this,u.validateCustomStyleLayer(n)))return;d=u.createStyleLayer(n);}else {if(typeof n.source=="object"&&(this.addSource(f,n.source),n=u.clone$1(n),n=u.extend(n,{source:f})),this._validate(u.validateStyle.layer,"layers."+f,n,{arrayIndex:-1},p))return;d=u.createStyleLayer(n),this._validateLayer(d),d.setEventedParent(this,{layer:{id:f}}),this._serializedLayers[d.id]=d.serialize();}var y=s?this._order.indexOf(s):this._order.length;if(s&&y===-1)this.fire(new u.ErrorEvent(new Error('Layer with id "'+s+'" does not exist on this map.')));else {if(this._order.splice(y,0,f),this._layerOrderChanged=!0,this._layers[f]=d,this._removedLayers[f]&&d.source&&d.type!=="custom"){var v=this._removedLayers[f];delete this._removedLayers[f],v.type!==d.type?this._updatedSources[d.source]="clear":(this._updatedSources[d.source]="reload",this.sourceCaches[d.source].pause());}this._updateLayer(d),d.onAdd&&d.onAdd(this.map);}}},o.prototype.moveLayer=function(n,s){if(this._checkLoaded(),this._changed=!0,this._layers[n]){if(n!==s){var p=this._order.indexOf(n);this._order.splice(p,1);var f=s?this._order.indexOf(s):this._order.length;s&&f===-1?this.fire(new u.ErrorEvent(new Error('Layer with id "'+s+'" does not exist on this map.'))):(this._order.splice(f,0,n),this._layerOrderChanged=!0);}}else this.fire(new u.ErrorEvent(new Error("The layer '"+n+"' does not exist in the map's style and cannot be moved.")));},o.prototype.removeLayer=function(n){this._checkLoaded();var s=this._layers[n];if(s){s.setEventedParent(null);var p=this._order.indexOf(n);this._order.splice(p,1),this._layerOrderChanged=!0,this._changed=!0,this._removedLayers[n]=s,delete this._layers[n],delete this._serializedLayers[n],delete this._updatedLayers[n],delete this._updatedPaintProps[n],s.onRemove&&s.onRemove(this.map);}else this.fire(new u.ErrorEvent(new Error("The layer '"+n+"' does not exist in the map's style and cannot be removed.")));},o.prototype.getLayer=function(n){return this._layers[n]},o.prototype.hasLayer=function(n){return n in this._layers},o.prototype.setLayerZoomRange=function(n,s,p){this._checkLoaded();var f=this.getLayer(n);f?f.minzoom===s&&f.maxzoom===p||(s!=null&&(f.minzoom=s),p!=null&&(f.maxzoom=p),this._updateLayer(f)):this.fire(new u.ErrorEvent(new Error("The layer '"+n+"' does not exist in the map's style and cannot have zoom extent.")));},o.prototype.setFilter=function(n,s,p){p===void 0&&(p={}),this._checkLoaded();var f=this.getLayer(n);if(f){if(!u.deepEqual(f.filter,s))return s==null?(f.filter=void 0,void this._updateLayer(f)):void(this._validate(u.validateStyle.filter,"layers."+f.id+".filter",s,null,p)||(f.filter=u.clone$1(s),this._updateLayer(f)))}else this.fire(new u.ErrorEvent(new Error("The layer '"+n+"' does not exist in the map's style and cannot be filtered.")));},o.prototype.getFilter=function(n){return u.clone$1(this.getLayer(n).filter)},o.prototype.setLayoutProperty=function(n,s,p,f){f===void 0&&(f={}),this._checkLoaded();var d=this.getLayer(n);d?u.deepEqual(d.getLayoutProperty(s),p)||(d.setLayoutProperty(s,p,f),this._updateLayer(d)):this.fire(new u.ErrorEvent(new Error("The layer '"+n+"' does not exist in the map's style and cannot be styled.")));},o.prototype.getLayoutProperty=function(n,s){var p=this.getLayer(n);if(p)return p.getLayoutProperty(s);this.fire(new u.ErrorEvent(new Error("The layer '"+n+"' does not exist in the map's style.")));},o.prototype.setPaintProperty=function(n,s,p,f){f===void 0&&(f={}),this._checkLoaded();var d=this.getLayer(n);d?u.deepEqual(d.getPaintProperty(s),p)||(d.setPaintProperty(s,p,f)&&this._updateLayer(d),this._changed=!0,this._updatedPaintProps[n]=!0):this.fire(new u.ErrorEvent(new Error("The layer '"+n+"' does not exist in the map's style and cannot be styled.")));},o.prototype.getPaintProperty=function(n,s){return this.getLayer(n).getPaintProperty(s)},o.prototype.setFeatureState=function(n,s){this._checkLoaded();var p=n.source,f=n.sourceLayer,d=this.sourceCaches[p];if(d!==void 0){var y=d.getSource().type;y==="geojson"&&f?this.fire(new u.ErrorEvent(new Error("GeoJSON sources cannot have a sourceLayer parameter."))):y!=="vector"||f?(n.id===void 0&&this.fire(new u.ErrorEvent(new Error("The feature id parameter must be provided."))),d.setFeatureState(f,n.id,s)):this.fire(new u.ErrorEvent(new Error("The sourceLayer parameter must be provided for vector source types.")));}else this.fire(new u.ErrorEvent(new Error("The source '"+p+"' does not exist in the map's style.")));},o.prototype.removeFeatureState=function(n,s){this._checkLoaded();var p=n.source,f=this.sourceCaches[p];if(f!==void 0){var d=f.getSource().type,y=d==="vector"?n.sourceLayer:void 0;d!=="vector"||y?s&&typeof n.id!="string"&&typeof n.id!="number"?this.fire(new u.ErrorEvent(new Error("A feature id is required to remove its specific state property."))):f.removeFeatureState(y,n.id,s):this.fire(new u.ErrorEvent(new Error("The sourceLayer parameter must be provided for vector source types.")));}else this.fire(new u.ErrorEvent(new Error("The source '"+p+"' does not exist in the map's style.")));},o.prototype.getFeatureState=function(n){this._checkLoaded();var s=n.source,p=n.sourceLayer,f=this.sourceCaches[s];if(f!==void 0){if(f.getSource().type!=="vector"||p)return n.id===void 0&&this.fire(new u.ErrorEvent(new Error("The feature id parameter must be provided."))),f.getFeatureState(p,n.id);this.fire(new u.ErrorEvent(new Error("The sourceLayer parameter must be provided for vector source types.")));}else this.fire(new u.ErrorEvent(new Error("The source '"+s+"' does not exist in the map's style.")));},o.prototype.getTransition=function(){return u.extend({duration:300,delay:0},this.stylesheet&&this.stylesheet.transition)},o.prototype.serialize=function(){return u.filterObject({version:this.stylesheet.version,name:this.stylesheet.name,metadata:this.stylesheet.metadata,light:this.stylesheet.light,center:this.stylesheet.center,zoom:this.stylesheet.zoom,bearing:this.stylesheet.bearing,pitch:this.stylesheet.pitch,sprite:this.stylesheet.sprite,glyphs:this.stylesheet.glyphs,transition:this.stylesheet.transition,sources:u.mapObject(this.sourceCaches,function(n){return n.serialize()}),layers:this._serializeLayers(this._order)},function(n){return n!==void 0})},o.prototype._updateLayer=function(n){this._updatedLayers[n.id]=!0,n.source&&!this._updatedSources[n.source]&&this.sourceCaches[n.source].getSource().type!=="raster"&&(this._updatedSources[n.source]="reload",this.sourceCaches[n.source].pause()),this._changed=!0;},o.prototype._flattenAndSortRenderedFeatures=function(n){for(var s=this,p=function(ht){return s._layers[ht].type==="fill-extrusion"},f={},d=[],y=this._order.length-1;y>=0;y--){var v=this._order[y];if(p(v)){f[v]=y;for(var S=0,P=n;S<P.length;S+=1){var z=P[S][v];if(z)for(var k=0,F=z;k<F.length;k+=1)d.push(F[k]);}}}d.sort(function(ht,pt){return pt.intersectionZ-ht.intersectionZ});for(var R=[],j=this._order.length-1;j>=0;j--){var D=this._order[j];if(p(D))for(var N=d.length-1;N>=0;N--){var G=d[N].feature;if(f[G.layer.id]<j)break;R.push(G),d.pop();}else for(var K=0,tt=n;K<tt.length;K+=1){var Q=tt[K][D];if(Q)for(var et=0,ot=Q;et<ot.length;et+=1)R.push(ot[et].feature);}}return R},o.prototype.queryRenderedFeatures=function(n,s,p){s&&s.filter&&this._validate(u.validateStyle.filter,"queryRenderedFeatures.filter",s.filter,null,s);var f={};if(s&&s.layers){if(!Array.isArray(s.layers))return this.fire(new u.ErrorEvent(new Error("parameters.layers must be an Array."))),[];for(var d=0,y=s.layers;d<y.length;d+=1){var v=y[d],S=this._layers[v];if(!S)return this.fire(new u.ErrorEvent(new Error("The layer '"+v+"' does not exist in the map's style and cannot be queried for features."))),[];f[S.source]=!0;}}var P=[];for(var z in s.availableImages=this._availableImages,this.sourceCaches)s.layers&&!f[z]||P.push(gr(this.sourceCaches[z],this._layers,this._serializedLayers,n,s,p));return this.placement&&P.push(function(k,F,R,j,D,N,G){for(var K={},tt=N.queryRenderedSymbols(j),Q=[],et=0,ot=Object.keys(tt).map(Number);et<ot.length;et+=1)Q.push(G[ot[et]]);Q.sort(Fi);for(var ht=function(){var Lt=bt[pt],ne=Lt.featureIndex.lookupSymbolFeatures(tt[Lt.bucketInstanceId],F,Lt.bucketIndex,Lt.sourceLayerIndex,D.filter,D.layers,D.availableImages,k);for(var wt in ne){var Nt=K[wt]=K[wt]||[],Gt=ne[wt];Gt.sort(function(Zt,Ot){var Rt=Lt.featureSortOrder;if(Rt){var Je=Rt.indexOf(Zt.featureIndex);return Rt.indexOf(Ot.featureIndex)-Je}return Ot.featureIndex-Zt.featureIndex});for(var Vt=0,Ut=Gt;Vt<Ut.length;Vt+=1)Nt.push(Ut[Vt]);}},pt=0,bt=Q;pt<bt.length;pt+=1)ht();var kt=function(Lt){K[Lt].forEach(function(ne){var wt=ne.feature,Nt=R[k[Lt].source].getFeatureState(wt.layer["source-layer"],wt.id);wt.source=wt.layer.source,wt.layer["source-layer"]&&(wt.sourceLayer=wt.layer["source-layer"]),wt.state=Nt;});};for(var Bt in K)kt(Bt);return K}(this._layers,this._serializedLayers,this.sourceCaches,n,s,this.placement.collisionIndex,this.placement.retainedQueryData)),this._flattenAndSortRenderedFeatures(P)},o.prototype.querySourceFeatures=function(n,s){s&&s.filter&&this._validate(u.validateStyle.filter,"querySourceFeatures.filter",s.filter,null,s);var p=this.sourceCaches[n];return p?function(f,d){for(var y=f.getRenderableIds().map(function(F){return f.getTileByID(F)}),v=[],S={},P=0;P<y.length;P++){var z=y[P],k=z.tileID.canonical.key;S[k]||(S[k]=!0,z.querySourceFeatures(v,d));}return v}(p,s):[]},o.prototype.addSourceType=function(n,s,p){return o.getSourceType(n)?p(new Error('A source type called "'+n+'" already exists.')):(o.setSourceType(n,s),s.workerSourceURL?void this.dispatcher.broadcast("loadWorkerSource",{name:n,url:s.workerSourceURL},p):p(null,null))},o.prototype.getLight=function(){return this.light.getLight()},o.prototype.setLight=function(n,s){s===void 0&&(s={}),this._checkLoaded();var p=this.light.getLight(),f=!1;for(var d in n)if(!u.deepEqual(n[d],p[d])){f=!0;break}if(f){var y={now:u.browser.now(),transition:u.extend({duration:300,delay:0},this.stylesheet.transition)};this.light.setLight(n,s),this.light.updateTransitions(y);}},o.prototype._validate=function(n,s,p,f,d){return d===void 0&&(d={}),(!d||d.validate!==!1)&&Cn(this,n.call(u.validateStyle,u.extend({key:s,style:this.serialize(),value:p,styleSpec:u.styleSpec},f)))},o.prototype._remove=function(){for(var n in this._request&&(this._request.cancel(),this._request=null),this._spriteRequest&&(this._spriteRequest.cancel(),this._spriteRequest=null),u.evented.off("pluginStateChange",this._rtlTextPluginCallback),this._layers)this._layers[n].setEventedParent(null);for(var s in this.sourceCaches)this.sourceCaches[s].clearTiles(),this.sourceCaches[s].setEventedParent(null);this.imageManager.setEventedParent(null),this.setEventedParent(null),this.dispatcher.remove();},o.prototype._clearSource=function(n){this.sourceCaches[n].clearTiles();},o.prototype._reloadSource=function(n){this.sourceCaches[n].resume(),this.sourceCaches[n].reload();},o.prototype._updateSources=function(n){for(var s in this.sourceCaches)this.sourceCaches[s].update(n);},o.prototype._generateCollisionBoxes=function(){for(var n in this.sourceCaches)this._reloadSource(n);},o.prototype._updatePlacement=function(n,s,p,f,d){d===void 0&&(d=!1);for(var y=!1,v=!1,S={},P=0,z=this._order;P<z.length;P+=1){var k=this._layers[z[P]];if(k.type==="symbol"){if(!S[k.source]){var F=this.sourceCaches[k.source];S[k.source]=F.getRenderableIds(!0).map(function(G){return F.getTileByID(G)}).sort(function(G,K){return K.tileID.overscaledZ-G.tileID.overscaledZ||(G.tileID.isLessThan(K.tileID)?-1:1)});}var R=this.crossTileSymbolIndex.addLayer(k,S[k.source],n.center.lng);y=y||R;}}if(this.crossTileSymbolIndex.pruneUnusedLayers(this._order),((d=d||this._layerOrderChanged||p===0)||!this.pauseablePlacement||this.pauseablePlacement.isDone()&&!this.placement.stillRecent(u.browser.now(),n.zoom))&&(this.pauseablePlacement=new qo(n,this._order,d,s,p,f,this.placement),this._layerOrderChanged=!1),this.pauseablePlacement.isDone()?this.placement.setStale():(this.pauseablePlacement.continuePlacement(this._order,this._layers,S),this.pauseablePlacement.isDone()&&(this.placement=this.pauseablePlacement.commit(u.browser.now()),v=!0),y&&this.pauseablePlacement.placement.setStale()),v||y)for(var j=0,D=this._order;j<D.length;j+=1){var N=this._layers[D[j]];N.type==="symbol"&&this.placement.updateLayerOpacities(N,S[N.source]);}return !this.pauseablePlacement.isDone()||this.placement.hasTransitions(u.browser.now())},o.prototype._releaseSymbolFadeTiles=function(){for(var n in this.sourceCaches)this.sourceCaches[n].releaseSymbolFadeTiles();},o.prototype.getImages=function(n,s,p){this.imageManager.getImages(s.icons,p),this._updateTilesForChangedImages();var f=this.sourceCaches[s.source];f&&f.setDependencies(s.tileID.key,s.type,s.icons);},o.prototype.getGlyphs=function(n,s,p){this.glyphManager.getGlyphs(s.stacks,p);},o.prototype.getResource=function(n,s,p){return u.makeRequest(s,p)},o}(u.Evented);Rr.getSourceType=function(i){return Hi[i]},Rr.setSourceType=function(i,o){Hi[i]=o;},Rr.registerForPluginStateChange=u.registerForPluginStateChange;var qe=u.createLayout([{name:"a_pos",type:"Int16",components:2}]),ho=_e(`#ifdef GL_ES
precision mediump float;
#else
#if !defined(lowp)
#define lowp
#endif
#if !defined(mediump)
#define mediump
#endif
#if !defined(highp)
#define highp
#endif
#endif`,`#ifdef GL_ES
precision highp float;
#else
#if !defined(lowp)
#define lowp
#endif
#if !defined(mediump)
#define mediump
#endif
#if !defined(highp)
#define highp
#endif
#endif
vec2 unpack_float(const float packedValue) {int packedIntValue=int(packedValue);int v0=packedIntValue/256;return vec2(v0,packedIntValue-v0*256);}vec2 unpack_opacity(const float packedOpacity) {int intOpacity=int(packedOpacity)/2;return vec2(float(intOpacity)/127.0,mod(packedOpacity,2.0));}vec4 decode_color(const vec2 encodedColor) {return vec4(unpack_float(encodedColor[0])/255.0,unpack_float(encodedColor[1])/255.0
);}float unpack_mix_vec2(const vec2 packedValue,const float t) {return mix(packedValue[0],packedValue[1],t);}vec4 unpack_mix_color(const vec4 packedColors,const float t) {vec4 minColor=decode_color(vec2(packedColors[0],packedColors[1]));vec4 maxColor=decode_color(vec2(packedColors[2],packedColors[3]));return mix(minColor,maxColor,t);}vec2 get_pattern_pos(const vec2 pixel_coord_upper,const vec2 pixel_coord_lower,const vec2 pattern_size,const float tile_units_to_pixels,const vec2 pos) {vec2 offset=mod(mod(mod(pixel_coord_upper,pattern_size)*256.0,pattern_size)*256.0+pixel_coord_lower,pattern_size);return (tile_units_to_pixels*pos+offset)/pattern_size;}`),Sl=_e(`uniform vec4 u_color;uniform float u_opacity;void main() {gl_FragColor=u_color*u_opacity;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,"attribute vec2 a_pos;uniform mat4 u_matrix;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);}"),Bu=_e(`uniform vec2 u_pattern_tl_a;uniform vec2 u_pattern_br_a;uniform vec2 u_pattern_tl_b;uniform vec2 u_pattern_br_b;uniform vec2 u_texsize;uniform float u_mix;uniform float u_opacity;uniform sampler2D u_image;varying vec2 v_pos_a;varying vec2 v_pos_b;void main() {vec2 imagecoord=mod(v_pos_a,1.0);vec2 pos=mix(u_pattern_tl_a/u_texsize,u_pattern_br_a/u_texsize,imagecoord);vec4 color1=texture2D(u_image,pos);vec2 imagecoord_b=mod(v_pos_b,1.0);vec2 pos2=mix(u_pattern_tl_b/u_texsize,u_pattern_br_b/u_texsize,imagecoord_b);vec4 color2=texture2D(u_image,pos2);gl_FragColor=mix(color1,color2,u_mix)*u_opacity;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,"uniform mat4 u_matrix;uniform vec2 u_pattern_size_a;uniform vec2 u_pattern_size_b;uniform vec2 u_pixel_coord_upper;uniform vec2 u_pixel_coord_lower;uniform float u_scale_a;uniform float u_scale_b;uniform float u_tile_units_to_pixels;attribute vec2 a_pos;varying vec2 v_pos_a;varying vec2 v_pos_b;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);v_pos_a=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,u_scale_a*u_pattern_size_a,u_tile_units_to_pixels,a_pos);v_pos_b=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,u_scale_b*u_pattern_size_b,u_tile_units_to_pixels,a_pos);}"),Ru=_e(`varying vec3 v_data;
#pragma mapbox: define highp vec4 color
#pragma mapbox: define mediump float radius
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
#pragma mapbox: define highp vec4 stroke_color
#pragma mapbox: define mediump float stroke_width
#pragma mapbox: define lowp float stroke_opacity
void main() {
#pragma mapbox: initialize highp vec4 color
#pragma mapbox: initialize mediump float radius
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize highp vec4 stroke_color
#pragma mapbox: initialize mediump float stroke_width
#pragma mapbox: initialize lowp float stroke_opacity
vec2 extrude=v_data.xy;float extrude_length=length(extrude);lowp float antialiasblur=v_data.z;float antialiased_blur=-max(blur,antialiasblur);float opacity_t=smoothstep(0.0,antialiased_blur,extrude_length-1.0);float color_t=stroke_width < 0.01 ? 0.0 : smoothstep(antialiased_blur,0.0,extrude_length-radius/(radius+stroke_width));gl_FragColor=opacity_t*mix(color*opacity,stroke_color*stroke_opacity,color_t);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`uniform mat4 u_matrix;uniform bool u_scale_with_map;uniform bool u_pitch_with_map;uniform vec2 u_extrude_scale;uniform lowp float u_device_pixel_ratio;uniform highp float u_camera_to_center_distance;attribute vec2 a_pos;varying vec3 v_data;
#pragma mapbox: define highp vec4 color
#pragma mapbox: define mediump float radius
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
#pragma mapbox: define highp vec4 stroke_color
#pragma mapbox: define mediump float stroke_width
#pragma mapbox: define lowp float stroke_opacity
void main(void) {
#pragma mapbox: initialize highp vec4 color
#pragma mapbox: initialize mediump float radius
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize highp vec4 stroke_color
#pragma mapbox: initialize mediump float stroke_width
#pragma mapbox: initialize lowp float stroke_opacity
vec2 extrude=vec2(mod(a_pos,2.0)*2.0-1.0);vec2 circle_center=floor(a_pos*0.5);if (u_pitch_with_map) {vec2 corner_position=circle_center;if (u_scale_with_map) {corner_position+=extrude*(radius+stroke_width)*u_extrude_scale;} else {vec4 projected_center=u_matrix*vec4(circle_center,0,1);corner_position+=extrude*(radius+stroke_width)*u_extrude_scale*(projected_center.w/u_camera_to_center_distance);}gl_Position=u_matrix*vec4(corner_position,0,1);} else {gl_Position=u_matrix*vec4(circle_center,0,1);if (u_scale_with_map) {gl_Position.xy+=extrude*(radius+stroke_width)*u_extrude_scale*u_camera_to_center_distance;} else {gl_Position.xy+=extrude*(radius+stroke_width)*u_extrude_scale*gl_Position.w;}}lowp float antialiasblur=1.0/u_device_pixel_ratio/(radius+stroke_width);v_data=vec3(extrude.x,extrude.y,antialiasblur);}`),Is=_e("void main() {gl_FragColor=vec4(1.0);}","attribute vec2 a_pos;uniform mat4 u_matrix;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);}"),Es=_e(`uniform highp float u_intensity;varying vec2 v_extrude;
#pragma mapbox: define highp float weight
#define GAUSS_COEF 0.3989422804014327
void main() {
#pragma mapbox: initialize highp float weight
float d=-0.5*3.0*3.0*dot(v_extrude,v_extrude);float val=weight*u_intensity*GAUSS_COEF*exp(d);gl_FragColor=vec4(val,1.0,1.0,1.0);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`uniform mat4 u_matrix;uniform float u_extrude_scale;uniform float u_opacity;uniform float u_intensity;attribute vec2 a_pos;varying vec2 v_extrude;
#pragma mapbox: define highp float weight
#pragma mapbox: define mediump float radius
const highp float ZERO=1.0/255.0/16.0;
#define GAUSS_COEF 0.3989422804014327
void main(void) {
#pragma mapbox: initialize highp float weight
#pragma mapbox: initialize mediump float radius
vec2 unscaled_extrude=vec2(mod(a_pos,2.0)*2.0-1.0);float S=sqrt(-2.0*log(ZERO/weight/u_intensity/GAUSS_COEF))/3.0;v_extrude=S*unscaled_extrude;vec2 extrude=v_extrude*radius*u_extrude_scale;vec4 pos=vec4(floor(a_pos*0.5)+extrude,0,1);gl_Position=u_matrix*pos;}`),As=_e(`uniform sampler2D u_image;uniform sampler2D u_color_ramp;uniform float u_opacity;varying vec2 v_pos;void main() {float t=texture2D(u_image,v_pos).r;vec4 color=texture2D(u_color_ramp,vec2(t,0.5));gl_FragColor=color*u_opacity;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(0.0);
#endif
}`,"uniform mat4 u_matrix;uniform vec2 u_world;attribute vec2 a_pos;varying vec2 v_pos;void main() {gl_Position=u_matrix*vec4(a_pos*u_world,0,1);v_pos.x=a_pos.x;v_pos.y=1.0-a_pos.y;}"),Ps=_e("varying float v_placed;varying float v_notUsed;void main() {float alpha=0.5;gl_FragColor=vec4(1.0,0.0,0.0,1.0)*alpha;if (v_placed > 0.5) {gl_FragColor=vec4(0.0,0.0,1.0,0.5)*alpha;}if (v_notUsed > 0.5) {gl_FragColor*=.1;}}","attribute vec2 a_pos;attribute vec2 a_anchor_pos;attribute vec2 a_extrude;attribute vec2 a_placed;attribute vec2 a_shift;uniform mat4 u_matrix;uniform vec2 u_extrude_scale;uniform float u_camera_to_center_distance;varying float v_placed;varying float v_notUsed;void main() {vec4 projectedPoint=u_matrix*vec4(a_anchor_pos,0,1);highp float camera_to_anchor_distance=projectedPoint.w;highp float collision_perspective_ratio=clamp(0.5+0.5*(u_camera_to_center_distance/camera_to_anchor_distance),0.0,4.0);gl_Position=u_matrix*vec4(a_pos,0.0,1.0);gl_Position.xy+=(a_extrude+a_shift)*u_extrude_scale*gl_Position.w*collision_perspective_ratio;v_placed=a_placed.x;v_notUsed=a_placed.y;}"),Tl=_e("varying float v_radius;varying vec2 v_extrude;varying float v_perspective_ratio;varying float v_collision;void main() {float alpha=0.5*min(v_perspective_ratio,1.0);float stroke_radius=0.9*max(v_perspective_ratio,1.0);float distance_to_center=length(v_extrude);float distance_to_edge=abs(distance_to_center-v_radius);float opacity_t=smoothstep(-stroke_radius,0.0,-distance_to_edge);vec4 color=mix(vec4(0.0,0.0,1.0,0.5),vec4(1.0,0.0,0.0,1.0),v_collision);gl_FragColor=color*alpha*opacity_t;}","attribute vec2 a_pos;attribute float a_radius;attribute vec2 a_flags;uniform mat4 u_matrix;uniform mat4 u_inv_matrix;uniform vec2 u_viewport_size;uniform float u_camera_to_center_distance;varying float v_radius;varying vec2 v_extrude;varying float v_perspective_ratio;varying float v_collision;vec3 toTilePosition(vec2 screenPos) {vec4 rayStart=u_inv_matrix*vec4(screenPos,-1.0,1.0);vec4 rayEnd  =u_inv_matrix*vec4(screenPos, 1.0,1.0);rayStart.xyz/=rayStart.w;rayEnd.xyz  /=rayEnd.w;highp float t=(0.0-rayStart.z)/(rayEnd.z-rayStart.z);return mix(rayStart.xyz,rayEnd.xyz,t);}void main() {vec2 quadCenterPos=a_pos;float radius=a_radius;float collision=a_flags.x;float vertexIdx=a_flags.y;vec2 quadVertexOffset=vec2(mix(-1.0,1.0,float(vertexIdx >=2.0)),mix(-1.0,1.0,float(vertexIdx >=1.0 && vertexIdx <=2.0)));vec2 quadVertexExtent=quadVertexOffset*radius;vec3 tilePos=toTilePosition(quadCenterPos);vec4 clipPos=u_matrix*vec4(tilePos,1.0);highp float camera_to_anchor_distance=clipPos.w;highp float collision_perspective_ratio=clamp(0.5+0.5*(u_camera_to_center_distance/camera_to_anchor_distance),0.0,4.0);float padding_factor=1.2;v_radius=radius;v_extrude=quadVertexExtent*padding_factor;v_perspective_ratio=collision_perspective_ratio;v_collision=collision;gl_Position=vec4(clipPos.xyz/clipPos.w,1.0)+vec4(quadVertexExtent*padding_factor/u_viewport_size*2.0,0.0,0.0);}"),Il=_e("uniform highp vec4 u_color;uniform sampler2D u_overlay;varying vec2 v_uv;void main() {vec4 overlay_color=texture2D(u_overlay,v_uv);gl_FragColor=mix(u_color,overlay_color,overlay_color.a);}","attribute vec2 a_pos;varying vec2 v_uv;uniform mat4 u_matrix;uniform float u_overlay_scale;void main() {v_uv=a_pos/8192.0;gl_Position=u_matrix*vec4(a_pos*u_overlay_scale,0,1);}"),Fu=_e(`#pragma mapbox: define highp vec4 color
#pragma mapbox: define lowp float opacity
void main() {
#pragma mapbox: initialize highp vec4 color
#pragma mapbox: initialize lowp float opacity
gl_FragColor=color*opacity;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`attribute vec2 a_pos;uniform mat4 u_matrix;
#pragma mapbox: define highp vec4 color
#pragma mapbox: define lowp float opacity
void main() {
#pragma mapbox: initialize highp vec4 color
#pragma mapbox: initialize lowp float opacity
gl_Position=u_matrix*vec4(a_pos,0,1);}`),Zo=_e(`varying vec2 v_pos;
#pragma mapbox: define highp vec4 outline_color
#pragma mapbox: define lowp float opacity
void main() {
#pragma mapbox: initialize highp vec4 outline_color
#pragma mapbox: initialize lowp float opacity
float dist=length(v_pos-gl_FragCoord.xy);float alpha=1.0-smoothstep(0.0,1.0,dist);gl_FragColor=outline_color*(alpha*opacity);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`attribute vec2 a_pos;uniform mat4 u_matrix;uniform vec2 u_world;varying vec2 v_pos;
#pragma mapbox: define highp vec4 outline_color
#pragma mapbox: define lowp float opacity
void main() {
#pragma mapbox: initialize highp vec4 outline_color
#pragma mapbox: initialize lowp float opacity
gl_Position=u_matrix*vec4(a_pos,0,1);v_pos=(gl_Position.xy/gl_Position.w+1.0)/2.0*u_world;}`),Go=_e(`uniform vec2 u_texsize;uniform sampler2D u_image;uniform float u_fade;varying vec2 v_pos_a;varying vec2 v_pos_b;varying vec2 v_pos;
#pragma mapbox: define lowp float opacity
#pragma mapbox: define lowp vec4 pattern_from
#pragma mapbox: define lowp vec4 pattern_to
void main() {
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize mediump vec4 pattern_from
#pragma mapbox: initialize mediump vec4 pattern_to
vec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;vec2 imagecoord=mod(v_pos_a,1.0);vec2 pos=mix(pattern_tl_a/u_texsize,pattern_br_a/u_texsize,imagecoord);vec4 color1=texture2D(u_image,pos);vec2 imagecoord_b=mod(v_pos_b,1.0);vec2 pos2=mix(pattern_tl_b/u_texsize,pattern_br_b/u_texsize,imagecoord_b);vec4 color2=texture2D(u_image,pos2);float dist=length(v_pos-gl_FragCoord.xy);float alpha=1.0-smoothstep(0.0,1.0,dist);gl_FragColor=mix(color1,color2,u_fade)*alpha*opacity;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`uniform mat4 u_matrix;uniform vec2 u_world;uniform vec2 u_pixel_coord_upper;uniform vec2 u_pixel_coord_lower;uniform vec3 u_scale;attribute vec2 a_pos;varying vec2 v_pos_a;varying vec2 v_pos_b;varying vec2 v_pos;
#pragma mapbox: define lowp float opacity
#pragma mapbox: define lowp vec4 pattern_from
#pragma mapbox: define lowp vec4 pattern_to
#pragma mapbox: define lowp float pixel_ratio_from
#pragma mapbox: define lowp float pixel_ratio_to
void main() {
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize mediump vec4 pattern_from
#pragma mapbox: initialize mediump vec4 pattern_to
#pragma mapbox: initialize lowp float pixel_ratio_from
#pragma mapbox: initialize lowp float pixel_ratio_to
vec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;float tileRatio=u_scale.x;float fromScale=u_scale.y;float toScale=u_scale.z;gl_Position=u_matrix*vec4(a_pos,0,1);vec2 display_size_a=(pattern_br_a-pattern_tl_a)/pixel_ratio_from;vec2 display_size_b=(pattern_br_b-pattern_tl_b)/pixel_ratio_to;v_pos_a=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,fromScale*display_size_a,tileRatio,a_pos);v_pos_b=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,toScale*display_size_b,tileRatio,a_pos);v_pos=(gl_Position.xy/gl_Position.w+1.0)/2.0*u_world;}`),El=_e(`uniform vec2 u_texsize;uniform float u_fade;uniform sampler2D u_image;varying vec2 v_pos_a;varying vec2 v_pos_b;
#pragma mapbox: define lowp float opacity
#pragma mapbox: define lowp vec4 pattern_from
#pragma mapbox: define lowp vec4 pattern_to
void main() {
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize mediump vec4 pattern_from
#pragma mapbox: initialize mediump vec4 pattern_to
vec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;vec2 imagecoord=mod(v_pos_a,1.0);vec2 pos=mix(pattern_tl_a/u_texsize,pattern_br_a/u_texsize,imagecoord);vec4 color1=texture2D(u_image,pos);vec2 imagecoord_b=mod(v_pos_b,1.0);vec2 pos2=mix(pattern_tl_b/u_texsize,pattern_br_b/u_texsize,imagecoord_b);vec4 color2=texture2D(u_image,pos2);gl_FragColor=mix(color1,color2,u_fade)*opacity;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`uniform mat4 u_matrix;uniform vec2 u_pixel_coord_upper;uniform vec2 u_pixel_coord_lower;uniform vec3 u_scale;attribute vec2 a_pos;varying vec2 v_pos_a;varying vec2 v_pos_b;
#pragma mapbox: define lowp float opacity
#pragma mapbox: define lowp vec4 pattern_from
#pragma mapbox: define lowp vec4 pattern_to
#pragma mapbox: define lowp float pixel_ratio_from
#pragma mapbox: define lowp float pixel_ratio_to
void main() {
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize mediump vec4 pattern_from
#pragma mapbox: initialize mediump vec4 pattern_to
#pragma mapbox: initialize lowp float pixel_ratio_from
#pragma mapbox: initialize lowp float pixel_ratio_to
vec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;float tileZoomRatio=u_scale.x;float fromScale=u_scale.y;float toScale=u_scale.z;vec2 display_size_a=(pattern_br_a-pattern_tl_a)/pixel_ratio_from;vec2 display_size_b=(pattern_br_b-pattern_tl_b)/pixel_ratio_to;gl_Position=u_matrix*vec4(a_pos,0,1);v_pos_a=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,fromScale*display_size_a,tileZoomRatio,a_pos);v_pos_b=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,toScale*display_size_b,tileZoomRatio,a_pos);}`),cr=_e(`varying vec4 v_color;void main() {gl_FragColor=v_color;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`uniform mat4 u_matrix;uniform vec3 u_lightcolor;uniform lowp vec3 u_lightpos;uniform lowp float u_lightintensity;uniform float u_vertical_gradient;uniform lowp float u_opacity;attribute vec2 a_pos;attribute vec4 a_normal_ed;varying vec4 v_color;
#pragma mapbox: define highp float base
#pragma mapbox: define highp float height
#pragma mapbox: define highp vec4 color
void main() {
#pragma mapbox: initialize highp float base
#pragma mapbox: initialize highp float height
#pragma mapbox: initialize highp vec4 color
vec3 normal=a_normal_ed.xyz;base=max(0.0,base);height=max(0.0,height);float t=mod(normal.x,2.0);gl_Position=u_matrix*vec4(a_pos,t > 0.0 ? height : base,1);float colorvalue=color.r*0.2126+color.g*0.7152+color.b*0.0722;v_color=vec4(0.0,0.0,0.0,1.0);vec4 ambientlight=vec4(0.03,0.03,0.03,1.0);color+=ambientlight;float directional=clamp(dot(normal/16384.0,u_lightpos),0.0,1.0);directional=mix((1.0-u_lightintensity),max((1.0-colorvalue+u_lightintensity),1.0),directional);if (normal.y !=0.0) {directional*=((1.0-u_vertical_gradient)+(u_vertical_gradient*clamp((t+base)*pow(height/150.0,0.5),mix(0.7,0.98,1.0-u_lightintensity),1.0)));}v_color.r+=clamp(color.r*directional*u_lightcolor.r,mix(0.0,0.3,1.0-u_lightcolor.r),1.0);v_color.g+=clamp(color.g*directional*u_lightcolor.g,mix(0.0,0.3,1.0-u_lightcolor.g),1.0);v_color.b+=clamp(color.b*directional*u_lightcolor.b,mix(0.0,0.3,1.0-u_lightcolor.b),1.0);v_color*=u_opacity;}`),zs=_e(`uniform vec2 u_texsize;uniform float u_fade;uniform sampler2D u_image;varying vec2 v_pos_a;varying vec2 v_pos_b;varying vec4 v_lighting;
#pragma mapbox: define lowp float base
#pragma mapbox: define lowp float height
#pragma mapbox: define lowp vec4 pattern_from
#pragma mapbox: define lowp vec4 pattern_to
#pragma mapbox: define lowp float pixel_ratio_from
#pragma mapbox: define lowp float pixel_ratio_to
void main() {
#pragma mapbox: initialize lowp float base
#pragma mapbox: initialize lowp float height
#pragma mapbox: initialize mediump vec4 pattern_from
#pragma mapbox: initialize mediump vec4 pattern_to
#pragma mapbox: initialize lowp float pixel_ratio_from
#pragma mapbox: initialize lowp float pixel_ratio_to
vec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;vec2 imagecoord=mod(v_pos_a,1.0);vec2 pos=mix(pattern_tl_a/u_texsize,pattern_br_a/u_texsize,imagecoord);vec4 color1=texture2D(u_image,pos);vec2 imagecoord_b=mod(v_pos_b,1.0);vec2 pos2=mix(pattern_tl_b/u_texsize,pattern_br_b/u_texsize,imagecoord_b);vec4 color2=texture2D(u_image,pos2);vec4 mixedColor=mix(color1,color2,u_fade);gl_FragColor=mixedColor*v_lighting;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`uniform mat4 u_matrix;uniform vec2 u_pixel_coord_upper;uniform vec2 u_pixel_coord_lower;uniform float u_height_factor;uniform vec3 u_scale;uniform float u_vertical_gradient;uniform lowp float u_opacity;uniform vec3 u_lightcolor;uniform lowp vec3 u_lightpos;uniform lowp float u_lightintensity;attribute vec2 a_pos;attribute vec4 a_normal_ed;varying vec2 v_pos_a;varying vec2 v_pos_b;varying vec4 v_lighting;
#pragma mapbox: define lowp float base
#pragma mapbox: define lowp float height
#pragma mapbox: define lowp vec4 pattern_from
#pragma mapbox: define lowp vec4 pattern_to
#pragma mapbox: define lowp float pixel_ratio_from
#pragma mapbox: define lowp float pixel_ratio_to
void main() {
#pragma mapbox: initialize lowp float base
#pragma mapbox: initialize lowp float height
#pragma mapbox: initialize mediump vec4 pattern_from
#pragma mapbox: initialize mediump vec4 pattern_to
#pragma mapbox: initialize lowp float pixel_ratio_from
#pragma mapbox: initialize lowp float pixel_ratio_to
vec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;float tileRatio=u_scale.x;float fromScale=u_scale.y;float toScale=u_scale.z;vec3 normal=a_normal_ed.xyz;float edgedistance=a_normal_ed.w;vec2 display_size_a=(pattern_br_a-pattern_tl_a)/pixel_ratio_from;vec2 display_size_b=(pattern_br_b-pattern_tl_b)/pixel_ratio_to;base=max(0.0,base);height=max(0.0,height);float t=mod(normal.x,2.0);float z=t > 0.0 ? height : base;gl_Position=u_matrix*vec4(a_pos,z,1);vec2 pos=normal.x==1.0 && normal.y==0.0 && normal.z==16384.0
? a_pos
: vec2(edgedistance,z*u_height_factor);v_pos_a=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,fromScale*display_size_a,tileRatio,pos);v_pos_b=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,toScale*display_size_b,tileRatio,pos);v_lighting=vec4(0.0,0.0,0.0,1.0);float directional=clamp(dot(normal/16383.0,u_lightpos),0.0,1.0);directional=mix((1.0-u_lightintensity),max((0.5+u_lightintensity),1.0),directional);if (normal.y !=0.0) {directional*=((1.0-u_vertical_gradient)+(u_vertical_gradient*clamp((t+base)*pow(height/150.0,0.5),mix(0.7,0.98,1.0-u_lightintensity),1.0)));}v_lighting.rgb+=clamp(directional*u_lightcolor,mix(vec3(0.0),vec3(0.3),1.0-u_lightcolor),vec3(1.0));v_lighting*=u_opacity;}`),en=_e(`#ifdef GL_ES
precision highp float;
#endif
uniform sampler2D u_image;varying vec2 v_pos;uniform vec2 u_dimension;uniform float u_zoom;uniform vec4 u_unpack;float getElevation(vec2 coord,float bias) {vec4 data=texture2D(u_image,coord)*255.0;data.a=-1.0;return dot(data,u_unpack)/4.0;}void main() {vec2 epsilon=1.0/u_dimension;float a=getElevation(v_pos+vec2(-epsilon.x,-epsilon.y),0.0);float b=getElevation(v_pos+vec2(0,-epsilon.y),0.0);float c=getElevation(v_pos+vec2(epsilon.x,-epsilon.y),0.0);float d=getElevation(v_pos+vec2(-epsilon.x,0),0.0);float e=getElevation(v_pos,0.0);float f=getElevation(v_pos+vec2(epsilon.x,0),0.0);float g=getElevation(v_pos+vec2(-epsilon.x,epsilon.y),0.0);float h=getElevation(v_pos+vec2(0,epsilon.y),0.0);float i=getElevation(v_pos+vec2(epsilon.x,epsilon.y),0.0);float exaggerationFactor=u_zoom < 2.0 ? 0.4 : u_zoom < 4.5 ? 0.35 : 0.3;float exaggeration=u_zoom < 15.0 ? (u_zoom-15.0)*exaggerationFactor : 0.0;vec2 deriv=vec2((c+f+f+i)-(a+d+d+g),(g+h+h+i)-(a+b+b+c))/pow(2.0,exaggeration+(19.2562-u_zoom));gl_FragColor=clamp(vec4(deriv.x/2.0+0.5,deriv.y/2.0+0.5,1.0,1.0),0.0,1.0);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,"uniform mat4 u_matrix;uniform vec2 u_dimension;attribute vec2 a_pos;attribute vec2 a_texture_pos;varying vec2 v_pos;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);highp vec2 epsilon=1.0/u_dimension;float scale=(u_dimension.x-2.0)/u_dimension.x;v_pos=(a_texture_pos/8192.0)*scale+epsilon;}"),rn=_e(`uniform sampler2D u_image;varying vec2 v_pos;uniform vec2 u_latrange;uniform vec2 u_light;uniform vec4 u_shadow;uniform vec4 u_highlight;uniform vec4 u_accent;
#define PI 3.141592653589793
void main() {vec4 pixel=texture2D(u_image,v_pos);vec2 deriv=((pixel.rg*2.0)-1.0);float scaleFactor=cos(radians((u_latrange[0]-u_latrange[1])*(1.0-v_pos.y)+u_latrange[1]));float slope=atan(1.25*length(deriv)/scaleFactor);float aspect=deriv.x !=0.0 ? atan(deriv.y,-deriv.x) : PI/2.0*(deriv.y > 0.0 ? 1.0 :-1.0);float intensity=u_light.x;float azimuth=u_light.y+PI;float base=1.875-intensity*1.75;float maxValue=0.5*PI;float scaledSlope=intensity !=0.5 ? ((pow(base,slope)-1.0)/(pow(base,maxValue)-1.0))*maxValue : slope;float accent=cos(scaledSlope);vec4 accent_color=(1.0-accent)*u_accent*clamp(intensity*2.0,0.0,1.0);float shade=abs(mod((aspect+azimuth)/PI+0.5,2.0)-1.0);vec4 shade_color=mix(u_shadow,u_highlight,shade)*sin(scaledSlope)*clamp(intensity*2.0,0.0,1.0);gl_FragColor=accent_color*(1.0-shade_color.a)+shade_color;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,"uniform mat4 u_matrix;attribute vec2 a_pos;attribute vec2 a_texture_pos;varying vec2 v_pos;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);v_pos=a_texture_pos/8192.0;}"),kn=_e(`uniform lowp float u_device_pixel_ratio;varying vec2 v_width2;varying vec2 v_normal;varying float v_gamma_scale;
#pragma mapbox: define highp vec4 color
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
void main() {
#pragma mapbox: initialize highp vec4 color
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
float dist=length(v_normal)*v_width2.s;float blur2=(blur+1.0/u_device_pixel_ratio)*v_gamma_scale;float alpha=clamp(min(dist-(v_width2.t-blur2),v_width2.s-dist)/blur2,0.0,1.0);gl_FragColor=color*(alpha*opacity);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`
#define scale 0.015873016
attribute vec2 a_pos_normal;attribute vec4 a_data;uniform mat4 u_matrix;uniform mediump float u_ratio;uniform vec2 u_units_to_pixels;uniform lowp float u_device_pixel_ratio;varying vec2 v_normal;varying vec2 v_width2;varying float v_gamma_scale;varying highp float v_linesofar;
#pragma mapbox: define highp vec4 color
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
#pragma mapbox: define mediump float gapwidth
#pragma mapbox: define lowp float offset
#pragma mapbox: define mediump float width
void main() {
#pragma mapbox: initialize highp vec4 color
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize mediump float gapwidth
#pragma mapbox: initialize lowp float offset
#pragma mapbox: initialize mediump float width
float ANTIALIASING=1.0/u_device_pixel_ratio/2.0;vec2 a_extrude=a_data.xy-128.0;float a_direction=mod(a_data.z,4.0)-1.0;v_linesofar=(floor(a_data.z/4.0)+a_data.w*64.0)*2.0;vec2 pos=floor(a_pos_normal*0.5);mediump vec2 normal=a_pos_normal-2.0*pos;normal.y=normal.y*2.0-1.0;v_normal=normal;gapwidth=gapwidth/2.0;float halfwidth=width/2.0;offset=-1.0*offset;float inset=gapwidth+(gapwidth > 0.0 ? ANTIALIASING : 0.0);float outset=gapwidth+halfwidth*(gapwidth > 0.0 ? 2.0 : 1.0)+(halfwidth==0.0 ? 0.0 : ANTIALIASING);mediump vec2 dist=outset*a_extrude*scale;mediump float u=0.5*a_direction;mediump float t=1.0-abs(u);mediump vec2 offset2=offset*a_extrude*scale*normal.y*mat2(t,-u,u,t);vec4 projected_extrude=u_matrix*vec4(dist/u_ratio,0.0,0.0);gl_Position=u_matrix*vec4(pos+offset2/u_ratio,0.0,1.0)+projected_extrude;float extrude_length_without_perspective=length(dist);float extrude_length_with_perspective=length(projected_extrude.xy/gl_Position.w*u_units_to_pixels);v_gamma_scale=extrude_length_without_perspective/extrude_length_with_perspective;v_width2=vec2(outset,inset);}`),Mn=_e(`uniform lowp float u_device_pixel_ratio;uniform sampler2D u_image;varying vec2 v_width2;varying vec2 v_normal;varying float v_gamma_scale;varying highp vec2 v_uv;
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
void main() {
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
float dist=length(v_normal)*v_width2.s;float blur2=(blur+1.0/u_device_pixel_ratio)*v_gamma_scale;float alpha=clamp(min(dist-(v_width2.t-blur2),v_width2.s-dist)/blur2,0.0,1.0);vec4 color=texture2D(u_image,v_uv);gl_FragColor=color*(alpha*opacity);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`
#define scale 0.015873016
attribute vec2 a_pos_normal;attribute vec4 a_data;attribute float a_uv_x;attribute float a_split_index;uniform mat4 u_matrix;uniform mediump float u_ratio;uniform lowp float u_device_pixel_ratio;uniform vec2 u_units_to_pixels;uniform float u_image_height;varying vec2 v_normal;varying vec2 v_width2;varying float v_gamma_scale;varying highp vec2 v_uv;
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
#pragma mapbox: define mediump float gapwidth
#pragma mapbox: define lowp float offset
#pragma mapbox: define mediump float width
void main() {
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize mediump float gapwidth
#pragma mapbox: initialize lowp float offset
#pragma mapbox: initialize mediump float width
float ANTIALIASING=1.0/u_device_pixel_ratio/2.0;vec2 a_extrude=a_data.xy-128.0;float a_direction=mod(a_data.z,4.0)-1.0;highp float texel_height=1.0/u_image_height;highp float half_texel_height=0.5*texel_height;v_uv=vec2(a_uv_x,a_split_index*texel_height-half_texel_height);vec2 pos=floor(a_pos_normal*0.5);mediump vec2 normal=a_pos_normal-2.0*pos;normal.y=normal.y*2.0-1.0;v_normal=normal;gapwidth=gapwidth/2.0;float halfwidth=width/2.0;offset=-1.0*offset;float inset=gapwidth+(gapwidth > 0.0 ? ANTIALIASING : 0.0);float outset=gapwidth+halfwidth*(gapwidth > 0.0 ? 2.0 : 1.0)+(halfwidth==0.0 ? 0.0 : ANTIALIASING);mediump vec2 dist=outset*a_extrude*scale;mediump float u=0.5*a_direction;mediump float t=1.0-abs(u);mediump vec2 offset2=offset*a_extrude*scale*normal.y*mat2(t,-u,u,t);vec4 projected_extrude=u_matrix*vec4(dist/u_ratio,0.0,0.0);gl_Position=u_matrix*vec4(pos+offset2/u_ratio,0.0,1.0)+projected_extrude;float extrude_length_without_perspective=length(dist);float extrude_length_with_perspective=length(projected_extrude.xy/gl_Position.w*u_units_to_pixels);v_gamma_scale=extrude_length_without_perspective/extrude_length_with_perspective;v_width2=vec2(outset,inset);}`),nn=_e(`uniform lowp float u_device_pixel_ratio;uniform vec2 u_texsize;uniform float u_fade;uniform mediump vec3 u_scale;uniform sampler2D u_image;varying vec2 v_normal;varying vec2 v_width2;varying float v_linesofar;varying float v_gamma_scale;varying float v_width;
#pragma mapbox: define lowp vec4 pattern_from
#pragma mapbox: define lowp vec4 pattern_to
#pragma mapbox: define lowp float pixel_ratio_from
#pragma mapbox: define lowp float pixel_ratio_to
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
void main() {
#pragma mapbox: initialize mediump vec4 pattern_from
#pragma mapbox: initialize mediump vec4 pattern_to
#pragma mapbox: initialize lowp float pixel_ratio_from
#pragma mapbox: initialize lowp float pixel_ratio_to
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
vec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;float tileZoomRatio=u_scale.x;float fromScale=u_scale.y;float toScale=u_scale.z;vec2 display_size_a=(pattern_br_a-pattern_tl_a)/pixel_ratio_from;vec2 display_size_b=(pattern_br_b-pattern_tl_b)/pixel_ratio_to;vec2 pattern_size_a=vec2(display_size_a.x*fromScale/tileZoomRatio,display_size_a.y);vec2 pattern_size_b=vec2(display_size_b.x*toScale/tileZoomRatio,display_size_b.y);float aspect_a=display_size_a.y/v_width;float aspect_b=display_size_b.y/v_width;float dist=length(v_normal)*v_width2.s;float blur2=(blur+1.0/u_device_pixel_ratio)*v_gamma_scale;float alpha=clamp(min(dist-(v_width2.t-blur2),v_width2.s-dist)/blur2,0.0,1.0);float x_a=mod(v_linesofar/pattern_size_a.x*aspect_a,1.0);float x_b=mod(v_linesofar/pattern_size_b.x*aspect_b,1.0);float y=0.5*v_normal.y+0.5;vec2 texel_size=1.0/u_texsize;vec2 pos_a=mix(pattern_tl_a*texel_size-texel_size,pattern_br_a*texel_size+texel_size,vec2(x_a,y));vec2 pos_b=mix(pattern_tl_b*texel_size-texel_size,pattern_br_b*texel_size+texel_size,vec2(x_b,y));vec4 color=mix(texture2D(u_image,pos_a),texture2D(u_image,pos_b),u_fade);gl_FragColor=color*alpha*opacity;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`
#define scale 0.015873016
#define LINE_DISTANCE_SCALE 2.0
attribute vec2 a_pos_normal;attribute vec4 a_data;uniform mat4 u_matrix;uniform vec2 u_units_to_pixels;uniform mediump float u_ratio;uniform lowp float u_device_pixel_ratio;varying vec2 v_normal;varying vec2 v_width2;varying float v_linesofar;varying float v_gamma_scale;varying float v_width;
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
#pragma mapbox: define lowp float offset
#pragma mapbox: define mediump float gapwidth
#pragma mapbox: define mediump float width
#pragma mapbox: define lowp float floorwidth
#pragma mapbox: define lowp vec4 pattern_from
#pragma mapbox: define lowp vec4 pattern_to
#pragma mapbox: define lowp float pixel_ratio_from
#pragma mapbox: define lowp float pixel_ratio_to
void main() {
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize lowp float offset
#pragma mapbox: initialize mediump float gapwidth
#pragma mapbox: initialize mediump float width
#pragma mapbox: initialize lowp float floorwidth
#pragma mapbox: initialize mediump vec4 pattern_from
#pragma mapbox: initialize mediump vec4 pattern_to
#pragma mapbox: initialize lowp float pixel_ratio_from
#pragma mapbox: initialize lowp float pixel_ratio_to
float ANTIALIASING=1.0/u_device_pixel_ratio/2.0;vec2 a_extrude=a_data.xy-128.0;float a_direction=mod(a_data.z,4.0)-1.0;float a_linesofar=(floor(a_data.z/4.0)+a_data.w*64.0)*LINE_DISTANCE_SCALE;vec2 pos=floor(a_pos_normal*0.5);mediump vec2 normal=a_pos_normal-2.0*pos;normal.y=normal.y*2.0-1.0;v_normal=normal;gapwidth=gapwidth/2.0;float halfwidth=width/2.0;offset=-1.0*offset;float inset=gapwidth+(gapwidth > 0.0 ? ANTIALIASING : 0.0);float outset=gapwidth+halfwidth*(gapwidth > 0.0 ? 2.0 : 1.0)+(halfwidth==0.0 ? 0.0 : ANTIALIASING);mediump vec2 dist=outset*a_extrude*scale;mediump float u=0.5*a_direction;mediump float t=1.0-abs(u);mediump vec2 offset2=offset*a_extrude*scale*normal.y*mat2(t,-u,u,t);vec4 projected_extrude=u_matrix*vec4(dist/u_ratio,0.0,0.0);gl_Position=u_matrix*vec4(pos+offset2/u_ratio,0.0,1.0)+projected_extrude;float extrude_length_without_perspective=length(dist);float extrude_length_with_perspective=length(projected_extrude.xy/gl_Position.w*u_units_to_pixels);v_gamma_scale=extrude_length_without_perspective/extrude_length_with_perspective;v_linesofar=a_linesofar;v_width2=vec2(outset,inset);v_width=floorwidth;}`),Dn=_e(`uniform lowp float u_device_pixel_ratio;uniform sampler2D u_image;uniform float u_sdfgamma;uniform float u_mix;varying vec2 v_normal;varying vec2 v_width2;varying vec2 v_tex_a;varying vec2 v_tex_b;varying float v_gamma_scale;
#pragma mapbox: define highp vec4 color
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
#pragma mapbox: define mediump float width
#pragma mapbox: define lowp float floorwidth
void main() {
#pragma mapbox: initialize highp vec4 color
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize mediump float width
#pragma mapbox: initialize lowp float floorwidth
float dist=length(v_normal)*v_width2.s;float blur2=(blur+1.0/u_device_pixel_ratio)*v_gamma_scale;float alpha=clamp(min(dist-(v_width2.t-blur2),v_width2.s-dist)/blur2,0.0,1.0);float sdfdist_a=texture2D(u_image,v_tex_a).a;float sdfdist_b=texture2D(u_image,v_tex_b).a;float sdfdist=mix(sdfdist_a,sdfdist_b,u_mix);alpha*=smoothstep(0.5-u_sdfgamma/floorwidth,0.5+u_sdfgamma/floorwidth,sdfdist);gl_FragColor=color*(alpha*opacity);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`
#define scale 0.015873016
#define LINE_DISTANCE_SCALE 2.0
attribute vec2 a_pos_normal;attribute vec4 a_data;uniform mat4 u_matrix;uniform mediump float u_ratio;uniform lowp float u_device_pixel_ratio;uniform vec2 u_patternscale_a;uniform float u_tex_y_a;uniform vec2 u_patternscale_b;uniform float u_tex_y_b;uniform vec2 u_units_to_pixels;varying vec2 v_normal;varying vec2 v_width2;varying vec2 v_tex_a;varying vec2 v_tex_b;varying float v_gamma_scale;
#pragma mapbox: define highp vec4 color
#pragma mapbox: define lowp float blur
#pragma mapbox: define lowp float opacity
#pragma mapbox: define mediump float gapwidth
#pragma mapbox: define lowp float offset
#pragma mapbox: define mediump float width
#pragma mapbox: define lowp float floorwidth
void main() {
#pragma mapbox: initialize highp vec4 color
#pragma mapbox: initialize lowp float blur
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize mediump float gapwidth
#pragma mapbox: initialize lowp float offset
#pragma mapbox: initialize mediump float width
#pragma mapbox: initialize lowp float floorwidth
float ANTIALIASING=1.0/u_device_pixel_ratio/2.0;vec2 a_extrude=a_data.xy-128.0;float a_direction=mod(a_data.z,4.0)-1.0;float a_linesofar=(floor(a_data.z/4.0)+a_data.w*64.0)*LINE_DISTANCE_SCALE;vec2 pos=floor(a_pos_normal*0.5);mediump vec2 normal=a_pos_normal-2.0*pos;normal.y=normal.y*2.0-1.0;v_normal=normal;gapwidth=gapwidth/2.0;float halfwidth=width/2.0;offset=-1.0*offset;float inset=gapwidth+(gapwidth > 0.0 ? ANTIALIASING : 0.0);float outset=gapwidth+halfwidth*(gapwidth > 0.0 ? 2.0 : 1.0)+(halfwidth==0.0 ? 0.0 : ANTIALIASING);mediump vec2 dist=outset*a_extrude*scale;mediump float u=0.5*a_direction;mediump float t=1.0-abs(u);mediump vec2 offset2=offset*a_extrude*scale*normal.y*mat2(t,-u,u,t);vec4 projected_extrude=u_matrix*vec4(dist/u_ratio,0.0,0.0);gl_Position=u_matrix*vec4(pos+offset2/u_ratio,0.0,1.0)+projected_extrude;float extrude_length_without_perspective=length(dist);float extrude_length_with_perspective=length(projected_extrude.xy/gl_Position.w*u_units_to_pixels);v_gamma_scale=extrude_length_without_perspective/extrude_length_with_perspective;v_tex_a=vec2(a_linesofar*u_patternscale_a.x/floorwidth,normal.y*u_patternscale_a.y+u_tex_y_a);v_tex_b=vec2(a_linesofar*u_patternscale_b.x/floorwidth,normal.y*u_patternscale_b.y+u_tex_y_b);v_width2=vec2(outset,inset);}`),Ln=_e(`uniform float u_fade_t;uniform float u_opacity;uniform sampler2D u_image0;uniform sampler2D u_image1;varying vec2 v_pos0;varying vec2 v_pos1;uniform float u_brightness_low;uniform float u_brightness_high;uniform float u_saturation_factor;uniform float u_contrast_factor;uniform vec3 u_spin_weights;void main() {vec4 color0=texture2D(u_image0,v_pos0);vec4 color1=texture2D(u_image1,v_pos1);if (color0.a > 0.0) {color0.rgb=color0.rgb/color0.a;}if (color1.a > 0.0) {color1.rgb=color1.rgb/color1.a;}vec4 color=mix(color0,color1,u_fade_t);color.a*=u_opacity;vec3 rgb=color.rgb;rgb=vec3(dot(rgb,u_spin_weights.xyz),dot(rgb,u_spin_weights.zxy),dot(rgb,u_spin_weights.yzx));float average=(color.r+color.g+color.b)/3.0;rgb+=(average-rgb)*u_saturation_factor;rgb=(rgb-0.5)*u_contrast_factor+0.5;vec3 u_high_vec=vec3(u_brightness_low,u_brightness_low,u_brightness_low);vec3 u_low_vec=vec3(u_brightness_high,u_brightness_high,u_brightness_high);gl_FragColor=vec4(mix(u_high_vec,u_low_vec,rgb)*color.a,color.a);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,"uniform mat4 u_matrix;uniform vec2 u_tl_parent;uniform float u_scale_parent;uniform float u_buffer_scale;attribute vec2 a_pos;attribute vec2 a_texture_pos;varying vec2 v_pos0;varying vec2 v_pos1;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);v_pos0=(((a_texture_pos/8192.0)-0.5)/u_buffer_scale )+0.5;v_pos1=(v_pos0*u_scale_parent)+u_tl_parent;}"),on=_e(`uniform sampler2D u_texture;varying vec2 v_tex;varying float v_fade_opacity;
#pragma mapbox: define lowp float opacity
void main() {
#pragma mapbox: initialize lowp float opacity
lowp float alpha=opacity*v_fade_opacity;gl_FragColor=texture2D(u_texture,v_tex)*alpha;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`const float PI=3.141592653589793;attribute vec4 a_pos_offset;attribute vec4 a_data;attribute vec4 a_pixeloffset;attribute vec3 a_projected_pos;attribute float a_fade_opacity;uniform bool u_is_size_zoom_constant;uniform bool u_is_size_feature_constant;uniform highp float u_size_t;uniform highp float u_size;uniform highp float u_camera_to_center_distance;uniform highp float u_pitch;uniform bool u_rotate_symbol;uniform highp float u_aspect_ratio;uniform float u_fade_change;uniform mat4 u_matrix;uniform mat4 u_label_plane_matrix;uniform mat4 u_coord_matrix;uniform bool u_is_text;uniform bool u_pitch_with_map;uniform vec2 u_texsize;varying vec2 v_tex;varying float v_fade_opacity;
#pragma mapbox: define lowp float opacity
void main() {
#pragma mapbox: initialize lowp float opacity
vec2 a_pos=a_pos_offset.xy;vec2 a_offset=a_pos_offset.zw;vec2 a_tex=a_data.xy;vec2 a_size=a_data.zw;float a_size_min=floor(a_size[0]*0.5);vec2 a_pxoffset=a_pixeloffset.xy;vec2 a_minFontScale=a_pixeloffset.zw/256.0;highp float segment_angle=-a_projected_pos[2];float size;if (!u_is_size_zoom_constant && !u_is_size_feature_constant) {size=mix(a_size_min,a_size[1],u_size_t)/128.0;} else if (u_is_size_zoom_constant && !u_is_size_feature_constant) {size=a_size_min/128.0;} else {size=u_size;}vec4 projectedPoint=u_matrix*vec4(a_pos,0,1);highp float camera_to_anchor_distance=projectedPoint.w;highp float distance_ratio=u_pitch_with_map ?
camera_to_anchor_distance/u_camera_to_center_distance :
u_camera_to_center_distance/camera_to_anchor_distance;highp float perspective_ratio=clamp(0.5+0.5*distance_ratio,0.0,4.0);size*=perspective_ratio;float fontScale=u_is_text ? size/24.0 : size;highp float symbol_rotation=0.0;if (u_rotate_symbol) {vec4 offsetProjectedPoint=u_matrix*vec4(a_pos+vec2(1,0),0,1);vec2 a=projectedPoint.xy/projectedPoint.w;vec2 b=offsetProjectedPoint.xy/offsetProjectedPoint.w;symbol_rotation=atan((b.y-a.y)/u_aspect_ratio,b.x-a.x);}highp float angle_sin=sin(segment_angle+symbol_rotation);highp float angle_cos=cos(segment_angle+symbol_rotation);mat2 rotation_matrix=mat2(angle_cos,-1.0*angle_sin,angle_sin,angle_cos);vec4 projected_pos=u_label_plane_matrix*vec4(a_projected_pos.xy,0.0,1.0);gl_Position=u_coord_matrix*vec4(projected_pos.xy/projected_pos.w+rotation_matrix*(a_offset/32.0*max(a_minFontScale,fontScale)+a_pxoffset/16.0),0.0,1.0);v_tex=a_tex/u_texsize;vec2 fade_opacity=unpack_opacity(a_fade_opacity);float fade_change=fade_opacity[1] > 0.5 ? u_fade_change :-u_fade_change;v_fade_opacity=max(0.0,min(1.0,fade_opacity[0]+fade_change));}`),Al=_e(`#define SDF_PX 8.0
uniform bool u_is_halo;uniform sampler2D u_texture;uniform highp float u_gamma_scale;uniform lowp float u_device_pixel_ratio;uniform bool u_is_text;varying vec2 v_data0;varying vec3 v_data1;
#pragma mapbox: define highp vec4 fill_color
#pragma mapbox: define highp vec4 halo_color
#pragma mapbox: define lowp float opacity
#pragma mapbox: define lowp float halo_width
#pragma mapbox: define lowp float halo_blur
void main() {
#pragma mapbox: initialize highp vec4 fill_color
#pragma mapbox: initialize highp vec4 halo_color
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize lowp float halo_width
#pragma mapbox: initialize lowp float halo_blur
float EDGE_GAMMA=0.105/u_device_pixel_ratio;vec2 tex=v_data0.xy;float gamma_scale=v_data1.x;float size=v_data1.y;float fade_opacity=v_data1[2];float fontScale=u_is_text ? size/24.0 : size;lowp vec4 color=fill_color;highp float gamma=EDGE_GAMMA/(fontScale*u_gamma_scale);lowp float buff=(256.0-64.0)/256.0;if (u_is_halo) {color=halo_color;gamma=(halo_blur*1.19/SDF_PX+EDGE_GAMMA)/(fontScale*u_gamma_scale);buff=(6.0-halo_width/fontScale)/SDF_PX;}lowp float dist=texture2D(u_texture,tex).a;highp float gamma_scaled=gamma*gamma_scale;highp float alpha=smoothstep(buff-gamma_scaled,buff+gamma_scaled,dist);gl_FragColor=color*(alpha*opacity*fade_opacity);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`const float PI=3.141592653589793;attribute vec4 a_pos_offset;attribute vec4 a_data;attribute vec4 a_pixeloffset;attribute vec3 a_projected_pos;attribute float a_fade_opacity;uniform bool u_is_size_zoom_constant;uniform bool u_is_size_feature_constant;uniform highp float u_size_t;uniform highp float u_size;uniform mat4 u_matrix;uniform mat4 u_label_plane_matrix;uniform mat4 u_coord_matrix;uniform bool u_is_text;uniform bool u_pitch_with_map;uniform highp float u_pitch;uniform bool u_rotate_symbol;uniform highp float u_aspect_ratio;uniform highp float u_camera_to_center_distance;uniform float u_fade_change;uniform vec2 u_texsize;varying vec2 v_data0;varying vec3 v_data1;
#pragma mapbox: define highp vec4 fill_color
#pragma mapbox: define highp vec4 halo_color
#pragma mapbox: define lowp float opacity
#pragma mapbox: define lowp float halo_width
#pragma mapbox: define lowp float halo_blur
void main() {
#pragma mapbox: initialize highp vec4 fill_color
#pragma mapbox: initialize highp vec4 halo_color
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize lowp float halo_width
#pragma mapbox: initialize lowp float halo_blur
vec2 a_pos=a_pos_offset.xy;vec2 a_offset=a_pos_offset.zw;vec2 a_tex=a_data.xy;vec2 a_size=a_data.zw;float a_size_min=floor(a_size[0]*0.5);vec2 a_pxoffset=a_pixeloffset.xy;highp float segment_angle=-a_projected_pos[2];float size;if (!u_is_size_zoom_constant && !u_is_size_feature_constant) {size=mix(a_size_min,a_size[1],u_size_t)/128.0;} else if (u_is_size_zoom_constant && !u_is_size_feature_constant) {size=a_size_min/128.0;} else {size=u_size;}vec4 projectedPoint=u_matrix*vec4(a_pos,0,1);highp float camera_to_anchor_distance=projectedPoint.w;highp float distance_ratio=u_pitch_with_map ?
camera_to_anchor_distance/u_camera_to_center_distance :
u_camera_to_center_distance/camera_to_anchor_distance;highp float perspective_ratio=clamp(0.5+0.5*distance_ratio,0.0,4.0);size*=perspective_ratio;float fontScale=u_is_text ? size/24.0 : size;highp float symbol_rotation=0.0;if (u_rotate_symbol) {vec4 offsetProjectedPoint=u_matrix*vec4(a_pos+vec2(1,0),0,1);vec2 a=projectedPoint.xy/projectedPoint.w;vec2 b=offsetProjectedPoint.xy/offsetProjectedPoint.w;symbol_rotation=atan((b.y-a.y)/u_aspect_ratio,b.x-a.x);}highp float angle_sin=sin(segment_angle+symbol_rotation);highp float angle_cos=cos(segment_angle+symbol_rotation);mat2 rotation_matrix=mat2(angle_cos,-1.0*angle_sin,angle_sin,angle_cos);vec4 projected_pos=u_label_plane_matrix*vec4(a_projected_pos.xy,0.0,1.0);gl_Position=u_coord_matrix*vec4(projected_pos.xy/projected_pos.w+rotation_matrix*(a_offset/32.0*fontScale+a_pxoffset),0.0,1.0);float gamma_scale=gl_Position.w;vec2 fade_opacity=unpack_opacity(a_fade_opacity);float fade_change=fade_opacity[1] > 0.5 ? u_fade_change :-u_fade_change;float interpolated_fade_opacity=max(0.0,min(1.0,fade_opacity[0]+fade_change));v_data0=a_tex/u_texsize;v_data1=vec3(gamma_scale,size,interpolated_fade_opacity);}`),Pl=_e(`#define SDF_PX 8.0
#define SDF 1.0
#define ICON 0.0
uniform bool u_is_halo;uniform sampler2D u_texture;uniform sampler2D u_texture_icon;uniform highp float u_gamma_scale;uniform lowp float u_device_pixel_ratio;varying vec4 v_data0;varying vec4 v_data1;
#pragma mapbox: define highp vec4 fill_color
#pragma mapbox: define highp vec4 halo_color
#pragma mapbox: define lowp float opacity
#pragma mapbox: define lowp float halo_width
#pragma mapbox: define lowp float halo_blur
void main() {
#pragma mapbox: initialize highp vec4 fill_color
#pragma mapbox: initialize highp vec4 halo_color
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize lowp float halo_width
#pragma mapbox: initialize lowp float halo_blur
float fade_opacity=v_data1[2];if (v_data1.w==ICON) {vec2 tex_icon=v_data0.zw;lowp float alpha=opacity*fade_opacity;gl_FragColor=texture2D(u_texture_icon,tex_icon)*alpha;
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
return;}vec2 tex=v_data0.xy;float EDGE_GAMMA=0.105/u_device_pixel_ratio;float gamma_scale=v_data1.x;float size=v_data1.y;float fontScale=size/24.0;lowp vec4 color=fill_color;highp float gamma=EDGE_GAMMA/(fontScale*u_gamma_scale);lowp float buff=(256.0-64.0)/256.0;if (u_is_halo) {color=halo_color;gamma=(halo_blur*1.19/SDF_PX+EDGE_GAMMA)/(fontScale*u_gamma_scale);buff=(6.0-halo_width/fontScale)/SDF_PX;}lowp float dist=texture2D(u_texture,tex).a;highp float gamma_scaled=gamma*gamma_scale;highp float alpha=smoothstep(buff-gamma_scaled,buff+gamma_scaled,dist);gl_FragColor=color*(alpha*opacity*fade_opacity);
#ifdef OVERDRAW_INSPECTOR
gl_FragColor=vec4(1.0);
#endif
}`,`const float PI=3.141592653589793;attribute vec4 a_pos_offset;attribute vec4 a_data;attribute vec3 a_projected_pos;attribute float a_fade_opacity;uniform bool u_is_size_zoom_constant;uniform bool u_is_size_feature_constant;uniform highp float u_size_t;uniform highp float u_size;uniform mat4 u_matrix;uniform mat4 u_label_plane_matrix;uniform mat4 u_coord_matrix;uniform bool u_is_text;uniform bool u_pitch_with_map;uniform highp float u_pitch;uniform bool u_rotate_symbol;uniform highp float u_aspect_ratio;uniform highp float u_camera_to_center_distance;uniform float u_fade_change;uniform vec2 u_texsize;uniform vec2 u_texsize_icon;varying vec4 v_data0;varying vec4 v_data1;
#pragma mapbox: define highp vec4 fill_color
#pragma mapbox: define highp vec4 halo_color
#pragma mapbox: define lowp float opacity
#pragma mapbox: define lowp float halo_width
#pragma mapbox: define lowp float halo_blur
void main() {
#pragma mapbox: initialize highp vec4 fill_color
#pragma mapbox: initialize highp vec4 halo_color
#pragma mapbox: initialize lowp float opacity
#pragma mapbox: initialize lowp float halo_width
#pragma mapbox: initialize lowp float halo_blur
vec2 a_pos=a_pos_offset.xy;vec2 a_offset=a_pos_offset.zw;vec2 a_tex=a_data.xy;vec2 a_size=a_data.zw;float a_size_min=floor(a_size[0]*0.5);float is_sdf=a_size[0]-2.0*a_size_min;highp float segment_angle=-a_projected_pos[2];float size;if (!u_is_size_zoom_constant && !u_is_size_feature_constant) {size=mix(a_size_min,a_size[1],u_size_t)/128.0;} else if (u_is_size_zoom_constant && !u_is_size_feature_constant) {size=a_size_min/128.0;} else {size=u_size;}vec4 projectedPoint=u_matrix*vec4(a_pos,0,1);highp float camera_to_anchor_distance=projectedPoint.w;highp float distance_ratio=u_pitch_with_map ?
camera_to_anchor_distance/u_camera_to_center_distance :
u_camera_to_center_distance/camera_to_anchor_distance;highp float perspective_ratio=clamp(0.5+0.5*distance_ratio,0.0,4.0);size*=perspective_ratio;float fontScale=size/24.0;highp float symbol_rotation=0.0;if (u_rotate_symbol) {vec4 offsetProjectedPoint=u_matrix*vec4(a_pos+vec2(1,0),0,1);vec2 a=projectedPoint.xy/projectedPoint.w;vec2 b=offsetProjectedPoint.xy/offsetProjectedPoint.w;symbol_rotation=atan((b.y-a.y)/u_aspect_ratio,b.x-a.x);}highp float angle_sin=sin(segment_angle+symbol_rotation);highp float angle_cos=cos(segment_angle+symbol_rotation);mat2 rotation_matrix=mat2(angle_cos,-1.0*angle_sin,angle_sin,angle_cos);vec4 projected_pos=u_label_plane_matrix*vec4(a_projected_pos.xy,0.0,1.0);gl_Position=u_coord_matrix*vec4(projected_pos.xy/projected_pos.w+rotation_matrix*(a_offset/32.0*fontScale),0.0,1.0);float gamma_scale=gl_Position.w;vec2 fade_opacity=unpack_opacity(a_fade_opacity);float fade_change=fade_opacity[1] > 0.5 ? u_fade_change :-u_fade_change;float interpolated_fade_opacity=max(0.0,min(1.0,fade_opacity[0]+fade_change));v_data0.xy=a_tex/u_texsize;v_data0.zw=a_tex/u_texsize_icon;v_data1=vec4(gamma_scale,size,interpolated_fade_opacity,is_sdf);}`);function _e(i,o){var n=/#pragma mapbox: ([\w]+) ([\w]+) ([\w]+) ([\w]+)/g,s=o.match(/attribute ([\w]+) ([\w]+)/g),p=i.match(/uniform ([\w]+) ([\w]+)([\s]*)([\w]*)/g),f=o.match(/uniform ([\w]+) ([\w]+)([\s]*)([\w]*)/g),d=f?f.concat(p):p,y={};return {fragmentSource:i=i.replace(n,function(v,S,P,z,k){return y[k]=!0,S==="define"?`
#ifndef HAS_UNIFORM_u_`+k+`
varying `+P+" "+z+" "+k+`;
#else
uniform `+P+" "+z+" u_"+k+`;
#endif
`:`
#ifdef HAS_UNIFORM_u_`+k+`
    `+P+" "+z+" "+k+" = u_"+k+`;
#endif
`}),vertexSource:o=o.replace(n,function(v,S,P,z,k){var F=z==="float"?"vec2":"vec4",R=k.match(/color/)?"color":F;return y[k]?S==="define"?`
#ifndef HAS_UNIFORM_u_`+k+`
uniform lowp float u_`+k+`_t;
attribute `+P+" "+F+" a_"+k+`;
varying `+P+" "+z+" "+k+`;
#else
uniform `+P+" "+z+" u_"+k+`;
#endif
`:R==="vec4"?`
#ifndef HAS_UNIFORM_u_`+k+`
    `+k+" = a_"+k+`;
#else
    `+P+" "+z+" "+k+" = u_"+k+`;
#endif
`:`
#ifndef HAS_UNIFORM_u_`+k+`
    `+k+" = unpack_mix_"+R+"(a_"+k+", u_"+k+`_t);
#else
    `+P+" "+z+" "+k+" = u_"+k+`;
#endif
`:S==="define"?`
#ifndef HAS_UNIFORM_u_`+k+`
uniform lowp float u_`+k+`_t;
attribute `+P+" "+F+" a_"+k+`;
#else
uniform `+P+" "+z+" u_"+k+`;
#endif
`:R==="vec4"?`
#ifndef HAS_UNIFORM_u_`+k+`
    `+P+" "+z+" "+k+" = a_"+k+`;
#else
    `+P+" "+z+" "+k+" = u_"+k+`;
#endif
`:`
#ifndef HAS_UNIFORM_u_`+k+`
    `+P+" "+z+" "+k+" = unpack_mix_"+R+"(a_"+k+", u_"+k+`_t);
#else
    `+P+" "+z+" "+k+" = u_"+k+`;
#endif
`}),staticAttributes:s,staticUniforms:d}}var Ou=Object.freeze({__proto__:null,prelude:ho,background:Sl,backgroundPattern:Bu,circle:Ru,clippingMask:Is,heatmap:Es,heatmapTexture:As,collisionBox:Ps,collisionCircle:Tl,debug:Il,fill:Fu,fillOutline:Zo,fillOutlinePattern:Go,fillPattern:El,fillExtrusion:cr,fillExtrusionPattern:zs,hillshadePrepare:en,hillshade:rn,line:kn,lineGradient:Mn,linePattern:nn,lineSDF:Dn,raster:Ln,symbolIcon:on,symbolSDF:Al,symbolTextAndIcon:Pl}),Aa=function(){this.boundProgram=null,this.boundLayoutVertexBuffer=null,this.boundPaintVertexBuffers=[],this.boundIndexBuffer=null,this.boundVertexOffset=null,this.boundDynamicVertexBuffer=null,this.vao=null;};function zl(i){for(var o=[],n=0;n<i.length;n++)if(i[n]!==null){var s=i[n].split(" ");o.push(s.pop());}return o}Aa.prototype.bind=function(i,o,n,s,p,f,d,y){this.context=i;for(var v=this.boundPaintVertexBuffers.length!==s.length,S=0;!v&&S<s.length;S++)this.boundPaintVertexBuffers[S]!==s[S]&&(v=!0);i.extVertexArrayObject&&this.vao&&this.boundProgram===o&&this.boundLayoutVertexBuffer===n&&!v&&this.boundIndexBuffer===p&&this.boundVertexOffset===f&&this.boundDynamicVertexBuffer===d&&this.boundDynamicVertexBuffer2===y?(i.bindVertexArrayOES.set(this.vao),d&&d.bind(),p&&p.dynamicDraw&&p.bind(),y&&y.bind()):this.freshBind(o,n,s,p,f,d,y);},Aa.prototype.freshBind=function(i,o,n,s,p,f,d){var y,v=i.numAttributes,S=this.context,P=S.gl;if(S.extVertexArrayObject)this.vao&&this.destroy(),this.vao=S.extVertexArrayObject.createVertexArrayOES(),S.bindVertexArrayOES.set(this.vao),y=0,this.boundProgram=i,this.boundLayoutVertexBuffer=o,this.boundPaintVertexBuffers=n,this.boundIndexBuffer=s,this.boundVertexOffset=p,this.boundDynamicVertexBuffer=f,this.boundDynamicVertexBuffer2=d;else {y=S.currentNumAttributes||0;for(var z=v;z<y;z++)P.disableVertexAttribArray(z);}o.enableAttributes(P,i);for(var k=0,F=n;k<F.length;k+=1)F[k].enableAttributes(P,i);f&&f.enableAttributes(P,i),d&&d.enableAttributes(P,i),o.bind(),o.setVertexAttribPointers(P,i,p);for(var R=0,j=n;R<j.length;R+=1){var D=j[R];D.bind(),D.setVertexAttribPointers(P,i,p);}f&&(f.bind(),f.setVertexAttribPointers(P,i,p)),s&&s.bind(),d&&(d.bind(),d.setVertexAttribPointers(P,i,p)),S.currentNumAttributes=v;},Aa.prototype.destroy=function(){this.vao&&(this.context.extVertexArrayObject.deleteVertexArrayOES(this.vao),this.vao=null);};var Cl=function(i,o,n,s,p,f){var d=i.gl;this.program=d.createProgram();for(var y=zl(n.staticAttributes),v=s?s.getBinderAttributes():[],S=y.concat(v),P=n.staticUniforms?zl(n.staticUniforms):[],z=s?s.getBinderUniforms():[],k=[],F=0,R=P.concat(z);F<R.length;F+=1){var j=R[F];k.indexOf(j)<0&&k.push(j);}var D=s?s.defines():[];f&&D.push("#define OVERDRAW_INSPECTOR;");var N=D.concat(ho.fragmentSource,n.fragmentSource).join(`
`),G=D.concat(ho.vertexSource,n.vertexSource).join(`
`),K=d.createShader(d.FRAGMENT_SHADER);if(d.isContextLost())this.failedToCreate=!0;else {d.shaderSource(K,N),d.compileShader(K),d.attachShader(this.program,K);var tt=d.createShader(d.VERTEX_SHADER);if(d.isContextLost())this.failedToCreate=!0;else {d.shaderSource(tt,G),d.compileShader(tt),d.attachShader(this.program,tt),this.attributes={};var Q={};this.numAttributes=S.length;for(var et=0;et<this.numAttributes;et++)S[et]&&(d.bindAttribLocation(this.program,et,S[et]),this.attributes[S[et]]=et);d.linkProgram(this.program),d.deleteShader(tt),d.deleteShader(K);for(var ot=0;ot<k.length;ot++){var ht=k[ot];if(ht&&!Q[ht]){var pt=d.getUniformLocation(this.program,ht);pt&&(Q[ht]=pt);}}this.fixedUniforms=p(i,Q),this.binderUniforms=s?s.getUniforms(i,Q):[];}}};function kl(i,o,n){var s=1/Te(n,1,o.transform.tileZoom),p=Math.pow(2,n.tileID.overscaledZ),f=n.tileSize*Math.pow(2,o.transform.tileZoom)/p,d=f*(n.tileID.canonical.x+n.tileID.wrap*p),y=f*n.tileID.canonical.y;return {u_image:0,u_texsize:n.imageAtlasTexture.size,u_scale:[s,i.fromScale,i.toScale],u_fade:i.t,u_pixel_coord_upper:[d>>16,y>>16],u_pixel_coord_lower:[65535&d,65535&y]}}Cl.prototype.draw=function(i,o,n,s,p,f,d,y,v,S,P,z,k,F,R,j){var D,N=i.gl;if(!this.failedToCreate){for(var G in i.program.set(this.program),i.setDepthMode(n),i.setStencilMode(s),i.setColorMode(p),i.setCullFace(f),this.fixedUniforms)this.fixedUniforms[G].set(d[G]);F&&F.setUniforms(i,this.binderUniforms,z,{zoom:k});for(var K=(D={},D[N.LINES]=2,D[N.TRIANGLES]=3,D[N.LINE_STRIP]=1,D)[o],tt=0,Q=P.get();tt<Q.length;tt+=1){var et=Q[tt],ot=et.vaos||(et.vaos={});(ot[y]||(ot[y]=new Aa)).bind(i,this,v,F?F.getPaintVertexBuffers():[],S,et.vertexOffset,R,j),N.drawElements(o,et.primitiveLength*K,N.UNSIGNED_SHORT,et.primitiveOffset*K*2);}}};var Ml=function(i,o,n,s){var p=o.style.light,f=p.properties.get("position"),d=[f.x,f.y,f.z],y=u.create$1();p.properties.get("anchor")==="viewport"&&u.fromRotation(y,-o.transform.angle),u.transformMat3(d,d,y);var v=p.properties.get("color");return {u_matrix:i,u_lightpos:d,u_lightintensity:p.properties.get("intensity"),u_lightcolor:[v.r,v.g,v.b],u_vertical_gradient:+n,u_opacity:s}},Bn=function(i,o,n,s,p,f,d){return u.extend(Ml(i,o,n,s),kl(f,o,d),{u_height_factor:-Math.pow(2,p.overscaledZ)/d.tileSize/8})},an=function(i){return {u_matrix:i}},Rn=function(i,o,n,s){return u.extend(an(i),kl(n,o,s))},Dl=function(i,o){return {u_matrix:i,u_world:o}},Ll=function(i,o,n,s,p){return u.extend(Rn(i,o,n,s),{u_world:p})},Cs=function(i,o,n,s){var p,f,d=i.transform;if(s.paint.get("circle-pitch-alignment")==="map"){var y=Te(n,1,d.zoom);p=!0,f=[y,y];}else p=!1,f=d.pixelsToGLUnits;return {u_camera_to_center_distance:d.cameraToCenterDistance,u_scale_with_map:+(s.paint.get("circle-pitch-scale")==="map"),u_matrix:i.translatePosMatrix(o.posMatrix,n,s.paint.get("circle-translate"),s.paint.get("circle-translate-anchor")),u_pitch_with_map:+p,u_device_pixel_ratio:u.browser.devicePixelRatio,u_extrude_scale:f}},Fn=function(i,o,n){var s=Te(n,1,o.zoom),p=Math.pow(2,o.zoom-n.tileID.overscaledZ),f=n.tileID.overscaleFactor();return {u_matrix:i,u_camera_to_center_distance:o.cameraToCenterDistance,u_pixels_to_tile_units:s,u_extrude_scale:[o.pixelsToGLUnits[0]/(s*p),o.pixelsToGLUnits[1]/(s*p)],u_overscale_factor:f}},Bl=function(i,o,n){return {u_matrix:i,u_inv_matrix:o,u_camera_to_center_distance:n.cameraToCenterDistance,u_viewport_size:[n.width,n.height]}},On=function(i,o,n){return n===void 0&&(n=1),{u_matrix:i,u_color:o,u_overlay:0,u_overlay_scale:n}},Un=function(i){return {u_matrix:i}},Rl=function(i,o,n,s){return {u_matrix:i,u_extrude_scale:Te(o,1,n),u_intensity:s}},Xo=function(i,o,n){var s=i.transform;return {u_matrix:Fl(i,o,n),u_ratio:1/Te(o,1,s.zoom),u_device_pixel_ratio:u.browser.devicePixelRatio,u_units_to_pixels:[1/s.pixelsToGLUnits[0],1/s.pixelsToGLUnits[1]]}},xe=function(i,o,n,s){return u.extend(Xo(i,o,n),{u_image:0,u_image_height:s})},Pa=function(i,o,n,s){var p=i.transform,f=fo(o,p);return {u_matrix:Fl(i,o,n),u_texsize:o.imageAtlasTexture.size,u_ratio:1/Te(o,1,p.zoom),u_device_pixel_ratio:u.browser.devicePixelRatio,u_image:0,u_scale:[f,s.fromScale,s.toScale],u_fade:s.t,u_units_to_pixels:[1/p.pixelsToGLUnits[0],1/p.pixelsToGLUnits[1]]}},Uu=function(i,o,n,s,p){var f=i.lineAtlas,d=fo(o,i.transform),y=n.layout.get("line-cap")==="round",v=f.getDash(s.from,y),S=f.getDash(s.to,y),P=v.width*p.fromScale,z=S.width*p.toScale;return u.extend(Xo(i,o,n),{u_patternscale_a:[d/P,-v.height/2],u_patternscale_b:[d/z,-S.height/2],u_sdfgamma:f.width/(256*Math.min(P,z)*u.browser.devicePixelRatio)/2,u_image:0,u_tex_y_a:v.y,u_tex_y_b:S.y,u_mix:p.t})};function fo(i,o){return 1/Te(i,1,o.tileZoom)}function Fl(i,o,n){return i.translatePosMatrix(o.tileID.posMatrix,o,n.paint.get("line-translate"),n.paint.get("line-translate-anchor"))}var Vu=function(i,o,n,s,p){return {u_matrix:i,u_tl_parent:o,u_scale_parent:n,u_buffer_scale:1,u_fade_t:s.mix,u_opacity:s.opacity*p.paint.get("raster-opacity"),u_image0:0,u_image1:1,u_brightness_low:p.paint.get("raster-brightness-min"),u_brightness_high:p.paint.get("raster-brightness-max"),u_saturation_factor:(d=p.paint.get("raster-saturation"),d>0?1-1/(1.001-d):-d),u_contrast_factor:(f=p.paint.get("raster-contrast"),f>0?1/(1-f):1+f),u_spin_weights:Ol(p.paint.get("raster-hue-rotate"))};var f,d;};function Ol(i){i*=Math.PI/180;var o=Math.sin(i),n=Math.cos(i);return [(2*n+1)/3,(-Math.sqrt(3)*o-n+1)/3,(Math.sqrt(3)*o-n+1)/3]}var za,mo=function(i,o,n,s,p,f,d,y,v,S){var P=p.transform;return {u_is_size_zoom_constant:+(i==="constant"||i==="source"),u_is_size_feature_constant:+(i==="constant"||i==="camera"),u_size_t:o?o.uSizeT:0,u_size:o?o.uSize:0,u_camera_to_center_distance:P.cameraToCenterDistance,u_pitch:P.pitch/360*2*Math.PI,u_rotate_symbol:+n,u_aspect_ratio:P.width/P.height,u_fade_change:p.options.fadeDuration?p.symbolFadeChange:1,u_matrix:f,u_label_plane_matrix:d,u_coord_matrix:y,u_is_text:+v,u_pitch_with_map:+s,u_texsize:S,u_texture:0}},Wo=function(i,o,n,s,p,f,d,y,v,S,P){var z=p.transform;return u.extend(mo(i,o,n,s,p,f,d,y,v,S),{u_gamma_scale:s?Math.cos(z._pitch)*z.cameraToCenterDistance:1,u_device_pixel_ratio:u.browser.devicePixelRatio,u_is_halo:+P})},Ca=function(i,o,n,s,p,f,d,y,v,S){return u.extend(Wo(i,o,n,s,p,f,d,y,!0,v,!0),{u_texsize_icon:S,u_texture_icon:1})},Ko=function(i,o,n){return {u_matrix:i,u_opacity:o,u_color:n}},yo=function(i,o,n,s,p,f){return u.extend(function(d,y,v,S){var P=v.imageManager.getPattern(d.from.toString()),z=v.imageManager.getPattern(d.to.toString()),k=v.imageManager.getPixelSize(),F=k.width,R=k.height,j=Math.pow(2,S.tileID.overscaledZ),D=S.tileSize*Math.pow(2,v.transform.tileZoom)/j,N=D*(S.tileID.canonical.x+S.tileID.wrap*j),G=D*S.tileID.canonical.y;return {u_image:0,u_pattern_tl_a:P.tl,u_pattern_br_a:P.br,u_pattern_tl_b:z.tl,u_pattern_br_b:z.br,u_texsize:[F,R],u_mix:y.t,u_pattern_size_a:P.displaySize,u_pattern_size_b:z.displaySize,u_scale_a:y.fromScale,u_scale_b:y.toScale,u_tile_units_to_pixels:1/Te(S,1,v.transform.tileZoom),u_pixel_coord_upper:[N>>16,G>>16],u_pixel_coord_lower:[65535&N,65535&G]}}(s,f,n,p),{u_matrix:i,u_opacity:o})},Ul={fillExtrusion:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_lightpos:new u.Uniform3f(i,o.u_lightpos),u_lightintensity:new u.Uniform1f(i,o.u_lightintensity),u_lightcolor:new u.Uniform3f(i,o.u_lightcolor),u_vertical_gradient:new u.Uniform1f(i,o.u_vertical_gradient),u_opacity:new u.Uniform1f(i,o.u_opacity)}},fillExtrusionPattern:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_lightpos:new u.Uniform3f(i,o.u_lightpos),u_lightintensity:new u.Uniform1f(i,o.u_lightintensity),u_lightcolor:new u.Uniform3f(i,o.u_lightcolor),u_vertical_gradient:new u.Uniform1f(i,o.u_vertical_gradient),u_height_factor:new u.Uniform1f(i,o.u_height_factor),u_image:new u.Uniform1i(i,o.u_image),u_texsize:new u.Uniform2f(i,o.u_texsize),u_pixel_coord_upper:new u.Uniform2f(i,o.u_pixel_coord_upper),u_pixel_coord_lower:new u.Uniform2f(i,o.u_pixel_coord_lower),u_scale:new u.Uniform3f(i,o.u_scale),u_fade:new u.Uniform1f(i,o.u_fade),u_opacity:new u.Uniform1f(i,o.u_opacity)}},fill:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix)}},fillPattern:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_image:new u.Uniform1i(i,o.u_image),u_texsize:new u.Uniform2f(i,o.u_texsize),u_pixel_coord_upper:new u.Uniform2f(i,o.u_pixel_coord_upper),u_pixel_coord_lower:new u.Uniform2f(i,o.u_pixel_coord_lower),u_scale:new u.Uniform3f(i,o.u_scale),u_fade:new u.Uniform1f(i,o.u_fade)}},fillOutline:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_world:new u.Uniform2f(i,o.u_world)}},fillOutlinePattern:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_world:new u.Uniform2f(i,o.u_world),u_image:new u.Uniform1i(i,o.u_image),u_texsize:new u.Uniform2f(i,o.u_texsize),u_pixel_coord_upper:new u.Uniform2f(i,o.u_pixel_coord_upper),u_pixel_coord_lower:new u.Uniform2f(i,o.u_pixel_coord_lower),u_scale:new u.Uniform3f(i,o.u_scale),u_fade:new u.Uniform1f(i,o.u_fade)}},circle:function(i,o){return {u_camera_to_center_distance:new u.Uniform1f(i,o.u_camera_to_center_distance),u_scale_with_map:new u.Uniform1i(i,o.u_scale_with_map),u_pitch_with_map:new u.Uniform1i(i,o.u_pitch_with_map),u_extrude_scale:new u.Uniform2f(i,o.u_extrude_scale),u_device_pixel_ratio:new u.Uniform1f(i,o.u_device_pixel_ratio),u_matrix:new u.UniformMatrix4f(i,o.u_matrix)}},collisionBox:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_camera_to_center_distance:new u.Uniform1f(i,o.u_camera_to_center_distance),u_pixels_to_tile_units:new u.Uniform1f(i,o.u_pixels_to_tile_units),u_extrude_scale:new u.Uniform2f(i,o.u_extrude_scale),u_overscale_factor:new u.Uniform1f(i,o.u_overscale_factor)}},collisionCircle:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_inv_matrix:new u.UniformMatrix4f(i,o.u_inv_matrix),u_camera_to_center_distance:new u.Uniform1f(i,o.u_camera_to_center_distance),u_viewport_size:new u.Uniform2f(i,o.u_viewport_size)}},debug:function(i,o){return {u_color:new u.UniformColor(i,o.u_color),u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_overlay:new u.Uniform1i(i,o.u_overlay),u_overlay_scale:new u.Uniform1f(i,o.u_overlay_scale)}},clippingMask:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix)}},heatmap:function(i,o){return {u_extrude_scale:new u.Uniform1f(i,o.u_extrude_scale),u_intensity:new u.Uniform1f(i,o.u_intensity),u_matrix:new u.UniformMatrix4f(i,o.u_matrix)}},heatmapTexture:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_world:new u.Uniform2f(i,o.u_world),u_image:new u.Uniform1i(i,o.u_image),u_color_ramp:new u.Uniform1i(i,o.u_color_ramp),u_opacity:new u.Uniform1f(i,o.u_opacity)}},hillshade:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_image:new u.Uniform1i(i,o.u_image),u_latrange:new u.Uniform2f(i,o.u_latrange),u_light:new u.Uniform2f(i,o.u_light),u_shadow:new u.UniformColor(i,o.u_shadow),u_highlight:new u.UniformColor(i,o.u_highlight),u_accent:new u.UniformColor(i,o.u_accent)}},hillshadePrepare:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_image:new u.Uniform1i(i,o.u_image),u_dimension:new u.Uniform2f(i,o.u_dimension),u_zoom:new u.Uniform1f(i,o.u_zoom),u_unpack:new u.Uniform4f(i,o.u_unpack)}},line:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_ratio:new u.Uniform1f(i,o.u_ratio),u_device_pixel_ratio:new u.Uniform1f(i,o.u_device_pixel_ratio),u_units_to_pixels:new u.Uniform2f(i,o.u_units_to_pixels)}},lineGradient:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_ratio:new u.Uniform1f(i,o.u_ratio),u_device_pixel_ratio:new u.Uniform1f(i,o.u_device_pixel_ratio),u_units_to_pixels:new u.Uniform2f(i,o.u_units_to_pixels),u_image:new u.Uniform1i(i,o.u_image),u_image_height:new u.Uniform1f(i,o.u_image_height)}},linePattern:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_texsize:new u.Uniform2f(i,o.u_texsize),u_ratio:new u.Uniform1f(i,o.u_ratio),u_device_pixel_ratio:new u.Uniform1f(i,o.u_device_pixel_ratio),u_image:new u.Uniform1i(i,o.u_image),u_units_to_pixels:new u.Uniform2f(i,o.u_units_to_pixels),u_scale:new u.Uniform3f(i,o.u_scale),u_fade:new u.Uniform1f(i,o.u_fade)}},lineSDF:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_ratio:new u.Uniform1f(i,o.u_ratio),u_device_pixel_ratio:new u.Uniform1f(i,o.u_device_pixel_ratio),u_units_to_pixels:new u.Uniform2f(i,o.u_units_to_pixels),u_patternscale_a:new u.Uniform2f(i,o.u_patternscale_a),u_patternscale_b:new u.Uniform2f(i,o.u_patternscale_b),u_sdfgamma:new u.Uniform1f(i,o.u_sdfgamma),u_image:new u.Uniform1i(i,o.u_image),u_tex_y_a:new u.Uniform1f(i,o.u_tex_y_a),u_tex_y_b:new u.Uniform1f(i,o.u_tex_y_b),u_mix:new u.Uniform1f(i,o.u_mix)}},raster:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_tl_parent:new u.Uniform2f(i,o.u_tl_parent),u_scale_parent:new u.Uniform1f(i,o.u_scale_parent),u_buffer_scale:new u.Uniform1f(i,o.u_buffer_scale),u_fade_t:new u.Uniform1f(i,o.u_fade_t),u_opacity:new u.Uniform1f(i,o.u_opacity),u_image0:new u.Uniform1i(i,o.u_image0),u_image1:new u.Uniform1i(i,o.u_image1),u_brightness_low:new u.Uniform1f(i,o.u_brightness_low),u_brightness_high:new u.Uniform1f(i,o.u_brightness_high),u_saturation_factor:new u.Uniform1f(i,o.u_saturation_factor),u_contrast_factor:new u.Uniform1f(i,o.u_contrast_factor),u_spin_weights:new u.Uniform3f(i,o.u_spin_weights)}},symbolIcon:function(i,o){return {u_is_size_zoom_constant:new u.Uniform1i(i,o.u_is_size_zoom_constant),u_is_size_feature_constant:new u.Uniform1i(i,o.u_is_size_feature_constant),u_size_t:new u.Uniform1f(i,o.u_size_t),u_size:new u.Uniform1f(i,o.u_size),u_camera_to_center_distance:new u.Uniform1f(i,o.u_camera_to_center_distance),u_pitch:new u.Uniform1f(i,o.u_pitch),u_rotate_symbol:new u.Uniform1i(i,o.u_rotate_symbol),u_aspect_ratio:new u.Uniform1f(i,o.u_aspect_ratio),u_fade_change:new u.Uniform1f(i,o.u_fade_change),u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_label_plane_matrix:new u.UniformMatrix4f(i,o.u_label_plane_matrix),u_coord_matrix:new u.UniformMatrix4f(i,o.u_coord_matrix),u_is_text:new u.Uniform1i(i,o.u_is_text),u_pitch_with_map:new u.Uniform1i(i,o.u_pitch_with_map),u_texsize:new u.Uniform2f(i,o.u_texsize),u_texture:new u.Uniform1i(i,o.u_texture)}},symbolSDF:function(i,o){return {u_is_size_zoom_constant:new u.Uniform1i(i,o.u_is_size_zoom_constant),u_is_size_feature_constant:new u.Uniform1i(i,o.u_is_size_feature_constant),u_size_t:new u.Uniform1f(i,o.u_size_t),u_size:new u.Uniform1f(i,o.u_size),u_camera_to_center_distance:new u.Uniform1f(i,o.u_camera_to_center_distance),u_pitch:new u.Uniform1f(i,o.u_pitch),u_rotate_symbol:new u.Uniform1i(i,o.u_rotate_symbol),u_aspect_ratio:new u.Uniform1f(i,o.u_aspect_ratio),u_fade_change:new u.Uniform1f(i,o.u_fade_change),u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_label_plane_matrix:new u.UniformMatrix4f(i,o.u_label_plane_matrix),u_coord_matrix:new u.UniformMatrix4f(i,o.u_coord_matrix),u_is_text:new u.Uniform1i(i,o.u_is_text),u_pitch_with_map:new u.Uniform1i(i,o.u_pitch_with_map),u_texsize:new u.Uniform2f(i,o.u_texsize),u_texture:new u.Uniform1i(i,o.u_texture),u_gamma_scale:new u.Uniform1f(i,o.u_gamma_scale),u_device_pixel_ratio:new u.Uniform1f(i,o.u_device_pixel_ratio),u_is_halo:new u.Uniform1i(i,o.u_is_halo)}},symbolTextAndIcon:function(i,o){return {u_is_size_zoom_constant:new u.Uniform1i(i,o.u_is_size_zoom_constant),u_is_size_feature_constant:new u.Uniform1i(i,o.u_is_size_feature_constant),u_size_t:new u.Uniform1f(i,o.u_size_t),u_size:new u.Uniform1f(i,o.u_size),u_camera_to_center_distance:new u.Uniform1f(i,o.u_camera_to_center_distance),u_pitch:new u.Uniform1f(i,o.u_pitch),u_rotate_symbol:new u.Uniform1i(i,o.u_rotate_symbol),u_aspect_ratio:new u.Uniform1f(i,o.u_aspect_ratio),u_fade_change:new u.Uniform1f(i,o.u_fade_change),u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_label_plane_matrix:new u.UniformMatrix4f(i,o.u_label_plane_matrix),u_coord_matrix:new u.UniformMatrix4f(i,o.u_coord_matrix),u_is_text:new u.Uniform1i(i,o.u_is_text),u_pitch_with_map:new u.Uniform1i(i,o.u_pitch_with_map),u_texsize:new u.Uniform2f(i,o.u_texsize),u_texsize_icon:new u.Uniform2f(i,o.u_texsize_icon),u_texture:new u.Uniform1i(i,o.u_texture),u_texture_icon:new u.Uniform1i(i,o.u_texture_icon),u_gamma_scale:new u.Uniform1f(i,o.u_gamma_scale),u_device_pixel_ratio:new u.Uniform1f(i,o.u_device_pixel_ratio),u_is_halo:new u.Uniform1i(i,o.u_is_halo)}},background:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_opacity:new u.Uniform1f(i,o.u_opacity),u_color:new u.UniformColor(i,o.u_color)}},backgroundPattern:function(i,o){return {u_matrix:new u.UniformMatrix4f(i,o.u_matrix),u_opacity:new u.Uniform1f(i,o.u_opacity),u_image:new u.Uniform1i(i,o.u_image),u_pattern_tl_a:new u.Uniform2f(i,o.u_pattern_tl_a),u_pattern_br_a:new u.Uniform2f(i,o.u_pattern_br_a),u_pattern_tl_b:new u.Uniform2f(i,o.u_pattern_tl_b),u_pattern_br_b:new u.Uniform2f(i,o.u_pattern_br_b),u_texsize:new u.Uniform2f(i,o.u_texsize),u_mix:new u.Uniform1f(i,o.u_mix),u_pattern_size_a:new u.Uniform2f(i,o.u_pattern_size_a),u_pattern_size_b:new u.Uniform2f(i,o.u_pattern_size_b),u_scale_a:new u.Uniform1f(i,o.u_scale_a),u_scale_b:new u.Uniform1f(i,o.u_scale_b),u_pixel_coord_upper:new u.Uniform2f(i,o.u_pixel_coord_upper),u_pixel_coord_lower:new u.Uniform2f(i,o.u_pixel_coord_lower),u_tile_units_to_pixels:new u.Uniform1f(i,o.u_tile_units_to_pixels)}}};function go(i,o,n,s,p,f,d){for(var y=i.context,v=y.gl,S=i.useProgram("collisionBox"),P=[],z=0,k=0,F=0;F<s.length;F++){var R=s[F],j=o.getTile(R),D=j.getBucket(n);if(D){var N=R.posMatrix;p[0]===0&&p[1]===0||(N=i.translatePosMatrix(R.posMatrix,j,p,f));var G=d?D.textCollisionBox:D.iconCollisionBox,K=D.collisionCircleArray;if(K.length>0){var tt=u.create(),Q=N;u.mul(tt,D.placementInvProjMatrix,i.transform.glCoordMatrix),u.mul(tt,tt,D.placementViewportMatrix),P.push({circleArray:K,circleOffset:k,transform:Q,invTransform:tt}),k=z+=K.length/4;}G&&S.draw(y,v.LINES,M.disabled,O.disabled,i.colorModeForRenderPass(),X.disabled,Fn(N,i.transform,j),n.id,G.layoutVertexBuffer,G.indexBuffer,G.segments,null,i.transform.zoom,null,null,G.collisionVertexBuffer);}}if(d&&P.length){var et=i.useProgram("collisionCircle"),ot=new u.StructArrayLayout2f1f2i16;ot.resize(4*z),ot._trim();for(var ht=0,pt=0,bt=P;pt<bt.length;pt+=1)for(var kt=bt[pt],Bt=0;Bt<kt.circleArray.length/4;Bt++){var Lt=4*Bt,ne=kt.circleArray[Lt+0],wt=kt.circleArray[Lt+1],Nt=kt.circleArray[Lt+2],Gt=kt.circleArray[Lt+3];ot.emplace(ht++,ne,wt,Nt,Gt,0),ot.emplace(ht++,ne,wt,Nt,Gt,1),ot.emplace(ht++,ne,wt,Nt,Gt,2),ot.emplace(ht++,ne,wt,Nt,Gt,3);}(!za||za.length<2*z)&&(za=function(De){var fr=2*De,nr=new u.StructArrayLayout3ui6;nr.resize(fr),nr._trim();for(var Ce=0;Ce<fr;Ce++){var Ue=6*Ce;nr.uint16[Ue+0]=4*Ce+0,nr.uint16[Ue+1]=4*Ce+1,nr.uint16[Ue+2]=4*Ce+2,nr.uint16[Ue+3]=4*Ce+2,nr.uint16[Ue+4]=4*Ce+3,nr.uint16[Ue+5]=4*Ce+0;}return nr}(z));for(var Vt=y.createIndexBuffer(za,!0),Ut=y.createVertexBuffer(ot,u.collisionCircleLayout.members,!0),Zt=0,Ot=P;Zt<Ot.length;Zt+=1){var Rt=Ot[Zt],Je=Bl(Rt.transform,Rt.invTransform,i.transform);et.draw(y,v.TRIANGLES,M.disabled,O.disabled,i.colorModeForRenderPass(),X.disabled,Je,n.id,Ut,Vt,u.SegmentVector.simpleSegment(0,2*Rt.circleOffset,Rt.circleArray.length,Rt.circleArray.length/2),null,i.transform.zoom,null,null,null);}Ut.destroy(),Vt.destroy();}}var _i=u.identity(new Float32Array(16));function Vl(i,o,n,s,p,f){var d=u.getAnchorAlignment(i),y=-(d.horizontalAlign-.5)*o,v=-(d.verticalAlign-.5)*n,S=u.evaluateVariableOffset(i,s);return new u.Point((y/p+S[0])*f,(v/p+S[1])*f)}function Nl(i,o,n,s,p,f,d,y,v,S,P){var z=i.text.placedSymbolArray,k=i.text.dynamicLayoutVertexArray,F=i.icon.dynamicLayoutVertexArray,R={};k.clear();for(var j=0;j<z.length;j++){var D=z.get(j),N=D.hidden||!D.crossTileID||i.allowVerticalPlacement&&!D.placedOrientation?null:s[D.crossTileID];if(N){var G=new u.Point(D.anchorX,D.anchorY),K=Qt(G,n?y:d),tt=ue(f.cameraToCenterDistance,K.signedDistanceFromCamera),Q=p.evaluateSizeForFeature(i.textSizeData,S,D)*tt/u.ONE_EM;n&&(Q*=i.tilePixelRatio/v);for(var et=Vl(N.anchor,N.width,N.height,N.textOffset,N.textBoxScale,Q),ot=n?Qt(G.add(et),d).point:K.point.add(o?et.rotate(-f.angle):et),ht=i.allowVerticalPlacement&&D.placedOrientation===u.WritingMode.vertical?Math.PI/2:0,pt=0;pt<D.numGlyphs;pt++)u.addDynamicAttributes(k,ot,ht);P&&D.associatedIconIndex>=0&&(R[D.associatedIconIndex]={shiftedAnchor:ot,angle:ht});}else vr(D.numGlyphs,k);}if(P){F.clear();for(var bt=i.icon.placedSymbolArray,kt=0;kt<bt.length;kt++){var Bt=bt.get(kt);if(Bt.hidden)vr(Bt.numGlyphs,F);else {var Lt=R[kt];if(Lt)for(var ne=0;ne<Bt.numGlyphs;ne++)u.addDynamicAttributes(F,Lt.shiftedAnchor,Lt.angle);else vr(Bt.numGlyphs,F);}}i.icon.dynamicLayoutVertexBuffer.updateData(F);}i.text.dynamicLayoutVertexBuffer.updateData(k);}function jl(i,o,n){return n.iconsInText&&o?"symbolTextAndIcon":i?"symbolSDF":"symbolIcon"}function Vn(i,o,n,s,p,f,d,y,v,S,P,z){for(var k=i.context,F=k.gl,R=i.transform,j=y==="map",D=v==="map",N=j&&n.layout.get("symbol-placement")!=="point",G=j&&!D&&!N,K=n.layout.get("symbol-sort-key").constantOr(1)!==void 0,tt=!1,Q=i.depthModeForSublayer(0,M.ReadOnly),et=n.layout.get("text-variable-anchor"),ot=[],ht=0,pt=s;ht<pt.length;ht+=1){var bt=pt[ht],kt=o.getTile(bt),Bt=kt.getBucket(n);if(Bt){var Lt=p?Bt.text:Bt.icon;if(Lt&&Lt.segments.get().length){var ne=Lt.programConfigurations.get(n.id),wt=p||Bt.sdfIcons,Nt=p?Bt.textSizeData:Bt.iconSizeData,Gt=D||R.pitch!==0,Vt=i.useProgram(jl(wt,p,Bt),ne),Ut=u.evaluateSizeForZoom(Nt,R.zoom),Zt=void 0,Ot=[0,0],Rt=void 0,Je=void 0,De=null,fr=void 0;if(p)Rt=kt.glyphAtlasTexture,Je=F.LINEAR,Zt=kt.glyphAtlasTexture.size,Bt.iconsInText&&(Ot=kt.imageAtlasTexture.size,De=kt.imageAtlasTexture,fr=Gt||i.options.rotating||i.options.zooming||Nt.kind==="composite"||Nt.kind==="camera"?F.LINEAR:F.NEAREST);else {var nr=n.layout.get("icon-size").constantOr(0)!==1||Bt.iconsNeedLinear;Rt=kt.imageAtlasTexture,Je=wt||i.options.rotating||i.options.zooming||nr||Gt?F.LINEAR:F.NEAREST,Zt=kt.imageAtlasTexture.size;}var Ce=Te(kt,1,i.transform.zoom),Ue=Fe(bt.posMatrix,D,j,i.transform,Ce),jr=de(bt.posMatrix,D,j,i.transform,Ce),Sr=et&&Bt.hasTextData(),hn=n.layout.get("icon-text-fit")!=="none"&&Sr&&Bt.hasIconData();N&&Vo(Bt,bt.posMatrix,i,p,Ue,jr,D,S);var Cr=i.translatePosMatrix(bt.posMatrix,kt,f,d),Si=N||p&&et||hn?_i:Ue,si=i.translatePosMatrix(jr,kt,f,d,!0),aa=wt&&n.paint.get(p?"text-halo-width":"icon-halo-width").constantOr(1)!==0,So={program:Vt,buffers:Lt,uniformValues:wt?Bt.iconsInText?Ca(Nt.kind,Ut,G,D,i,Cr,Si,si,Zt,Ot):Wo(Nt.kind,Ut,G,D,i,Cr,Si,si,p,Zt,!0):mo(Nt.kind,Ut,G,D,i,Cr,Si,si,p,Zt),atlasTexture:Rt,atlasTextureIcon:De,atlasInterpolation:Je,atlasInterpolationIcon:fr,isSDF:wt,hasHalo:aa};if(K&&Bt.canOverlap){tt=!0;for(var fn=0,To=Lt.segments.get();fn<To.length;fn+=1){var sa=To[fn];ot.push({segments:new u.SegmentVector([sa]),sortKey:sa.sortKey,state:So});}}else ot.push({segments:Lt.segments,sortKey:0,state:So});}}}tt&&ot.sort(function(dn,Xn){return dn.sortKey-Xn.sortKey});for(var ki=0,la=ot;ki<la.length;ki+=1){var Mi=la[ki],Ye=Mi.state;if(k.activeTexture.set(F.TEXTURE0),Ye.atlasTexture.bind(Ye.atlasInterpolation,F.CLAMP_TO_EDGE),Ye.atlasTextureIcon&&(k.activeTexture.set(F.TEXTURE1),Ye.atlasTextureIcon&&Ye.atlasTextureIcon.bind(Ye.atlasInterpolationIcon,F.CLAMP_TO_EDGE)),Ye.isSDF){var Zi=Ye.uniformValues;Ye.hasHalo&&(Zi.u_is_halo=1,Ho(Ye.buffers,Mi.segments,n,i,Ye.program,Q,P,z,Zi)),Zi.u_is_halo=0;}Ho(Ye.buffers,Mi.segments,n,i,Ye.program,Q,P,z,Ye.uniformValues);}}function Ho(i,o,n,s,p,f,d,y,v){var S=s.context;p.draw(S,S.gl.TRIANGLES,f,d,y,X.disabled,v,n.id,i.layoutVertexBuffer,i.indexBuffer,o,n.paint,s.transform.zoom,i.programConfigurations.get(n.id),i.dynamicLayoutVertexBuffer,i.opacityVertexBuffer);}function ka(i,o,n,s,p,f,d){var y,v,S,P,z,k=i.context.gl,F=n.paint.get("fill-pattern"),R=F&&F.constantOr(1),j=n.getCrossfadeParameters();d?(v=R&&!n.getPaintProperty("fill-outline-color")?"fillOutlinePattern":"fillOutline",y=k.LINES):(v=R?"fillPattern":"fill",y=k.TRIANGLES);for(var D=0,N=s;D<N.length;D+=1){var G=N[D],K=o.getTile(G);if(!R||K.patternsLoaded()){var tt=K.getBucket(n);if(tt){var Q=tt.programConfigurations.get(n.id),et=i.useProgram(v,Q);R&&(i.context.activeTexture.set(k.TEXTURE0),K.imageAtlasTexture.bind(k.LINEAR,k.CLAMP_TO_EDGE),Q.updatePaintBuffers(j));var ot=F.constantOr(null);if(ot&&K.imageAtlas){var ht=K.imageAtlas,pt=ht.patternPositions[ot.to.toString()],bt=ht.patternPositions[ot.from.toString()];pt&&bt&&Q.setConstantPatternPositions(pt,bt);}var kt=i.translatePosMatrix(G.posMatrix,K,n.paint.get("fill-translate"),n.paint.get("fill-translate-anchor"));if(d){P=tt.indexBuffer2,z=tt.segments2;var Bt=[k.drawingBufferWidth,k.drawingBufferHeight];S=v==="fillOutlinePattern"&&R?Ll(kt,i,j,K,Bt):Dl(kt,Bt);}else P=tt.indexBuffer,z=tt.segments,S=R?Rn(kt,i,j,K):an(kt);et.draw(i.context,y,p,i.stencilModeForClipping(G),f,X.disabled,S,n.id,tt.layoutVertexBuffer,P,z,n.paint,i.transform.zoom,Q);}}}}function ks(i,o,n,s,p,f,d){for(var y=i.context,v=y.gl,S=n.paint.get("fill-extrusion-pattern"),P=S.constantOr(1),z=n.getCrossfadeParameters(),k=n.paint.get("fill-extrusion-opacity"),F=0,R=s;F<R.length;F+=1){var j=R[F],D=o.getTile(j),N=D.getBucket(n);if(N){var G=N.programConfigurations.get(n.id),K=i.useProgram(P?"fillExtrusionPattern":"fillExtrusion",G);P&&(i.context.activeTexture.set(v.TEXTURE0),D.imageAtlasTexture.bind(v.LINEAR,v.CLAMP_TO_EDGE),G.updatePaintBuffers(z));var tt=S.constantOr(null);if(tt&&D.imageAtlas){var Q=D.imageAtlas,et=Q.patternPositions[tt.to.toString()],ot=Q.patternPositions[tt.from.toString()];et&&ot&&G.setConstantPatternPositions(et,ot);}var ht=i.translatePosMatrix(j.posMatrix,D,n.paint.get("fill-extrusion-translate"),n.paint.get("fill-extrusion-translate-anchor")),pt=n.paint.get("fill-extrusion-vertical-gradient"),bt=P?Bn(ht,i,pt,k,j,z,D):Ml(ht,i,pt,k);K.draw(y,y.gl.TRIANGLES,p,f,d,X.backCCW,bt,n.id,N.layoutVertexBuffer,N.indexBuffer,N.segments,n.paint,i.transform.zoom,G);}}}function Ma(i,o,n,s,p,f){var d=i.context,y=d.gl,v=o.fbo;if(v){var S=i.useProgram("hillshade");d.activeTexture.set(y.TEXTURE0),y.bindTexture(y.TEXTURE_2D,v.colorAttachment.get());var P=function(z,k,F){var R=F.paint.get("hillshade-shadow-color"),j=F.paint.get("hillshade-highlight-color"),D=F.paint.get("hillshade-accent-color"),N=F.paint.get("hillshade-illumination-direction")*(Math.PI/180);F.paint.get("hillshade-illumination-anchor")==="viewport"&&(N-=z.transform.angle);var G,K,tt,Q=!z.options.moving;return {u_matrix:z.transform.calculatePosMatrix(k.tileID.toUnwrapped(),Q),u_image:0,u_latrange:(G=k.tileID,K=Math.pow(2,G.canonical.z),tt=G.canonical.y,[new u.MercatorCoordinate(0,tt/K).toLngLat().lat,new u.MercatorCoordinate(0,(tt+1)/K).toLngLat().lat]),u_light:[F.paint.get("hillshade-exaggeration"),N],u_shadow:R,u_highlight:j,u_accent:D}}(i,o,n);S.draw(d,y.TRIANGLES,s,p,f,X.disabled,P,n.id,i.rasterBoundsBuffer,i.quadTriangleIndexBuffer,i.rasterBoundsSegments);}}function Nu(i,o,n,s,p,f){var d=i.context,y=d.gl,v=o.dem;if(v&&v.data){var S=v.dim,P=v.stride,z=v.getPixels();if(d.activeTexture.set(y.TEXTURE1),d.pixelStoreUnpackPremultiplyAlpha.set(!1),o.demTexture=o.demTexture||i.getTileTexture(P),o.demTexture){var k=o.demTexture;k.update(z,{premultiply:!1}),k.bind(y.NEAREST,y.CLAMP_TO_EDGE);}else o.demTexture=new u.Texture(d,z,y.RGBA,{premultiply:!1}),o.demTexture.bind(y.NEAREST,y.CLAMP_TO_EDGE);d.activeTexture.set(y.TEXTURE0);var F=o.fbo;if(!F){var R=new u.Texture(d,{width:S,height:S,data:null},y.RGBA);R.bind(y.LINEAR,y.CLAMP_TO_EDGE),(F=o.fbo=d.createFramebuffer(S,S,!0)).colorAttachment.set(R.texture);}d.bindFramebuffer.set(F.framebuffer),d.viewport.set([0,0,S,S]),i.useProgram("hillshadePrepare").draw(d,y.TRIANGLES,s,p,f,X.disabled,function(j,D){var N=D.stride,G=u.create();return u.ortho(G,0,u.EXTENT,-u.EXTENT,0,0,1),u.translate(G,G,[0,-u.EXTENT,0]),{u_matrix:G,u_image:1,u_dimension:[N,N],u_zoom:j.overscaledZ,u_unpack:D.getUnpackVector()}}(o.tileID,v),n.id,i.rasterBoundsBuffer,i.quadTriangleIndexBuffer,i.rasterBoundsSegments),o.needsHillshadePrepare=!1;}}function Da(i,o,n,s,p){var f=s.paint.get("raster-fade-duration");if(f>0){var d=u.browser.now(),y=(d-i.timeAdded)/f,v=o?(d-o.timeAdded)/f:-1,S=n.getSource(),P=p.coveringZoomLevel({tileSize:S.tileSize,roundZoom:S.roundZoom}),z=!o||Math.abs(o.tileID.overscaledZ-P)>Math.abs(i.tileID.overscaledZ-P),k=z&&i.refreshedUponExpiration?1:u.clamp(z?y:1-v,0,1);return i.refreshedUponExpiration&&y>=1&&(i.refreshedUponExpiration=!1),o?{opacity:1,mix:1-k}:{opacity:k,mix:0}}return {opacity:1,mix:0}}var Ms=new u.Color(1,0,0,1),ql=new u.Color(0,1,0,1),Zl=new u.Color(0,0,1,1),La=new u.Color(1,0,1,1),Ds=new u.Color(0,1,1,1);function Ls(i,o,n,s){Jo(i,0,o+n/2,i.transform.width,n,s);}function Bs(i,o,n,s){Jo(i,o-n/2,0,n,i.transform.height,s);}function Jo(i,o,n,s,p,f){var d=i.context,y=d.gl;y.enable(y.SCISSOR_TEST),y.scissor(o*u.browser.devicePixelRatio,n*u.browser.devicePixelRatio,s*u.browser.devicePixelRatio,p*u.browser.devicePixelRatio),d.clear({color:f}),y.disable(y.SCISSOR_TEST);}function Gl(i,o,n){var s=i.context,p=s.gl,f=n.posMatrix,d=i.useProgram("debug"),y=M.disabled,v=O.disabled,S=i.colorModeForRenderPass();s.activeTexture.set(p.TEXTURE0),i.emptyTexture.bind(p.LINEAR,p.CLAMP_TO_EDGE),d.draw(s,p.LINE_STRIP,y,v,S,X.disabled,On(f,u.Color.red),"$debug",i.debugBuffer,i.tileBorderIndexBuffer,i.debugSegments);var P=o.getTileByID(n.key).latestRawTileData,z=Math.floor((P&&P.byteLength||0)/1024),k=o.getTile(n).tileSize,F=512/Math.min(k,512)*(n.overscaledZ/i.transform.zoom)*.5,R=n.canonical.toString();n.overscaledZ!==n.canonical.z&&(R+=" => "+n.overscaledZ),function(j,D){j.initDebugOverlayCanvas();var N=j.debugOverlayCanvas,G=j.context.gl,K=j.debugOverlayCanvas.getContext("2d");K.clearRect(0,0,N.width,N.height),K.shadowColor="white",K.shadowBlur=2,K.lineWidth=1.5,K.strokeStyle="white",K.textBaseline="top",K.font="bold 36px Open Sans, sans-serif",K.fillText(D,5,5),K.strokeText(D,5,5),j.debugOverlayTexture.update(N),j.debugOverlayTexture.bind(G.LINEAR,G.CLAMP_TO_EDGE);}(i,R+" "+z+"kb"),d.draw(s,p.TRIANGLES,y,v,Z.alphaBlended,X.disabled,On(f,u.Color.transparent,F),"$debug",i.debugBuffer,i.quadTriangleIndexBuffer,i.debugSegments);}var Nn={symbol:function(i,o,n,s,p){if(i.renderPass==="translucent"){var f=O.disabled,d=i.colorModeForRenderPass();n.layout.get("text-variable-anchor")&&function(y,v,S,P,z,k,F){for(var R=v.transform,j=z==="map",D=k==="map",N=0,G=y;N<G.length;N+=1){var K=G[N],tt=P.getTile(K),Q=tt.getBucket(S);if(Q&&Q.text&&Q.text.segments.get().length){var et=u.evaluateSizeForZoom(Q.textSizeData,R.zoom),ot=Te(tt,1,v.transform.zoom),ht=Fe(K.posMatrix,D,j,v.transform,ot),pt=S.layout.get("icon-text-fit")!=="none"&&Q.hasIconData();if(et){var bt=Math.pow(2,R.zoom-tt.tileID.overscaledZ);Nl(Q,j,D,F,u.symbolSize,R,ht,K.posMatrix,bt,et,pt);}}}}(s,i,n,o,n.layout.get("text-rotation-alignment"),n.layout.get("text-pitch-alignment"),p),n.paint.get("icon-opacity").constantOr(1)!==0&&Vn(i,o,n,s,!1,n.paint.get("icon-translate"),n.paint.get("icon-translate-anchor"),n.layout.get("icon-rotation-alignment"),n.layout.get("icon-pitch-alignment"),n.layout.get("icon-keep-upright"),f,d),n.paint.get("text-opacity").constantOr(1)!==0&&Vn(i,o,n,s,!0,n.paint.get("text-translate"),n.paint.get("text-translate-anchor"),n.layout.get("text-rotation-alignment"),n.layout.get("text-pitch-alignment"),n.layout.get("text-keep-upright"),f,d),o.map.showCollisionBoxes&&(go(i,o,n,s,n.paint.get("text-translate"),n.paint.get("text-translate-anchor"),!0),go(i,o,n,s,n.paint.get("icon-translate"),n.paint.get("icon-translate-anchor"),!1));}},circle:function(i,o,n,s){if(i.renderPass==="translucent"){var p=n.paint.get("circle-opacity"),f=n.paint.get("circle-stroke-width"),d=n.paint.get("circle-stroke-opacity"),y=n.layout.get("circle-sort-key").constantOr(1)!==void 0;if(p.constantOr(1)!==0||f.constantOr(1)!==0&&d.constantOr(1)!==0){for(var v=i.context,S=v.gl,P=i.depthModeForSublayer(0,M.ReadOnly),z=O.disabled,k=i.colorModeForRenderPass(),F=[],R=0;R<s.length;R++){var j=s[R],D=o.getTile(j),N=D.getBucket(n);if(N){var G=N.programConfigurations.get(n.id),K={programConfiguration:G,program:i.useProgram("circle",G),layoutVertexBuffer:N.layoutVertexBuffer,indexBuffer:N.indexBuffer,uniformValues:Cs(i,j,D,n)};if(y)for(var tt=0,Q=N.segments.get();tt<Q.length;tt+=1){var et=Q[tt];F.push({segments:new u.SegmentVector([et]),sortKey:et.sortKey,state:K});}else F.push({segments:N.segments,sortKey:0,state:K});}}y&&F.sort(function(kt,Bt){return kt.sortKey-Bt.sortKey});for(var ot=0,ht=F;ot<ht.length;ot+=1){var pt=ht[ot],bt=pt.state;bt.program.draw(v,S.TRIANGLES,P,z,k,X.disabled,bt.uniformValues,n.id,bt.layoutVertexBuffer,bt.indexBuffer,pt.segments,n.paint,i.transform.zoom,bt.programConfiguration);}}}},heatmap:function(i,o,n,s){if(n.paint.get("heatmap-opacity")!==0)if(i.renderPass==="offscreen"){var p=i.context,f=p.gl,d=O.disabled,y=new Z([f.ONE,f.ONE],u.Color.transparent,[!0,!0,!0,!0]);!function(F,R,j){var D=F.gl;F.activeTexture.set(D.TEXTURE1),F.viewport.set([0,0,R.width/4,R.height/4]);var N=j.heatmapFbo;if(N)D.bindTexture(D.TEXTURE_2D,N.colorAttachment.get()),F.bindFramebuffer.set(N.framebuffer);else {var G=D.createTexture();D.bindTexture(D.TEXTURE_2D,G),D.texParameteri(D.TEXTURE_2D,D.TEXTURE_WRAP_S,D.CLAMP_TO_EDGE),D.texParameteri(D.TEXTURE_2D,D.TEXTURE_WRAP_T,D.CLAMP_TO_EDGE),D.texParameteri(D.TEXTURE_2D,D.TEXTURE_MIN_FILTER,D.LINEAR),D.texParameteri(D.TEXTURE_2D,D.TEXTURE_MAG_FILTER,D.LINEAR),N=j.heatmapFbo=F.createFramebuffer(R.width/4,R.height/4,!1),function(K,tt,Q,et){var ot=K.gl;ot.texImage2D(ot.TEXTURE_2D,0,ot.RGBA,tt.width/4,tt.height/4,0,ot.RGBA,K.extRenderToTextureHalfFloat?K.extTextureHalfFloat.HALF_FLOAT_OES:ot.UNSIGNED_BYTE,null),et.colorAttachment.set(Q);}(F,R,G,N);}}(p,i,n),p.clear({color:u.Color.transparent});for(var v=0;v<s.length;v++){var S=s[v];if(!o.hasRenderableParent(S)){var P=o.getTile(S),z=P.getBucket(n);if(z){var k=z.programConfigurations.get(n.id);i.useProgram("heatmap",k).draw(p,f.TRIANGLES,M.disabled,d,y,X.disabled,Rl(S.posMatrix,P,i.transform.zoom,n.paint.get("heatmap-intensity")),n.id,z.layoutVertexBuffer,z.indexBuffer,z.segments,n.paint,i.transform.zoom,k);}}}p.viewport.set([0,0,i.width,i.height]);}else i.renderPass==="translucent"&&(i.context.setColorMode(i.colorModeForRenderPass()),function(F,R){var j=F.context,D=j.gl,N=R.heatmapFbo;if(N){j.activeTexture.set(D.TEXTURE0),D.bindTexture(D.TEXTURE_2D,N.colorAttachment.get()),j.activeTexture.set(D.TEXTURE1);var G=R.colorRampTexture;G||(G=R.colorRampTexture=new u.Texture(j,R.colorRamp,D.RGBA)),G.bind(D.LINEAR,D.CLAMP_TO_EDGE),F.useProgram("heatmapTexture").draw(j,D.TRIANGLES,M.disabled,O.disabled,F.colorModeForRenderPass(),X.disabled,function(K,tt,Q,et){var ot=u.create();u.ortho(ot,0,K.width,K.height,0,0,1);var ht=K.context.gl;return {u_matrix:ot,u_world:[ht.drawingBufferWidth,ht.drawingBufferHeight],u_image:0,u_color_ramp:1,u_opacity:tt.paint.get("heatmap-opacity")}}(F,R),R.id,F.viewportBuffer,F.quadTriangleIndexBuffer,F.viewportSegments,R.paint,F.transform.zoom);}}(i,n));},line:function(i,o,n,s){if(i.renderPass==="translucent"){var p=n.paint.get("line-opacity"),f=n.paint.get("line-width");if(p.constantOr(1)!==0&&f.constantOr(1)!==0)for(var d=i.depthModeForSublayer(0,M.ReadOnly),y=i.colorModeForRenderPass(),v=n.paint.get("line-dasharray"),S=n.paint.get("line-pattern"),P=S.constantOr(1),z=n.paint.get("line-gradient"),k=n.getCrossfadeParameters(),F=P?"linePattern":v?"lineSDF":z?"lineGradient":"line",R=i.context,j=R.gl,D=!0,N=0,G=s;N<G.length;N+=1){var K=G[N],tt=o.getTile(K);if(!P||tt.patternsLoaded()){var Q=tt.getBucket(n);if(Q){var et=Q.programConfigurations.get(n.id),ot=i.context.program.get(),ht=i.useProgram(F,et),pt=D||ht.program!==ot,bt=S.constantOr(null);if(bt&&tt.imageAtlas){var kt=tt.imageAtlas,Bt=kt.patternPositions[bt.to.toString()],Lt=kt.patternPositions[bt.from.toString()];Bt&&Lt&&et.setConstantPatternPositions(Bt,Lt);}var ne=P?Pa(i,tt,n,k):v?Uu(i,tt,n,v,k):z?xe(i,tt,n,Q.lineClipsArray.length):Xo(i,tt,n);if(P)R.activeTexture.set(j.TEXTURE0),tt.imageAtlasTexture.bind(j.LINEAR,j.CLAMP_TO_EDGE),et.updatePaintBuffers(k);else if(v&&(pt||i.lineAtlas.dirty))R.activeTexture.set(j.TEXTURE0),i.lineAtlas.bind(R);else if(z){var wt=Q.gradients[n.id],Nt=wt.texture;if(n.gradientVersion!==wt.version){var Gt=256;if(n.stepInterpolant){var Vt=o.getSource().maxzoom,Ut=K.canonical.z===Vt?Math.ceil(1<<i.transform.maxZoom-K.canonical.z):1;Gt=u.clamp(u.nextPowerOfTwo(Q.maxLineLength/u.EXTENT*1024*Ut),256,R.maxTextureSize);}wt.gradient=u.renderColorRamp({expression:n.gradientExpression(),evaluationKey:"lineProgress",resolution:Gt,image:wt.gradient||void 0,clips:Q.lineClipsArray}),wt.texture?wt.texture.update(wt.gradient):wt.texture=new u.Texture(R,wt.gradient,j.RGBA),wt.version=n.gradientVersion,Nt=wt.texture;}R.activeTexture.set(j.TEXTURE0),Nt.bind(n.stepInterpolant?j.NEAREST:j.LINEAR,j.CLAMP_TO_EDGE);}ht.draw(R,j.TRIANGLES,d,i.stencilModeForClipping(K),y,X.disabled,ne,n.id,Q.layoutVertexBuffer,Q.indexBuffer,Q.segments,n.paint,i.transform.zoom,et,Q.layoutVertexBuffer2),D=!1;}}}}},fill:function(i,o,n,s){var p=n.paint.get("fill-color"),f=n.paint.get("fill-opacity");if(f.constantOr(1)!==0){var d=i.colorModeForRenderPass(),y=n.paint.get("fill-pattern"),v=i.opaquePassEnabledForLayer()&&!y.constantOr(1)&&p.constantOr(u.Color.transparent).a===1&&f.constantOr(0)===1?"opaque":"translucent";if(i.renderPass===v){var S=i.depthModeForSublayer(1,i.renderPass==="opaque"?M.ReadWrite:M.ReadOnly);ka(i,o,n,s,S,d,!1);}if(i.renderPass==="translucent"&&n.paint.get("fill-antialias")){var P=i.depthModeForSublayer(n.getPaintProperty("fill-outline-color")?2:0,M.ReadOnly);ka(i,o,n,s,P,d,!0);}}},"fill-extrusion":function(i,o,n,s){var p=n.paint.get("fill-extrusion-opacity");if(p!==0&&i.renderPass==="translucent"){var f=new M(i.context.gl.LEQUAL,M.ReadWrite,i.depthRangeFor3D);if(p!==1||n.paint.get("fill-extrusion-pattern").constantOr(1))ks(i,o,n,s,f,O.disabled,Z.disabled),ks(i,o,n,s,f,i.stencilModeFor3D(),i.colorModeForRenderPass());else {var d=i.colorModeForRenderPass();ks(i,o,n,s,f,O.disabled,d);}}},hillshade:function(i,o,n,s){if(i.renderPass==="offscreen"||i.renderPass==="translucent"){for(var p=i.context,f=i.depthModeForSublayer(0,M.ReadOnly),d=i.colorModeForRenderPass(),y=i.renderPass==="translucent"?i.stencilConfigForOverlap(s):[{},s],v=y[0],S=0,P=y[1];S<P.length;S+=1){var z=P[S],k=o.getTile(z);k.needsHillshadePrepare&&i.renderPass==="offscreen"?Nu(i,k,n,f,O.disabled,d):i.renderPass==="translucent"&&Ma(i,k,n,f,v[z.overscaledZ],d);}p.viewport.set([0,0,i.width,i.height]);}},raster:function(i,o,n,s){if(i.renderPass==="translucent"&&n.paint.get("raster-opacity")!==0&&s.length)for(var p=i.context,f=p.gl,d=o.getSource(),y=i.useProgram("raster"),v=i.colorModeForRenderPass(),S=d instanceof Ii?[{},s]:i.stencilConfigForOverlap(s),P=S[0],z=S[1],k=z[z.length-1].overscaledZ,F=!i.options.moving,R=0,j=z;R<j.length;R+=1){var D=j[R],N=i.depthModeForSublayer(D.overscaledZ-k,n.paint.get("raster-opacity")===1?M.ReadWrite:M.ReadOnly,f.LESS),G=o.getTile(D),K=i.transform.calculatePosMatrix(D.toUnwrapped(),F);G.registerFadeDuration(n.paint.get("raster-fade-duration"));var tt=o.findLoadedParent(D,0),Q=Da(G,tt,o,n,i.transform),et=void 0,ot=void 0,ht=n.paint.get("raster-resampling")==="nearest"?f.NEAREST:f.LINEAR;p.activeTexture.set(f.TEXTURE0),G.texture.bind(ht,f.CLAMP_TO_EDGE,f.LINEAR_MIPMAP_NEAREST),p.activeTexture.set(f.TEXTURE1),tt?(tt.texture.bind(ht,f.CLAMP_TO_EDGE,f.LINEAR_MIPMAP_NEAREST),et=Math.pow(2,tt.tileID.overscaledZ-G.tileID.overscaledZ),ot=[G.tileID.canonical.x*et%1,G.tileID.canonical.y*et%1]):G.texture.bind(ht,f.CLAMP_TO_EDGE,f.LINEAR_MIPMAP_NEAREST);var pt=Vu(K,ot||[0,0],et||1,Q,n);d instanceof Ii?y.draw(p,f.TRIANGLES,N,O.disabled,v,X.disabled,pt,n.id,d.boundsBuffer,i.quadTriangleIndexBuffer,d.boundsSegments):y.draw(p,f.TRIANGLES,N,P[D.overscaledZ],v,X.disabled,pt,n.id,i.rasterBoundsBuffer,i.quadTriangleIndexBuffer,i.rasterBoundsSegments);}},background:function(i,o,n){var s=n.paint.get("background-color"),p=n.paint.get("background-opacity");if(p!==0){var f=i.context,d=f.gl,y=i.transform,v=y.tileSize,S=n.paint.get("background-pattern");if(!i.isPatternMissing(S)){var P=!S&&s.a===1&&p===1&&i.opaquePassEnabledForLayer()?"opaque":"translucent";if(i.renderPass===P){var z=O.disabled,k=i.depthModeForSublayer(0,P==="opaque"?M.ReadWrite:M.ReadOnly),F=i.colorModeForRenderPass(),R=i.useProgram(S?"backgroundPattern":"background"),j=y.coveringTiles({tileSize:v});S&&(f.activeTexture.set(d.TEXTURE0),i.imageManager.bind(i.context));for(var D=n.getCrossfadeParameters(),N=0,G=j;N<G.length;N+=1){var K=G[N],tt=i.transform.calculatePosMatrix(K.toUnwrapped()),Q=S?yo(tt,p,i,S,{tileID:K,tileSize:v},D):Ko(tt,p,s);R.draw(f,d.TRIANGLES,k,z,F,X.disabled,Q,n.id,i.tileExtentBuffer,i.quadTriangleIndexBuffer,i.tileExtentSegments);}}}}},debug:function(i,o,n){for(var s=0;s<n.length;s++)Gl(i,o,n[s]);},custom:function(i,o,n){var s=i.context,p=n.implementation;if(i.renderPass==="offscreen"){var f=p.prerender;f&&(i.setCustomLayerDefaults(),s.setColorMode(i.colorModeForRenderPass()),f.call(p,s.gl,i.transform.customLayerMatrix()),s.setDirty(),i.setBaseState());}else if(i.renderPass==="translucent"){i.setCustomLayerDefaults(),s.setColorMode(i.colorModeForRenderPass()),s.setStencilMode(O.disabled);var d=p.renderingMode==="3d"?new M(i.context.gl.LEQUAL,M.ReadWrite,i.depthRangeFor3D):i.depthModeForSublayer(0,M.ReadOnly);s.setDepthMode(d),p.render(s.gl,i.transform.customLayerMatrix()),s.setDirty(),i.setBaseState(),s.bindFramebuffer.set(null);}}},Ie=function(i,o){this.context=new C(i),this.transform=o,this._tileTextures={},this.setup(),this.numSublayers=U.maxUnderzooming+U.maxOverzooming+1,this.depthEpsilon=1/Math.pow(2,16),this.crossTileSymbolIndex=new Qi,this.gpuTimers={};};Ie.prototype.resize=function(i,o){if(this.width=i*u.browser.devicePixelRatio,this.height=o*u.browser.devicePixelRatio,this.context.viewport.set([0,0,this.width,this.height]),this.style)for(var n=0,s=this.style._order;n<s.length;n+=1)this.style._layers[s[n]].resize();},Ie.prototype.setup=function(){var i=this.context,o=new u.StructArrayLayout2i4;o.emplaceBack(0,0),o.emplaceBack(u.EXTENT,0),o.emplaceBack(0,u.EXTENT),o.emplaceBack(u.EXTENT,u.EXTENT),this.tileExtentBuffer=i.createVertexBuffer(o,qe.members),this.tileExtentSegments=u.SegmentVector.simpleSegment(0,0,4,2);var n=new u.StructArrayLayout2i4;n.emplaceBack(0,0),n.emplaceBack(u.EXTENT,0),n.emplaceBack(0,u.EXTENT),n.emplaceBack(u.EXTENT,u.EXTENT),this.debugBuffer=i.createVertexBuffer(n,qe.members),this.debugSegments=u.SegmentVector.simpleSegment(0,0,4,5);var s=new u.StructArrayLayout4i8;s.emplaceBack(0,0,0,0),s.emplaceBack(u.EXTENT,0,u.EXTENT,0),s.emplaceBack(0,u.EXTENT,0,u.EXTENT),s.emplaceBack(u.EXTENT,u.EXTENT,u.EXTENT,u.EXTENT),this.rasterBoundsBuffer=i.createVertexBuffer(s,fi.members),this.rasterBoundsSegments=u.SegmentVector.simpleSegment(0,0,4,2);var p=new u.StructArrayLayout2i4;p.emplaceBack(0,0),p.emplaceBack(1,0),p.emplaceBack(0,1),p.emplaceBack(1,1),this.viewportBuffer=i.createVertexBuffer(p,qe.members),this.viewportSegments=u.SegmentVector.simpleSegment(0,0,4,2);var f=new u.StructArrayLayout1ui2;f.emplaceBack(0),f.emplaceBack(1),f.emplaceBack(3),f.emplaceBack(2),f.emplaceBack(0),this.tileBorderIndexBuffer=i.createIndexBuffer(f);var d=new u.StructArrayLayout3ui6;d.emplaceBack(0,1,2),d.emplaceBack(2,1,3),this.quadTriangleIndexBuffer=i.createIndexBuffer(d),this.emptyTexture=new u.Texture(i,{width:1,height:1,data:new Uint8Array([0,0,0,0])},i.gl.RGBA);var y=this.context.gl;this.stencilClearMode=new O({func:y.ALWAYS,mask:0},0,255,y.ZERO,y.ZERO,y.ZERO);},Ie.prototype.clearStencil=function(){var i=this.context,o=i.gl;this.nextStencilID=1,this.currentStencilSource=void 0;var n=u.create();u.ortho(n,0,this.width,this.height,0,0,1),u.scale(n,n,[o.drawingBufferWidth,o.drawingBufferHeight,0]),this.useProgram("clippingMask").draw(i,o.TRIANGLES,M.disabled,this.stencilClearMode,Z.disabled,X.disabled,Un(n),"$clipping",this.viewportBuffer,this.quadTriangleIndexBuffer,this.viewportSegments);},Ie.prototype._renderTileClippingMasks=function(i,o){if(this.currentStencilSource!==i.source&&i.isTileClipped()&&o&&o.length){this.currentStencilSource=i.source;var n=this.context,s=n.gl;this.nextStencilID+o.length>256&&this.clearStencil(),n.setColorMode(Z.disabled),n.setDepthMode(M.disabled);var p=this.useProgram("clippingMask");this._tileClippingMaskIDs={};for(var f=0,d=o;f<d.length;f+=1){var y=d[f],v=this._tileClippingMaskIDs[y.key]=this.nextStencilID++;p.draw(n,s.TRIANGLES,M.disabled,new O({func:s.ALWAYS,mask:0},v,255,s.KEEP,s.KEEP,s.REPLACE),Z.disabled,X.disabled,Un(y.posMatrix),"$clipping",this.tileExtentBuffer,this.quadTriangleIndexBuffer,this.tileExtentSegments);}}},Ie.prototype.stencilModeFor3D=function(){this.currentStencilSource=void 0,this.nextStencilID+1>256&&this.clearStencil();var i=this.nextStencilID++,o=this.context.gl;return new O({func:o.NOTEQUAL,mask:255},i,255,o.KEEP,o.KEEP,o.REPLACE)},Ie.prototype.stencilModeForClipping=function(i){var o=this.context.gl;return new O({func:o.EQUAL,mask:255},this._tileClippingMaskIDs[i.key],0,o.KEEP,o.KEEP,o.REPLACE)},Ie.prototype.stencilConfigForOverlap=function(i){var o,n=this.context.gl,s=i.sort(function(v,S){return S.overscaledZ-v.overscaledZ}),p=s[s.length-1].overscaledZ,f=s[0].overscaledZ-p+1;if(f>1){this.currentStencilSource=void 0,this.nextStencilID+f>256&&this.clearStencil();for(var d={},y=0;y<f;y++)d[y+p]=new O({func:n.GEQUAL,mask:255},y+this.nextStencilID,255,n.KEEP,n.KEEP,n.REPLACE);return this.nextStencilID+=f,[d,s]}return [(o={},o[p]=O.disabled,o),s]},Ie.prototype.colorModeForRenderPass=function(){var i=this.context.gl;return this._showOverdrawInspector?new Z([i.CONSTANT_COLOR,i.ONE],new u.Color(1/8,1/8,1/8,0),[!0,!0,!0,!0]):this.renderPass==="opaque"?Z.unblended:Z.alphaBlended},Ie.prototype.depthModeForSublayer=function(i,o,n){if(!this.opaquePassEnabledForLayer())return M.disabled;var s=1-((1+this.currentLayer)*this.numSublayers+i)*this.depthEpsilon;return new M(n||this.context.gl.LEQUAL,o,[s,s])},Ie.prototype.opaquePassEnabledForLayer=function(){return this.currentLayer<this.opaquePassCutoff},Ie.prototype.render=function(i,o){var n=this;this.style=i,this.options=o,this.lineAtlas=i.lineAtlas,this.imageManager=i.imageManager,this.glyphManager=i.glyphManager,this.symbolFadeChange=i.placement.symbolFadeChange(u.browser.now()),this.imageManager.beginFrame();var s=this.style._order,p=this.style.sourceCaches;for(var f in p){var d=p[f];d.used&&d.prepare(this.context);}var y,v,S={},P={},z={};for(var k in p){var F=p[k];S[k]=F.getVisibleCoordinates(),P[k]=S[k].slice().reverse(),z[k]=F.getVisibleCoordinates(!0).reverse();}this.opaquePassCutoff=1/0;for(var R=0;R<s.length;R++)if(this.style._layers[s[R]].is3D()){this.opaquePassCutoff=R;break}this.renderPass="offscreen";for(var j=0,D=s;j<D.length;j+=1){var N=this.style._layers[D[j]];if(N.hasOffscreenPass()&&!N.isHidden(this.transform.zoom)){var G=P[N.source];(N.type==="custom"||G.length)&&this.renderLayer(this,p[N.source],N,G);}}for(this.context.bindFramebuffer.set(null),this.context.clear({color:o.showOverdrawInspector?u.Color.black:u.Color.transparent,depth:1}),this.clearStencil(),this._showOverdrawInspector=o.showOverdrawInspector,this.depthRangeFor3D=[0,1-(i._order.length+2)*this.numSublayers*this.depthEpsilon],this.renderPass="opaque",this.currentLayer=s.length-1;this.currentLayer>=0;this.currentLayer--){var K=this.style._layers[s[this.currentLayer]],tt=p[K.source],Q=S[K.source];this._renderTileClippingMasks(K,Q),this.renderLayer(this,tt,K,Q);}for(this.renderPass="translucent",this.currentLayer=0;this.currentLayer<s.length;this.currentLayer++){var et=this.style._layers[s[this.currentLayer]],ot=p[et.source],ht=(et.type==="symbol"?z:P)[et.source];this._renderTileClippingMasks(et,S[et.source]),this.renderLayer(this,ot,et,ht);}this.options.showTileBoundaries&&(u.values(this.style._layers).forEach(function(pt){pt.source&&!pt.isHidden(n.transform.zoom)&&(pt.source!==(v&&v.id)&&(v=n.style.sourceCaches[pt.source]),(!y||y.getSource().maxzoom<v.getSource().maxzoom)&&(y=v));}),y&&Nn.debug(this,y,y.getVisibleCoordinates())),this.options.showPadding&&function(pt){var bt=pt.transform.padding;Ls(pt,pt.transform.height-(bt.top||0),3,Ms),Ls(pt,bt.bottom||0,3,ql),Bs(pt,bt.left||0,3,Zl),Bs(pt,pt.transform.width-(bt.right||0),3,La);var kt=pt.transform.centerPoint;!function(Bt,Lt,ne,wt){Jo(Bt,Lt-1,ne-10,2,20,wt),Jo(Bt,Lt-10,ne-1,20,2,wt);}(pt,kt.x,pt.transform.height-kt.y,Ds);}(this),this.context.setDefault();},Ie.prototype.renderLayer=function(i,o,n,s){n.isHidden(this.transform.zoom)||(n.type==="background"||n.type==="custom"||s.length)&&(this.id=n.id,this.gpuTimingStart(n),Nn[n.type](i,o,n,s,this.style.placement.variableOffsets),this.gpuTimingEnd());},Ie.prototype.gpuTimingStart=function(i){if(this.options.gpuTiming){var o=this.context.extTimerQuery,n=this.gpuTimers[i.id];n||(n=this.gpuTimers[i.id]={calls:0,cpuTime:0,query:o.createQueryEXT()}),n.calls++,o.beginQueryEXT(o.TIME_ELAPSED_EXT,n.query);}},Ie.prototype.gpuTimingEnd=function(){if(this.options.gpuTiming){var i=this.context.extTimerQuery;i.endQueryEXT(i.TIME_ELAPSED_EXT);}},Ie.prototype.collectGpuTimers=function(){var i=this.gpuTimers;return this.gpuTimers={},i},Ie.prototype.queryGpuTimers=function(i){var o={};for(var n in i){var s=i[n],p=this.context.extTimerQuery,f=p.getQueryObjectEXT(s.query,p.QUERY_RESULT_EXT)/1e6;p.deleteQueryEXT(s.query),o[n]=f;}return o},Ie.prototype.translatePosMatrix=function(i,o,n,s,p){if(!n[0]&&!n[1])return i;var f=p?s==="map"?this.transform.angle:0:s==="viewport"?-this.transform.angle:0;if(f){var d=Math.sin(f),y=Math.cos(f);n=[n[0]*y-n[1]*d,n[0]*d+n[1]*y];}var v=[p?n[0]:Te(o,n[0],this.transform.zoom),p?n[1]:Te(o,n[1],this.transform.zoom),0],S=new Float32Array(16);return u.translate(S,i,v),S},Ie.prototype.saveTileTexture=function(i){var o=this._tileTextures[i.size[0]];o?o.push(i):this._tileTextures[i.size[0]]=[i];},Ie.prototype.getTileTexture=function(i){var o=this._tileTextures[i];return o&&o.length>0?o.pop():null},Ie.prototype.isPatternMissing=function(i){if(!i)return !1;if(!i.from||!i.to)return !0;var o=this.imageManager.getPattern(i.from.toString()),n=this.imageManager.getPattern(i.to.toString());return !o||!n},Ie.prototype.useProgram=function(i,o){this.cache=this.cache||{};var n=""+i+(o?o.cacheKey:"")+(this._showOverdrawInspector?"/overdraw":"");return this.cache[n]||(this.cache[n]=new Cl(this.context,i,Ou[i],o,Ul[i],this._showOverdrawInspector)),this.cache[n]},Ie.prototype.setCustomLayerDefaults=function(){this.context.unbindVAO(),this.context.cullFace.setDefault(),this.context.activeTexture.setDefault(),this.context.pixelStoreUnpack.setDefault(),this.context.pixelStoreUnpackPremultiplyAlpha.setDefault(),this.context.pixelStoreUnpackFlipY.setDefault();},Ie.prototype.setBaseState=function(){var i=this.context.gl;this.context.cullFace.set(!1),this.context.viewport.set([0,0,this.width,this.height]),this.context.blendEquation.set(i.FUNC_ADD);},Ie.prototype.initDebugOverlayCanvas=function(){this.debugOverlayCanvas==null&&(this.debugOverlayCanvas=u.window.document.createElement("canvas"),this.debugOverlayCanvas.width=512,this.debugOverlayCanvas.height=512,this.debugOverlayTexture=new u.Texture(this.context,this.debugOverlayCanvas,this.context.gl.RGBA));},Ie.prototype.destroy=function(){this.emptyTexture.destroy(),this.debugOverlayTexture&&this.debugOverlayTexture.destroy();};var Ba=function(i,o){this.points=i,this.planes=o;};Ba.fromInvProjectionMatrix=function(i,o,n){var s=Math.pow(2,n),p=[[-1,1,-1,1],[1,1,-1,1],[1,-1,-1,1],[-1,-1,-1,1],[-1,1,1,1],[1,1,1,1],[1,-1,1,1],[-1,-1,1,1]].map(function(d){return u.transformMat4([],d,i)}).map(function(d){return u.scale$1([],d,1/d[3]/o*s)}),f=[[0,1,2],[6,5,4],[0,3,7],[2,1,5],[3,2,6],[0,4,5]].map(function(d){var y=u.sub([],p[d[0]],p[d[1]]),v=u.sub([],p[d[2]],p[d[1]]),S=u.normalize([],u.cross([],y,v)),P=-u.dot(S,p[d[1]]);return S.concat(P)});return new Ba(p,f)};var jn=function(i,o){this.min=i,this.max=o,this.center=u.scale$2([],u.add([],this.min,this.max),.5);};jn.prototype.quadrant=function(i){for(var o=[i%2==0,i<2],n=u.clone$2(this.min),s=u.clone$2(this.max),p=0;p<o.length;p++)n[p]=o[p]?this.min[p]:this.center[p],s[p]=o[p]?this.center[p]:this.max[p];return s[2]=this.max[2],new jn(n,s)},jn.prototype.distanceX=function(i){return Math.max(Math.min(this.max[0],i[0]),this.min[0])-i[0]},jn.prototype.distanceY=function(i){return Math.max(Math.min(this.max[1],i[1]),this.min[1])-i[1]},jn.prototype.intersects=function(i){for(var o=[[this.min[0],this.min[1],0,1],[this.max[0],this.min[1],0,1],[this.max[0],this.max[1],0,1],[this.min[0],this.max[1],0,1]],n=!0,s=0;s<i.planes.length;s++){for(var p=i.planes[s],f=0,d=0;d<o.length;d++)f+=u.dot$1(p,o[d])>=0;if(f===0)return 0;f!==o.length&&(n=!1);}if(n)return 2;for(var y=0;y<3;y++){for(var v=Number.MAX_VALUE,S=-Number.MAX_VALUE,P=0;P<i.points.length;P++){var z=i.points[P][y]-this.min[y];v=Math.min(v,z),S=Math.max(S,z);}if(S<0||v>this.max[y]-this.min[y])return 0}return 1};var sn=function(i,o,n,s){if(i===void 0&&(i=0),o===void 0&&(o=0),n===void 0&&(n=0),s===void 0&&(s=0),isNaN(i)||i<0||isNaN(o)||o<0||isNaN(n)||n<0||isNaN(s)||s<0)throw new Error("Invalid value for edge-insets, top, bottom, left and right must all be numbers");this.top=i,this.bottom=o,this.left=n,this.right=s;};sn.prototype.interpolate=function(i,o,n){return o.top!=null&&i.top!=null&&(this.top=u.number(i.top,o.top,n)),o.bottom!=null&&i.bottom!=null&&(this.bottom=u.number(i.bottom,o.bottom,n)),o.left!=null&&i.left!=null&&(this.left=u.number(i.left,o.left,n)),o.right!=null&&i.right!=null&&(this.right=u.number(i.right,o.right,n)),this},sn.prototype.getCenter=function(i,o){var n=u.clamp((this.left+i-this.right)/2,0,i),s=u.clamp((this.top+o-this.bottom)/2,0,o);return new u.Point(n,s)},sn.prototype.equals=function(i){return this.top===i.top&&this.bottom===i.bottom&&this.left===i.left&&this.right===i.right},sn.prototype.clone=function(){return new sn(this.top,this.bottom,this.left,this.right)},sn.prototype.toJSON=function(){return {top:this.top,bottom:this.bottom,left:this.left,right:this.right}};var ee=function(i,o,n,s,p){this.tileSize=512,this.maxValidLatitude=85.051129,this._renderWorldCopies=p===void 0||p,this._minZoom=i||0,this._maxZoom=o||22,this._minPitch=n??0,this._maxPitch=s??60,this.setMaxBounds(),this.width=0,this.height=0,this._center=new u.LngLat(0,0),this.zoom=0,this.angle=0,this._fov=.6435011087932844,this._pitch=0,this._unmodified=!0,this._edgeInsets=new sn,this._posMatrixCache={},this._alignedPosMatrixCache={};},be={minZoom:{configurable:!0},maxZoom:{configurable:!0},minPitch:{configurable:!0},maxPitch:{configurable:!0},renderWorldCopies:{configurable:!0},worldSize:{configurable:!0},centerOffset:{configurable:!0},size:{configurable:!0},bearing:{configurable:!0},pitch:{configurable:!0},fov:{configurable:!0},zoom:{configurable:!0},center:{configurable:!0},padding:{configurable:!0},centerPoint:{configurable:!0},unmodified:{configurable:!0},point:{configurable:!0}};ee.prototype.clone=function(){var i=new ee(this._minZoom,this._maxZoom,this._minPitch,this.maxPitch,this._renderWorldCopies);return i.tileSize=this.tileSize,i.latRange=this.latRange,i.width=this.width,i.height=this.height,i._center=this._center,i.zoom=this.zoom,i.angle=this.angle,i._fov=this._fov,i._pitch=this._pitch,i._unmodified=this._unmodified,i._edgeInsets=this._edgeInsets.clone(),i._calcMatrices(),i},be.minZoom.get=function(){return this._minZoom},be.minZoom.set=function(i){this._minZoom!==i&&(this._minZoom=i,this.zoom=Math.max(this.zoom,i));},be.maxZoom.get=function(){return this._maxZoom},be.maxZoom.set=function(i){this._maxZoom!==i&&(this._maxZoom=i,this.zoom=Math.min(this.zoom,i));},be.minPitch.get=function(){return this._minPitch},be.minPitch.set=function(i){this._minPitch!==i&&(this._minPitch=i,this.pitch=Math.max(this.pitch,i));},be.maxPitch.get=function(){return this._maxPitch},be.maxPitch.set=function(i){this._maxPitch!==i&&(this._maxPitch=i,this.pitch=Math.min(this.pitch,i));},be.renderWorldCopies.get=function(){return this._renderWorldCopies},be.renderWorldCopies.set=function(i){i===void 0?i=!0:i===null&&(i=!1),this._renderWorldCopies=i;},be.worldSize.get=function(){return this.tileSize*this.scale},be.centerOffset.get=function(){return this.centerPoint._sub(this.size._div(2))},be.size.get=function(){return new u.Point(this.width,this.height)},be.bearing.get=function(){return -this.angle/Math.PI*180},be.bearing.set=function(i){var o=-u.wrap(i,-180,180)*Math.PI/180;this.angle!==o&&(this._unmodified=!1,this.angle=o,this._calcMatrices(),this.rotationMatrix=u.create$2(),u.rotate(this.rotationMatrix,this.rotationMatrix,this.angle));},be.pitch.get=function(){return this._pitch/Math.PI*180},be.pitch.set=function(i){var o=u.clamp(i,this.minPitch,this.maxPitch)/180*Math.PI;this._pitch!==o&&(this._unmodified=!1,this._pitch=o,this._calcMatrices());},be.fov.get=function(){return this._fov/Math.PI*180},be.fov.set=function(i){i=Math.max(.01,Math.min(60,i)),this._fov!==i&&(this._unmodified=!1,this._fov=i/180*Math.PI,this._calcMatrices());},be.zoom.get=function(){return this._zoom},be.zoom.set=function(i){var o=Math.min(Math.max(i,this.minZoom),this.maxZoom);this._zoom!==o&&(this._unmodified=!1,this._zoom=o,this.scale=this.zoomScale(o),this.tileZoom=Math.floor(o),this.zoomFraction=o-this.tileZoom,this._constrain(),this._calcMatrices());},be.center.get=function(){return this._center},be.center.set=function(i){i.lat===this._center.lat&&i.lng===this._center.lng||(this._unmodified=!1,this._center=i,this._constrain(),this._calcMatrices());},be.padding.get=function(){return this._edgeInsets.toJSON()},be.padding.set=function(i){this._edgeInsets.equals(i)||(this._unmodified=!1,this._edgeInsets.interpolate(this._edgeInsets,i,1),this._calcMatrices());},be.centerPoint.get=function(){return this._edgeInsets.getCenter(this.width,this.height)},ee.prototype.isPaddingEqual=function(i){return this._edgeInsets.equals(i)},ee.prototype.interpolatePadding=function(i,o,n){this._unmodified=!1,this._edgeInsets.interpolate(i,o,n),this._constrain(),this._calcMatrices();},ee.prototype.coveringZoomLevel=function(i){var o=(i.roundZoom?Math.round:Math.floor)(this.zoom+this.scaleZoom(this.tileSize/i.tileSize));return Math.max(0,o)},ee.prototype.getVisibleUnwrappedCoordinates=function(i){var o=[new u.UnwrappedTileID(0,i)];if(this._renderWorldCopies)for(var n=this.pointCoordinate(new u.Point(0,0)),s=this.pointCoordinate(new u.Point(this.width,0)),p=this.pointCoordinate(new u.Point(this.width,this.height)),f=this.pointCoordinate(new u.Point(0,this.height)),d=Math.floor(Math.min(n.x,s.x,p.x,f.x)),y=Math.floor(Math.max(n.x,s.x,p.x,f.x)),v=d-1;v<=y+1;v++)v!==0&&o.push(new u.UnwrappedTileID(v,i));return o},ee.prototype.coveringTiles=function(i){var o=this.coveringZoomLevel(i),n=o;if(i.minzoom!==void 0&&o<i.minzoom)return [];i.maxzoom!==void 0&&o>i.maxzoom&&(o=i.maxzoom);var s=u.MercatorCoordinate.fromLngLat(this.center),p=Math.pow(2,o),f=[p*s.x,p*s.y,0],d=Ba.fromInvProjectionMatrix(this.invProjMatrix,this.worldSize,o),y=i.minzoom||0;this.pitch<=60&&this._edgeInsets.top<.1&&(y=o);var v=function(pt){return {aabb:new jn([pt*p,0,0],[(pt+1)*p,p,0]),zoom:0,x:0,y:0,wrap:pt,fullyVisible:!1}},S=[],P=[],z=o,k=i.reparseOverscaled?n:o;if(this._renderWorldCopies)for(var F=1;F<=3;F++)S.push(v(-F)),S.push(v(F));for(S.push(v(0));S.length>0;){var R=S.pop(),j=R.x,D=R.y,N=R.fullyVisible;if(!N){var G=R.aabb.intersects(d);if(G===0)continue;N=G===2;}var K=R.aabb.distanceX(f),tt=R.aabb.distanceY(f),Q=Math.max(Math.abs(K),Math.abs(tt));if(R.zoom===z||Q>3+(1<<z-R.zoom)-2&&R.zoom>=y)P.push({tileID:new u.OverscaledTileID(R.zoom===z?k:R.zoom,R.wrap,R.zoom,j,D),distanceSq:u.sqrLen([f[0]-.5-j,f[1]-.5-D])});else for(var et=0;et<4;et++){var ot=(j<<1)+et%2,ht=(D<<1)+(et>>1);S.push({aabb:R.aabb.quadrant(et),zoom:R.zoom+1,x:ot,y:ht,wrap:R.wrap,fullyVisible:N});}}return P.sort(function(pt,bt){return pt.distanceSq-bt.distanceSq}).map(function(pt){return pt.tileID})},ee.prototype.resize=function(i,o){this.width=i,this.height=o,this.pixelsToGLUnits=[2/i,-2/o],this._constrain(),this._calcMatrices();},be.unmodified.get=function(){return this._unmodified},ee.prototype.zoomScale=function(i){return Math.pow(2,i)},ee.prototype.scaleZoom=function(i){return Math.log(i)/Math.LN2},ee.prototype.project=function(i){var o=u.clamp(i.lat,-this.maxValidLatitude,this.maxValidLatitude);return new u.Point(u.mercatorXfromLng(i.lng)*this.worldSize,u.mercatorYfromLat(o)*this.worldSize)},ee.prototype.unproject=function(i){return new u.MercatorCoordinate(i.x/this.worldSize,i.y/this.worldSize).toLngLat()},be.point.get=function(){return this.project(this.center)},ee.prototype.setLocationAtPoint=function(i,o){var n=this.pointCoordinate(o),s=this.pointCoordinate(this.centerPoint),p=this.locationCoordinate(i),f=new u.MercatorCoordinate(p.x-(n.x-s.x),p.y-(n.y-s.y));this.center=this.coordinateLocation(f),this._renderWorldCopies&&(this.center=this.center.wrap());},ee.prototype.locationPoint=function(i){return this.coordinatePoint(this.locationCoordinate(i))},ee.prototype.pointLocation=function(i){return this.coordinateLocation(this.pointCoordinate(i))},ee.prototype.locationCoordinate=function(i){return u.MercatorCoordinate.fromLngLat(i)},ee.prototype.coordinateLocation=function(i){return i.toLngLat()},ee.prototype.pointCoordinate=function(i){var o=[i.x,i.y,0,1],n=[i.x,i.y,1,1];u.transformMat4(o,o,this.pixelMatrixInverse),u.transformMat4(n,n,this.pixelMatrixInverse);var s=o[3],p=n[3],f=o[1]/s,d=n[1]/p,y=o[2]/s,v=n[2]/p,S=y===v?0:(0-y)/(v-y);return new u.MercatorCoordinate(u.number(o[0]/s,n[0]/p,S)/this.worldSize,u.number(f,d,S)/this.worldSize)},ee.prototype.coordinatePoint=function(i){var o=[i.x*this.worldSize,i.y*this.worldSize,0,1];return u.transformMat4(o,o,this.pixelMatrix),new u.Point(o[0]/o[3],o[1]/o[3])},ee.prototype.getBounds=function(){return new u.LngLatBounds().extend(this.pointLocation(new u.Point(0,0))).extend(this.pointLocation(new u.Point(this.width,0))).extend(this.pointLocation(new u.Point(this.width,this.height))).extend(this.pointLocation(new u.Point(0,this.height)))},ee.prototype.getMaxBounds=function(){return this.latRange&&this.latRange.length===2&&this.lngRange&&this.lngRange.length===2?new u.LngLatBounds([this.lngRange[0],this.latRange[0]],[this.lngRange[1],this.latRange[1]]):null},ee.prototype.setMaxBounds=function(i){i?(this.lngRange=[i.getWest(),i.getEast()],this.latRange=[i.getSouth(),i.getNorth()],this._constrain()):(this.lngRange=null,this.latRange=[-this.maxValidLatitude,this.maxValidLatitude]);},ee.prototype.calculatePosMatrix=function(i,o){o===void 0&&(o=!1);var n=i.key,s=o?this._alignedPosMatrixCache:this._posMatrixCache;if(s[n])return s[n];var p=i.canonical,f=this.worldSize/this.zoomScale(p.z),d=p.x+Math.pow(2,p.z)*i.wrap,y=u.identity(new Float64Array(16));return u.translate(y,y,[d*f,p.y*f,0]),u.scale(y,y,[f/u.EXTENT,f/u.EXTENT,1]),u.multiply(y,o?this.alignedProjMatrix:this.projMatrix,y),s[n]=new Float32Array(y),s[n]},ee.prototype.customLayerMatrix=function(){return this.mercatorMatrix.slice()},ee.prototype._constrain=function(){if(this.center&&this.width&&this.height&&!this._constraining){this._constraining=!0;var i,o,n,s,p=-90,f=90,d=-180,y=180,v=this.size,S=this._unmodified;if(this.latRange){var P=this.latRange;p=u.mercatorYfromLat(P[1])*this.worldSize,i=(f=u.mercatorYfromLat(P[0])*this.worldSize)-p<v.y?v.y/(f-p):0;}if(this.lngRange){var z=this.lngRange;d=u.mercatorXfromLng(z[0])*this.worldSize,o=(y=u.mercatorXfromLng(z[1])*this.worldSize)-d<v.x?v.x/(y-d):0;}var k=this.point,F=Math.max(o||0,i||0);if(F)return this.center=this.unproject(new u.Point(o?(y+d)/2:k.x,i?(f+p)/2:k.y)),this.zoom+=this.scaleZoom(F),this._unmodified=S,void(this._constraining=!1);if(this.latRange){var R=k.y,j=v.y/2;R-j<p&&(s=p+j),R+j>f&&(s=f-j);}if(this.lngRange){var D=k.x,N=v.x/2;D-N<d&&(n=d+N),D+N>y&&(n=y-N);}n===void 0&&s===void 0||(this.center=this.unproject(new u.Point(n!==void 0?n:k.x,s!==void 0?s:k.y))),this._unmodified=S,this._constraining=!1;}},ee.prototype._calcMatrices=function(){if(this.height){var i=this.centerOffset;this.cameraToCenterDistance=.5/Math.tan(this._fov/2)*this.height;var o=Math.PI/2+this._pitch,n=this._fov*(.5+i.y/this.height),s=Math.sin(n)*this.cameraToCenterDistance/Math.sin(u.clamp(Math.PI-o-n,.01,Math.PI-.01)),p=this.point,f=p.x,d=p.y,y=1.01*(Math.cos(Math.PI/2-this._pitch)*s+this.cameraToCenterDistance),v=this.height/50,S=new Float64Array(16);u.perspective(S,this._fov,this.width/this.height,v,y),S[8]=2*-i.x/this.width,S[9]=2*i.y/this.height,u.scale(S,S,[1,-1,1]),u.translate(S,S,[0,0,-this.cameraToCenterDistance]),u.rotateX(S,S,this._pitch),u.rotateZ(S,S,this.angle),u.translate(S,S,[-f,-d,0]),this.mercatorMatrix=u.scale([],S,[this.worldSize,this.worldSize,this.worldSize]),u.scale(S,S,[1,1,u.mercatorZfromAltitude(1,this.center.lat)*this.worldSize,1]),this.projMatrix=S,this.invProjMatrix=u.invert([],this.projMatrix);var P=this.width%2/2,z=this.height%2/2,k=Math.cos(this.angle),F=Math.sin(this.angle),R=f-Math.round(f)+k*P+F*z,j=d-Math.round(d)+k*z+F*P,D=new Float64Array(S);if(u.translate(D,D,[R>.5?R-1:R,j>.5?j-1:j,0]),this.alignedProjMatrix=D,S=u.create(),u.scale(S,S,[this.width/2,-this.height/2,1]),u.translate(S,S,[1,-1,0]),this.labelPlaneMatrix=S,S=u.create(),u.scale(S,S,[1,-1,1]),u.translate(S,S,[-1,-1,0]),u.scale(S,S,[2/this.width,2/this.height,1]),this.glCoordMatrix=S,this.pixelMatrix=u.multiply(new Float64Array(16),this.labelPlaneMatrix,this.projMatrix),!(S=u.invert(new Float64Array(16),this.pixelMatrix)))throw new Error("failed to invert matrix");this.pixelMatrixInverse=S,this._posMatrixCache={},this._alignedPosMatrixCache={};}},ee.prototype.maxPitchScaleFactor=function(){if(!this.pixelMatrixInverse)return 1;var i=this.pointCoordinate(new u.Point(0,0)),o=[i.x*this.worldSize,i.y*this.worldSize,0,1];return u.transformMat4(o,o,this.pixelMatrix)[3]/this.cameraToCenterDistance},ee.prototype.getCameraPoint=function(){var i=Math.tan(this._pitch)*(this.cameraToCenterDistance||1);return this.centerPoint.add(new u.Point(0,i))},ee.prototype.getCameraQueryGeometry=function(i){var o=this.getCameraPoint();if(i.length===1)return [i[0],o];for(var n=o.x,s=o.y,p=o.x,f=o.y,d=0,y=i;d<y.length;d+=1){var v=y[d];n=Math.min(n,v.x),s=Math.min(s,v.y),p=Math.max(p,v.x),f=Math.max(f,v.y);}return [new u.Point(n,s),new u.Point(p,s),new u.Point(p,f),new u.Point(n,f),new u.Point(n,s)]},Object.defineProperties(ee.prototype,be);var Xr=function(i){var o,n,s,p;this._hashName=i&&encodeURIComponent(i),u.bindAll(["_getCurrentHash","_onHashChange","_updateHash"],this),this._updateHash=(o=this._updateHashUnthrottled.bind(this),n=!1,s=null,p=function(){s=null,n&&(o(),s=setTimeout(p,300),n=!1);},function(){return n=!0,s||p(),s});};Xr.prototype.addTo=function(i){return this._map=i,u.window.addEventListener("hashchange",this._onHashChange,!1),this._map.on("moveend",this._updateHash),this},Xr.prototype.remove=function(){return u.window.removeEventListener("hashchange",this._onHashChange,!1),this._map.off("moveend",this._updateHash),clearTimeout(this._updateHash()),delete this._map,this},Xr.prototype.getHashString=function(i){var o=this._map.getCenter(),n=Math.round(100*this._map.getZoom())/100,s=Math.ceil((n*Math.LN2+Math.log(512/360/.5))/Math.LN10),p=Math.pow(10,s),f=Math.round(o.lng*p)/p,d=Math.round(o.lat*p)/p,y=this._map.getBearing(),v=this._map.getPitch(),S="";if(S+=i?"/"+f+"/"+d+"/"+n:n+"/"+d+"/"+f,(y||v)&&(S+="/"+Math.round(10*y)/10),v&&(S+="/"+Math.round(v)),this._hashName){var P=this._hashName,z=!1,k=u.window.location.hash.slice(1).split("&").map(function(F){var R=F.split("=")[0];return R===P?(z=!0,R+"="+S):F}).filter(function(F){return F});return z||k.push(P+"="+S),"#"+k.join("&")}return "#"+S},Xr.prototype._getCurrentHash=function(){var i,o=this,n=u.window.location.hash.replace("#","");return this._hashName?(n.split("&").map(function(s){return s.split("=")}).forEach(function(s){s[0]===o._hashName&&(i=s);}),(i&&i[1]||"").split("/")):n.split("/")},Xr.prototype._onHashChange=function(){var i=this._getCurrentHash();if(i.length>=3&&!i.some(function(n){return isNaN(n)})){var o=this._map.dragRotate.isEnabled()&&this._map.touchZoomRotate.isEnabled()?+(i[3]||0):this._map.getBearing();return this._map.jumpTo({center:[+i[2],+i[1]],zoom:+i[0],bearing:o,pitch:+(i[4]||0)}),!0}return !1},Xr.prototype._updateHashUnthrottled=function(){var i=u.window.location.href.replace(/(#.+)?$/,this.getHashString());try{u.window.history.replaceState(u.window.history.state,null,i);}catch(o){}};var Yo={linearity:.3,easing:u.bezier(0,0,.3,1)},_o=u.extend({deceleration:2500,maxSpeed:1400},Yo),Qo=u.extend({deceleration:20,maxSpeed:1400},Yo),ju=u.extend({deceleration:1e3,maxSpeed:360},Yo),qu=u.extend({deceleration:1e3,maxSpeed:90},Yo),$o=function(i){this._map=i,this.clear();};function ta(i,o){(!i.duration||i.duration<o.duration)&&(i.duration=o.duration,i.easing=o.easing);}function Ni(i,o,n){var s=n.maxSpeed,p=n.linearity,f=n.deceleration,d=u.clamp(i*p/(o/1e3),-s,s),y=Math.abs(d)/(f*p);return {easing:n.easing,duration:1e3*y,amount:d*(y/2)}}$o.prototype.clear=function(){this._inertiaBuffer=[];},$o.prototype.record=function(i){this._drainInertiaBuffer(),this._inertiaBuffer.push({time:u.browser.now(),settings:i});},$o.prototype._drainInertiaBuffer=function(){for(var i=this._inertiaBuffer,o=u.browser.now();i.length>0&&o-i[0].time>160;)i.shift();},$o.prototype._onMoveEnd=function(i){if(this._drainInertiaBuffer(),!(this._inertiaBuffer.length<2)){for(var o={zoom:0,bearing:0,pitch:0,pan:new u.Point(0,0),pinchAround:void 0,around:void 0},n=0,s=this._inertiaBuffer;n<s.length;n+=1){var p=s[n].settings;o.zoom+=p.zoomDelta||0,o.bearing+=p.bearingDelta||0,o.pitch+=p.pitchDelta||0,p.panDelta&&o.pan._add(p.panDelta),p.around&&(o.around=p.around),p.pinchAround&&(o.pinchAround=p.pinchAround);}var f=this._inertiaBuffer[this._inertiaBuffer.length-1].time-this._inertiaBuffer[0].time,d={};if(o.pan.mag()){var y=Ni(o.pan.mag(),f,u.extend({},_o,i||{}));d.offset=o.pan.mult(y.amount/o.pan.mag()),d.center=this._map.transform.center,ta(d,y);}if(o.zoom){var v=Ni(o.zoom,f,Qo);d.zoom=this._map.transform.zoom+v.amount,ta(d,v);}if(o.bearing){var S=Ni(o.bearing,f,ju);d.bearing=this._map.transform.bearing+u.clamp(S.amount,-179,179),ta(d,S);}if(o.pitch){var P=Ni(o.pitch,f,qu);d.pitch=this._map.transform.pitch+P.amount,ta(d,P);}if(d.zoom||d.bearing){var z=o.pinchAround===void 0?o.around:o.pinchAround;d.around=z?this._map.unproject(z):this._map.getCenter();}return this.clear(),u.extend(d,{noMoveStart:!0})}};var Xe=function(i){function o(s,p,f,d){d===void 0&&(d={});var y=ct.mousePos(p.getCanvasContainer(),f),v=p.unproject(y);i.call(this,s,u.extend({point:y,lngLat:v,originalEvent:f},d)),this._defaultPrevented=!1,this.target=p;}i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o;var n={defaultPrevented:{configurable:!0}};return o.prototype.preventDefault=function(){this._defaultPrevented=!0;},n.defaultPrevented.get=function(){return this._defaultPrevented},Object.defineProperties(o.prototype,n),o}(u.Event),ea=function(i){function o(s,p,f){var d=s==="touchend"?f.changedTouches:f.touches,y=ct.touchPos(p.getCanvasContainer(),d),v=y.map(function(z){return p.unproject(z)}),S=y.reduce(function(z,k,F,R){return z.add(k.div(R.length))},new u.Point(0,0)),P=p.unproject(S);i.call(this,s,{points:y,point:S,lngLats:v,lngLat:P,originalEvent:f}),this._defaultPrevented=!1;}i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o;var n={defaultPrevented:{configurable:!0}};return o.prototype.preventDefault=function(){this._defaultPrevented=!0;},n.defaultPrevented.get=function(){return this._defaultPrevented},Object.defineProperties(o.prototype,n),o}(u.Event),Xl=function(i){function o(s,p,f){i.call(this,s,{originalEvent:f}),this._defaultPrevented=!1;}i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o;var n={defaultPrevented:{configurable:!0}};return o.prototype.preventDefault=function(){this._defaultPrevented=!0;},n.defaultPrevented.get=function(){return this._defaultPrevented},Object.defineProperties(o.prototype,n),o}(u.Event),Ze=function(i,o){this._map=i,this._clickTolerance=o.clickTolerance;};Ze.prototype.reset=function(){delete this._mousedownPos;},Ze.prototype.wheel=function(i){return this._firePreventable(new Xl(i.type,this._map,i))},Ze.prototype.mousedown=function(i,o){return this._mousedownPos=o,this._firePreventable(new Xe(i.type,this._map,i))},Ze.prototype.mouseup=function(i){this._map.fire(new Xe(i.type,this._map,i));},Ze.prototype.click=function(i,o){this._mousedownPos&&this._mousedownPos.dist(o)>=this._clickTolerance||this._map.fire(new Xe(i.type,this._map,i));},Ze.prototype.dblclick=function(i){return this._firePreventable(new Xe(i.type,this._map,i))},Ze.prototype.mouseover=function(i){this._map.fire(new Xe(i.type,this._map,i));},Ze.prototype.mouseout=function(i){this._map.fire(new Xe(i.type,this._map,i));},Ze.prototype.touchstart=function(i){return this._firePreventable(new ea(i.type,this._map,i))},Ze.prototype.touchmove=function(i){this._map.fire(new ea(i.type,this._map,i));},Ze.prototype.touchend=function(i){this._map.fire(new ea(i.type,this._map,i));},Ze.prototype.touchcancel=function(i){this._map.fire(new ea(i.type,this._map,i));},Ze.prototype._firePreventable=function(i){if(this._map.fire(i),i.defaultPrevented)return {}},Ze.prototype.isEnabled=function(){return !0},Ze.prototype.isActive=function(){return !1},Ze.prototype.enable=function(){},Ze.prototype.disable=function(){};var Tt=function(i){this._map=i;};Tt.prototype.reset=function(){this._delayContextMenu=!1,delete this._contextMenuEvent;},Tt.prototype.mousemove=function(i){this._map.fire(new Xe(i.type,this._map,i));},Tt.prototype.mousedown=function(){this._delayContextMenu=!0;},Tt.prototype.mouseup=function(){this._delayContextMenu=!1,this._contextMenuEvent&&(this._map.fire(new Xe("contextmenu",this._map,this._contextMenuEvent)),delete this._contextMenuEvent);},Tt.prototype.contextmenu=function(i){this._delayContextMenu?this._contextMenuEvent=i:this._map.fire(new Xe(i.type,this._map,i)),this._map.listens("contextmenu")&&i.preventDefault();},Tt.prototype.isEnabled=function(){return !0},Tt.prototype.isActive=function(){return !1},Tt.prototype.enable=function(){},Tt.prototype.disable=function(){};var Fr=function(i,o){this._map=i,this._el=i.getCanvasContainer(),this._container=i.getContainer(),this._clickTolerance=o.clickTolerance||1;};function Ra(i,o){for(var n={},s=0;s<i.length;s++)n[i[s].identifier]=o[s];return n}Fr.prototype.isEnabled=function(){return !!this._enabled},Fr.prototype.isActive=function(){return !!this._active},Fr.prototype.enable=function(){this.isEnabled()||(this._enabled=!0);},Fr.prototype.disable=function(){this.isEnabled()&&(this._enabled=!1);},Fr.prototype.mousedown=function(i,o){this.isEnabled()&&i.shiftKey&&i.button===0&&(ct.disableDrag(),this._startPos=this._lastPos=o,this._active=!0);},Fr.prototype.mousemoveWindow=function(i,o){if(this._active){var n=o;if(!(this._lastPos.equals(n)||!this._box&&n.dist(this._startPos)<this._clickTolerance)){var s=this._startPos;this._lastPos=n,this._box||(this._box=ct.create("div","mapboxgl-boxzoom",this._container),this._container.classList.add("mapboxgl-crosshair"),this._fireEvent("boxzoomstart",i));var p=Math.min(s.x,n.x),f=Math.max(s.x,n.x),d=Math.min(s.y,n.y),y=Math.max(s.y,n.y);ct.setTransform(this._box,"translate("+p+"px,"+d+"px)"),this._box.style.width=f-p+"px",this._box.style.height=y-d+"px";}}},Fr.prototype.mouseupWindow=function(i,o){var n=this;if(this._active&&i.button===0){var s=this._startPos,p=o;if(this.reset(),ct.suppressClick(),s.x!==p.x||s.y!==p.y)return this._map.fire(new u.Event("boxzoomend",{originalEvent:i})),{cameraAnimation:function(f){return f.fitScreenCoordinates(s,p,n._map.getBearing(),{linear:!0})}};this._fireEvent("boxzoomcancel",i);}},Fr.prototype.keydown=function(i){this._active&&i.keyCode===27&&(this.reset(),this._fireEvent("boxzoomcancel",i));},Fr.prototype.blur=function(){this.reset();},Fr.prototype.reset=function(){this._active=!1,this._container.classList.remove("mapboxgl-crosshair"),this._box&&(ct.remove(this._box),this._box=null),ct.enableDrag(),delete this._startPos,delete this._lastPos;},Fr.prototype._fireEvent=function(i,o){return this._map.fire(new u.Event(i,{originalEvent:o}))};var vo=function(i){this.reset(),this.numTouches=i.numTouches;};vo.prototype.reset=function(){delete this.centroid,delete this.startTime,delete this.touches,this.aborted=!1;},vo.prototype.touchstart=function(i,o,n){(this.centroid||n.length>this.numTouches)&&(this.aborted=!0),this.aborted||(this.startTime===void 0&&(this.startTime=i.timeStamp),n.length===this.numTouches&&(this.centroid=function(s){for(var p=new u.Point(0,0),f=0,d=s;f<d.length;f+=1)p._add(d[f]);return p.div(s.length)}(o),this.touches=Ra(n,o)));},vo.prototype.touchmove=function(i,o,n){if(!this.aborted&&this.centroid){var s=Ra(n,o);for(var p in this.touches){var f=s[p];(!f||f.dist(this.touches[p])>30)&&(this.aborted=!0);}}},vo.prototype.touchend=function(i,o,n){if((!this.centroid||i.timeStamp-this.startTime>500)&&(this.aborted=!0),n.length===0){var s=!this.aborted&&this.centroid;if(this.reset(),s)return s}};var vi=function(i){this.singleTap=new vo(i),this.numTaps=i.numTaps,this.reset();};vi.prototype.reset=function(){this.lastTime=1/0,delete this.lastTap,this.count=0,this.singleTap.reset();},vi.prototype.touchstart=function(i,o,n){this.singleTap.touchstart(i,o,n);},vi.prototype.touchmove=function(i,o,n){this.singleTap.touchmove(i,o,n);},vi.prototype.touchend=function(i,o,n){var s=this.singleTap.touchend(i,o,n);if(s){var p=i.timeStamp-this.lastTime<500,f=!this.lastTap||this.lastTap.dist(s)<30;if(p&&f||this.reset(),this.count++,this.lastTime=i.timeStamp,this.lastTap=s,this.count===this.numTaps)return this.reset(),s}};var Or=function(){this._zoomIn=new vi({numTouches:1,numTaps:2}),this._zoomOut=new vi({numTouches:2,numTaps:1}),this.reset();};Or.prototype.reset=function(){this._active=!1,this._zoomIn.reset(),this._zoomOut.reset();},Or.prototype.touchstart=function(i,o,n){this._zoomIn.touchstart(i,o,n),this._zoomOut.touchstart(i,o,n);},Or.prototype.touchmove=function(i,o,n){this._zoomIn.touchmove(i,o,n),this._zoomOut.touchmove(i,o,n);},Or.prototype.touchend=function(i,o,n){var s=this,p=this._zoomIn.touchend(i,o,n),f=this._zoomOut.touchend(i,o,n);return p?(this._active=!0,i.preventDefault(),setTimeout(function(){return s.reset()},0),{cameraAnimation:function(d){return d.easeTo({duration:300,zoom:d.getZoom()+1,around:d.unproject(p)},{originalEvent:i})}}):f?(this._active=!0,i.preventDefault(),setTimeout(function(){return s.reset()},0),{cameraAnimation:function(d){return d.easeTo({duration:300,zoom:d.getZoom()-1,around:d.unproject(f)},{originalEvent:i})}}):void 0},Or.prototype.touchcancel=function(){this.reset();},Or.prototype.enable=function(){this._enabled=!0;},Or.prototype.disable=function(){this._enabled=!1,this.reset();},Or.prototype.isEnabled=function(){return this._enabled},Or.prototype.isActive=function(){return this._active};var Rs={0:1,2:2},mt=function(i){this.reset(),this._clickTolerance=i.clickTolerance||1;};mt.prototype.blur=function(){this.reset();},mt.prototype.reset=function(){this._active=!1,this._moved=!1,delete this._lastPoint,delete this._eventButton;},mt.prototype._correctButton=function(i,o){return !1},mt.prototype._move=function(i,o){return {}},mt.prototype.mousedown=function(i,o){if(!this._lastPoint){var n=ct.mouseButton(i);this._correctButton(i,n)&&(this._lastPoint=o,this._eventButton=n);}},mt.prototype.mousemoveWindow=function(i,o){var n=this._lastPoint;if(n){if(i.preventDefault(),function(s,p){var f=Rs[p];return s.buttons===void 0||(s.buttons&f)!==f}(i,this._eventButton))this.reset();else if(this._moved||!(o.dist(n)<this._clickTolerance))return this._moved=!0,this._lastPoint=o,this._move(n,o)}},mt.prototype.mouseupWindow=function(i){this._lastPoint&&ct.mouseButton(i)===this._eventButton&&(this._moved&&ct.suppressClick(),this.reset());},mt.prototype.enable=function(){this._enabled=!0;},mt.prototype.disable=function(){this._enabled=!1,this.reset();},mt.prototype.isEnabled=function(){return this._enabled},mt.prototype.isActive=function(){return this._active};var Fs=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.mousedown=function(n,s){i.prototype.mousedown.call(this,n,s),this._lastPoint&&(this._active=!0);},o.prototype._correctButton=function(n,s){return s===0&&!n.ctrlKey},o.prototype._move=function(n,s){return {around:s,panDelta:s.sub(n)}},o}(mt),Fa=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype._correctButton=function(n,s){return s===0&&n.ctrlKey||s===2},o.prototype._move=function(n,s){var p=.8*(s.x-n.x);if(p)return this._active=!0,{bearingDelta:p}},o.prototype.contextmenu=function(n){n.preventDefault();},o}(mt),Os=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype._correctButton=function(n,s){return s===0&&n.ctrlKey||s===2},o.prototype._move=function(n,s){var p=-.5*(s.y-n.y);if(p)return this._active=!0,{pitchDelta:p}},o.prototype.contextmenu=function(n){n.preventDefault();},o}(mt),ni=function(i){this._minTouches=1,this._clickTolerance=i.clickTolerance||1,this.reset();};ni.prototype.reset=function(){this._active=!1,this._touches={},this._sum=new u.Point(0,0);},ni.prototype.touchstart=function(i,o,n){return this._calculateTransform(i,o,n)},ni.prototype.touchmove=function(i,o,n){if(this._active&&!(n.length<this._minTouches))return i.preventDefault(),this._calculateTransform(i,o,n)},ni.prototype.touchend=function(i,o,n){this._calculateTransform(i,o,n),this._active&&n.length<this._minTouches&&this.reset();},ni.prototype.touchcancel=function(){this.reset();},ni.prototype._calculateTransform=function(i,o,n){n.length>0&&(this._active=!0);var s=Ra(n,o),p=new u.Point(0,0),f=new u.Point(0,0),d=0;for(var y in s){var v=s[y],S=this._touches[y];S&&(p._add(v),f._add(v.sub(S)),d++,s[y]=v);}if(this._touches=s,!(d<this._minTouches)&&f.mag()){var P=f.div(d);if(this._sum._add(P),!(this._sum.mag()<this._clickTolerance))return {around:p.div(d),panDelta:P}}},ni.prototype.enable=function(){this._enabled=!0;},ni.prototype.disable=function(){this._enabled=!1,this.reset();},ni.prototype.isEnabled=function(){return this._enabled},ni.prototype.isActive=function(){return this._active};var Ur=function(){this.reset();};function Oa(i,o,n){for(var s=0;s<i.length;s++)if(i[s].identifier===n)return o[s]}function Ua(i,o){return Math.log(i/o)/Math.LN2}Ur.prototype.reset=function(){this._active=!1,delete this._firstTwoTouches;},Ur.prototype._start=function(i){},Ur.prototype._move=function(i,o,n){return {}},Ur.prototype.touchstart=function(i,o,n){this._firstTwoTouches||n.length<2||(this._firstTwoTouches=[n[0].identifier,n[1].identifier],this._start([o[0],o[1]]));},Ur.prototype.touchmove=function(i,o,n){if(this._firstTwoTouches){i.preventDefault();var s=this._firstTwoTouches,p=s[1],f=Oa(n,o,s[0]),d=Oa(n,o,p);if(f&&d){var y=this._aroundCenter?null:f.add(d).div(2);return this._move([f,d],y,i)}}},Ur.prototype.touchend=function(i,o,n){if(this._firstTwoTouches){var s=this._firstTwoTouches,p=s[1],f=Oa(n,o,s[0]),d=Oa(n,o,p);f&&d||(this._active&&ct.suppressClick(),this.reset());}},Ur.prototype.touchcancel=function(){this.reset();},Ur.prototype.enable=function(i){this._enabled=!0,this._aroundCenter=!!i&&i.around==="center";},Ur.prototype.disable=function(){this._enabled=!1,this.reset();},Ur.prototype.isEnabled=function(){return this._enabled},Ur.prototype.isActive=function(){return this._active};var Vr=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.reset=function(){i.prototype.reset.call(this),delete this._distance,delete this._startDistance;},o.prototype._start=function(n){this._startDistance=this._distance=n[0].dist(n[1]);},o.prototype._move=function(n,s){var p=this._distance;if(this._distance=n[0].dist(n[1]),this._active||!(Math.abs(Ua(this._distance,this._startDistance))<.1))return this._active=!0,{zoomDelta:Ua(this._distance,p),pinchAround:s}},o}(Ur);function ji(i,o){return 180*i.angleWith(o)/Math.PI}var Wl=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.reset=function(){i.prototype.reset.call(this),delete this._minDiameter,delete this._startVector,delete this._vector;},o.prototype._start=function(n){this._startVector=this._vector=n[0].sub(n[1]),this._minDiameter=n[0].dist(n[1]);},o.prototype._move=function(n,s){var p=this._vector;if(this._vector=n[0].sub(n[1]),this._active||!this._isBelowThreshold(this._vector))return this._active=!0,{bearingDelta:ji(this._vector,p),pinchAround:s}},o.prototype._isBelowThreshold=function(n){this._minDiameter=Math.min(this._minDiameter,n.mag());var s=25/(Math.PI*this._minDiameter)*360,p=ji(n,this._startVector);return Math.abs(p)<s},o}(Ur);function ra(i){return Math.abs(i.y)>Math.abs(i.x)}var Us=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.reset=function(){i.prototype.reset.call(this),this._valid=void 0,delete this._firstMove,delete this._lastPoints;},o.prototype._start=function(n){this._lastPoints=n,ra(n[0].sub(n[1]))&&(this._valid=!1);},o.prototype._move=function(n,s,p){var f=n[0].sub(this._lastPoints[0]),d=n[1].sub(this._lastPoints[1]);if(this._valid=this.gestureBeginsVertically(f,d,p.timeStamp),this._valid)return this._lastPoints=n,this._active=!0,{pitchDelta:(f.y+d.y)/2*-.5}},o.prototype.gestureBeginsVertically=function(n,s,p){if(this._valid!==void 0)return this._valid;var f=n.mag()>=2,d=s.mag()>=2;if(f||d){if(!f||!d)return this._firstMove===void 0&&(this._firstMove=p),p-this._firstMove<100&&void 0;var y=n.y>0==s.y>0;return ra(n)&&ra(s)&&y}},o}(Ur),Vs={panStep:100,bearingStep:15,pitchStep:10},xi=function(){var i=Vs;this._panStep=i.panStep,this._bearingStep=i.bearingStep,this._pitchStep=i.pitchStep,this._rotationDisabled=!1;};function Wr(i){return i*(2-i)}xi.prototype.blur=function(){this.reset();},xi.prototype.reset=function(){this._active=!1;},xi.prototype.keydown=function(i){var o=this;if(!(i.altKey||i.ctrlKey||i.metaKey)){var n=0,s=0,p=0,f=0,d=0;switch(i.keyCode){case 61:case 107:case 171:case 187:n=1;break;case 189:case 109:case 173:n=-1;break;case 37:i.shiftKey?s=-1:(i.preventDefault(),f=-1);break;case 39:i.shiftKey?s=1:(i.preventDefault(),f=1);break;case 38:i.shiftKey?p=1:(i.preventDefault(),d=-1);break;case 40:i.shiftKey?p=-1:(i.preventDefault(),d=1);break;default:return}return this._rotationDisabled&&(s=0,p=0),{cameraAnimation:function(y){var v=y.getZoom();y.easeTo({duration:300,easeId:"keyboardHandler",easing:Wr,zoom:n?Math.round(v)+n*(i.shiftKey?2:1):v,bearing:y.getBearing()+s*o._bearingStep,pitch:y.getPitch()+p*o._pitchStep,offset:[-f*o._panStep,-d*o._panStep],center:y.getCenter()},{originalEvent:i});}}}},xi.prototype.enable=function(){this._enabled=!0;},xi.prototype.disable=function(){this._enabled=!1,this.reset();},xi.prototype.isEnabled=function(){return this._enabled},xi.prototype.isActive=function(){return this._active},xi.prototype.disableRotation=function(){this._rotationDisabled=!0;},xi.prototype.enableRotation=function(){this._rotationDisabled=!1;};var Jt=function(i,o){this._map=i,this._el=i.getCanvasContainer(),this._handler=o,this._delta=0,this._defaultZoomRate=.01,this._wheelZoomRate=1/450,u.bindAll(["_onTimeout"],this);};Jt.prototype.setZoomRate=function(i){this._defaultZoomRate=i;},Jt.prototype.setWheelZoomRate=function(i){this._wheelZoomRate=i;},Jt.prototype.isEnabled=function(){return !!this._enabled},Jt.prototype.isActive=function(){return !!this._active||this._finishTimeout!==void 0},Jt.prototype.isZooming=function(){return !!this._zooming},Jt.prototype.enable=function(i){this.isEnabled()||(this._enabled=!0,this._aroundCenter=i&&i.around==="center");},Jt.prototype.disable=function(){this.isEnabled()&&(this._enabled=!1);},Jt.prototype.wheel=function(i){if(this.isEnabled()){var o=i.deltaMode===u.window.WheelEvent.DOM_DELTA_LINE?40*i.deltaY:i.deltaY,n=u.browser.now(),s=n-(this._lastWheelEventTime||0);this._lastWheelEventTime=n,o!==0&&o%4.000244140625==0?this._type="wheel":o!==0&&Math.abs(o)<4?this._type="trackpad":s>400?(this._type=null,this._lastValue=o,this._timeout=setTimeout(this._onTimeout,40,i)):this._type||(this._type=Math.abs(s*o)<200?"trackpad":"wheel",this._timeout&&(clearTimeout(this._timeout),this._timeout=null,o+=this._lastValue)),i.shiftKey&&o&&(o/=4),this._type&&(this._lastWheelEvent=i,this._delta-=o,this._active||this._start(i)),i.preventDefault();}},Jt.prototype._onTimeout=function(i){this._type="wheel",this._delta-=this._lastValue,this._active||this._start(i);},Jt.prototype._start=function(i){if(this._delta){this._frameId&&(this._frameId=null),this._active=!0,this.isZooming()||(this._zooming=!0),this._finishTimeout&&(clearTimeout(this._finishTimeout),delete this._finishTimeout);var o=ct.mousePos(this._el,i);this._around=u.LngLat.convert(this._aroundCenter?this._map.getCenter():this._map.unproject(o)),this._aroundPoint=this._map.transform.locationPoint(this._around),this._frameId||(this._frameId=!0,this._handler._triggerRenderFrame());}},Jt.prototype.renderFrame=function(){var i=this;if(this._frameId&&(this._frameId=null,this.isActive())){var o=this._map.transform;if(this._delta!==0){var n=this._type==="wheel"&&Math.abs(this._delta)>4.000244140625?this._wheelZoomRate:this._defaultZoomRate,s=2/(1+Math.exp(-Math.abs(this._delta*n)));this._delta<0&&s!==0&&(s=1/s);var p=typeof this._targetZoom=="number"?o.zoomScale(this._targetZoom):o.scale;this._targetZoom=Math.min(o.maxZoom,Math.max(o.minZoom,o.scaleZoom(p*s))),this._type==="wheel"&&(this._startZoom=o.zoom,this._easing=this._smoothOutEasing(200)),this._delta=0;}var f,d=typeof this._targetZoom=="number"?this._targetZoom:o.zoom,y=this._startZoom,v=this._easing,S=!1;if(this._type==="wheel"&&y&&v){var P=Math.min((u.browser.now()-this._lastWheelEventTime)/200,1),z=v(P);f=u.number(y,d,z),P<1?this._frameId||(this._frameId=!0):S=!0;}else f=d,S=!0;return this._active=!0,S&&(this._active=!1,this._finishTimeout=setTimeout(function(){i._zooming=!1,i._handler._triggerRenderFrame(),delete i._targetZoom,delete i._finishTimeout;},200)),{noInertia:!0,needsRenderFrame:!S,zoomDelta:f-o.zoom,around:this._aroundPoint,originalEvent:this._lastWheelEvent}}},Jt.prototype._smoothOutEasing=function(i){var o=u.ease;if(this._prevEase){var n=this._prevEase,s=(u.browser.now()-n.start)/n.duration,p=n.easing(s+.01)-n.easing(s),f=.27/Math.sqrt(p*p+1e-4)*.01,d=Math.sqrt(.0729-f*f);o=u.bezier(f,d,.25,1);}return this._prevEase={start:u.browser.now(),duration:i,easing:o},o},Jt.prototype.blur=function(){this.reset();},Jt.prototype.reset=function(){this._active=!1;};var Pi=function(i,o){this._clickZoom=i,this._tapZoom=o;};Pi.prototype.enable=function(){this._clickZoom.enable(),this._tapZoom.enable();},Pi.prototype.disable=function(){this._clickZoom.disable(),this._tapZoom.disable();},Pi.prototype.isEnabled=function(){return this._clickZoom.isEnabled()&&this._tapZoom.isEnabled()},Pi.prototype.isActive=function(){return this._clickZoom.isActive()||this._tapZoom.isActive()};var oi=function(){this.reset();};oi.prototype.reset=function(){this._active=!1;},oi.prototype.blur=function(){this.reset();},oi.prototype.dblclick=function(i,o){return i.preventDefault(),{cameraAnimation:function(n){n.easeTo({duration:300,zoom:n.getZoom()+(i.shiftKey?-1:1),around:n.unproject(o)},{originalEvent:i});}}},oi.prototype.enable=function(){this._enabled=!0;},oi.prototype.disable=function(){this._enabled=!1,this.reset();},oi.prototype.isEnabled=function(){return this._enabled},oi.prototype.isActive=function(){return this._active};var pr=function(){this._tap=new vi({numTouches:1,numTaps:1}),this.reset();};pr.prototype.reset=function(){this._active=!1,delete this._swipePoint,delete this._swipeTouch,delete this._tapTime,this._tap.reset();},pr.prototype.touchstart=function(i,o,n){this._swipePoint||(this._tapTime&&i.timeStamp-this._tapTime>500&&this.reset(),this._tapTime?n.length>0&&(this._swipePoint=o[0],this._swipeTouch=n[0].identifier):this._tap.touchstart(i,o,n));},pr.prototype.touchmove=function(i,o,n){if(this._tapTime){if(this._swipePoint){if(n[0].identifier!==this._swipeTouch)return;var s=o[0],p=s.y-this._swipePoint.y;return this._swipePoint=s,i.preventDefault(),this._active=!0,{zoomDelta:p/128}}}else this._tap.touchmove(i,o,n);},pr.prototype.touchend=function(i,o,n){this._tapTime?this._swipePoint&&n.length===0&&this.reset():this._tap.touchend(i,o,n)&&(this._tapTime=i.timeStamp);},pr.prototype.touchcancel=function(){this.reset();},pr.prototype.enable=function(){this._enabled=!0;},pr.prototype.disable=function(){this._enabled=!1,this.reset();},pr.prototype.isEnabled=function(){return this._enabled},pr.prototype.isActive=function(){return this._active};var qn=function(i,o,n){this._el=i,this._mousePan=o,this._touchPan=n;};qn.prototype.enable=function(i){this._inertiaOptions=i||{},this._mousePan.enable(),this._touchPan.enable(),this._el.classList.add("mapboxgl-touch-drag-pan");},qn.prototype.disable=function(){this._mousePan.disable(),this._touchPan.disable(),this._el.classList.remove("mapboxgl-touch-drag-pan");},qn.prototype.isEnabled=function(){return this._mousePan.isEnabled()&&this._touchPan.isEnabled()},qn.prototype.isActive=function(){return this._mousePan.isActive()||this._touchPan.isActive()};var ln=function(i,o,n){this._pitchWithRotate=i.pitchWithRotate,this._mouseRotate=o,this._mousePitch=n;};ln.prototype.enable=function(){this._mouseRotate.enable(),this._pitchWithRotate&&this._mousePitch.enable();},ln.prototype.disable=function(){this._mouseRotate.disable(),this._mousePitch.disable();},ln.prototype.isEnabled=function(){return this._mouseRotate.isEnabled()&&(!this._pitchWithRotate||this._mousePitch.isEnabled())},ln.prototype.isActive=function(){return this._mouseRotate.isActive()||this._mousePitch.isActive()};var bi=function(i,o,n,s){this._el=i,this._touchZoom=o,this._touchRotate=n,this._tapDragZoom=s,this._rotationDisabled=!1,this._enabled=!0;};bi.prototype.enable=function(i){this._touchZoom.enable(i),this._rotationDisabled||this._touchRotate.enable(i),this._tapDragZoom.enable(),this._el.classList.add("mapboxgl-touch-zoom-rotate");},bi.prototype.disable=function(){this._touchZoom.disable(),this._touchRotate.disable(),this._tapDragZoom.disable(),this._el.classList.remove("mapboxgl-touch-zoom-rotate");},bi.prototype.isEnabled=function(){return this._touchZoom.isEnabled()&&(this._rotationDisabled||this._touchRotate.isEnabled())&&this._tapDragZoom.isEnabled()},bi.prototype.isActive=function(){return this._touchZoom.isActive()||this._touchRotate.isActive()||this._tapDragZoom.isActive()},bi.prototype.disableRotation=function(){this._rotationDisabled=!0,this._touchRotate.disable();},bi.prototype.enableRotation=function(){this._rotationDisabled=!1,this._touchZoom.isEnabled()&&this._touchRotate.enable();};var br=function(i){return i.zoom||i.drag||i.pitch||i.rotate},ia=function(i){function o(){i.apply(this,arguments);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o}(u.Event);function Ct(i){return i.panDelta&&i.panDelta.mag()||i.zoomDelta||i.bearingDelta||i.pitchDelta}var Et=function(i,o){this._map=i,this._el=this._map.getCanvasContainer(),this._handlers=[],this._handlersById={},this._changes=[],this._inertia=new $o(i),this._bearingSnap=o.bearingSnap,this._previousActiveHandlers={},this._eventsInProgress={},this._addDefaultHandlers(o),u.bindAll(["handleEvent","handleWindowEvent"],this);var n=this._el;this._listeners=[[n,"touchstart",{passive:!0}],[n,"touchmove",{passive:!1}],[n,"touchend",void 0],[n,"touchcancel",void 0],[n,"mousedown",void 0],[n,"mousemove",void 0],[n,"mouseup",void 0],[u.window.document,"mousemove",{capture:!0}],[u.window.document,"mouseup",void 0],[n,"mouseover",void 0],[n,"mouseout",void 0],[n,"dblclick",void 0],[n,"click",void 0],[n,"keydown",{capture:!1}],[n,"keyup",void 0],[n,"wheel",{passive:!1}],[n,"contextmenu",void 0],[u.window,"blur",void 0]];for(var s=0,p=this._listeners;s<p.length;s+=1){var f=p[s],d=f[0];ct.addEventListener(d,f[1],d===u.window.document?this.handleWindowEvent:this.handleEvent,f[2]);}};Et.prototype.destroy=function(){for(var i=0,o=this._listeners;i<o.length;i+=1){var n=o[i],s=n[0];ct.removeEventListener(s,n[1],s===u.window.document?this.handleWindowEvent:this.handleEvent,n[2]);}},Et.prototype._addDefaultHandlers=function(i){var o=this._map,n=o.getCanvasContainer();this._add("mapEvent",new Ze(o,i));var s=o.boxZoom=new Fr(o,i);this._add("boxZoom",s);var p=new Or,f=new oi;o.doubleClickZoom=new Pi(f,p),this._add("tapZoom",p),this._add("clickZoom",f);var d=new pr;this._add("tapDragZoom",d);var y=o.touchPitch=new Us;this._add("touchPitch",y);var v=new Fa(i),S=new Os(i);o.dragRotate=new ln(i,v,S),this._add("mouseRotate",v,["mousePitch"]),this._add("mousePitch",S,["mouseRotate"]);var P=new Fs(i),z=new ni(i);o.dragPan=new qn(n,P,z),this._add("mousePan",P),this._add("touchPan",z,["touchZoom","touchRotate"]);var k=new Wl,F=new Vr;o.touchZoomRotate=new bi(n,F,k,d),this._add("touchRotate",k,["touchPan","touchZoom"]),this._add("touchZoom",F,["touchPan","touchRotate"]);var R=o.scrollZoom=new Jt(o,this);this._add("scrollZoom",R,["mousePan"]);var j=o.keyboard=new xi;this._add("keyboard",j),this._add("blockableMapEvent",new Tt(o));for(var D=0,N=["boxZoom","doubleClickZoom","tapDragZoom","touchPitch","dragRotate","dragPan","touchZoomRotate","scrollZoom","keyboard"];D<N.length;D+=1){var G=N[D];i.interactive&&i[G]&&o[G].enable(i[G]);}},Et.prototype._add=function(i,o,n){this._handlers.push({handlerName:i,handler:o,allowed:n}),this._handlersById[i]=o;},Et.prototype.stop=function(i){if(!this._updatingCamera){for(var o=0,n=this._handlers;o<n.length;o+=1)n[o].handler.reset();this._inertia.clear(),this._fireEvents({},{},i),this._changes=[];}},Et.prototype.isActive=function(){for(var i=0,o=this._handlers;i<o.length;i+=1)if(o[i].handler.isActive())return !0;return !1},Et.prototype.isZooming=function(){return !!this._eventsInProgress.zoom||this._map.scrollZoom.isZooming()},Et.prototype.isRotating=function(){return !!this._eventsInProgress.rotate},Et.prototype.isMoving=function(){return Boolean(br(this._eventsInProgress))||this.isZooming()},Et.prototype._blockedByActive=function(i,o,n){for(var s in i)if(s!==n&&(!o||o.indexOf(s)<0))return !0;return !1},Et.prototype.handleWindowEvent=function(i){this.handleEvent(i,i.type+"Window");},Et.prototype._getMapTouches=function(i){for(var o=[],n=0,s=i;n<s.length;n+=1){var p=s[n];this._el.contains(p.target)&&o.push(p);}return o},Et.prototype.handleEvent=function(i,o){this._updatingCamera=!0;for(var n=i.type==="renderFrame"?void 0:i,s={needsRenderFrame:!1},p={},f={},d=i.touches?this._getMapTouches(i.touches):void 0,y=d?ct.touchPos(this._el,d):ct.mousePos(this._el,i),v=0,S=this._handlers;v<S.length;v+=1){var P=S[v],z=P.handlerName,k=P.handler,F=P.allowed;if(k.isEnabled()){var R=void 0;this._blockedByActive(f,F,z)?k.reset():k[o||i.type]&&(R=k[o||i.type](i,y,d),this.mergeHandlerResult(s,p,R,z,n),R&&R.needsRenderFrame&&this._triggerRenderFrame()),(R||k.isActive())&&(f[z]=k);}}var j={};for(var D in this._previousActiveHandlers)f[D]||(j[D]=n);this._previousActiveHandlers=f,(Object.keys(j).length||Ct(s))&&(this._changes.push([s,p,j]),this._triggerRenderFrame()),(Object.keys(f).length||Ct(s))&&this._map._stop(!0),this._updatingCamera=!1;var N=s.cameraAnimation;N&&(this._inertia.clear(),this._fireEvents({},{},!0),this._changes=[],N(this._map));},Et.prototype.mergeHandlerResult=function(i,o,n,s,p){if(n){u.extend(i,n);var f={handlerName:s,originalEvent:n.originalEvent||p};n.zoomDelta!==void 0&&(o.zoom=f),n.panDelta!==void 0&&(o.drag=f),n.pitchDelta!==void 0&&(o.pitch=f),n.bearingDelta!==void 0&&(o.rotate=f);}},Et.prototype._applyChanges=function(){for(var i={},o={},n={},s=0,p=this._changes;s<p.length;s+=1){var f=p[s],d=f[0],y=f[1],v=f[2];d.panDelta&&(i.panDelta=(i.panDelta||new u.Point(0,0))._add(d.panDelta)),d.zoomDelta&&(i.zoomDelta=(i.zoomDelta||0)+d.zoomDelta),d.bearingDelta&&(i.bearingDelta=(i.bearingDelta||0)+d.bearingDelta),d.pitchDelta&&(i.pitchDelta=(i.pitchDelta||0)+d.pitchDelta),d.around!==void 0&&(i.around=d.around),d.pinchAround!==void 0&&(i.pinchAround=d.pinchAround),d.noInertia&&(i.noInertia=d.noInertia),u.extend(o,y),u.extend(n,v);}this._updateMapTransform(i,o,n),this._changes=[];},Et.prototype._updateMapTransform=function(i,o,n){var s=this._map,p=s.transform;if(!Ct(i))return this._fireEvents(o,n,!0);var f=i.panDelta,d=i.zoomDelta,y=i.bearingDelta,v=i.pitchDelta,S=i.around,P=i.pinchAround;P!==void 0&&(S=P),s._stop(!0),S=S||s.transform.centerPoint;var z=p.pointLocation(f?S.sub(f):S);y&&(p.bearing+=y),v&&(p.pitch+=v),d&&(p.zoom+=d),p.setLocationAtPoint(z,S),this._map._update(),i.noInertia||this._inertia.record(i),this._fireEvents(o,n,!0);},Et.prototype._fireEvents=function(i,o,n){var s=this,p=br(this._eventsInProgress),f=br(i),d={};for(var y in i)this._eventsInProgress[y]||(d[y+"start"]=i[y].originalEvent),this._eventsInProgress[y]=i[y];for(var v in !p&&f&&this._fireEvent("movestart",f.originalEvent),d)this._fireEvent(v,d[v]);for(var S in f&&this._fireEvent("move",f.originalEvent),i)this._fireEvent(S,i[S].originalEvent);var P,z={};for(var k in this._eventsInProgress){var F=this._eventsInProgress[k],R=F.handlerName,j=F.originalEvent;this._handlersById[R].isActive()||(delete this._eventsInProgress[k],z[k+"end"]=P=o[R]||j);}for(var D in z)this._fireEvent(D,z[D]);var N=br(this._eventsInProgress);if(n&&(p||f)&&!N){this._updatingCamera=!0;var G=this._inertia._onMoveEnd(this._map.dragPan._inertiaOptions),K=function(tt){return tt!==0&&-s._bearingSnap<tt&&tt<s._bearingSnap};G?(K(G.bearing||this._map.getBearing())&&(G.bearing=0),this._map.easeTo(G,{originalEvent:P})):(this._map.fire(new u.Event("moveend",{originalEvent:P})),K(this._map.getBearing())&&this._map.resetNorth()),this._updatingCamera=!1;}},Et.prototype._fireEvent=function(i,o){this._map.fire(new u.Event(i,o?{originalEvent:o}:{}));},Et.prototype._requestFrame=function(){var i=this;return this._map.triggerRepaint(),this._map._renderTaskQueue.add(function(o){delete i._frameId,i.handleEvent(new ia("renderFrame",{timeStamp:o})),i._applyChanges();})},Et.prototype._triggerRenderFrame=function(){this._frameId===void 0&&(this._frameId=this._requestFrame());};var Va=function(i){function o(n,s){i.call(this),this._moving=!1,this._zooming=!1,this.transform=n,this._bearingSnap=s.bearingSnap,u.bindAll(["_renderFrameCallback"],this);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.getCenter=function(){return new u.LngLat(this.transform.center.lng,this.transform.center.lat)},o.prototype.setCenter=function(n,s){return this.jumpTo({center:n},s)},o.prototype.panBy=function(n,s,p){return n=u.Point.convert(n).mult(-1),this.panTo(this.transform.center,u.extend({offset:n},s),p)},o.prototype.panTo=function(n,s,p){return this.easeTo(u.extend({center:n},s),p)},o.prototype.getZoom=function(){return this.transform.zoom},o.prototype.setZoom=function(n,s){return this.jumpTo({zoom:n},s),this},o.prototype.zoomTo=function(n,s,p){return this.easeTo(u.extend({zoom:n},s),p)},o.prototype.zoomIn=function(n,s){return this.zoomTo(this.getZoom()+1,n,s),this},o.prototype.zoomOut=function(n,s){return this.zoomTo(this.getZoom()-1,n,s),this},o.prototype.getBearing=function(){return this.transform.bearing},o.prototype.setBearing=function(n,s){return this.jumpTo({bearing:n},s),this},o.prototype.getPadding=function(){return this.transform.padding},o.prototype.setPadding=function(n,s){return this.jumpTo({padding:n},s),this},o.prototype.rotateTo=function(n,s,p){return this.easeTo(u.extend({bearing:n},s),p)},o.prototype.resetNorth=function(n,s){return this.rotateTo(0,u.extend({duration:1e3},n),s),this},o.prototype.resetNorthPitch=function(n,s){return this.easeTo(u.extend({bearing:0,pitch:0,duration:1e3},n),s),this},o.prototype.snapToNorth=function(n,s){return Math.abs(this.getBearing())<this._bearingSnap?this.resetNorth(n,s):this},o.prototype.getPitch=function(){return this.transform.pitch},o.prototype.setPitch=function(n,s){return this.jumpTo({pitch:n},s),this},o.prototype.cameraForBounds=function(n,s){n=u.LngLatBounds.convert(n);var p=s&&s.bearing||0;return this._cameraForBoxAndBearing(n.getNorthWest(),n.getSouthEast(),p,s)},o.prototype._cameraForBoxAndBearing=function(n,s,p,f){var d={top:0,bottom:0,right:0,left:0};if(typeof(f=u.extend({padding:d,offset:[0,0],maxZoom:this.transform.maxZoom},f)).padding=="number"){var y=f.padding;f.padding={top:y,bottom:y,right:y,left:y};}f.padding=u.extend(d,f.padding);var v=this.transform,S=v.padding,P=v.project(u.LngLat.convert(n)),z=v.project(u.LngLat.convert(s)),k=P.rotate(-p*Math.PI/180),F=z.rotate(-p*Math.PI/180),R=new u.Point(Math.max(k.x,F.x),Math.max(k.y,F.y)),j=new u.Point(Math.min(k.x,F.x),Math.min(k.y,F.y)),D=R.sub(j),N=(v.width-(S.left+S.right+f.padding.left+f.padding.right))/D.x,G=(v.height-(S.top+S.bottom+f.padding.top+f.padding.bottom))/D.y;if(!(G<0||N<0)){var K=Math.min(v.scaleZoom(v.scale*Math.min(N,G)),f.maxZoom),tt=typeof f.offset.x=="number"?new u.Point(f.offset.x,f.offset.y):u.Point.convert(f.offset),Q=new u.Point((f.padding.left-f.padding.right)/2,(f.padding.top-f.padding.bottom)/2).rotate(p*Math.PI/180),et=tt.add(Q).mult(v.scale/v.zoomScale(K));return {center:v.unproject(P.add(z).div(2).sub(et)),zoom:K,bearing:p}}u.warnOnce("Map cannot fit within canvas with the given bounds, padding, and/or offset.");},o.prototype.fitBounds=function(n,s,p){return this._fitInternal(this.cameraForBounds(n,s),s,p)},o.prototype.fitScreenCoordinates=function(n,s,p,f,d){return this._fitInternal(this._cameraForBoxAndBearing(this.transform.pointLocation(u.Point.convert(n)),this.transform.pointLocation(u.Point.convert(s)),p,f),f,d)},o.prototype._fitInternal=function(n,s,p){return n?(delete(s=u.extend(n,s)).padding,s.linear?this.easeTo(s,p):this.flyTo(s,p)):this},o.prototype.jumpTo=function(n,s){this.stop();var p=this.transform,f=!1,d=!1,y=!1;return "zoom"in n&&p.zoom!==+n.zoom&&(f=!0,p.zoom=+n.zoom),n.center!==void 0&&(p.center=u.LngLat.convert(n.center)),"bearing"in n&&p.bearing!==+n.bearing&&(d=!0,p.bearing=+n.bearing),"pitch"in n&&p.pitch!==+n.pitch&&(y=!0,p.pitch=+n.pitch),n.padding==null||p.isPaddingEqual(n.padding)||(p.padding=n.padding),this.fire(new u.Event("movestart",s)).fire(new u.Event("move",s)),f&&this.fire(new u.Event("zoomstart",s)).fire(new u.Event("zoom",s)).fire(new u.Event("zoomend",s)),d&&this.fire(new u.Event("rotatestart",s)).fire(new u.Event("rotate",s)).fire(new u.Event("rotateend",s)),y&&this.fire(new u.Event("pitchstart",s)).fire(new u.Event("pitch",s)).fire(new u.Event("pitchend",s)),this.fire(new u.Event("moveend",s))},o.prototype.easeTo=function(n,s){var p=this;this._stop(!1,n.easeId),((n=u.extend({offset:[0,0],duration:500,easing:u.ease},n)).animate===!1||!n.essential&&u.browser.prefersReducedMotion)&&(n.duration=0);var f=this.transform,d=this.getZoom(),y=this.getBearing(),v=this.getPitch(),S=this.getPadding(),P="zoom"in n?+n.zoom:d,z="bearing"in n?this._normalizeBearing(n.bearing,y):y,k="pitch"in n?+n.pitch:v,F="padding"in n?n.padding:f.padding,R=u.Point.convert(n.offset),j=f.centerPoint.add(R),D=f.pointLocation(j),N=u.LngLat.convert(n.center||D);this._normalizeCenter(N);var G,K,tt=f.project(D),Q=f.project(N).sub(tt),et=f.zoomScale(P-d);n.around&&(G=u.LngLat.convert(n.around),K=f.locationPoint(G));var ot={moving:this._moving,zooming:this._zooming,rotating:this._rotating,pitching:this._pitching};return this._zooming=this._zooming||P!==d,this._rotating=this._rotating||y!==z,this._pitching=this._pitching||k!==v,this._padding=!f.isPaddingEqual(F),this._easeId=n.easeId,this._prepareEase(s,n.noMoveStart,ot),this._ease(function(ht){if(p._zooming&&(f.zoom=u.number(d,P,ht)),p._rotating&&(f.bearing=u.number(y,z,ht)),p._pitching&&(f.pitch=u.number(v,k,ht)),p._padding&&(f.interpolatePadding(S,F,ht),j=f.centerPoint.add(R)),G)f.setLocationAtPoint(G,K);else {var pt=f.zoomScale(f.zoom-d),bt=P>d?Math.min(2,et):Math.max(.5,et),kt=Math.pow(bt,1-ht),Bt=f.unproject(tt.add(Q.mult(ht*kt)).mult(pt));f.setLocationAtPoint(f.renderWorldCopies?Bt.wrap():Bt,j);}p._fireMoveEvents(s);},function(ht){p._afterEase(s,ht);},n),this},o.prototype._prepareEase=function(n,s,p){p===void 0&&(p={}),this._moving=!0,s||p.moving||this.fire(new u.Event("movestart",n)),this._zooming&&!p.zooming&&this.fire(new u.Event("zoomstart",n)),this._rotating&&!p.rotating&&this.fire(new u.Event("rotatestart",n)),this._pitching&&!p.pitching&&this.fire(new u.Event("pitchstart",n));},o.prototype._fireMoveEvents=function(n){this.fire(new u.Event("move",n)),this._zooming&&this.fire(new u.Event("zoom",n)),this._rotating&&this.fire(new u.Event("rotate",n)),this._pitching&&this.fire(new u.Event("pitch",n));},o.prototype._afterEase=function(n,s){if(!this._easeId||!s||this._easeId!==s){delete this._easeId;var p=this._zooming,f=this._rotating,d=this._pitching;this._moving=!1,this._zooming=!1,this._rotating=!1,this._pitching=!1,this._padding=!1,p&&this.fire(new u.Event("zoomend",n)),f&&this.fire(new u.Event("rotateend",n)),d&&this.fire(new u.Event("pitchend",n)),this.fire(new u.Event("moveend",n));}},o.prototype.flyTo=function(n,s){var p=this;if(!n.essential&&u.browser.prefersReducedMotion){var f=u.pick(n,["center","zoom","bearing","pitch","around"]);return this.jumpTo(f,s)}this.stop(),n=u.extend({offset:[0,0],speed:1.2,curve:1.42,easing:u.ease},n);var d=this.transform,y=this.getZoom(),v=this.getBearing(),S=this.getPitch(),P=this.getPadding(),z="zoom"in n?u.clamp(+n.zoom,d.minZoom,d.maxZoom):y,k="bearing"in n?this._normalizeBearing(n.bearing,v):v,F="pitch"in n?+n.pitch:S,R="padding"in n?n.padding:d.padding,j=d.zoomScale(z-y),D=u.Point.convert(n.offset),N=d.centerPoint.add(D),G=d.pointLocation(N),K=u.LngLat.convert(n.center||G);this._normalizeCenter(K);var tt=d.project(G),Q=d.project(K).sub(tt),et=n.curve,ot=Math.max(d.width,d.height),ht=ot/j,pt=Q.mag();if("minZoom"in n){var bt=u.clamp(Math.min(n.minZoom,y,z),d.minZoom,d.maxZoom),kt=ot/d.zoomScale(bt-y);et=Math.sqrt(kt/pt*2);}var Bt=et*et;function Lt(Ot){var Rt=(ht*ht-ot*ot+(Ot?-1:1)*Bt*Bt*pt*pt)/(2*(Ot?ht:ot)*Bt*pt);return Math.log(Math.sqrt(Rt*Rt+1)-Rt)}function ne(Ot){return (Math.exp(Ot)-Math.exp(-Ot))/2}function wt(Ot){return (Math.exp(Ot)+Math.exp(-Ot))/2}var Nt=Lt(0),Gt=function(Ot){return wt(Nt)/wt(Nt+et*Ot)},Vt=function(Ot){return ot*((wt(Nt)*(ne(Rt=Nt+et*Ot)/wt(Rt))-ne(Nt))/Bt)/pt;var Rt;},Ut=(Lt(1)-Nt)/et;if(Math.abs(pt)<1e-6||!isFinite(Ut)){if(Math.abs(ot-ht)<1e-6)return this.easeTo(n,s);var Zt=ht<ot?-1:1;Ut=Math.abs(Math.log(ht/ot))/et,Vt=function(){return 0},Gt=function(Ot){return Math.exp(Zt*et*Ot)};}return n.duration="duration"in n?+n.duration:1e3*Ut/("screenSpeed"in n?+n.screenSpeed/et:+n.speed),n.maxDuration&&n.duration>n.maxDuration&&(n.duration=0),this._zooming=!0,this._rotating=v!==k,this._pitching=F!==S,this._padding=!d.isPaddingEqual(R),this._prepareEase(s,!1),this._ease(function(Ot){var Rt=Ot*Ut,Je=1/Gt(Rt);d.zoom=Ot===1?z:y+d.scaleZoom(Je),p._rotating&&(d.bearing=u.number(v,k,Ot)),p._pitching&&(d.pitch=u.number(S,F,Ot)),p._padding&&(d.interpolatePadding(P,R,Ot),N=d.centerPoint.add(D));var De=Ot===1?K:d.unproject(tt.add(Q.mult(Vt(Rt))).mult(Je));d.setLocationAtPoint(d.renderWorldCopies?De.wrap():De,N),p._fireMoveEvents(s);},function(){return p._afterEase(s)},n),this},o.prototype.isEasing=function(){return !!this._easeFrameId},o.prototype.stop=function(){return this._stop()},o.prototype._stop=function(n,s){if(this._easeFrameId&&(this._cancelRenderFrame(this._easeFrameId),delete this._easeFrameId,delete this._onEaseFrame),this._onEaseEnd){var p=this._onEaseEnd;delete this._onEaseEnd,p.call(this,s);}if(!n){var f=this.handlers;f&&f.stop(!1);}return this},o.prototype._ease=function(n,s,p){p.animate===!1||p.duration===0?(n(1),s()):(this._easeStart=u.browser.now(),this._easeOptions=p,this._onEaseFrame=n,this._onEaseEnd=s,this._easeFrameId=this._requestRenderFrame(this._renderFrameCallback));},o.prototype._renderFrameCallback=function(){var n=Math.min((u.browser.now()-this._easeStart)/this._easeOptions.duration,1);this._onEaseFrame(this._easeOptions.easing(n)),n<1?this._easeFrameId=this._requestRenderFrame(this._renderFrameCallback):this.stop();},o.prototype._normalizeBearing=function(n,s){n=u.wrap(n,-180,180);var p=Math.abs(n-s);return Math.abs(n-360-s)<p&&(n-=360),Math.abs(n+360-s)<p&&(n+=360),n},o.prototype._normalizeCenter=function(n){var s=this.transform;if(s.renderWorldCopies&&!s.lngRange){var p=n.lng-s.center.lng;n.lng+=p>180?-360:p<-180?360:0;}},o}(u.Evented),wr=function(i){i===void 0&&(i={}),this.options=i,u.bindAll(["_toggleAttribution","_updateEditLink","_updateData","_updateCompact"],this);};wr.prototype.getDefaultPosition=function(){return "bottom-right"},wr.prototype.onAdd=function(i){var o=this.options&&this.options.compact;return this._map=i,this._container=ct.create("div","mapboxgl-ctrl mapboxgl-ctrl-attrib"),this._compactButton=ct.create("button","mapboxgl-ctrl-attrib-button",this._container),this._compactButton.addEventListener("click",this._toggleAttribution),this._setElementTitle(this._compactButton,"ToggleAttribution"),this._innerContainer=ct.create("div","mapboxgl-ctrl-attrib-inner",this._container),this._innerContainer.setAttribute("role","list"),o&&this._container.classList.add("mapboxgl-compact"),this._updateAttributions(),this._updateEditLink(),this._map.on("styledata",this._updateData),this._map.on("sourcedata",this._updateData),this._map.on("moveend",this._updateEditLink),o===void 0&&(this._map.on("resize",this._updateCompact),this._updateCompact()),this._container},wr.prototype.onRemove=function(){ct.remove(this._container),this._map.off("styledata",this._updateData),this._map.off("sourcedata",this._updateData),this._map.off("moveend",this._updateEditLink),this._map.off("resize",this._updateCompact),this._map=void 0,this._attribHTML=void 0;},wr.prototype._setElementTitle=function(i,o){var n=this._map._getUIString("AttributionControl."+o);i.title=n,i.setAttribute("aria-label",n);},wr.prototype._toggleAttribution=function(){this._container.classList.contains("mapboxgl-compact-show")?(this._container.classList.remove("mapboxgl-compact-show"),this._compactButton.setAttribute("aria-pressed","false")):(this._container.classList.add("mapboxgl-compact-show"),this._compactButton.setAttribute("aria-pressed","true"));},wr.prototype._updateEditLink=function(){var i=this._editLink;i||(i=this._editLink=this._container.querySelector(".mapbox-improve-map"));var o=[{key:"owner",value:this.styleOwner},{key:"id",value:this.styleId},{key:"access_token",value:this._map._requestManager._customAccessToken||u.config.ACCESS_TOKEN}];if(i){var n=o.reduce(function(s,p,f){return p.value&&(s+=p.key+"="+p.value+(f<o.length-1?"&":"")),s},"?");i.href=u.config.FEEDBACK_URL+"/"+n+(this._map._hash?this._map._hash.getHashString(!0):""),i.rel="noopener nofollow",this._setElementTitle(i,"MapFeedback");}},wr.prototype._updateData=function(i){!i||i.sourceDataType!=="metadata"&&i.sourceDataType!=="visibility"&&i.dataType!=="style"||(this._updateAttributions(),this._updateEditLink());},wr.prototype._updateAttributions=function(){if(this._map.style){var i=[];if(this.options.customAttribution&&(Array.isArray(this.options.customAttribution)?i=i.concat(this.options.customAttribution.map(function(y){return typeof y!="string"?"":y})):typeof this.options.customAttribution=="string"&&i.push(this.options.customAttribution)),this._map.style.stylesheet){var o=this._map.style.stylesheet;this.styleOwner=o.owner,this.styleId=o.id;}var n=this._map.style.sourceCaches;for(var s in n){var p=n[s];if(p.used){var f=p.getSource();f.attribution&&i.indexOf(f.attribution)<0&&i.push(f.attribution);}}i.sort(function(y,v){return y.length-v.length});var d=(i=i.filter(function(y,v){for(var S=v+1;S<i.length;S++)if(i[S].indexOf(y)>=0)return !1;return !0})).join(" | ");d!==this._attribHTML&&(this._attribHTML=d,i.length?(this._innerContainer.innerHTML=d,this._container.classList.remove("mapboxgl-attrib-empty")):this._container.classList.add("mapboxgl-attrib-empty"),this._editLink=null);}},wr.prototype._updateCompact=function(){this._map.getCanvasContainer().offsetWidth<=640?this._container.classList.add("mapboxgl-compact"):this._container.classList.remove("mapboxgl-compact","mapboxgl-compact-show");};var wi=function(){u.bindAll(["_updateLogo"],this),u.bindAll(["_updateCompact"],this);};wi.prototype.onAdd=function(i){this._map=i,this._container=ct.create("div","mapboxgl-ctrl");var o=ct.create("a","mapboxgl-ctrl-logo");return o.target="_blank",o.rel="noopener nofollow",o.href="https://www.mapbox.com/",o.setAttribute("aria-label",this._map._getUIString("LogoControl.Title")),o.setAttribute("rel","noopener nofollow"),this._container.appendChild(o),this._container.style.display="none",this._map.on("sourcedata",this._updateLogo),this._updateLogo(),this._map.on("resize",this._updateCompact),this._updateCompact(),this._container},wi.prototype.onRemove=function(){ct.remove(this._container),this._map.off("sourcedata",this._updateLogo),this._map.off("resize",this._updateCompact);},wi.prototype.getDefaultPosition=function(){return "bottom-left"},wi.prototype._updateLogo=function(i){i&&i.sourceDataType!=="metadata"||(this._container.style.display=this._logoRequired()?"block":"none");},wi.prototype._logoRequired=function(){if(this._map.style){var i=this._map.style.sourceCaches;for(var o in i)if(i[o].getSource().mapbox_logo)return !0;return !1}},wi.prototype._updateCompact=function(){var i=this._container.children;if(i.length){var o=i[0];this._map.getCanvasContainer().offsetWidth<250?o.classList.add("mapboxgl-compact"):o.classList.remove("mapboxgl-compact");}};var hr=function(){this._queue=[],this._id=0,this._cleared=!1,this._currentlyRunning=!1;};hr.prototype.add=function(i){var o=++this._id;return this._queue.push({callback:i,id:o,cancelled:!1}),o},hr.prototype.remove=function(i){for(var o=this._currentlyRunning,n=0,s=o?this._queue.concat(o):this._queue;n<s.length;n+=1){var p=s[n];if(p.id===i)return void(p.cancelled=!0)}},hr.prototype.run=function(i){i===void 0&&(i=0);var o=this._currentlyRunning=this._queue;this._queue=[];for(var n=0,s=o;n<s.length;n+=1){var p=s[n];if(!p.cancelled&&(p.callback(i),this._cleared))break}this._cleared=!1,this._currentlyRunning=!1;},hr.prototype.clear=function(){this._currentlyRunning&&(this._cleared=!0),this._queue=[];};var zi={"AttributionControl.ToggleAttribution":"Toggle attribution","AttributionControl.MapFeedback":"Map feedback","FullscreenControl.Enter":"Enter fullscreen","FullscreenControl.Exit":"Exit fullscreen","GeolocateControl.FindMyLocation":"Find my location","GeolocateControl.LocationNotAvailable":"Location not available","LogoControl.Title":"Mapbox logo","NavigationControl.ResetBearing":"Reset bearing to north","NavigationControl.ZoomIn":"Zoom in","NavigationControl.ZoomOut":"Zoom out","ScaleControl.Feet":"ft","ScaleControl.Meters":"m","ScaleControl.Kilometers":"km","ScaleControl.Miles":"mi","ScaleControl.NauticalMiles":"nm"},Ns=u.window.HTMLImageElement,Na=u.window.HTMLElement,he=u.window.ImageBitmap,ir={center:[0,0],zoom:0,bearing:0,pitch:0,minZoom:-2,maxZoom:22,minPitch:0,maxPitch:60,interactive:!0,scrollZoom:!0,boxZoom:!0,dragRotate:!0,dragPan:!0,keyboard:!0,doubleClickZoom:!0,touchZoomRotate:!0,touchPitch:!0,bearingSnap:7,clickTolerance:3,pitchWithRotate:!0,hash:!1,attributionControl:!0,failIfMajorPerformanceCaveat:!1,preserveDrawingBuffer:!1,trackResize:!0,renderWorldCopies:!0,refreshExpiredTiles:!0,maxTileCacheSize:null,localIdeographFontFamily:"sans-serif",transformRequest:null,accessToken:null,fadeDuration:300,crossSourceCollisions:!0},Kl=function(i){function o(s){var p=this;if((s=u.extend({},ir,s)).minZoom!=null&&s.maxZoom!=null&&s.minZoom>s.maxZoom)throw new Error("maxZoom must be greater than or equal to minZoom");if(s.minPitch!=null&&s.maxPitch!=null&&s.minPitch>s.maxPitch)throw new Error("maxPitch must be greater than or equal to minPitch");if(s.minPitch!=null&&s.minPitch<0)throw new Error("minPitch must be greater than or equal to 0");if(s.maxPitch!=null&&s.maxPitch>60)throw new Error("maxPitch must be less than or equal to 60");var f=new ee(s.minZoom,s.maxZoom,s.minPitch,s.maxPitch,s.renderWorldCopies);if(i.call(this,f,s),this._interactive=s.interactive,this._maxTileCacheSize=s.maxTileCacheSize,this._failIfMajorPerformanceCaveat=s.failIfMajorPerformanceCaveat,this._preserveDrawingBuffer=s.preserveDrawingBuffer,this._antialias=s.antialias,this._trackResize=s.trackResize,this._bearingSnap=s.bearingSnap,this._refreshExpiredTiles=s.refreshExpiredTiles,this._fadeDuration=s.fadeDuration,this._crossSourceCollisions=s.crossSourceCollisions,this._crossFadingFactor=1,this._collectResourceTiming=s.collectResourceTiming,this._renderTaskQueue=new hr,this._controls=[],this._mapId=u.uniqueId(),this._locale=u.extend({},zi,s.locale),this._clickTolerance=s.clickTolerance,this._requestManager=new u.RequestManager(s.transformRequest,s.accessToken),typeof s.container=="string"){if(this._container=u.window.document.getElementById(s.container),!this._container)throw new Error("Container '"+s.container+"' not found.")}else {if(!(s.container instanceof Na))throw new Error("Invalid type: 'container' must be a String or HTMLElement.");this._container=s.container;}if(s.maxBounds&&this.setMaxBounds(s.maxBounds),u.bindAll(["_onWindowOnline","_onWindowResize","_onMapScroll","_contextLost","_contextRestored"],this),this._setupContainer(),this._setupPainter(),this.painter===void 0)throw new Error("Failed to initialize WebGL.");this.on("move",function(){return p._update(!1)}),this.on("moveend",function(){return p._update(!1)}),this.on("zoom",function(){return p._update(!0)}),u.window!==void 0&&(u.window.addEventListener("online",this._onWindowOnline,!1),u.window.addEventListener("resize",this._onWindowResize,!1),u.window.addEventListener("orientationchange",this._onWindowResize,!1)),this.handlers=new Et(this,s),this._hash=s.hash&&new Xr(typeof s.hash=="string"&&s.hash||void 0).addTo(this),this._hash&&this._hash._onHashChange()||(this.jumpTo({center:s.center,zoom:s.zoom,bearing:s.bearing,pitch:s.pitch}),s.bounds&&(this.resize(),this.fitBounds(s.bounds,u.extend({},s.fitBoundsOptions,{duration:0})))),this.resize(),this._localIdeographFontFamily=s.localIdeographFontFamily,s.style&&this.setStyle(s.style,{localIdeographFontFamily:s.localIdeographFontFamily}),s.attributionControl&&this.addControl(new wr({customAttribution:s.customAttribution})),this.addControl(new wi,s.logoPosition),this.on("style.load",function(){p.transform.unmodified&&p.jumpTo(p.style.stylesheet);}),this.on("data",function(d){p._update(d.dataType==="style"),p.fire(new u.Event(d.dataType+"data",d));}),this.on("dataloading",function(d){p.fire(new u.Event(d.dataType+"dataloading",d));});}i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o;var n={showTileBoundaries:{configurable:!0},showPadding:{configurable:!0},showCollisionBoxes:{configurable:!0},showOverdrawInspector:{configurable:!0},repaint:{configurable:!0},vertices:{configurable:!0},version:{configurable:!0}};return o.prototype._getMapId=function(){return this._mapId},o.prototype.addControl=function(s,p){if(p===void 0&&(p=s.getDefaultPosition?s.getDefaultPosition():"top-right"),!s||!s.onAdd)return this.fire(new u.ErrorEvent(new Error("Invalid argument to map.addControl(). Argument must be a control with onAdd and onRemove methods.")));var f=s.onAdd(this);this._controls.push(s);var d=this._controlPositions[p];return p.indexOf("bottom")!==-1?d.insertBefore(f,d.firstChild):d.appendChild(f),this},o.prototype.removeControl=function(s){if(!s||!s.onRemove)return this.fire(new u.ErrorEvent(new Error("Invalid argument to map.removeControl(). Argument must be a control with onAdd and onRemove methods.")));var p=this._controls.indexOf(s);return p>-1&&this._controls.splice(p,1),s.onRemove(this),this},o.prototype.hasControl=function(s){return this._controls.indexOf(s)>-1},o.prototype.resize=function(s){var p=this._containerDimensions(),f=p[0],d=p[1];if(f===this.transform.width&&d===this.transform.height)return this;this._resizeCanvas(f,d),this.transform.resize(f,d),this.painter.resize(f,d);var y=!this._moving;return y&&this.fire(new u.Event("movestart",s)).fire(new u.Event("move",s)),this.fire(new u.Event("resize",s)),y&&this.fire(new u.Event("moveend",s)),this},o.prototype.getBounds=function(){return this.transform.getBounds()},o.prototype.getMaxBounds=function(){return this.transform.getMaxBounds()},o.prototype.setMaxBounds=function(s){return this.transform.setMaxBounds(u.LngLatBounds.convert(s)),this._update()},o.prototype.setMinZoom=function(s){if((s=s??-2)>=-2&&s<=this.transform.maxZoom)return this.transform.minZoom=s,this._update(),this.getZoom()<s&&this.setZoom(s),this;throw new Error("minZoom must be between -2 and the current maxZoom, inclusive")},o.prototype.getMinZoom=function(){return this.transform.minZoom},o.prototype.setMaxZoom=function(s){if((s=s??22)>=this.transform.minZoom)return this.transform.maxZoom=s,this._update(),this.getZoom()>s&&this.setZoom(s),this;throw new Error("maxZoom must be greater than the current minZoom")},o.prototype.getMaxZoom=function(){return this.transform.maxZoom},o.prototype.setMinPitch=function(s){if((s=s??0)<0)throw new Error("minPitch must be greater than or equal to 0");if(s>=0&&s<=this.transform.maxPitch)return this.transform.minPitch=s,this._update(),this.getPitch()<s&&this.setPitch(s),this;throw new Error("minPitch must be between 0 and the current maxPitch, inclusive")},o.prototype.getMinPitch=function(){return this.transform.minPitch},o.prototype.setMaxPitch=function(s){if((s=s??60)>60)throw new Error("maxPitch must be less than or equal to 60");if(s>=this.transform.minPitch)return this.transform.maxPitch=s,this._update(),this.getPitch()>s&&this.setPitch(s),this;throw new Error("maxPitch must be greater than the current minPitch")},o.prototype.getMaxPitch=function(){return this.transform.maxPitch},o.prototype.getRenderWorldCopies=function(){return this.transform.renderWorldCopies},o.prototype.setRenderWorldCopies=function(s){return this.transform.renderWorldCopies=s,this._update()},o.prototype.project=function(s){return this.transform.locationPoint(u.LngLat.convert(s))},o.prototype.unproject=function(s){return this.transform.pointLocation(u.Point.convert(s))},o.prototype.isMoving=function(){return this._moving||this.handlers.isMoving()},o.prototype.isZooming=function(){return this._zooming||this.handlers.isZooming()},o.prototype.isRotating=function(){return this._rotating||this.handlers.isRotating()},o.prototype._createDelegatedListener=function(s,p,f){var d,y=this;if(s==="mouseenter"||s==="mouseover"){var v=!1;return {layer:p,listener:f,delegates:{mousemove:function(P){var z=y.getLayer(p)?y.queryRenderedFeatures(P.point,{layers:[p]}):[];z.length?v||(v=!0,f.call(y,new Xe(s,y,P.originalEvent,{features:z}))):v=!1;},mouseout:function(){v=!1;}}}}if(s==="mouseleave"||s==="mouseout"){var S=!1;return {layer:p,listener:f,delegates:{mousemove:function(P){(y.getLayer(p)?y.queryRenderedFeatures(P.point,{layers:[p]}):[]).length?S=!0:S&&(S=!1,f.call(y,new Xe(s,y,P.originalEvent)));},mouseout:function(P){S&&(S=!1,f.call(y,new Xe(s,y,P.originalEvent)));}}}}return {layer:p,listener:f,delegates:(d={},d[s]=function(P){var z=y.getLayer(p)?y.queryRenderedFeatures(P.point,{layers:[p]}):[];z.length&&(P.features=z,f.call(y,P),delete P.features);},d)}},o.prototype.on=function(s,p,f){if(f===void 0)return i.prototype.on.call(this,s,p);var d=this._createDelegatedListener(s,p,f);for(var y in this._delegatedListeners=this._delegatedListeners||{},this._delegatedListeners[s]=this._delegatedListeners[s]||[],this._delegatedListeners[s].push(d),d.delegates)this.on(y,d.delegates[y]);return this},o.prototype.once=function(s,p,f){if(f===void 0)return i.prototype.once.call(this,s,p);var d=this._createDelegatedListener(s,p,f);for(var y in d.delegates)this.once(y,d.delegates[y]);return this},o.prototype.off=function(s,p,f){var d=this;return f===void 0?i.prototype.off.call(this,s,p):(this._delegatedListeners&&this._delegatedListeners[s]&&function(y){for(var v=y[s],S=0;S<v.length;S++){var P=v[S];if(P.layer===p&&P.listener===f){for(var z in P.delegates)d.off(z,P.delegates[z]);return v.splice(S,1),d}}}(this._delegatedListeners),this)},o.prototype.queryRenderedFeatures=function(s,p){if(!this.style)return [];var f;if(p!==void 0||s===void 0||s instanceof u.Point||Array.isArray(s)||(p=s,s=void 0),p=p||{},(s=s||[[0,0],[this.transform.width,this.transform.height]])instanceof u.Point||typeof s[0]=="number")f=[u.Point.convert(s)];else {var d=u.Point.convert(s[0]),y=u.Point.convert(s[1]);f=[d,new u.Point(y.x,d.y),y,new u.Point(d.x,y.y),d];}return this.style.queryRenderedFeatures(f,p,this.transform)},o.prototype.querySourceFeatures=function(s,p){return this.style.querySourceFeatures(s,p)},o.prototype.setStyle=function(s,p){return (p=u.extend({},{localIdeographFontFamily:this._localIdeographFontFamily},p)).diff!==!1&&p.localIdeographFontFamily===this._localIdeographFontFamily&&this.style&&s?(this._diffStyle(s,p),this):(this._localIdeographFontFamily=p.localIdeographFontFamily,this._updateStyle(s,p))},o.prototype._getUIString=function(s){var p=this._locale[s];if(p==null)throw new Error("Missing UI string '"+s+"'");return p},o.prototype._updateStyle=function(s,p){return this.style&&(this.style.setEventedParent(null),this.style._remove()),s?(this.style=new Rr(this,p||{}),this.style.setEventedParent(this,{style:this.style}),typeof s=="string"?this.style.loadURL(s):this.style.loadJSON(s),this):(delete this.style,this)},o.prototype._lazyInitEmptyStyle=function(){this.style||(this.style=new Rr(this,{}),this.style.setEventedParent(this,{style:this.style}),this.style.loadEmpty());},o.prototype._diffStyle=function(s,p){var f=this;if(typeof s=="string"){var d=this._requestManager.normalizeStyleURL(s),y=this._requestManager.transformRequest(d,u.ResourceType.Style);u.getJSON(y,function(v,S){v?f.fire(new u.ErrorEvent(v)):S&&f._updateDiff(S,p);});}else typeof s=="object"&&this._updateDiff(s,p);},o.prototype._updateDiff=function(s,p){try{this.style.setState(s)&&this._update(!0);}catch(f){u.warnOnce("Unable to perform style diff: "+(f.message||f.error||f)+".  Rebuilding the style from scratch."),this._updateStyle(s,p);}},o.prototype.getStyle=function(){if(this.style)return this.style.serialize()},o.prototype.isStyleLoaded=function(){return this.style?this.style.loaded():u.warnOnce("There is no style added to the map.")},o.prototype.addSource=function(s,p){return this._lazyInitEmptyStyle(),this.style.addSource(s,p),this._update(!0)},o.prototype.isSourceLoaded=function(s){var p=this.style&&this.style.sourceCaches[s];if(p!==void 0)return p.loaded();this.fire(new u.ErrorEvent(new Error("There is no source with ID '"+s+"'")));},o.prototype.areTilesLoaded=function(){var s=this.style&&this.style.sourceCaches;for(var p in s){var f=s[p]._tiles;for(var d in f){var y=f[d];if(y.state!=="loaded"&&y.state!=="errored")return !1}}return !0},o.prototype.addSourceType=function(s,p,f){return this._lazyInitEmptyStyle(),this.style.addSourceType(s,p,f)},o.prototype.removeSource=function(s){return this.style.removeSource(s),this._update(!0)},o.prototype.getSource=function(s){return this.style.getSource(s)},o.prototype.addImage=function(s,p,f){f===void 0&&(f={});var d=f.pixelRatio;d===void 0&&(d=1);var y=f.sdf;y===void 0&&(y=!1);var v=f.stretchX,S=f.stretchY,P=f.content;if(this._lazyInitEmptyStyle(),p instanceof Ns||he&&p instanceof he){var z=u.browser.getImageData(p);this.style.addImage(s,{data:new u.RGBAImage({width:z.width,height:z.height},z.data),pixelRatio:d,stretchX:v,stretchY:S,content:P,sdf:y,version:0});}else {if(p.width===void 0||p.height===void 0)return this.fire(new u.ErrorEvent(new Error("Invalid arguments to map.addImage(). The second argument must be an `HTMLImageElement`, `ImageData`, `ImageBitmap`, or object with `width`, `height`, and `data` properties with the same format as `ImageData`")));var k=p;this.style.addImage(s,{data:new u.RGBAImage({width:p.width,height:p.height},new Uint8Array(p.data)),pixelRatio:d,stretchX:v,stretchY:S,content:P,sdf:y,version:0,userImage:k}),k.onAdd&&k.onAdd(this,s);}},o.prototype.updateImage=function(s,p){var f=this.style.getImage(s);if(!f)return this.fire(new u.ErrorEvent(new Error("The map has no image with that id. If you are adding a new image use `map.addImage(...)` instead.")));var d=p instanceof Ns||he&&p instanceof he?u.browser.getImageData(p):p,y=d.width,v=d.height,S=d.data;return y===void 0||v===void 0?this.fire(new u.ErrorEvent(new Error("Invalid arguments to map.updateImage(). The second argument must be an `HTMLImageElement`, `ImageData`, `ImageBitmap`, or object with `width`, `height`, and `data` properties with the same format as `ImageData`"))):y!==f.data.width||v!==f.data.height?this.fire(new u.ErrorEvent(new Error("The width and height of the updated image must be that same as the previous version of the image"))):(f.data.replace(S,!(p instanceof Ns||he&&p instanceof he)),void this.style.updateImage(s,f))},o.prototype.hasImage=function(s){return s?!!this.style.getImage(s):(this.fire(new u.ErrorEvent(new Error("Missing required image id"))),!1)},o.prototype.removeImage=function(s){this.style.removeImage(s);},o.prototype.loadImage=function(s,p){u.getImage(this._requestManager.transformRequest(s,u.ResourceType.Image),p);},o.prototype.listImages=function(){return this.style.listImages()},o.prototype.addLayer=function(s,p){return this._lazyInitEmptyStyle(),this.style.addLayer(s,p),this._update(!0)},o.prototype.moveLayer=function(s,p){return this.style.moveLayer(s,p),this._update(!0)},o.prototype.removeLayer=function(s){return this.style.removeLayer(s),this._update(!0)},o.prototype.getLayer=function(s){return this.style.getLayer(s)},o.prototype.setLayerZoomRange=function(s,p,f){return this.style.setLayerZoomRange(s,p,f),this._update(!0)},o.prototype.setFilter=function(s,p,f){return f===void 0&&(f={}),this.style.setFilter(s,p,f),this._update(!0)},o.prototype.getFilter=function(s){return this.style.getFilter(s)},o.prototype.setPaintProperty=function(s,p,f,d){return d===void 0&&(d={}),this.style.setPaintProperty(s,p,f,d),this._update(!0)},o.prototype.getPaintProperty=function(s,p){return this.style.getPaintProperty(s,p)},o.prototype.setLayoutProperty=function(s,p,f,d){return d===void 0&&(d={}),this.style.setLayoutProperty(s,p,f,d),this._update(!0)},o.prototype.getLayoutProperty=function(s,p){return this.style.getLayoutProperty(s,p)},o.prototype.setLight=function(s,p){return p===void 0&&(p={}),this._lazyInitEmptyStyle(),this.style.setLight(s,p),this._update(!0)},o.prototype.getLight=function(){return this.style.getLight()},o.prototype.setFeatureState=function(s,p){return this.style.setFeatureState(s,p),this._update()},o.prototype.removeFeatureState=function(s,p){return this.style.removeFeatureState(s,p),this._update()},o.prototype.getFeatureState=function(s){return this.style.getFeatureState(s)},o.prototype.getContainer=function(){return this._container},o.prototype.getCanvasContainer=function(){return this._canvasContainer},o.prototype.getCanvas=function(){return this._canvas},o.prototype._containerDimensions=function(){var s=0,p=0;return this._container&&(s=this._container.clientWidth||400,p=this._container.clientHeight||300),[s,p]},o.prototype._detectMissingCSS=function(){u.window.getComputedStyle(this._missingCSSCanary).getPropertyValue("background-color")!=="rgb(250, 128, 114)"&&u.warnOnce("This page appears to be missing CSS declarations for Mapbox GL JS, which may cause the map to display incorrectly. Please ensure your page includes mapbox-gl.css, as described in https://www.mapbox.com/mapbox-gl-js/api/.");},o.prototype._setupContainer=function(){var s=this._container;s.classList.add("mapboxgl-map"),(this._missingCSSCanary=ct.create("div","mapboxgl-canary",s)).style.visibility="hidden",this._detectMissingCSS();var p=this._canvasContainer=ct.create("div","mapboxgl-canvas-container",s);this._interactive&&p.classList.add("mapboxgl-interactive"),this._canvas=ct.create("canvas","mapboxgl-canvas",p),this._canvas.addEventListener("webglcontextlost",this._contextLost,!1),this._canvas.addEventListener("webglcontextrestored",this._contextRestored,!1),this._canvas.setAttribute("tabindex","0"),this._canvas.setAttribute("aria-label","Map"),this._canvas.setAttribute("role","region");var f=this._containerDimensions();this._resizeCanvas(f[0],f[1]);var d=this._controlContainer=ct.create("div","mapboxgl-control-container",s),y=this._controlPositions={};["top-left","top-right","bottom-left","bottom-right"].forEach(function(v){y[v]=ct.create("div","mapboxgl-ctrl-"+v,d);}),this._container.addEventListener("scroll",this._onMapScroll,!1);},o.prototype._resizeCanvas=function(s,p){var f=u.browser.devicePixelRatio||1;this._canvas.width=f*s,this._canvas.height=f*p,this._canvas.style.width=s+"px",this._canvas.style.height=p+"px";},o.prototype._setupPainter=function(){var s=u.extend({},Zr.webGLContextAttributes,{failIfMajorPerformanceCaveat:this._failIfMajorPerformanceCaveat,preserveDrawingBuffer:this._preserveDrawingBuffer,antialias:this._antialias||!1}),p=this._canvas.getContext("webgl",s)||this._canvas.getContext("experimental-webgl",s);p?(this.painter=new Ie(p,this.transform),u.webpSupported.testSupport(p)):this.fire(new u.ErrorEvent(new Error("Failed to initialize WebGL")));},o.prototype._contextLost=function(s){s.preventDefault(),this._frame&&(this._frame.cancel(),this._frame=null),this.fire(new u.Event("webglcontextlost",{originalEvent:s}));},o.prototype._contextRestored=function(s){this._setupPainter(),this.resize(),this._update(),this.fire(new u.Event("webglcontextrestored",{originalEvent:s}));},o.prototype._onMapScroll=function(s){if(s.target===this._container)return this._container.scrollTop=0,this._container.scrollLeft=0,!1},o.prototype.loaded=function(){return !this._styleDirty&&!this._sourcesDirty&&!!this.style&&this.style.loaded()},o.prototype._update=function(s){return this.style?(this._styleDirty=this._styleDirty||s,this._sourcesDirty=!0,this.triggerRepaint(),this):this},o.prototype._requestRenderFrame=function(s){return this._update(),this._renderTaskQueue.add(s)},o.prototype._cancelRenderFrame=function(s){this._renderTaskQueue.remove(s);},o.prototype._render=function(s){var p,f=this,d=0,y=this.painter.context.extTimerQuery;if(this.listens("gpu-timing-frame")&&(p=y.createQueryEXT(),y.beginQueryEXT(y.TIME_ELAPSED_EXT,p),d=u.browser.now()),this.painter.context.setDirty(),this.painter.setBaseState(),this._renderTaskQueue.run(s),!this._removed){var v=!1;if(this.style&&this._styleDirty){this._styleDirty=!1;var S=this.transform.zoom,P=u.browser.now();this.style.zoomHistory.update(S,P);var z=new u.EvaluationParameters(S,{now:P,fadeDuration:this._fadeDuration,zoomHistory:this.style.zoomHistory,transition:this.style.getTransition()}),k=z.crossFadingFactor();k===1&&k===this._crossFadingFactor||(v=!0,this._crossFadingFactor=k),this.style.update(z);}if(this.style&&this._sourcesDirty&&(this._sourcesDirty=!1,this.style._updateSources(this.transform)),this._placementDirty=this.style&&this.style._updatePlacement(this.painter.transform,this.showCollisionBoxes,this._fadeDuration,this._crossSourceCollisions),this.painter.render(this.style,{showTileBoundaries:this.showTileBoundaries,showOverdrawInspector:this._showOverdrawInspector,rotating:this.isRotating(),zooming:this.isZooming(),moving:this.isMoving(),fadeDuration:this._fadeDuration,showPadding:this.showPadding,gpuTiming:!!this.listens("gpu-timing-layer")}),this.fire(new u.Event("render")),this.loaded()&&!this._loaded&&(this._loaded=!0,this.fire(new u.Event("load"))),this.style&&(this.style.hasTransitions()||v)&&(this._styleDirty=!0),this.style&&!this._placementDirty&&this.style._releaseSymbolFadeTiles(),this.listens("gpu-timing-frame")){var F=u.browser.now()-d;y.endQueryEXT(y.TIME_ELAPSED_EXT,p),setTimeout(function(){var D=y.getQueryObjectEXT(p,y.QUERY_RESULT_EXT)/1e6;y.deleteQueryEXT(p),f.fire(new u.Event("gpu-timing-frame",{cpuTime:F,gpuTime:D}));},50);}if(this.listens("gpu-timing-layer")){var R=this.painter.collectGpuTimers();setTimeout(function(){var D=f.painter.queryGpuTimers(R);f.fire(new u.Event("gpu-timing-layer",{layerTimes:D}));},50);}var j=this._sourcesDirty||this._styleDirty||this._placementDirty;return j||this._repaint?this.triggerRepaint():!this.isMoving()&&this.loaded()&&this.fire(new u.Event("idle")),!this._loaded||this._fullyLoaded||j||(this._fullyLoaded=!0),this}},o.prototype.remove=function(){this._hash&&this._hash.remove();for(var s=0,p=this._controls;s<p.length;s+=1)p[s].onRemove(this);this._controls=[],this._frame&&(this._frame.cancel(),this._frame=null),this._renderTaskQueue.clear(),this.painter.destroy(),this.handlers.destroy(),delete this.handlers,this.setStyle(null),u.window!==void 0&&(u.window.removeEventListener("resize",this._onWindowResize,!1),u.window.removeEventListener("orientationchange",this._onWindowResize,!1),u.window.removeEventListener("online",this._onWindowOnline,!1));var f=this.painter.context.gl.getExtension("WEBGL_lose_context");f&&f.loseContext(),Zn(this._canvasContainer),Zn(this._controlContainer),Zn(this._missingCSSCanary),this._container.classList.remove("mapboxgl-map"),this._removed=!0,this.fire(new u.Event("remove"));},o.prototype.triggerRepaint=function(){var s=this;this.style&&!this._frame&&(this._frame=u.browser.frame(function(p){s._frame=null,s._render(p);}));},o.prototype._onWindowOnline=function(){this._update();},o.prototype._onWindowResize=function(s){this._trackResize&&this.resize({originalEvent:s})._update();},n.showTileBoundaries.get=function(){return !!this._showTileBoundaries},n.showTileBoundaries.set=function(s){this._showTileBoundaries!==s&&(this._showTileBoundaries=s,this._update());},n.showPadding.get=function(){return !!this._showPadding},n.showPadding.set=function(s){this._showPadding!==s&&(this._showPadding=s,this._update());},n.showCollisionBoxes.get=function(){return !!this._showCollisionBoxes},n.showCollisionBoxes.set=function(s){this._showCollisionBoxes!==s&&(this._showCollisionBoxes=s,s?this.style._generateCollisionBoxes():this._update());},n.showOverdrawInspector.get=function(){return !!this._showOverdrawInspector},n.showOverdrawInspector.set=function(s){this._showOverdrawInspector!==s&&(this._showOverdrawInspector=s,this._update());},n.repaint.get=function(){return !!this._repaint},n.repaint.set=function(s){this._repaint!==s&&(this._repaint=s,this.triggerRepaint());},n.vertices.get=function(){return !!this._vertices},n.vertices.set=function(s){this._vertices=s,this._update();},o.prototype._setCacheLimits=function(s,p){u.setCacheLimits(s,p);},n.version.get=function(){return u.version},Object.defineProperties(o.prototype,n),o}(Va);function Zn(i){i.parentNode&&i.parentNode.removeChild(i);}var js={showCompass:!0,showZoom:!0,visualizePitch:!1},qi=function(i){var o=this;this.options=u.extend({},js,i),this._container=ct.create("div","mapboxgl-ctrl mapboxgl-ctrl-group"),this._container.addEventListener("contextmenu",function(n){return n.preventDefault()}),this.options.showZoom&&(u.bindAll(["_setButtonTitle","_updateZoomButtons"],this),this._zoomInButton=this._createButton("mapboxgl-ctrl-zoom-in",function(n){return o._map.zoomIn({},{originalEvent:n})}),ct.create("span","mapboxgl-ctrl-icon",this._zoomInButton).setAttribute("aria-hidden",!0),this._zoomOutButton=this._createButton("mapboxgl-ctrl-zoom-out",function(n){return o._map.zoomOut({},{originalEvent:n})}),ct.create("span","mapboxgl-ctrl-icon",this._zoomOutButton).setAttribute("aria-hidden",!0)),this.options.showCompass&&(u.bindAll(["_rotateCompassArrow"],this),this._compass=this._createButton("mapboxgl-ctrl-compass",function(n){o.options.visualizePitch?o._map.resetNorthPitch({},{originalEvent:n}):o._map.resetNorth({},{originalEvent:n});}),this._compassIcon=ct.create("span","mapboxgl-ctrl-icon",this._compass),this._compassIcon.setAttribute("aria-hidden",!0));};qi.prototype._updateZoomButtons=function(){var i=this._map.getZoom(),o=i===this._map.getMaxZoom(),n=i===this._map.getMinZoom();this._zoomInButton.disabled=o,this._zoomOutButton.disabled=n,this._zoomInButton.setAttribute("aria-disabled",o.toString()),this._zoomOutButton.setAttribute("aria-disabled",n.toString());},qi.prototype._rotateCompassArrow=function(){var i=this.options.visualizePitch?"scale("+1/Math.pow(Math.cos(this._map.transform.pitch*(Math.PI/180)),.5)+") rotateX("+this._map.transform.pitch+"deg) rotateZ("+this._map.transform.angle*(180/Math.PI)+"deg)":"rotate("+this._map.transform.angle*(180/Math.PI)+"deg)";this._compassIcon.style.transform=i;},qi.prototype.onAdd=function(i){return this._map=i,this.options.showZoom&&(this._setButtonTitle(this._zoomInButton,"ZoomIn"),this._setButtonTitle(this._zoomOutButton,"ZoomOut"),this._map.on("zoom",this._updateZoomButtons),this._updateZoomButtons()),this.options.showCompass&&(this._setButtonTitle(this._compass,"ResetBearing"),this.options.visualizePitch&&this._map.on("pitch",this._rotateCompassArrow),this._map.on("rotate",this._rotateCompassArrow),this._rotateCompassArrow(),this._handler=new Nr(this._map,this._compass,this.options.visualizePitch)),this._container},qi.prototype.onRemove=function(){ct.remove(this._container),this.options.showZoom&&this._map.off("zoom",this._updateZoomButtons),this.options.showCompass&&(this.options.visualizePitch&&this._map.off("pitch",this._rotateCompassArrow),this._map.off("rotate",this._rotateCompassArrow),this._handler.off(),delete this._handler),delete this._map;},qi.prototype._createButton=function(i,o){var n=ct.create("button",i,this._container);return n.type="button",n.addEventListener("click",o),n},qi.prototype._setButtonTitle=function(i,o){var n=this._map._getUIString("NavigationControl."+o);i.title=n,i.setAttribute("aria-label",n);};var Nr=function(i,o,n){n===void 0&&(n=!1),this._clickTolerance=10,this.element=o,this.mouseRotate=new Fa({clickTolerance:i.dragRotate._mouseRotate._clickTolerance}),this.map=i,n&&(this.mousePitch=new Os({clickTolerance:i.dragRotate._mousePitch._clickTolerance})),u.bindAll(["mousedown","mousemove","mouseup","touchstart","touchmove","touchend","reset"],this),ct.addEventListener(o,"mousedown",this.mousedown),ct.addEventListener(o,"touchstart",this.touchstart,{passive:!1}),ct.addEventListener(o,"touchmove",this.touchmove),ct.addEventListener(o,"touchend",this.touchend),ct.addEventListener(o,"touchcancel",this.reset);};function xo(i,o,n){if(i=new u.LngLat(i.lng,i.lat),o){var s=new u.LngLat(i.lng-360,i.lat),p=new u.LngLat(i.lng+360,i.lat),f=n.locationPoint(i).distSqr(o);n.locationPoint(s).distSqr(o)<f?i=s:n.locationPoint(p).distSqr(o)<f&&(i=p);}for(;Math.abs(i.lng-n.center.lng)>180;){var d=n.locationPoint(i);if(d.x>=0&&d.y>=0&&d.x<=n.width&&d.y<=n.height)break;i.lng>n.center.lng?i.lng-=360:i.lng+=360;}return i}Nr.prototype.down=function(i,o){this.mouseRotate.mousedown(i,o),this.mousePitch&&this.mousePitch.mousedown(i,o),ct.disableDrag();},Nr.prototype.move=function(i,o){var n=this.map,s=this.mouseRotate.mousemoveWindow(i,o);if(s&&s.bearingDelta&&n.setBearing(n.getBearing()+s.bearingDelta),this.mousePitch){var p=this.mousePitch.mousemoveWindow(i,o);p&&p.pitchDelta&&n.setPitch(n.getPitch()+p.pitchDelta);}},Nr.prototype.off=function(){var i=this.element;ct.removeEventListener(i,"mousedown",this.mousedown),ct.removeEventListener(i,"touchstart",this.touchstart,{passive:!1}),ct.removeEventListener(i,"touchmove",this.touchmove),ct.removeEventListener(i,"touchend",this.touchend),ct.removeEventListener(i,"touchcancel",this.reset),this.offTemp();},Nr.prototype.offTemp=function(){ct.enableDrag(),ct.removeEventListener(u.window,"mousemove",this.mousemove),ct.removeEventListener(u.window,"mouseup",this.mouseup);},Nr.prototype.mousedown=function(i){this.down(u.extend({},i,{ctrlKey:!0,preventDefault:function(){return i.preventDefault()}}),ct.mousePos(this.element,i)),ct.addEventListener(u.window,"mousemove",this.mousemove),ct.addEventListener(u.window,"mouseup",this.mouseup);},Nr.prototype.mousemove=function(i){this.move(i,ct.mousePos(this.element,i));},Nr.prototype.mouseup=function(i){this.mouseRotate.mouseupWindow(i),this.mousePitch&&this.mousePitch.mouseupWindow(i),this.offTemp();},Nr.prototype.touchstart=function(i){i.targetTouches.length!==1?this.reset():(this._startPos=this._lastPos=ct.touchPos(this.element,i.targetTouches)[0],this.down({type:"mousedown",button:0,ctrlKey:!0,preventDefault:function(){return i.preventDefault()}},this._startPos));},Nr.prototype.touchmove=function(i){i.targetTouches.length!==1?this.reset():(this._lastPos=ct.touchPos(this.element,i.targetTouches)[0],this.move({preventDefault:function(){return i.preventDefault()}},this._lastPos));},Nr.prototype.touchend=function(i){i.targetTouches.length===0&&this._startPos&&this._lastPos&&this._startPos.dist(this._lastPos)<this._clickTolerance&&this.element.click(),this.reset();},Nr.prototype.reset=function(){this.mouseRotate.reset(),this.mousePitch&&this.mousePitch.reset(),delete this._startPos,delete this._lastPos,this.offTemp();};var Ci={center:"translate(-50%,-50%)",top:"translate(-50%,0)","top-left":"translate(0,0)","top-right":"translate(-100%,0)",bottom:"translate(-50%,-100%)","bottom-left":"translate(0,-100%)","bottom-right":"translate(-100%,-100%)",left:"translate(0,-50%)",right:"translate(-100%,-50%)"};function ja(i,o,n){var s=i.classList;for(var p in Ci)s.remove("mapboxgl-"+n+"-anchor-"+p);s.add("mapboxgl-"+n+"-anchor-"+o);}var bo,na=function(i){function o(n,s){if(i.call(this),(n instanceof u.window.HTMLElement||s)&&(n=u.extend({element:n},s)),u.bindAll(["_update","_onMove","_onUp","_addDragHandler","_onMapClick","_onKeyPress"],this),this._anchor=n&&n.anchor||"center",this._color=n&&n.color||"#3FB1CE",this._scale=n&&n.scale||1,this._draggable=n&&n.draggable||!1,this._clickTolerance=n&&n.clickTolerance||0,this._isDragging=!1,this._state="inactive",this._rotation=n&&n.rotation||0,this._rotationAlignment=n&&n.rotationAlignment||"auto",this._pitchAlignment=n&&n.pitchAlignment&&n.pitchAlignment!=="auto"?n.pitchAlignment:this._rotationAlignment,n&&n.element)this._element=n.element,this._offset=u.Point.convert(n&&n.offset||[0,0]);else {this._defaultMarker=!0,this._element=ct.create("div"),this._element.setAttribute("aria-label","Map marker");var p=ct.createNS("http://www.w3.org/2000/svg","svg");p.setAttributeNS(null,"display","block"),p.setAttributeNS(null,"height","41px"),p.setAttributeNS(null,"width","27px"),p.setAttributeNS(null,"viewBox","0 0 27 41");var f=ct.createNS("http://www.w3.org/2000/svg","g");f.setAttributeNS(null,"stroke","none"),f.setAttributeNS(null,"stroke-width","1"),f.setAttributeNS(null,"fill","none"),f.setAttributeNS(null,"fill-rule","evenodd");var d=ct.createNS("http://www.w3.org/2000/svg","g");d.setAttributeNS(null,"fill-rule","nonzero");var y=ct.createNS("http://www.w3.org/2000/svg","g");y.setAttributeNS(null,"transform","translate(3.0, 29.0)"),y.setAttributeNS(null,"fill","#000000");for(var v=0,S=[{rx:"10.5",ry:"5.25002273"},{rx:"10.5",ry:"5.25002273"},{rx:"9.5",ry:"4.77275007"},{rx:"8.5",ry:"4.29549936"},{rx:"7.5",ry:"3.81822308"},{rx:"6.5",ry:"3.34094679"},{rx:"5.5",ry:"2.86367051"},{rx:"4.5",ry:"2.38636864"}];v<S.length;v+=1){var P=S[v],z=ct.createNS("http://www.w3.org/2000/svg","ellipse");z.setAttributeNS(null,"opacity","0.04"),z.setAttributeNS(null,"cx","10.5"),z.setAttributeNS(null,"cy","5.80029008"),z.setAttributeNS(null,"rx",P.rx),z.setAttributeNS(null,"ry",P.ry),y.appendChild(z);}var k=ct.createNS("http://www.w3.org/2000/svg","g");k.setAttributeNS(null,"fill",this._color);var F=ct.createNS("http://www.w3.org/2000/svg","path");F.setAttributeNS(null,"d","M27,13.5 C27,19.074644 20.250001,27.000002 14.75,34.500002 C14.016665,35.500004 12.983335,35.500004 12.25,34.500002 C6.7499993,27.000002 0,19.222562 0,13.5 C0,6.0441559 6.0441559,0 13.5,0 C20.955844,0 27,6.0441559 27,13.5 Z"),k.appendChild(F);var R=ct.createNS("http://www.w3.org/2000/svg","g");R.setAttributeNS(null,"opacity","0.25"),R.setAttributeNS(null,"fill","#000000");var j=ct.createNS("http://www.w3.org/2000/svg","path");j.setAttributeNS(null,"d","M13.5,0 C6.0441559,0 0,6.0441559 0,13.5 C0,19.222562 6.7499993,27 12.25,34.5 C13,35.522727 14.016664,35.500004 14.75,34.5 C20.250001,27 27,19.074644 27,13.5 C27,6.0441559 20.955844,0 13.5,0 Z M13.5,1 C20.415404,1 26,6.584596 26,13.5 C26,15.898657 24.495584,19.181431 22.220703,22.738281 C19.945823,26.295132 16.705119,30.142167 13.943359,33.908203 C13.743445,34.180814 13.612715,34.322738 13.5,34.441406 C13.387285,34.322738 13.256555,34.180814 13.056641,33.908203 C10.284481,30.127985 7.4148684,26.314159 5.015625,22.773438 C2.6163816,19.232715 1,15.953538 1,13.5 C1,6.584596 6.584596,1 13.5,1 Z"),R.appendChild(j);var D=ct.createNS("http://www.w3.org/2000/svg","g");D.setAttributeNS(null,"transform","translate(6.0, 7.0)"),D.setAttributeNS(null,"fill","#FFFFFF");var N=ct.createNS("http://www.w3.org/2000/svg","g");N.setAttributeNS(null,"transform","translate(8.0, 8.0)");var G=ct.createNS("http://www.w3.org/2000/svg","circle");G.setAttributeNS(null,"fill","#000000"),G.setAttributeNS(null,"opacity","0.25"),G.setAttributeNS(null,"cx","5.5"),G.setAttributeNS(null,"cy","5.5"),G.setAttributeNS(null,"r","5.4999962");var K=ct.createNS("http://www.w3.org/2000/svg","circle");K.setAttributeNS(null,"fill","#FFFFFF"),K.setAttributeNS(null,"cx","5.5"),K.setAttributeNS(null,"cy","5.5"),K.setAttributeNS(null,"r","5.4999962"),N.appendChild(G),N.appendChild(K),d.appendChild(y),d.appendChild(k),d.appendChild(R),d.appendChild(D),d.appendChild(N),p.appendChild(d),p.setAttributeNS(null,"height",41*this._scale+"px"),p.setAttributeNS(null,"width",27*this._scale+"px"),this._element.appendChild(p),this._offset=u.Point.convert(n&&n.offset||[0,-14]);}this._element.classList.add("mapboxgl-marker"),this._element.addEventListener("dragstart",function(tt){tt.preventDefault();}),this._element.addEventListener("mousedown",function(tt){tt.preventDefault();}),ja(this._element,this._anchor,"marker"),this._popup=null;}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.addTo=function(n){return this.remove(),this._map=n,n.getCanvasContainer().appendChild(this._element),n.on("move",this._update),n.on("moveend",this._update),this.setDraggable(this._draggable),this._update(),this._map.on("click",this._onMapClick),this},o.prototype.remove=function(){return this._map&&(this._map.off("click",this._onMapClick),this._map.off("move",this._update),this._map.off("moveend",this._update),this._map.off("mousedown",this._addDragHandler),this._map.off("touchstart",this._addDragHandler),this._map.off("mouseup",this._onUp),this._map.off("touchend",this._onUp),this._map.off("mousemove",this._onMove),this._map.off("touchmove",this._onMove),delete this._map),ct.remove(this._element),this._popup&&this._popup.remove(),this},o.prototype.getLngLat=function(){return this._lngLat},o.prototype.setLngLat=function(n){return this._lngLat=u.LngLat.convert(n),this._pos=null,this._popup&&this._popup.setLngLat(this._lngLat),this._update(),this},o.prototype.getElement=function(){return this._element},o.prototype.setPopup=function(n){if(this._popup&&(this._popup.remove(),this._popup=null,this._element.removeEventListener("keypress",this._onKeyPress),this._originalTabIndex||this._element.removeAttribute("tabindex")),n){if(!("offset"in n.options)){var s=Math.sqrt(Math.pow(13.5,2)/2);n.options.offset=this._defaultMarker?{top:[0,0],"top-left":[0,0],"top-right":[0,0],bottom:[0,-38.1],"bottom-left":[s,-1*(24.6+s)],"bottom-right":[-s,-1*(24.6+s)],left:[13.5,-24.6],right:[-13.5,-24.6]}:this._offset;}this._popup=n,this._lngLat&&this._popup.setLngLat(this._lngLat),this._originalTabIndex=this._element.getAttribute("tabindex"),this._originalTabIndex||this._element.setAttribute("tabindex","0"),this._element.addEventListener("keypress",this._onKeyPress);}return this},o.prototype._onKeyPress=function(n){var s=n.code,p=n.charCode||n.keyCode;s!=="Space"&&s!=="Enter"&&p!==32&&p!==13||this.togglePopup();},o.prototype._onMapClick=function(n){var s=n.originalEvent.target,p=this._element;this._popup&&(s===p||p.contains(s))&&this.togglePopup();},o.prototype.getPopup=function(){return this._popup},o.prototype.togglePopup=function(){var n=this._popup;return n?(n.isOpen()?n.remove():n.addTo(this._map),this):this},o.prototype._update=function(n){if(this._map){this._map.transform.renderWorldCopies&&(this._lngLat=xo(this._lngLat,this._pos,this._map.transform)),this._pos=this._map.project(this._lngLat)._add(this._offset);var s="";this._rotationAlignment==="viewport"||this._rotationAlignment==="auto"?s="rotateZ("+this._rotation+"deg)":this._rotationAlignment==="map"&&(s="rotateZ("+(this._rotation-this._map.getBearing())+"deg)");var p="";this._pitchAlignment==="viewport"||this._pitchAlignment==="auto"?p="rotateX(0deg)":this._pitchAlignment==="map"&&(p="rotateX("+this._map.getPitch()+"deg)"),n&&n.type!=="moveend"||(this._pos=this._pos.round()),ct.setTransform(this._element,Ci[this._anchor]+" translate("+this._pos.x+"px, "+this._pos.y+"px) "+p+" "+s);}},o.prototype.getOffset=function(){return this._offset},o.prototype.setOffset=function(n){return this._offset=u.Point.convert(n),this._update(),this},o.prototype._onMove=function(n){if(!this._isDragging){var s=this._clickTolerance||this._map._clickTolerance;this._isDragging=n.point.dist(this._pointerdownPos)>=s;}this._isDragging&&(this._pos=n.point.sub(this._positionDelta),this._lngLat=this._map.unproject(this._pos),this.setLngLat(this._lngLat),this._element.style.pointerEvents="none",this._state==="pending"&&(this._state="active",this.fire(new u.Event("dragstart"))),this.fire(new u.Event("drag")));},o.prototype._onUp=function(){this._element.style.pointerEvents="auto",this._positionDelta=null,this._pointerdownPos=null,this._isDragging=!1,this._map.off("mousemove",this._onMove),this._map.off("touchmove",this._onMove),this._state==="active"&&this.fire(new u.Event("dragend")),this._state="inactive";},o.prototype._addDragHandler=function(n){this._element.contains(n.originalEvent.target)&&(n.preventDefault(),this._positionDelta=n.point.sub(this._pos).add(this._offset),this._pointerdownPos=n.point,this._state="pending",this._map.on("mousemove",this._onMove),this._map.on("touchmove",this._onMove),this._map.once("mouseup",this._onUp),this._map.once("touchend",this._onUp));},o.prototype.setDraggable=function(n){return this._draggable=!!n,this._map&&(n?(this._map.on("mousedown",this._addDragHandler),this._map.on("touchstart",this._addDragHandler)):(this._map.off("mousedown",this._addDragHandler),this._map.off("touchstart",this._addDragHandler))),this},o.prototype.isDraggable=function(){return this._draggable},o.prototype.setRotation=function(n){return this._rotation=n||0,this._update(),this},o.prototype.getRotation=function(){return this._rotation},o.prototype.setRotationAlignment=function(n){return this._rotationAlignment=n||"auto",this._update(),this},o.prototype.getRotationAlignment=function(){return this._rotationAlignment},o.prototype.setPitchAlignment=function(n){return this._pitchAlignment=n&&n!=="auto"?n:this._rotationAlignment,this._update(),this},o.prototype.getPitchAlignment=function(){return this._pitchAlignment},o}(u.Evented),qs={positionOptions:{enableHighAccuracy:!1,maximumAge:0,timeout:6e3},fitBoundsOptions:{maxZoom:15},trackUserLocation:!1,showAccuracyCircle:!0,showUserLocation:!0},wo=0,Gn=!1,Zs=function(i){function o(n){i.call(this),this.options=u.extend({},qs,n),u.bindAll(["_onSuccess","_onError","_onZoom","_finish","_setupUI","_updateCamera","_updateMarker"],this);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.onAdd=function(n){var s;return this._map=n,this._container=ct.create("div","mapboxgl-ctrl mapboxgl-ctrl-group"),s=this._setupUI,bo!==void 0?s(bo):u.window.navigator.permissions!==void 0?u.window.navigator.permissions.query({name:"geolocation"}).then(function(p){s(bo=p.state!=="denied");}):s(bo=!!u.window.navigator.geolocation),this._container},o.prototype.onRemove=function(){this._geolocationWatchID!==void 0&&(u.window.navigator.geolocation.clearWatch(this._geolocationWatchID),this._geolocationWatchID=void 0),this.options.showUserLocation&&this._userLocationDotMarker&&this._userLocationDotMarker.remove(),this.options.showAccuracyCircle&&this._accuracyCircleMarker&&this._accuracyCircleMarker.remove(),ct.remove(this._container),this._map.off("zoom",this._onZoom),this._map=void 0,wo=0,Gn=!1;},o.prototype._isOutOfMapMaxBounds=function(n){var s=this._map.getMaxBounds(),p=n.coords;return s&&(p.longitude<s.getWest()||p.longitude>s.getEast()||p.latitude<s.getSouth()||p.latitude>s.getNorth())},o.prototype._setErrorState=function(){switch(this._watchState){case"WAITING_ACTIVE":this._watchState="ACTIVE_ERROR",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active-error");break;case"ACTIVE_LOCK":this._watchState="ACTIVE_ERROR",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active-error"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting");break;case"BACKGROUND":this._watchState="BACKGROUND_ERROR",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background-error"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting");}},o.prototype._onSuccess=function(n){if(this._map){if(this._isOutOfMapMaxBounds(n))return this._setErrorState(),this.fire(new u.Event("outofmaxbounds",n)),this._updateMarker(),void this._finish();if(this.options.trackUserLocation)switch(this._lastKnownPosition=n,this._watchState){case"WAITING_ACTIVE":case"ACTIVE_LOCK":case"ACTIVE_ERROR":this._watchState="ACTIVE_LOCK",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active-error"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active");break;case"BACKGROUND":case"BACKGROUND_ERROR":this._watchState="BACKGROUND",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background-error"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background");}this.options.showUserLocation&&this._watchState!=="OFF"&&this._updateMarker(n),this.options.trackUserLocation&&this._watchState!=="ACTIVE_LOCK"||this._updateCamera(n),this.options.showUserLocation&&this._dotElement.classList.remove("mapboxgl-user-location-dot-stale"),this.fire(new u.Event("geolocate",n)),this._finish();}},o.prototype._updateCamera=function(n){var s=new u.LngLat(n.coords.longitude,n.coords.latitude),p=n.coords.accuracy,f=this._map.getBearing(),d=u.extend({bearing:f},this.options.fitBoundsOptions);this._map.fitBounds(s.toBounds(p),d,{geolocateSource:!0});},o.prototype._updateMarker=function(n){if(n){var s=new u.LngLat(n.coords.longitude,n.coords.latitude);this._accuracyCircleMarker.setLngLat(s).addTo(this._map),this._userLocationDotMarker.setLngLat(s).addTo(this._map),this._accuracy=n.coords.accuracy,this.options.showUserLocation&&this.options.showAccuracyCircle&&this._updateCircleRadius();}else this._userLocationDotMarker.remove(),this._accuracyCircleMarker.remove();},o.prototype._updateCircleRadius=function(){var n=this._map._container.clientHeight/2,s=this._map.unproject([0,n]),p=this._map.unproject([1,n]),f=s.distanceTo(p),d=Math.ceil(2*this._accuracy/f);this._circleElement.style.width=d+"px",this._circleElement.style.height=d+"px";},o.prototype._onZoom=function(){this.options.showUserLocation&&this.options.showAccuracyCircle&&this._updateCircleRadius();},o.prototype._onError=function(n){if(this._map){if(this.options.trackUserLocation)if(n.code===1){this._watchState="OFF",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active-error"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background-error"),this._geolocateButton.disabled=!0;var s=this._map._getUIString("GeolocateControl.LocationNotAvailable");this._geolocateButton.title=s,this._geolocateButton.setAttribute("aria-label",s),this._geolocationWatchID!==void 0&&this._clearWatch();}else {if(n.code===3&&Gn)return;this._setErrorState();}this._watchState!=="OFF"&&this.options.showUserLocation&&this._dotElement.classList.add("mapboxgl-user-location-dot-stale"),this.fire(new u.Event("error",n)),this._finish();}},o.prototype._finish=function(){this._timeoutId&&clearTimeout(this._timeoutId),this._timeoutId=void 0;},o.prototype._setupUI=function(n){var s=this;if(this._container.addEventListener("contextmenu",function(d){return d.preventDefault()}),this._geolocateButton=ct.create("button","mapboxgl-ctrl-geolocate",this._container),ct.create("span","mapboxgl-ctrl-icon",this._geolocateButton).setAttribute("aria-hidden",!0),this._geolocateButton.type="button",n===!1){u.warnOnce("Geolocation support is not available so the GeolocateControl will be disabled.");var p=this._map._getUIString("GeolocateControl.LocationNotAvailable");this._geolocateButton.disabled=!0,this._geolocateButton.title=p,this._geolocateButton.setAttribute("aria-label",p);}else {var f=this._map._getUIString("GeolocateControl.FindMyLocation");this._geolocateButton.title=f,this._geolocateButton.setAttribute("aria-label",f);}this.options.trackUserLocation&&(this._geolocateButton.setAttribute("aria-pressed","false"),this._watchState="OFF"),this.options.showUserLocation&&(this._dotElement=ct.create("div","mapboxgl-user-location-dot"),this._userLocationDotMarker=new na(this._dotElement),this._circleElement=ct.create("div","mapboxgl-user-location-accuracy-circle"),this._accuracyCircleMarker=new na({element:this._circleElement,pitchAlignment:"map"}),this.options.trackUserLocation&&(this._watchState="OFF"),this._map.on("zoom",this._onZoom)),this._geolocateButton.addEventListener("click",this.trigger.bind(this)),this._setup=!0,this.options.trackUserLocation&&this._map.on("movestart",function(d){d.geolocateSource||s._watchState!=="ACTIVE_LOCK"||d.originalEvent&&d.originalEvent.type==="resize"||(s._watchState="BACKGROUND",s._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background"),s._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),s.fire(new u.Event("trackuserlocationend")));});},o.prototype.trigger=function(){if(!this._setup)return u.warnOnce("Geolocate control triggered before added to a map"),!1;if(this.options.trackUserLocation){switch(this._watchState){case"OFF":this._watchState="WAITING_ACTIVE",this.fire(new u.Event("trackuserlocationstart"));break;case"WAITING_ACTIVE":case"ACTIVE_LOCK":case"ACTIVE_ERROR":case"BACKGROUND_ERROR":wo--,Gn=!1,this._watchState="OFF",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active-error"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background-error"),this.fire(new u.Event("trackuserlocationend"));break;case"BACKGROUND":this._watchState="ACTIVE_LOCK",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background"),this._lastKnownPosition&&this._updateCamera(this._lastKnownPosition),this.fire(new u.Event("trackuserlocationstart"));}switch(this._watchState){case"WAITING_ACTIVE":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active");break;case"ACTIVE_LOCK":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active");break;case"ACTIVE_ERROR":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active-error");break;case"BACKGROUND":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background");break;case"BACKGROUND_ERROR":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background-error");}if(this._watchState==="OFF"&&this._geolocationWatchID!==void 0)this._clearWatch();else if(this._geolocationWatchID===void 0){var n;this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.setAttribute("aria-pressed","true"),++wo>1?(n={maximumAge:6e5,timeout:0},Gn=!0):(n=this.options.positionOptions,Gn=!1),this._geolocationWatchID=u.window.navigator.geolocation.watchPosition(this._onSuccess,this._onError,n);}}else u.window.navigator.geolocation.getCurrentPosition(this._onSuccess,this._onError,this.options.positionOptions),this._timeoutId=setTimeout(this._finish,1e4);return !0},o.prototype._clearWatch=function(){u.window.navigator.geolocation.clearWatch(this._geolocationWatchID),this._geolocationWatchID=void 0,this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.setAttribute("aria-pressed","false"),this.options.showUserLocation&&this._updateMarker(null);},o}(u.Evented),un={maxWidth:100,unit:"metric"},cn=function(i){this.options=u.extend({},un,i),u.bindAll(["_onMove","setUnit"],this);};function qa(i,o,n){var s=n&&n.maxWidth||100,p=i._container.clientHeight/2,f=i.unproject([0,p]),d=i.unproject([s,p]),y=f.distanceTo(d);if(n&&n.unit==="imperial"){var v=3.2808*y;v>5280?pn(o,s,v/5280,i._getUIString("ScaleControl.Miles")):pn(o,s,v,i._getUIString("ScaleControl.Feet"));}else n&&n.unit==="nautical"?pn(o,s,y/1852,i._getUIString("ScaleControl.NauticalMiles")):y>=1e3?pn(o,s,y/1e3,i._getUIString("ScaleControl.Kilometers")):pn(o,s,y,i._getUIString("ScaleControl.Meters"));}function pn(i,o,n,s){var p,f,d,y=(p=n,(f=Math.pow(10,(""+Math.floor(p)).length-1))*(d=(d=p/f)>=10?10:d>=5?5:d>=3?3:d>=2?2:d>=1?1:function(v){var S=Math.pow(10,Math.ceil(-Math.log(v)/Math.LN10));return Math.round(v*S)/S}(d)));i.style.width=o*(y/n)+"px",i.innerHTML=y+"&nbsp;"+s;}cn.prototype.getDefaultPosition=function(){return "bottom-left"},cn.prototype._onMove=function(){qa(this._map,this._container,this.options);},cn.prototype.onAdd=function(i){return this._map=i,this._container=ct.create("div","mapboxgl-ctrl mapboxgl-ctrl-scale",i.getContainer()),this._map.on("move",this._onMove),this._onMove(),this._container},cn.prototype.onRemove=function(){ct.remove(this._container),this._map.off("move",this._onMove),this._map=void 0;},cn.prototype.setUnit=function(i){this.options.unit=i,qa(this._map,this._container,this.options);};var ai=function(i){this._fullscreen=!1,i&&i.container&&(i.container instanceof u.window.HTMLElement?this._container=i.container:u.warnOnce("Full screen control 'container' must be a DOM element.")),u.bindAll(["_onClickFullscreen","_changeIcon"],this),"onfullscreenchange"in u.window.document?this._fullscreenchange="fullscreenchange":"onmozfullscreenchange"in u.window.document?this._fullscreenchange="mozfullscreenchange":"onwebkitfullscreenchange"in u.window.document?this._fullscreenchange="webkitfullscreenchange":"onmsfullscreenchange"in u.window.document&&(this._fullscreenchange="MSFullscreenChange");};ai.prototype.onAdd=function(i){return this._map=i,this._container||(this._container=this._map.getContainer()),this._controlContainer=ct.create("div","mapboxgl-ctrl mapboxgl-ctrl-group"),this._checkFullscreenSupport()?this._setupUI():(this._controlContainer.style.display="none",u.warnOnce("This device does not support fullscreen mode.")),this._controlContainer},ai.prototype.onRemove=function(){ct.remove(this._controlContainer),this._map=null,u.window.document.removeEventListener(this._fullscreenchange,this._changeIcon);},ai.prototype._checkFullscreenSupport=function(){return !!(u.window.document.fullscreenEnabled||u.window.document.mozFullScreenEnabled||u.window.document.msFullscreenEnabled||u.window.document.webkitFullscreenEnabled)},ai.prototype._setupUI=function(){var i=this._fullscreenButton=ct.create("button","mapboxgl-ctrl-fullscreen",this._controlContainer);ct.create("span","mapboxgl-ctrl-icon",i).setAttribute("aria-hidden",!0),i.type="button",this._updateTitle(),this._fullscreenButton.addEventListener("click",this._onClickFullscreen),u.window.document.addEventListener(this._fullscreenchange,this._changeIcon);},ai.prototype._updateTitle=function(){var i=this._getTitle();this._fullscreenButton.setAttribute("aria-label",i),this._fullscreenButton.title=i;},ai.prototype._getTitle=function(){return this._map._getUIString(this._isFullscreen()?"FullscreenControl.Exit":"FullscreenControl.Enter")},ai.prototype._isFullscreen=function(){return this._fullscreen},ai.prototype._changeIcon=function(){(u.window.document.fullscreenElement||u.window.document.mozFullScreenElement||u.window.document.webkitFullscreenElement||u.window.document.msFullscreenElement)===this._container!==this._fullscreen&&(this._fullscreen=!this._fullscreen,this._fullscreenButton.classList.toggle("mapboxgl-ctrl-shrink"),this._fullscreenButton.classList.toggle("mapboxgl-ctrl-fullscreen"),this._updateTitle());},ai.prototype._onClickFullscreen=function(){this._isFullscreen()?u.window.document.exitFullscreen?u.window.document.exitFullscreen():u.window.document.mozCancelFullScreen?u.window.document.mozCancelFullScreen():u.window.document.msExitFullscreen?u.window.document.msExitFullscreen():u.window.document.webkitCancelFullScreen&&u.window.document.webkitCancelFullScreen():this._container.requestFullscreen?this._container.requestFullscreen():this._container.mozRequestFullScreen?this._container.mozRequestFullScreen():this._container.msRequestFullscreen?this._container.msRequestFullscreen():this._container.webkitRequestFullscreen&&this._container.webkitRequestFullscreen();};var Gs={closeButton:!0,closeOnClick:!0,focusAfterOpen:!0,className:"",maxWidth:"240px"},oa=["a[href]","[tabindex]:not([tabindex='-1'])","[contenteditable]:not([contenteditable='false'])","button:not([disabled])","input:not([disabled])","select:not([disabled])","textarea:not([disabled])"].join(", "),Xs=function(i){function o(n){i.call(this),this.options=u.extend(Object.create(Gs),n),u.bindAll(["_update","_onClose","remove","_onMouseMove","_onMouseUp","_onDrag"],this);}return i&&(o.__proto__=i),(o.prototype=Object.create(i&&i.prototype)).constructor=o,o.prototype.addTo=function(n){return this._map&&this.remove(),this._map=n,this.options.closeOnClick&&this._map.on("click",this._onClose),this.options.closeOnMove&&this._map.on("move",this._onClose),this._map.on("remove",this.remove),this._update(),this._focusFirstElement(),this._trackPointer?(this._map.on("mousemove",this._onMouseMove),this._map.on("mouseup",this._onMouseUp),this._container&&this._container.classList.add("mapboxgl-popup-track-pointer"),this._map._canvasContainer.classList.add("mapboxgl-track-pointer")):this._map.on("move",this._update),this.fire(new u.Event("open")),this},o.prototype.isOpen=function(){return !!this._map},o.prototype.remove=function(){return this._content&&ct.remove(this._content),this._container&&(ct.remove(this._container),delete this._container),this._map&&(this._map.off("move",this._update),this._map.off("move",this._onClose),this._map.off("click",this._onClose),this._map.off("remove",this.remove),this._map.off("mousemove",this._onMouseMove),this._map.off("mouseup",this._onMouseUp),this._map.off("drag",this._onDrag),delete this._map),this.fire(new u.Event("close")),this},o.prototype.getLngLat=function(){return this._lngLat},o.prototype.setLngLat=function(n){return this._lngLat=u.LngLat.convert(n),this._pos=null,this._trackPointer=!1,this._update(),this._map&&(this._map.on("move",this._update),this._map.off("mousemove",this._onMouseMove),this._container&&this._container.classList.remove("mapboxgl-popup-track-pointer"),this._map._canvasContainer.classList.remove("mapboxgl-track-pointer")),this},o.prototype.trackPointer=function(){return this._trackPointer=!0,this._pos=null,this._update(),this._map&&(this._map.off("move",this._update),this._map.on("mousemove",this._onMouseMove),this._map.on("drag",this._onDrag),this._container&&this._container.classList.add("mapboxgl-popup-track-pointer"),this._map._canvasContainer.classList.add("mapboxgl-track-pointer")),this},o.prototype.getElement=function(){return this._container},o.prototype.setText=function(n){return this.setDOMContent(u.window.document.createTextNode(n))},o.prototype.setHTML=function(n){var s,p=u.window.document.createDocumentFragment(),f=u.window.document.createElement("body");for(f.innerHTML=n;s=f.firstChild;)p.appendChild(s);return this.setDOMContent(p)},o.prototype.getMaxWidth=function(){return this._container&&this._container.style.maxWidth},o.prototype.setMaxWidth=function(n){return this.options.maxWidth=n,this._update(),this},o.prototype.setDOMContent=function(n){if(this._content)for(;this._content.hasChildNodes();)this._content.firstChild&&this._content.removeChild(this._content.firstChild);else this._content=ct.create("div","mapboxgl-popup-content",this._container);return this._content.appendChild(n),this._createCloseButton(),this._update(),this._focusFirstElement(),this},o.prototype.addClassName=function(n){this._container&&this._container.classList.add(n);},o.prototype.removeClassName=function(n){this._container&&this._container.classList.remove(n);},o.prototype.setOffset=function(n){return this.options.offset=n,this._update(),this},o.prototype.toggleClassName=function(n){if(this._container)return this._container.classList.toggle(n)},o.prototype._createCloseButton=function(){this.options.closeButton&&(this._closeButton=ct.create("button","mapboxgl-popup-close-button",this._content),this._closeButton.type="button",this._closeButton.setAttribute("aria-label","Close popup"),this._closeButton.innerHTML="&#215;",this._closeButton.addEventListener("click",this._onClose));},o.prototype._onMouseUp=function(n){this._update(n.point);},o.prototype._onMouseMove=function(n){this._update(n.point);},o.prototype._onDrag=function(n){this._update(n.point);},o.prototype._update=function(n){var s=this;if(this._map&&(this._lngLat||this._trackPointer)&&this._content&&(this._container||(this._container=ct.create("div","mapboxgl-popup",this._map.getContainer()),this._tip=ct.create("div","mapboxgl-popup-tip",this._container),this._container.appendChild(this._content),this.options.className&&this.options.className.split(" ").forEach(function(z){return s._container.classList.add(z)}),this._trackPointer&&this._container.classList.add("mapboxgl-popup-track-pointer")),this.options.maxWidth&&this._container.style.maxWidth!==this.options.maxWidth&&(this._container.style.maxWidth=this.options.maxWidth),this._map.transform.renderWorldCopies&&!this._trackPointer&&(this._lngLat=xo(this._lngLat,this._pos,this._map.transform)),!this._trackPointer||n)){var p=this._pos=this._trackPointer&&n?n:this._map.project(this._lngLat),f=this.options.anchor,d=function z(k){if(k){if(typeof k=="number"){var F=Math.round(Math.sqrt(.5*Math.pow(k,2)));return {center:new u.Point(0,0),top:new u.Point(0,k),"top-left":new u.Point(F,F),"top-right":new u.Point(-F,F),bottom:new u.Point(0,-k),"bottom-left":new u.Point(F,-F),"bottom-right":new u.Point(-F,-F),left:new u.Point(k,0),right:new u.Point(-k,0)}}if(k instanceof u.Point||Array.isArray(k)){var R=u.Point.convert(k);return {center:R,top:R,"top-left":R,"top-right":R,bottom:R,"bottom-left":R,"bottom-right":R,left:R,right:R}}return {center:u.Point.convert(k.center||[0,0]),top:u.Point.convert(k.top||[0,0]),"top-left":u.Point.convert(k["top-left"]||[0,0]),"top-right":u.Point.convert(k["top-right"]||[0,0]),bottom:u.Point.convert(k.bottom||[0,0]),"bottom-left":u.Point.convert(k["bottom-left"]||[0,0]),"bottom-right":u.Point.convert(k["bottom-right"]||[0,0]),left:u.Point.convert(k.left||[0,0]),right:u.Point.convert(k.right||[0,0])}}return z(new u.Point(0,0))}(this.options.offset);if(!f){var y,v=this._container.offsetWidth,S=this._container.offsetHeight;y=p.y+d.bottom.y<S?["top"]:p.y>this._map.transform.height-S?["bottom"]:[],p.x<v/2?y.push("left"):p.x>this._map.transform.width-v/2&&y.push("right"),f=y.length===0?"bottom":y.join("-");}var P=p.add(d[f]).round();ct.setTransform(this._container,Ci[f]+" translate("+P.x+"px,"+P.y+"px)"),ja(this._container,f,"popup");}},o.prototype._focusFirstElement=function(){if(this.options.focusAfterOpen&&this._container){var n=this._container.querySelector(oa);n&&n.focus();}},o.prototype._onClose=function(){this.remove();},o}(u.Evented),Za={version:u.version,supported:Zr,setRTLTextPlugin:u.setRTLTextPlugin,getRTLTextPluginStatus:u.getRTLTextPluginStatus,Map:Kl,NavigationControl:qi,GeolocateControl:Zs,AttributionControl:wr,ScaleControl:cn,FullscreenControl:ai,Popup:Xs,Marker:na,Style:Rr,LngLat:u.LngLat,LngLatBounds:u.LngLatBounds,Point:u.Point,MercatorCoordinate:u.MercatorCoordinate,Evented:u.Evented,config:u.config,prewarm:function(){it().acquire(rt);},clearPrewarmedResources:function(){var i=It;i&&(i.isPreloaded()&&i.numActive()===1?(i.release(rt),It=null):console.warn("Could not clear WebWorkers since there are active Map instances that still reference it. The pre-warmed WebWorker pool can only be cleared when all map instances have been removed with map.remove()"));},get accessToken(){return u.config.ACCESS_TOKEN},set accessToken(i){u.config.ACCESS_TOKEN=i;},get baseApiUrl(){return u.config.API_URL},set baseApiUrl(i){u.config.API_URL=i;},get workerCount(){return st.workerCount},set workerCount(i){st.workerCount=i;},get maxParallelImageRequests(){return u.config.MAX_PARALLEL_IMAGE_REQUESTS},set maxParallelImageRequests(i){u.config.MAX_PARALLEL_IMAGE_REQUESTS=i;},clearStorage:function(i){u.clearTileCache(i);},workerUrl:""};return Za}),ko});}),If=ze.AttributionControl,Ef=ze.Evented,Af=ze.FullscreenControl,Pf=ze.GeolocateControl,zf=ze.LngLat,Cf=ze.LngLatBounds,kf=ze.Map,Mf=ze.Marker,Df=ze.MercatorCoordinate,Lf=ze.NavigationControl,Bf=ze.Point,Rf=ze.Popup,Ff=ze.ScaleControl,Of=ze.Style,Uf=ze.accessToken,Vf=ze.baseApiUrl,Nf=ze.clearPrewarmedResources,jf=ze.clearStorage,qf=ze.config;var Zf=ze.getRTLTextPluginStatus,Gf=ze.maxParallelImageRequests,Xf=ze.prewarm,Wf=ze.setRTLTextPlugin,Kf=ze.supported,Hf=ze.version,Jf=ze.workerCount,Yf=ze.workerUrl;

    /* libs\@onsvisual\svelte-maps\src\Map.svelte generated by Svelte v3.44.1 */
    const file$1 = "libs\\@onsvisual\\svelte-maps\\src\\Map.svelte";

    // (118:1) {#if loaded}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 65536)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[16],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[16])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[16], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(118:1) {#if loaded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let div_resize_listener;
    	let current;
    	let if_block = /*loaded*/ ctx[4] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "id", /*id*/ ctx[0]);
    			attr_dev(div, "class", "svelte-a65d1y");
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[18].call(div));
    			add_location(div, file$1, 116, 0, 2764);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[18].bind(div));
    			/*div_binding*/ ctx[19](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*loaded*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*loaded*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*id*/ 1) {
    				attr_dev(div, "id", /*id*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			div_resize_listener();
    			/*div_binding*/ ctx[19](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Map', slots, ['default']);
    	let { map } = $$props;
    	let { id = "map" } = $$props;
    	let { location = { lng: 15, lat: 45, zoom: 1 } } = $$props;

    	let { style = {
    		"version": 8,
    		"sources": {},
    		"layers": []
    	} } = $$props;

    	let { minzoom = 0 } = $$props;
    	let { maxzoom = 14 } = $$props;
    	let { controls = false } = $$props;
    	let { locate = false } = $$props;
    	let { tabbable = false } = $$props;
    	let { zoom = null } = $$props;
    	let { center = null } = $$props;
    	let { interactive = true } = $$props;
    	let container;
    	let w;
    	let h;
    	let options;
    	let loaded = false;
    	setContext("map", { getMap: () => map });

    	// Interpret location
    	if (location.bounds) {
    		options = { bounds: location.bounds };
    	} else if (typeof location.lng == 'number' && typeof location.lat == 'number') {
    		options = { center: [location.lng, location.lat] };

    		if (typeof location.zoom == 'number') {
    			options.zoom = location.zoom;
    		}
    	}

    	onMount(() => {
    		const link = document.createElement("link");
    		link.rel = "stylesheet";
    		link.href = "https://unpkg.com/mapbox-gl@1.13.2/dist/mapbox-gl.css";

    		link.onload = () => {
    			$$invalidate(5, map = new ze.Map({
    					container,
    					style,
    					minZoom: minzoom,
    					maxZoom: maxzoom,
    					interactive,
    					...options
    				}));

    			if (controls) {
    				map.addControl(new ze.NavigationControl({ showCompass: false }));
    			}

    			if (locate) {
    				map.addControl(new ze.GeolocateControl());
    			}

    			// Get initial zoom level
    			map.on("load", () => {
    				$$invalidate(6, zoom = map.getZoom());
    				$$invalidate(7, center = map.getCenter());
    				$$invalidate(4, loaded = true);

    				// Prevent map from being tabbable
    				if (!tabbable && document.querySelector(`#${id} canvas`)) {
    					document.querySelector(`#${id} canvas`).tabIndex = "-1";
    				}
    			});

    			// Update zoom level and center when the view changes
    			map.on("moveend", () => {
    				$$invalidate(6, zoom = map.getZoom());
    				$$invalidate(7, center = map.getCenter());
    			});
    		};

    		document.head.appendChild(link);

    		return () => {
    			map.remove();
    			link.parentNode.removeChild(link);
    		};
    	});

    	// Function that forces map to resize to fit parent div, in case it doesn't automatically
    	function resizeCanvas() {
    		if (loaded) {
    			let canvas = document.getElementsByClassName("mapboxgl-canvas");

    			if (canvas[0]) {
    				canvas[0].style.width = "100%";
    				canvas[0].style.height = "100%";
    				map.resize();
    			}
    		}
    	}

    	const writable_props = [
    		'map',
    		'id',
    		'location',
    		'style',
    		'minzoom',
    		'maxzoom',
    		'controls',
    		'locate',
    		'tabbable',
    		'zoom',
    		'center',
    		'interactive'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Map> was created with unknown prop '${key}'`);
    	});

    	function div_elementresize_handler() {
    		w = this.clientWidth;
    		h = this.clientHeight;
    		$$invalidate(1, w);
    		$$invalidate(2, h);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			container = $$value;
    			$$invalidate(3, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('map' in $$props) $$invalidate(5, map = $$props.map);
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('location' in $$props) $$invalidate(8, location = $$props.location);
    		if ('style' in $$props) $$invalidate(9, style = $$props.style);
    		if ('minzoom' in $$props) $$invalidate(10, minzoom = $$props.minzoom);
    		if ('maxzoom' in $$props) $$invalidate(11, maxzoom = $$props.maxzoom);
    		if ('controls' in $$props) $$invalidate(12, controls = $$props.controls);
    		if ('locate' in $$props) $$invalidate(13, locate = $$props.locate);
    		if ('tabbable' in $$props) $$invalidate(14, tabbable = $$props.tabbable);
    		if ('zoom' in $$props) $$invalidate(6, zoom = $$props.zoom);
    		if ('center' in $$props) $$invalidate(7, center = $$props.center);
    		if ('interactive' in $$props) $$invalidate(15, interactive = $$props.interactive);
    		if ('$$scope' in $$props) $$invalidate(16, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		mapbox: ze,
    		map,
    		id,
    		location,
    		style,
    		minzoom,
    		maxzoom,
    		controls,
    		locate,
    		tabbable,
    		zoom,
    		center,
    		interactive,
    		container,
    		w,
    		h,
    		options,
    		loaded,
    		resizeCanvas
    	});

    	$$self.$inject_state = $$props => {
    		if ('map' in $$props) $$invalidate(5, map = $$props.map);
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('location' in $$props) $$invalidate(8, location = $$props.location);
    		if ('style' in $$props) $$invalidate(9, style = $$props.style);
    		if ('minzoom' in $$props) $$invalidate(10, minzoom = $$props.minzoom);
    		if ('maxzoom' in $$props) $$invalidate(11, maxzoom = $$props.maxzoom);
    		if ('controls' in $$props) $$invalidate(12, controls = $$props.controls);
    		if ('locate' in $$props) $$invalidate(13, locate = $$props.locate);
    		if ('tabbable' in $$props) $$invalidate(14, tabbable = $$props.tabbable);
    		if ('zoom' in $$props) $$invalidate(6, zoom = $$props.zoom);
    		if ('center' in $$props) $$invalidate(7, center = $$props.center);
    		if ('interactive' in $$props) $$invalidate(15, interactive = $$props.interactive);
    		if ('container' in $$props) $$invalidate(3, container = $$props.container);
    		if ('w' in $$props) $$invalidate(1, w = $$props.w);
    		if ('h' in $$props) $$invalidate(2, h = $$props.h);
    		if ('options' in $$props) options = $$props.options;
    		if ('loaded' in $$props) $$invalidate(4, loaded = $$props.loaded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*w, h*/ 6) {
    			// Invoke above function when parent div size changes
    			 (w || h) && resizeCanvas();
    		}
    	};

    	return [
    		id,
    		w,
    		h,
    		container,
    		loaded,
    		map,
    		zoom,
    		center,
    		location,
    		style,
    		minzoom,
    		maxzoom,
    		controls,
    		locate,
    		tabbable,
    		interactive,
    		$$scope,
    		slots,
    		div_elementresize_handler,
    		div_binding
    	];
    }

    class Map$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			map: 5,
    			id: 0,
    			location: 8,
    			style: 9,
    			minzoom: 10,
    			maxzoom: 11,
    			controls: 12,
    			locate: 13,
    			tabbable: 14,
    			zoom: 6,
    			center: 7,
    			interactive: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*map*/ ctx[5] === undefined && !('map' in props)) {
    			console.warn("<Map> was created without expected prop 'map'");
    		}
    	}

    	get map() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set map(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get location() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minzoom() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minzoom(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxzoom() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxzoom(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get controls() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set controls(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get locate() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set locate(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabbable() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabbable(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoom() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zoom(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get center() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set center(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get interactive() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set interactive(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* libs\@onsvisual\svelte-maps\src\MapSource.svelte generated by Svelte v3.44.1 */

    const { console: console_1 } = globals;

    // (103:0) {#if loaded}
    function create_if_block$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(103:0) {#if loaded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*loaded*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*loaded*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*loaded*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MapSource', slots, ['default']);
    	let { id } = $$props;
    	let { type } = $$props;
    	let { url = null } = $$props;
    	let { props = {} } = $$props;
    	let { data = null } = $$props;
    	let { layer = null } = $$props;
    	let { promoteId = null } = $$props;
    	let { minzoom = null } = $$props;
    	let { maxzoom = null } = $$props;
    	let loaded = false;
    	const { getMap } = getContext('map');
    	const map = getMap();
    	setContext("source", { source: id, layer, promoteId });

    	if (map.getSource(id)) {
    		map.removeSource(id);
    	}

    	function isSourceLoaded() {
    		if (map.isSourceLoaded(id)) {
    			$$invalidate(0, loaded = true);
    			console.log(id + ' map source loaded!');
    		} else {
    			setTimeout(
    				() => {
    					console.log('...');
    					isSourceLoaded();
    				},
    				250
    			);
    		}
    	}

    	// Set optional source properties
    	if (minzoom) {
    		props.minzoom = minzoom;
    	}

    	if (maxzoom) {
    		props.maxzoom = maxzoom;
    	}

    	if (layer && promoteId) {
    		props.promoteId = {};
    		props.promoteId[layer] = promoteId;
    	} else if (promoteId) {
    		props.promoteId = promoteId;
    	}

    	function addSource() {
    		console.log(id + ' map source loading...');
    		let layerdef;

    		if (type == "geojson") {
    			if (data) {
    				layerdef = { type, data, ...props };
    			} else if (url) {
    				layerdef = { type, data: url, ...props };
    			}
    		} else if (type == "vector") {
    			layerdef = { type, tiles: [url], ...props };
    		} else if (type == "raster") {
    			layerdef = {
    				type,
    				tiles: [url],
    				tileSize: tilesize,
    				...props
    			};
    		}

    		if (layerdef) {
    			map.addSource(id, layerdef);
    			isSourceLoaded();
    		}
    	}
    	addSource();

    	function setData() {
    		map.getSource(id).setData(data);
    	}

    	const writable_props = [
    		'id',
    		'type',
    		'url',
    		'props',
    		'data',
    		'layer',
    		'promoteId',
    		'minzoom',
    		'maxzoom'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<MapSource> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(2, id = $$props.id);
    		if ('type' in $$props) $$invalidate(3, type = $$props.type);
    		if ('url' in $$props) $$invalidate(4, url = $$props.url);
    		if ('props' in $$props) $$invalidate(1, props = $$props.props);
    		if ('data' in $$props) $$invalidate(5, data = $$props.data);
    		if ('layer' in $$props) $$invalidate(6, layer = $$props.layer);
    		if ('promoteId' in $$props) $$invalidate(7, promoteId = $$props.promoteId);
    		if ('minzoom' in $$props) $$invalidate(8, minzoom = $$props.minzoom);
    		if ('maxzoom' in $$props) $$invalidate(9, maxzoom = $$props.maxzoom);
    		if ('$$scope' in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		id,
    		type,
    		url,
    		props,
    		data,
    		layer,
    		promoteId,
    		minzoom,
    		maxzoom,
    		loaded,
    		getMap,
    		map,
    		isSourceLoaded,
    		addSource,
    		setData
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(2, id = $$props.id);
    		if ('type' in $$props) $$invalidate(3, type = $$props.type);
    		if ('url' in $$props) $$invalidate(4, url = $$props.url);
    		if ('props' in $$props) $$invalidate(1, props = $$props.props);
    		if ('data' in $$props) $$invalidate(5, data = $$props.data);
    		if ('layer' in $$props) $$invalidate(6, layer = $$props.layer);
    		if ('promoteId' in $$props) $$invalidate(7, promoteId = $$props.promoteId);
    		if ('minzoom' in $$props) $$invalidate(8, minzoom = $$props.minzoom);
    		if ('maxzoom' in $$props) $$invalidate(9, maxzoom = $$props.maxzoom);
    		if ('loaded' in $$props) $$invalidate(0, loaded = $$props.loaded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*loaded, data*/ 33) {
    			 loaded && data && setData();
    		}
    	};

    	return [
    		loaded,
    		props,
    		id,
    		type,
    		url,
    		data,
    		layer,
    		promoteId,
    		minzoom,
    		maxzoom,
    		$$scope,
    		slots
    	];
    }

    class MapSource extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			id: 2,
    			type: 3,
    			url: 4,
    			props: 1,
    			data: 5,
    			layer: 6,
    			promoteId: 7,
    			minzoom: 8,
    			maxzoom: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MapSource",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[2] === undefined && !('id' in props)) {
    			console_1.warn("<MapSource> was created without expected prop 'id'");
    		}

    		if (/*type*/ ctx[3] === undefined && !('type' in props)) {
    			console_1.warn("<MapSource> was created without expected prop 'type'");
    		}
    	}

    	get id() {
    		throw new Error("<MapSource>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<MapSource>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<MapSource>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<MapSource>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<MapSource>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<MapSource>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get props() {
    		throw new Error("<MapSource>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set props(value) {
    		throw new Error("<MapSource>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<MapSource>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<MapSource>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layer() {
    		throw new Error("<MapSource>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layer(value) {
    		throw new Error("<MapSource>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get promoteId() {
    		throw new Error("<MapSource>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set promoteId(value) {
    		throw new Error("<MapSource>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minzoom() {
    		throw new Error("<MapSource>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minzoom(value) {
    		throw new Error("<MapSource>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxzoom() {
    		throw new Error("<MapSource>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxzoom(value) {
    		throw new Error("<MapSource>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* libs\@onsvisual\svelte-maps\src\MapLayer.svelte generated by Svelte v3.44.1 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const get_default_slot_changes = dirty => ({ hovered: dirty[0] & /*hovered*/ 1 });
    const get_default_slot_context = ctx => ({ hovered: /*hovered*/ ctx[0] });

    // (301:0) {#if hover}
    function create_if_block$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[30].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[29], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope, hovered*/ 536870913)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[29],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[29])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[29], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(301:0) {#if hover}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*hover*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*hover*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*hover*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $hoverObj;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MapLayer', slots, ['default']);
    	const dispatch = createEventDispatcher();
    	let { id } = $$props;
    	let { type } = $$props;
    	let { filter = null } = $$props;
    	let { layout = {} } = $$props;
    	let { paint = {} } = $$props;
    	let { data = null } = $$props;
    	let { colorKey = 'color' } = $$props;
    	let { nameKey = null } = $$props;
    	let { valueKey = null } = $$props;
    	let { idKey = null } = $$props;
    	let { select = false } = $$props;
    	let { clickIgnore = false } = $$props;
    	let { clickCenter = false } = $$props;
    	let { selected = null } = $$props;
    	let { hover = false } = $$props;
    	let { hovered = null } = $$props;
    	let { highlight = false } = $$props;
    	let { highlightKey = 'highlighted' } = $$props;
    	let { highlighted = [] } = $$props;
    	let { order = null } = $$props;
    	let { maxzoom = null } = $$props;
    	let { minzoom = null } = $$props;
    	let { sourceLayer = null } = $$props;
    	let { custom } = $$props;
    	const { source, layer, promoteId } = getContext('source');
    	const { getMap } = getContext('map');
    	const map = getMap();
    	setContext('layer', { layer: id });
    	const hoverObj = writable({ id: null, feature: null, event: null });
    	validate_store(hoverObj, 'hoverObj');
    	component_subscribe($$self, hoverObj, value => $$invalidate(31, $hoverObj = value));
    	setContext('hover', hoverObj);
    	idKey = idKey ? idKey : promoteId;
    	sourceLayer = sourceLayer ? sourceLayer : layer;
    	let selectedPrev = null;
    	let hoveredPrev = null;
    	let highlightedPrev = [];

    	if (map.getLayer(id)) {
    		map.removeLayer(id);
    	}

    	let options = { id, type, source, paint, layout };

    	if (filter) {
    		options['filter'] = filter;
    	}

    	if (sourceLayer) {
    		options['source-layer'] = sourceLayer;
    	}

    	if (maxzoom) {
    		options['maxzoom'] = maxzoom;
    	}

    	if (minzoom) {
    		options['minzoom'] = minzoom;
    	}

    	// Updates "color" feature states for all geo codes
    	// Assumes that each data point has the colours defined on the colorCode key
    	function updateColors() {
    		console.log('&&&&&&&& updating colors...');

    		data.forEach(d => {
    			map.setFeatureState({ source, sourceLayer, id: d[idKey] }, {
    				color: colorKey ? d[colorKey] : null,
    				name: nameKey ? d[nameKey] : null,
    				value: valueKey ? d[valueKey] : null
    			});
    		});
    	}

    	// Adds a click event to change the selected geo code (if select = true for map layer)
    	if (select) {
    		map.on('click', id, e => {
    			if (e.features.length > 0 && !clickIgnore) {
    				let feature = e.features[0];
    				$$invalidate(3, selected = feature.id);
    				dispatch('select', { id: selected, feature, event: e });

    				if (selectedPrev) {
    					map.setFeatureState({ source, sourceLayer, id: selectedPrev }, { selected: false });
    				}

    				map.setFeatureState({ source, sourceLayer, id: selected }, { selected: true });

    				if (clickCenter) {
    					let center = centroid(e.features[0].toJSON().geometry);
    					map.flyTo({ center: center.geometry.coordinates });
    				}

    				$$invalidate(25, selectedPrev = selected);
    			}
    		});
    	}

    	// Adds an event to update the hovered geo code when the mouse is moved over the map
    	if (hover) {
    		map.on('mousemove', id, e => {
    			if (e.features.length > 0) {
    				if (hovered) {
    					map.setFeatureState({ source, sourceLayer, id: hovered }, { hovered: false });
    				}

    				let feature = e.features[0];
    				$$invalidate(0, hovered = $$invalidate(26, hoveredPrev = feature.id));
    				hoverObj.set({ id: hovered, feature, event: e });
    				dispatch('hover', $hoverObj);
    				map.setFeatureState({ source, sourceLayer, id: hovered }, { hovered: true });

    				// Change the cursor style as a UI indicator.
    				map.getCanvas().style.cursor = 'pointer';
    			}
    		});

    		map.on('mouseleave', id, e => {
    			if (hovered) {
    				map.setFeatureState({ source, sourceLayer, id: hovered }, { hovered: false });
    			}

    			$$invalidate(0, hovered = $$invalidate(26, hoveredPrev = null));
    			hoverObj.set({ id: null, feature: null, event: e });
    			dispatch('hover', $hoverObj);

    			// Reset cursor and remove popup
    			map.getCanvas().style.cursor = '';
    		});
    	}

    	const writable_props = [
    		'id',
    		'type',
    		'filter',
    		'layout',
    		'paint',
    		'data',
    		'colorKey',
    		'nameKey',
    		'valueKey',
    		'idKey',
    		'select',
    		'clickIgnore',
    		'clickCenter',
    		'selected',
    		'hover',
    		'hovered',
    		'highlight',
    		'highlightKey',
    		'highlighted',
    		'order',
    		'maxzoom',
    		'minzoom',
    		'sourceLayer',
    		'custom'
    	];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<MapLayer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(6, id = $$props.id);
    		if ('type' in $$props) $$invalidate(7, type = $$props.type);
    		if ('filter' in $$props) $$invalidate(8, filter = $$props.filter);
    		if ('layout' in $$props) $$invalidate(9, layout = $$props.layout);
    		if ('paint' in $$props) $$invalidate(10, paint = $$props.paint);
    		if ('data' in $$props) $$invalidate(11, data = $$props.data);
    		if ('colorKey' in $$props) $$invalidate(12, colorKey = $$props.colorKey);
    		if ('nameKey' in $$props) $$invalidate(13, nameKey = $$props.nameKey);
    		if ('valueKey' in $$props) $$invalidate(14, valueKey = $$props.valueKey);
    		if ('idKey' in $$props) $$invalidate(5, idKey = $$props.idKey);
    		if ('select' in $$props) $$invalidate(15, select = $$props.select);
    		if ('clickIgnore' in $$props) $$invalidate(16, clickIgnore = $$props.clickIgnore);
    		if ('clickCenter' in $$props) $$invalidate(17, clickCenter = $$props.clickCenter);
    		if ('selected' in $$props) $$invalidate(3, selected = $$props.selected);
    		if ('hover' in $$props) $$invalidate(1, hover = $$props.hover);
    		if ('hovered' in $$props) $$invalidate(0, hovered = $$props.hovered);
    		if ('highlight' in $$props) $$invalidate(18, highlight = $$props.highlight);
    		if ('highlightKey' in $$props) $$invalidate(19, highlightKey = $$props.highlightKey);
    		if ('highlighted' in $$props) $$invalidate(20, highlighted = $$props.highlighted);
    		if ('order' in $$props) $$invalidate(21, order = $$props.order);
    		if ('maxzoom' in $$props) $$invalidate(22, maxzoom = $$props.maxzoom);
    		if ('minzoom' in $$props) $$invalidate(23, minzoom = $$props.minzoom);
    		if ('sourceLayer' in $$props) $$invalidate(4, sourceLayer = $$props.sourceLayer);
    		if ('custom' in $$props) $$invalidate(24, custom = $$props.custom);
    		if ('$$scope' in $$props) $$invalidate(29, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		createEventDispatcher,
    		writable,
    		dispatch,
    		id,
    		type,
    		filter,
    		layout,
    		paint,
    		data,
    		colorKey,
    		nameKey,
    		valueKey,
    		idKey,
    		select,
    		clickIgnore,
    		clickCenter,
    		selected,
    		hover,
    		hovered,
    		highlight,
    		highlightKey,
    		highlighted,
    		order,
    		maxzoom,
    		minzoom,
    		sourceLayer,
    		custom,
    		source,
    		layer,
    		promoteId,
    		getMap,
    		map,
    		hoverObj,
    		selectedPrev,
    		hoveredPrev,
    		highlightedPrev,
    		options,
    		updateColors,
    		$hoverObj
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(6, id = $$props.id);
    		if ('type' in $$props) $$invalidate(7, type = $$props.type);
    		if ('filter' in $$props) $$invalidate(8, filter = $$props.filter);
    		if ('layout' in $$props) $$invalidate(9, layout = $$props.layout);
    		if ('paint' in $$props) $$invalidate(10, paint = $$props.paint);
    		if ('data' in $$props) $$invalidate(11, data = $$props.data);
    		if ('colorKey' in $$props) $$invalidate(12, colorKey = $$props.colorKey);
    		if ('nameKey' in $$props) $$invalidate(13, nameKey = $$props.nameKey);
    		if ('valueKey' in $$props) $$invalidate(14, valueKey = $$props.valueKey);
    		if ('idKey' in $$props) $$invalidate(5, idKey = $$props.idKey);
    		if ('select' in $$props) $$invalidate(15, select = $$props.select);
    		if ('clickIgnore' in $$props) $$invalidate(16, clickIgnore = $$props.clickIgnore);
    		if ('clickCenter' in $$props) $$invalidate(17, clickCenter = $$props.clickCenter);
    		if ('selected' in $$props) $$invalidate(3, selected = $$props.selected);
    		if ('hover' in $$props) $$invalidate(1, hover = $$props.hover);
    		if ('hovered' in $$props) $$invalidate(0, hovered = $$props.hovered);
    		if ('highlight' in $$props) $$invalidate(18, highlight = $$props.highlight);
    		if ('highlightKey' in $$props) $$invalidate(19, highlightKey = $$props.highlightKey);
    		if ('highlighted' in $$props) $$invalidate(20, highlighted = $$props.highlighted);
    		if ('order' in $$props) $$invalidate(21, order = $$props.order);
    		if ('maxzoom' in $$props) $$invalidate(22, maxzoom = $$props.maxzoom);
    		if ('minzoom' in $$props) $$invalidate(23, minzoom = $$props.minzoom);
    		if ('sourceLayer' in $$props) $$invalidate(4, sourceLayer = $$props.sourceLayer);
    		if ('custom' in $$props) $$invalidate(24, custom = $$props.custom);
    		if ('selectedPrev' in $$props) $$invalidate(25, selectedPrev = $$props.selectedPrev);
    		if ('hoveredPrev' in $$props) $$invalidate(26, hoveredPrev = $$props.hoveredPrev);
    		if ('highlightedPrev' in $$props) $$invalidate(27, highlightedPrev = $$props.highlightedPrev);
    		if ('options' in $$props) $$invalidate(28, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*custom, id, data, sourceLayer*/ 16779344) {
    			// # ============================================================================ #
    			// # diagnose code here
    			 {
    				if (custom[id]) {
    					console.log(`######### ${id} #######`);
    					console.log(`custom`);
    					console.log(custom);
    					console.log(`data`);
    					console.log(data);
    					console.log(`source`);
    					console.log(source);
    					console.log(`sourceLayer`);
    					console.log(sourceLayer);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*custom, options, order*/ 287309824) {
    			 {
    				Object.entries(custom).map(arr => {
    					const id_tmp = arr[0];
    					const want_to_add_id = custom[id_tmp];

    					if (want_to_add_id && options.id == id_tmp) {
    						map.addLayer(options, order);
    						console.log(`XXXXXXXXXXX   Adding layer ${id_tmp}`);
    					}

    					if (!want_to_add_id && map.getLayer(id_tmp)) {
    						map.removeLayer(id_tmp);
    						console.log(`XXXXXXXXXXXXX    Removing layer ${id_tmp}`);
    					}
    				});
    			}
    		}

    		if ($$self.$$.dirty[0] & /*data, colorKey*/ 6144) {
    			 data && (data || colorKey) && updateColors();
    		}

    		if ($$self.$$.dirty[0] & /*highlight, highlighted, highlightedPrev, highlightKey, sourceLayer*/ 136052752) {
    			// // updates just boundaries
    			// function updateBoundaries() {
    			//   console.log('updating boundaries...');
    			//   console.log(data);
    			//   data.forEach((d) => {
    			//     console.log(d);
    			//     // map.setFeatureState(
    			//     //   {
    			//     //     source: source,
    			//     //     sourceLayer: sourceLayer,
    			//     //     id: d[idKey],
    			//     //   },
    			//     //   {
    			//     //     color: colorKey ? d[colorKey] : null,
    			//     //     name: nameKey ? d[nameKey] : null,
    			//     //     value: valueKey ? d[valueKey] : null,
    			//     //   }
    			//     // );
    			//   });
    			// }
    			// $: data && updateBoundaries();
    			// Updates the "highlighted" feature state as geo codes are added to/removed from the highlighted array
    			 if (highlight && highlighted != highlightedPrev) {
    				if (highlightedPrev[0]) {
    					highlightedPrev.forEach(id => {
    						let state = {};
    						state[highlightKey] = false;
    						map.setFeatureState({ source, sourceLayer, id }, state);
    					});
    				}

    				$$invalidate(27, highlightedPrev = highlighted);

    				if (highlighted[0]) {
    					highlighted.forEach(id => {
    						let state = {};
    						state[highlightKey] = true;
    						map.setFeatureState({ source, sourceLayer, id }, state);
    					});
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*select, selected, selectedPrev, sourceLayer*/ 33587224) {
    			// Updates the selected geo code if it is changed elsewhere in the app (outside of this component)
    			 if (select && selected != selectedPrev) {
    				if (selectedPrev) {
    					map.setFeatureState({ source, sourceLayer, id: selectedPrev }, { selected: false });
    				}

    				if (selected) {
    					map.setFeatureState({ source, sourceLayer, id: selected }, { selected: true });
    				}

    				$$invalidate(25, selectedPrev = selected);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*hover, hovered, hoveredPrev, sourceLayer*/ 67108883) {
    			// Updates the hovered geo code if it is changed elsewhere in the app (outside of this component)
    			 if (hover && hovered != hoveredPrev) {
    				if (hoveredPrev) {
    					map.setFeatureState({ source, sourceLayer, id: hoveredPrev }, { hovered: false });
    				}

    				if (hovered) {
    					map.setFeatureState({ source, sourceLayer, id: hovered }, { hovered: true });
    				}

    				$$invalidate(26, hoveredPrev = hovered);
    			}
    		}
    	};

    	return [
    		hovered,
    		hover,
    		hoverObj,
    		selected,
    		sourceLayer,
    		idKey,
    		id,
    		type,
    		filter,
    		layout,
    		paint,
    		data,
    		colorKey,
    		nameKey,
    		valueKey,
    		select,
    		clickIgnore,
    		clickCenter,
    		highlight,
    		highlightKey,
    		highlighted,
    		order,
    		maxzoom,
    		minzoom,
    		custom,
    		selectedPrev,
    		hoveredPrev,
    		highlightedPrev,
    		options,
    		$$scope,
    		slots
    	];
    }

    class MapLayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				id: 6,
    				type: 7,
    				filter: 8,
    				layout: 9,
    				paint: 10,
    				data: 11,
    				colorKey: 12,
    				nameKey: 13,
    				valueKey: 14,
    				idKey: 5,
    				select: 15,
    				clickIgnore: 16,
    				clickCenter: 17,
    				selected: 3,
    				hover: 1,
    				hovered: 0,
    				highlight: 18,
    				highlightKey: 19,
    				highlighted: 20,
    				order: 21,
    				maxzoom: 22,
    				minzoom: 23,
    				sourceLayer: 4,
    				custom: 24
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MapLayer",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[6] === undefined && !('id' in props)) {
    			console_1$1.warn("<MapLayer> was created without expected prop 'id'");
    		}

    		if (/*type*/ ctx[7] === undefined && !('type' in props)) {
    			console_1$1.warn("<MapLayer> was created without expected prop 'type'");
    		}

    		if (/*custom*/ ctx[24] === undefined && !('custom' in props)) {
    			console_1$1.warn("<MapLayer> was created without expected prop 'custom'");
    		}
    	}

    	get id() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filter() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filter(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layout(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get paint() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paint(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorKey() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorKey(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nameKey() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nameKey(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valueKey() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueKey(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get idKey() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set idKey(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get select() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set select(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clickIgnore() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clickIgnore(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clickCenter() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clickCenter(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hover() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hover(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hovered() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hovered(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlight() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlight(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlightKey() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlightKey(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlighted() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlighted(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get order() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set order(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxzoom() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxzoom(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minzoom() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minzoom(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sourceLayer() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sourceLayer(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get custom() {
    		throw new Error("<MapLayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set custom(value) {
    		throw new Error("<MapLayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* libs\@onsvisual\svelte-maps\src\MapTooltip.svelte generated by Svelte v3.44.1 */

    function create_fragment$4(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $hoverObj;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MapTooltip', slots, []);
    	let { content } = $$props;
    	const tooltip = new ze.Popup({ closeButton: false, closeOnClick: false });
    	const { getMap } = getContext('map');
    	const map = getMap();
    	const hoverObj = getContext('hover');
    	validate_store(hoverObj, 'hoverObj');
    	component_subscribe($$self, hoverObj, value => $$invalidate(2, $hoverObj = value));

    	function updateTooltip(obj, content) {
    		if (obj.id) {
    			tooltip.setLngLat(obj.event.lngLat).setHTML(content ? content : obj.code).addTo(map);
    		} else {
    			tooltip.remove();
    		}
    	}

    	const writable_props = ['content'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MapTooltip> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('content' in $$props) $$invalidate(1, content = $$props.content);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		mapbox: ze,
    		content,
    		tooltip,
    		getMap,
    		map,
    		hoverObj,
    		updateTooltip,
    		$hoverObj
    	});

    	$$self.$inject_state = $$props => {
    		if ('content' in $$props) $$invalidate(1, content = $$props.content);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$hoverObj, content*/ 6) {
    			 updateTooltip($hoverObj, content);
    		}
    	};

    	return [hoverObj, content, $hoverObj];
    }

    class MapTooltip extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { content: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MapTooltip",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[1] === undefined && !('content' in props)) {
    			console.warn("<MapTooltip> was created without expected prop 'content'");
    		}
    	}

    	get content() {
    		throw new Error("<MapTooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<MapTooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var EOL = {},
        EOF = {},
        QUOTE = 34,
        NEWLINE = 10,
        RETURN = 13;

    function objectConverter(columns) {
      return new Function("d", "return {" + columns.map(function(name, i) {
        return JSON.stringify(name) + ": d[" + i + "] || \"\"";
      }).join(",") + "}");
    }

    function customConverter(columns, f) {
      var object = objectConverter(columns);
      return function(row, i) {
        return f(object(row), i, columns);
      };
    }

    // Compute unique columns in order of discovery.
    function inferColumns(rows) {
      var columnSet = Object.create(null),
          columns = [];

      rows.forEach(function(row) {
        for (var column in row) {
          if (!(column in columnSet)) {
            columns.push(columnSet[column] = column);
          }
        }
      });

      return columns;
    }

    function pad(value, width) {
      var s = value + "", length = s.length;
      return length < width ? new Array(width - length + 1).join(0) + s : s;
    }

    function formatYear(year) {
      return year < 0 ? "-" + pad(-year, 6)
        : year > 9999 ? "+" + pad(year, 6)
        : pad(year, 4);
    }

    function formatDate(date) {
      var hours = date.getUTCHours(),
          minutes = date.getUTCMinutes(),
          seconds = date.getUTCSeconds(),
          milliseconds = date.getUTCMilliseconds();
      return isNaN(date) ? "Invalid Date"
          : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
          + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
          : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
          : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
          : "");
    }

    function dsv(delimiter) {
      var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
          DELIMITER = delimiter.charCodeAt(0);

      function parse(text, f) {
        var convert, columns, rows = parseRows(text, function(row, i) {
          if (convert) return convert(row, i - 1);
          columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
        });
        rows.columns = columns || [];
        return rows;
      }

      function parseRows(text, f) {
        var rows = [], // output rows
            N = text.length,
            I = 0, // current character index
            n = 0, // current line number
            t, // current token
            eof = N <= 0, // current token followed by EOF?
            eol = false; // current token followed by EOL?

        // Strip the trailing newline.
        if (text.charCodeAt(N - 1) === NEWLINE) --N;
        if (text.charCodeAt(N - 1) === RETURN) --N;

        function token() {
          if (eof) return EOF;
          if (eol) return eol = false, EOL;

          // Unescape quotes.
          var i, j = I, c;
          if (text.charCodeAt(j) === QUOTE) {
            while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
            if ((i = I) >= N) eof = true;
            else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            return text.slice(j + 1, i - 1).replace(/""/g, "\"");
          }

          // Find next delimiter or newline.
          while (I < N) {
            if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            else if (c !== DELIMITER) continue;
            return text.slice(j, i);
          }

          // Return last token before EOF.
          return eof = true, text.slice(j, N);
        }

        while ((t = token()) !== EOF) {
          var row = [];
          while (t !== EOL && t !== EOF) row.push(t), t = token();
          if (f && (row = f(row, n++)) == null) continue;
          rows.push(row);
        }

        return rows;
      }

      function preformatBody(rows, columns) {
        return rows.map(function(row) {
          return columns.map(function(column) {
            return formatValue(row[column]);
          }).join(delimiter);
        });
      }

      function format(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
      }

      function formatBody(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return preformatBody(rows, columns).join("\n");
      }

      function formatRows(rows) {
        return rows.map(formatRow).join("\n");
      }

      function formatRow(row) {
        return row.map(formatValue).join(delimiter);
      }

      function formatValue(value) {
        return value == null ? ""
            : value instanceof Date ? formatDate(value)
            : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
            : value;
      }

      return {
        parse: parse,
        parseRows: parseRows,
        format: format,
        formatBody: formatBody,
        formatRows: formatRows,
        formatRow: formatRow,
        formatValue: formatValue
      };
    }

    var csv = dsv(",");

    var csvParse = csv.parse;

    function autoType(object) {
      for (var key in object) {
        var value = object[key].trim(), number, m;
        if (!value) value = null;
        else if (value === "true") value = true;
        else if (value === "false") value = false;
        else if (value === "NaN") value = NaN;
        else if (!isNaN(number = +value)) value = number;
        else if (m = value.match(/^([-+]\d{2})?\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[-+]\d{2}:\d{2})?)?$/)) {
          if (fixtz && !!m[4] && !m[7]) value = value.replace(/-/g, "/").replace(/T/, " ");
          value = new Date(value);
        }
        else continue;
        object[key] = value;
      }
      return object;
    }

    // https://github.com/d3/d3-dsv/issues/45
    const fixtz = new Date("2019-01-01T00:00").getHours() || new Date("2019-07-01T00:00").getHours();

    function identity(x) {
      return x;
    }

    function transform(transform) {
      if (transform == null) return identity;
      var x0,
          y0,
          kx = transform.scale[0],
          ky = transform.scale[1],
          dx = transform.translate[0],
          dy = transform.translate[1];
      return function(input, i) {
        if (!i) x0 = y0 = 0;
        var j = 2, n = input.length, output = new Array(n);
        output[0] = (x0 += input[0]) * kx + dx;
        output[1] = (y0 += input[1]) * ky + dy;
        while (j < n) output[j] = input[j], ++j;
        return output;
      };
    }

    function reverse(array, n) {
      var t, j = array.length, i = j - n;
      while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
    }

    function feature(topology, o) {
      if (typeof o === "string") o = topology.objects[o];
      return o.type === "GeometryCollection"
          ? {type: "FeatureCollection", features: o.geometries.map(function(o) { return feature$1(topology, o); })}
          : feature$1(topology, o);
    }

    function feature$1(topology, o) {
      var id = o.id,
          bbox = o.bbox,
          properties = o.properties == null ? {} : o.properties,
          geometry = object(topology, o);
      return id == null && bbox == null ? {type: "Feature", properties: properties, geometry: geometry}
          : bbox == null ? {type: "Feature", id: id, properties: properties, geometry: geometry}
          : {type: "Feature", id: id, bbox: bbox, properties: properties, geometry: geometry};
    }

    function object(topology, o) {
      var transformPoint = transform(topology.transform),
          arcs = topology.arcs;

      function arc(i, points) {
        if (points.length) points.pop();
        for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
          points.push(transformPoint(a[k], k));
        }
        if (i < 0) reverse(points, n);
      }

      function point(p) {
        return transformPoint(p);
      }

      function line(arcs) {
        var points = [];
        for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
        if (points.length < 2) points.push(points[0]); // This should never happen per the specification.
        return points;
      }

      function ring(arcs) {
        var points = line(arcs);
        while (points.length < 4) points.push(points[0]); // This may happen if an arc has only two points.
        return points;
      }

      function polygon(arcs) {
        return arcs.map(ring);
      }

      function geometry(o) {
        var type = o.type, coordinates;
        switch (type) {
          case "GeometryCollection": return {type: type, geometries: o.geometries.map(geometry)};
          case "Point": coordinates = point(o.coordinates); break;
          case "MultiPoint": coordinates = o.coordinates.map(point); break;
          case "LineString": coordinates = line(o.arcs); break;
          case "MultiLineString": coordinates = o.arcs.map(line); break;
          case "Polygon": coordinates = polygon(o.arcs); break;
          case "MultiPolygon": coordinates = o.arcs.map(polygon); break;
          default: return null;
        }
        return {type: type, coordinates: coordinates};
      }

      return geometry(o);
    }

    async function getData(url) {
      let response = await fetch(url);
      let string = await response.text();
      let data = await csvParse(string, autoType);
      return data;
    }

    async function getTopo(url, layer) {
      let response = await fetch(url);
      let json = await response.json();
      let geojson = await feature(json, layer);
      return geojson;
    }

    function getColor(value, breaks, colors) {

      let color;
      let found = false;
      let i = 1;
      while (found == false) {
        if (value <= breaks[i]) {
          color = colors[i - 1];
          found = true;
        } else {
          i++;
        }
      }
      return color ? color : 'lightgrey';
    }

    /**
     * Callback for coordEach
     *
     * @callback coordEachCallback
     * @param {Array<number>} currentCoord The current coordinate being processed.
     * @param {number} coordIndex The current index of the coordinate being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
     * @param {number} geometryIndex The current index of the Geometry being processed.
     */

    /**
     * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
     *
     * @name coordEach
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
     * @param {Function} callback a method that takes (currentCoord, coordIndex, featureIndex, multiFeatureIndex)
     * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
     * @returns {void}
     * @example
     * var features = turf.featureCollection([
     *   turf.point([26, 37], {"foo": "bar"}),
     *   turf.point([36, 53], {"hello": "world"})
     * ]);
     *
     * turf.coordEach(features, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
     *   //=currentCoord
     *   //=coordIndex
     *   //=featureIndex
     *   //=multiFeatureIndex
     *   //=geometryIndex
     * });
     */
    function coordEach(geojson, callback, excludeWrapCoord) {
      // Handles null Geometry -- Skips this GeoJSON
      if (geojson === null) return;
      var j,
        k,
        l,
        geometry,
        stopG,
        coords,
        geometryMaybeCollection,
        wrapShrink = 0,
        coordIndex = 0,
        isGeometryCollection,
        type = geojson.type,
        isFeatureCollection = type === "FeatureCollection",
        isFeature = type === "Feature",
        stop = isFeatureCollection ? geojson.features.length : 1;

      // This logic may look a little weird. The reason why it is that way
      // is because it's trying to be fast. GeoJSON supports multiple kinds
      // of objects at its root: FeatureCollection, Features, Geometries.
      // This function has the responsibility of handling all of them, and that
      // means that some of the `for` loops you see below actually just don't apply
      // to certain inputs. For instance, if you give this just a
      // Point geometry, then both loops are short-circuited and all we do
      // is gradually rename the input until it's called 'geometry'.
      //
      // This also aims to allocate as few resources as possible: just a
      // few numbers and booleans, rather than any temporary arrays as would
      // be required with the normalization approach.
      for (var featureIndex = 0; featureIndex < stop; featureIndex++) {
        geometryMaybeCollection = isFeatureCollection
          ? geojson.features[featureIndex].geometry
          : isFeature
          ? geojson.geometry
          : geojson;
        isGeometryCollection = geometryMaybeCollection
          ? geometryMaybeCollection.type === "GeometryCollection"
          : false;
        stopG = isGeometryCollection
          ? geometryMaybeCollection.geometries.length
          : 1;

        for (var geomIndex = 0; geomIndex < stopG; geomIndex++) {
          var multiFeatureIndex = 0;
          var geometryIndex = 0;
          geometry = isGeometryCollection
            ? geometryMaybeCollection.geometries[geomIndex]
            : geometryMaybeCollection;

          // Handles null Geometry -- Skips this geometry
          if (geometry === null) continue;
          coords = geometry.coordinates;
          var geomType = geometry.type;

          wrapShrink =
            excludeWrapCoord &&
            (geomType === "Polygon" || geomType === "MultiPolygon")
              ? 1
              : 0;

          switch (geomType) {
            case null:
              break;
            case "Point":
              if (
                callback(
                  coords,
                  coordIndex,
                  featureIndex,
                  multiFeatureIndex,
                  geometryIndex
                ) === false
              )
                return false;
              coordIndex++;
              multiFeatureIndex++;
              break;
            case "LineString":
            case "MultiPoint":
              for (j = 0; j < coords.length; j++) {
                if (
                  callback(
                    coords[j],
                    coordIndex,
                    featureIndex,
                    multiFeatureIndex,
                    geometryIndex
                  ) === false
                )
                  return false;
                coordIndex++;
                if (geomType === "MultiPoint") multiFeatureIndex++;
              }
              if (geomType === "LineString") multiFeatureIndex++;
              break;
            case "Polygon":
            case "MultiLineString":
              for (j = 0; j < coords.length; j++) {
                for (k = 0; k < coords[j].length - wrapShrink; k++) {
                  if (
                    callback(
                      coords[j][k],
                      coordIndex,
                      featureIndex,
                      multiFeatureIndex,
                      geometryIndex
                    ) === false
                  )
                    return false;
                  coordIndex++;
                }
                if (geomType === "MultiLineString") multiFeatureIndex++;
                if (geomType === "Polygon") geometryIndex++;
              }
              if (geomType === "Polygon") multiFeatureIndex++;
              break;
            case "MultiPolygon":
              for (j = 0; j < coords.length; j++) {
                geometryIndex = 0;
                for (k = 0; k < coords[j].length; k++) {
                  for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                    if (
                      callback(
                        coords[j][k][l],
                        coordIndex,
                        featureIndex,
                        multiFeatureIndex,
                        geometryIndex
                      ) === false
                    )
                      return false;
                    coordIndex++;
                  }
                  geometryIndex++;
                }
                multiFeatureIndex++;
              }
              break;
            case "GeometryCollection":
              for (j = 0; j < geometry.geometries.length; j++)
                if (
                  coordEach(geometry.geometries[j], callback, excludeWrapCoord) ===
                  false
                )
                  return false;
              break;
            default:
              throw new Error("Unknown Geometry Type");
          }
        }
      }
    }

    /**
     * Takes a set of features, calculates the bbox of all input features, and returns a bounding box.
     *
     * @name bbox
     * @param {GeoJSON} geojson any GeoJSON object
     * @returns {BBox} bbox extent in [minX, minY, maxX, maxY] order
     * @example
     * var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
     * var bbox = turf.bbox(line);
     * var bboxPolygon = turf.bboxPolygon(bbox);
     *
     * //addToMap
     * var addToMap = [line, bboxPolygon]
     */
    function bbox(geojson) {
        var result = [Infinity, Infinity, -Infinity, -Infinity];
        coordEach(geojson, function (coord) {
            if (result[0] > coord[0]) {
                result[0] = coord[0];
            }
            if (result[1] > coord[1]) {
                result[1] = coord[1];
            }
            if (result[2] < coord[0]) {
                result[2] = coord[0];
            }
            if (result[3] < coord[1]) {
                result[3] = coord[1];
            }
        });
        return result;
    }
    bbox["default"] = bbox;

    /* src\App.svelte generated by Svelte v3.44.1 */

    const { Object: Object_1$1, console: console_1$2 } = globals;
    const file$2 = "src\\App.svelte";

    // (241:12) <MapLayer                id="fill"                custom={{                  stateBoundaries: stateBoundaries,                  boundaries: boundaries,                  fill: fill,                }}                data={data.pa}                type="fill"                hover={true}                {colorKey}                bind:hovered                select={true}                bind:selected                paint={{                  'fill-color': [                    'case',                    ['!=', ['feature-state', 'color'], null],                    ['feature-state', 'color'],                    'rgba(255, 255, 255, 0)',                  ],                  'fill-opacity': 0.7,                }}              >
    function create_default_slot_3(ctx) {
    	let maptooltip;
    	let current;

    	maptooltip = new MapTooltip({
    			props: { content: `Code: ${/*hovered*/ ctx[7]}` },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(maptooltip.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(maptooltip, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const maptooltip_changes = {};
    			if (dirty[0] & /*hovered*/ 128) maptooltip_changes.content = `Code: ${/*hovered*/ ctx[7]}`;
    			maptooltip.$set(maptooltip_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(maptooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(maptooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(maptooltip, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(241:12) <MapLayer                id=\\\"fill\\\"                custom={{                  stateBoundaries: stateBoundaries,                  boundaries: boundaries,                  fill: fill,                }}                data={data.pa}                type=\\\"fill\\\"                hover={true}                {colorKey}                bind:hovered                select={true}                bind:selected                paint={{                  'fill-color': [                    'case',                    ['!=', ['feature-state', 'color'], null],                    ['feature-state', 'color'],                    'rgba(255, 255, 255, 0)',                  ],                  'fill-opacity': 0.7,                }}              >",
    		ctx
    	});

    	return block;
    }

    // (221:10) <MapSource              id="paBounds"              type="geojson"              data={geojson}              promoteId={paBounds.code}              maxzoom={13}            >
    function create_default_slot_2(ctx) {
    	let maplayer0;
    	let t0;
    	let maplayer1;
    	let updating_hovered;
    	let updating_selected;
    	let t1;
    	let maplayer2;
    	let current;

    	maplayer0 = new MapLayer({
    			props: {
    				id: "boundaries",
    				custom: {
    					stateBoundaries: /*stateBoundaries*/ ctx[11],
    					boundaries: /*boundaries*/ ctx[10],
    					fill: /*fill*/ ctx[9]
    				},
    				type: "line",
    				paint: { 'line-color': 'black', 'line-width': 2 }
    			},
    			$$inline: true
    		});

    	function maplayer1_hovered_binding(value) {
    		/*maplayer1_hovered_binding*/ ctx[17](value);
    	}

    	function maplayer1_selected_binding(value) {
    		/*maplayer1_selected_binding*/ ctx[18](value);
    	}

    	let maplayer1_props = {
    		id: "fill",
    		custom: {
    			stateBoundaries: /*stateBoundaries*/ ctx[11],
    			boundaries: /*boundaries*/ ctx[10],
    			fill: /*fill*/ ctx[9]
    		},
    		data: /*data*/ ctx[2].pa,
    		type: "fill",
    		hover: true,
    		colorKey: /*colorKey*/ ctx[13],
    		select: true,
    		paint: {
    			'fill-color': [
    				'case',
    				['!=', ['feature-state', 'color'], null],
    				['feature-state', 'color'],
    				'rgba(255, 255, 255, 0)'
    			],
    			'fill-opacity': 0.7
    		},
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	};

    	if (/*hovered*/ ctx[7] !== void 0) {
    		maplayer1_props.hovered = /*hovered*/ ctx[7];
    	}

    	if (/*selected*/ ctx[8] !== void 0) {
    		maplayer1_props.selected = /*selected*/ ctx[8];
    	}

    	maplayer1 = new MapLayer({ props: maplayer1_props, $$inline: true });
    	binding_callbacks.push(() => bind(maplayer1, 'hovered', maplayer1_hovered_binding));
    	binding_callbacks.push(() => bind(maplayer1, 'selected', maplayer1_selected_binding));

    	maplayer2 = new MapLayer({
    			props: {
    				id: "highlight",
    				custom: {
    					boundaries: /*boundaries*/ ctx[10],
    					fill: /*fill*/ ctx[9],
    					highlight: /*highlight*/ ctx[12]
    				},
    				type: "line",
    				paint: {
    					'line-color': [
    						'case',
    						['==', ['feature-state', 'selected'], true],
    						'black',
    						['==', ['feature-state', 'hovered'], true],
    						'orange',
    						'rgba(255, 255, 255, 0)'
    					],
    					'line-width': ['case', ['==', ['feature-state', 'selected'], true], 2, 1]
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(maplayer0.$$.fragment);
    			t0 = space();
    			create_component(maplayer1.$$.fragment);
    			t1 = space();
    			create_component(maplayer2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(maplayer0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(maplayer1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(maplayer2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const maplayer0_changes = {};

    			if (dirty[0] & /*stateBoundaries, boundaries, fill*/ 3584) maplayer0_changes.custom = {
    				stateBoundaries: /*stateBoundaries*/ ctx[11],
    				boundaries: /*boundaries*/ ctx[10],
    				fill: /*fill*/ ctx[9]
    			};

    			maplayer0.$set(maplayer0_changes);
    			const maplayer1_changes = {};

    			if (dirty[0] & /*stateBoundaries, boundaries, fill*/ 3584) maplayer1_changes.custom = {
    				stateBoundaries: /*stateBoundaries*/ ctx[11],
    				boundaries: /*boundaries*/ ctx[10],
    				fill: /*fill*/ ctx[9]
    			};

    			if (dirty[0] & /*data*/ 4) maplayer1_changes.data = /*data*/ ctx[2].pa;
    			if (dirty[0] & /*colorKey*/ 8192) maplayer1_changes.colorKey = /*colorKey*/ ctx[13];

    			if (dirty[0] & /*hovered*/ 128 | dirty[1] & /*$$scope*/ 1) {
    				maplayer1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_hovered && dirty[0] & /*hovered*/ 128) {
    				updating_hovered = true;
    				maplayer1_changes.hovered = /*hovered*/ ctx[7];
    				add_flush_callback(() => updating_hovered = false);
    			}

    			if (!updating_selected && dirty[0] & /*selected*/ 256) {
    				updating_selected = true;
    				maplayer1_changes.selected = /*selected*/ ctx[8];
    				add_flush_callback(() => updating_selected = false);
    			}

    			maplayer1.$set(maplayer1_changes);
    			const maplayer2_changes = {};

    			if (dirty[0] & /*boundaries, fill, highlight*/ 5632) maplayer2_changes.custom = {
    				boundaries: /*boundaries*/ ctx[10],
    				fill: /*fill*/ ctx[9],
    				highlight: /*highlight*/ ctx[12]
    			};

    			maplayer2.$set(maplayer2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(maplayer0.$$.fragment, local);
    			transition_in(maplayer1.$$.fragment, local);
    			transition_in(maplayer2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(maplayer0.$$.fragment, local);
    			transition_out(maplayer1.$$.fragment, local);
    			transition_out(maplayer2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(maplayer0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(maplayer1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(maplayer2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(221:10) <MapSource              id=\\\"paBounds\\\"              type=\\\"geojson\\\"              data={geojson}              promoteId={paBounds.code}              maxzoom={13}            >",
    		ctx
    	});

    	return block;
    }

    // (293:10) <MapSource              id="stateBounds"              type="geojson"              data={geojson_state}              promoteId={stateBounds.code}              maxzoom={13}            >
    function create_default_slot_1(ctx) {
    	let maplayer;
    	let current;

    	maplayer = new MapLayer({
    			props: {
    				id: "stateBoundaries",
    				custom: {
    					stateBoundaries: /*stateBoundaries*/ ctx[11],
    					boundaries: /*boundaries*/ ctx[10],
    					fill: /*fill*/ ctx[9]
    				},
    				type: "line",
    				paint: { 'line-color': 'red', 'line-width': 5 }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(maplayer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(maplayer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const maplayer_changes = {};

    			if (dirty[0] & /*stateBoundaries, boundaries, fill*/ 3584) maplayer_changes.custom = {
    				stateBoundaries: /*stateBoundaries*/ ctx[11],
    				boundaries: /*boundaries*/ ctx[10],
    				fill: /*fill*/ ctx[9]
    			};

    			maplayer.$set(maplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(maplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(maplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(maplayer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(293:10) <MapSource              id=\\\"stateBounds\\\"              type=\\\"geojson\\\"              data={geojson_state}              promoteId={stateBounds.code}              maxzoom={13}            >",
    		ctx
    	});

    	return block;
    }

    // (213:8) <Map            id="map"            style="./data/style-osm.json"            location={{ bounds: bounds.pa }}            bind:map            bind:zoom            bind:center          >
    function create_default_slot(ctx) {
    	let mapsource0;
    	let t;
    	let mapsource1;
    	let current;

    	mapsource0 = new MapSource({
    			props: {
    				id: "paBounds",
    				type: "geojson",
    				data: /*geojson*/ ctx[3],
    				promoteId: /*paBounds*/ ctx[14].code,
    				maxzoom: 13,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	mapsource1 = new MapSource({
    			props: {
    				id: "stateBounds",
    				type: "geojson",
    				data: /*geojson_state*/ ctx[4],
    				promoteId: /*stateBounds*/ ctx[15].code,
    				maxzoom: 13,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(mapsource0.$$.fragment);
    			t = space();
    			create_component(mapsource1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(mapsource0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(mapsource1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const mapsource0_changes = {};
    			if (dirty[0] & /*geojson*/ 8) mapsource0_changes.data = /*geojson*/ ctx[3];

    			if (dirty[0] & /*boundaries, fill, highlight, stateBoundaries, data, colorKey, hovered, selected*/ 16260 | dirty[1] & /*$$scope*/ 1) {
    				mapsource0_changes.$$scope = { dirty, ctx };
    			}

    			mapsource0.$set(mapsource0_changes);
    			const mapsource1_changes = {};
    			if (dirty[0] & /*geojson_state*/ 16) mapsource1_changes.data = /*geojson_state*/ ctx[4];

    			if (dirty[0] & /*stateBoundaries, boundaries, fill*/ 3584 | dirty[1] & /*$$scope*/ 1) {
    				mapsource1_changes.$$scope = { dirty, ctx };
    			}

    			mapsource1.$set(mapsource1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mapsource0.$$.fragment, local);
    			transition_in(mapsource1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mapsource0.$$.fragment, local);
    			transition_out(mapsource1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mapsource0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(mapsource1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(213:8) <Map            id=\\\"map\\\"            style=\\\"./data/style-osm.json\\\"            location={{ bounds: bounds.pa }}            bind:map            bind:zoom            bind:center          >",
    		ctx
    	});

    	return block;
    }

    // (210:2) 
    function create_background_slot(ctx) {
    	let div2;
    	let figure;
    	let div1;
    	let map_1;
    	let updating_map;
    	let updating_zoom;
    	let updating_center;
    	let t0;
    	let div0;
    	let t1_value = /*id*/ ctx[0].map + "";
    	let t1;
    	let current;

    	function map_1_map_binding(value) {
    		/*map_1_map_binding*/ ctx[19](value);
    	}

    	function map_1_zoom_binding(value) {
    		/*map_1_zoom_binding*/ ctx[20](value);
    	}

    	function map_1_center_binding(value) {
    		/*map_1_center_binding*/ ctx[21](value);
    	}

    	let map_1_props = {
    		id: "map",
    		style: "./data/style-osm.json",
    		location: { bounds: /*bounds*/ ctx[16].pa },
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*map*/ ctx[1] !== void 0) {
    		map_1_props.map = /*map*/ ctx[1];
    	}

    	if (/*zoom*/ ctx[5] !== void 0) {
    		map_1_props.zoom = /*zoom*/ ctx[5];
    	}

    	if (/*center*/ ctx[6] !== void 0) {
    		map_1_props.center = /*center*/ ctx[6];
    	}

    	map_1 = new Map$1({ props: map_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(map_1, 'map', map_1_map_binding));
    	binding_callbacks.push(() => bind(map_1, 'zoom', map_1_zoom_binding));
    	binding_callbacks.push(() => bind(map_1, 'center', map_1_center_binding));

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			figure = element("figure");
    			div1 = element("div");
    			create_component(map_1.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			attr_dev(div0, "class", "stickDev svelte-11mmfbg");
    			add_location(div0, file$2, 314, 8, 8354);
    			attr_dev(div1, "class", "col-full height-full");
    			add_location(div1, file$2, 211, 6, 5309);
    			add_location(figure, file$2, 210, 4, 5293);
    			attr_dev(div2, "slot", "background");
    			add_location(div2, file$2, 209, 2, 5264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, figure);
    			append_dev(figure, div1);
    			mount_component(map_1, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const map_1_changes = {};

    			if (dirty[0] & /*geojson_state, stateBoundaries, boundaries, fill, geojson, highlight, data, colorKey, hovered, selected*/ 16284 | dirty[1] & /*$$scope*/ 1) {
    				map_1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_map && dirty[0] & /*map*/ 2) {
    				updating_map = true;
    				map_1_changes.map = /*map*/ ctx[1];
    				add_flush_callback(() => updating_map = false);
    			}

    			if (!updating_zoom && dirty[0] & /*zoom*/ 32) {
    				updating_zoom = true;
    				map_1_changes.zoom = /*zoom*/ ctx[5];
    				add_flush_callback(() => updating_zoom = false);
    			}

    			if (!updating_center && dirty[0] & /*center*/ 64) {
    				updating_center = true;
    				map_1_changes.center = /*center*/ ctx[6];
    				add_flush_callback(() => updating_center = false);
    			}

    			map_1.$set(map_1_changes);
    			if ((!current || dirty[0] & /*id*/ 1) && t1_value !== (t1_value = /*id*/ ctx[0].map + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(map_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_background_slot.name,
    		type: "slot",
    		source: "(210:2) ",
    		ctx
    	});

    	return block;
    }

    // (322:2) 
    function create_foreground_slot(ctx) {
    	let div6;
    	let section0;
    	let div0;
    	let p0;
    	let strong0;
    	let t1;
    	let section1;
    	let div1;
    	let p1;
    	let strong1;
    	let t3;
    	let section2;
    	let div2;
    	let p2;
    	let strong2;
    	let t5;
    	let section3;
    	let div3;
    	let p3;
    	let strong3;
    	let t7;
    	let section4;
    	let div4;
    	let p4;
    	let strong4;
    	let t9;
    	let section5;
    	let div5;
    	let p5;
    	let strong5;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			section0 = element("section");
    			div0 = element("div");
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "OSM base map";
    			t1 = space();
    			section1 = element("section");
    			div1 = element("div");
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "add boundaries";
    			t3 = space();
    			section2 = element("section");
    			div2 = element("div");
    			p2 = element("p");
    			strong2 = element("strong");
    			strong2.textContent = "add median age data layer";
    			t5 = space();
    			section3 = element("section");
    			div3 = element("div");
    			p3 = element("p");
    			strong3 = element("strong");
    			strong3.textContent = "show salary layer";
    			t7 = space();
    			section4 = element("section");
    			div4 = element("div");
    			p4 = element("p");
    			strong4 = element("strong");
    			strong4.textContent = "zoom in on a specific unit";
    			t9 = space();
    			section5 = element("section");
    			div5 = element("div");
    			p5 = element("p");
    			strong5 = element("strong");
    			strong5.textContent = "Lets go back to boundaries and add a layer for state boundaries.";
    			add_location(strong0, file$2, 324, 11, 8556);
    			add_location(p0, file$2, 324, 8, 8553);
    			attr_dev(div0, "class", "col-medium");
    			add_location(div0, file$2, 323, 6, 8519);
    			attr_dev(section0, "data-id", "map01");
    			add_location(section0, file$2, 322, 4, 8486);
    			add_location(strong1, file$2, 329, 11, 8695);
    			add_location(p1, file$2, 329, 8, 8692);
    			attr_dev(div1, "class", "col-medium");
    			add_location(div1, file$2, 328, 6, 8658);
    			attr_dev(section1, "data-id", "map02");
    			add_location(section1, file$2, 327, 4, 8625);
    			add_location(strong2, file$2, 334, 11, 8836);
    			add_location(p2, file$2, 334, 8, 8833);
    			attr_dev(div2, "class", "col-medium");
    			add_location(div2, file$2, 333, 6, 8799);
    			attr_dev(section2, "data-id", "map03");
    			add_location(section2, file$2, 332, 4, 8766);
    			add_location(strong3, file$2, 339, 11, 8988);
    			add_location(p3, file$2, 339, 8, 8985);
    			attr_dev(div3, "class", "col-medium");
    			add_location(div3, file$2, 338, 6, 8951);
    			attr_dev(section3, "data-id", "map04");
    			add_location(section3, file$2, 337, 4, 8918);
    			add_location(strong4, file$2, 344, 11, 9132);
    			add_location(p4, file$2, 344, 8, 9129);
    			attr_dev(div4, "class", "col-medium");
    			add_location(div4, file$2, 343, 6, 9095);
    			attr_dev(section4, "data-id", "map05");
    			add_location(section4, file$2, 342, 4, 9062);
    			add_location(strong5, file$2, 350, 10, 9297);
    			add_location(p5, file$2, 349, 8, 9282);
    			attr_dev(div5, "class", "col-medium");
    			add_location(div5, file$2, 348, 6, 9248);
    			attr_dev(section5, "data-id", "map06");
    			add_location(section5, file$2, 347, 4, 9215);
    			attr_dev(div6, "slot", "foreground");
    			add_location(div6, file$2, 321, 2, 8457);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, section0);
    			append_dev(section0, div0);
    			append_dev(div0, p0);
    			append_dev(p0, strong0);
    			append_dev(div6, t1);
    			append_dev(div6, section1);
    			append_dev(section1, div1);
    			append_dev(div1, p1);
    			append_dev(p1, strong1);
    			append_dev(div6, t3);
    			append_dev(div6, section2);
    			append_dev(section2, div2);
    			append_dev(div2, p2);
    			append_dev(p2, strong2);
    			append_dev(div6, t5);
    			append_dev(div6, section3);
    			append_dev(section3, div3);
    			append_dev(div3, p3);
    			append_dev(p3, strong3);
    			append_dev(div6, t7);
    			append_dev(div6, section4);
    			append_dev(section4, div4);
    			append_dev(div4, p4);
    			append_dev(p4, strong4);
    			append_dev(div6, t9);
    			append_dev(div6, section5);
    			append_dev(section5, div5);
    			append_dev(div5, p5);
    			append_dev(p5, strong5);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_foreground_slot.name,
    		type: "slot",
    		source: "(322:2) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let scroller;
    	let updating_id;
    	let current;

    	function scroller_id_binding(value) {
    		/*scroller_id_binding*/ ctx[22](value);
    	}

    	let scroller_props = {
    		threshold,
    		splitscreen: true,
    		$$slots: {
    			foreground: [create_foreground_slot],
    			background: [create_background_slot]
    		},
    		$$scope: { ctx }
    	};

    	if (/*id*/ ctx[0]['map'] !== void 0) {
    		scroller_props.id = /*id*/ ctx[0]['map'];
    	}

    	scroller = new Scroller({ props: scroller_props, $$inline: true });
    	binding_callbacks.push(() => bind(scroller, 'id', scroller_id_binding));

    	const block = {
    		c: function create() {
    			create_component(scroller.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(scroller, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scroller_changes = {};

    			if (dirty[0] & /*id, map, zoom, center, geojson_state, stateBoundaries, boundaries, fill, geojson, highlight, data, colorKey, hovered, selected*/ 16383 | dirty[1] & /*$$scope*/ 1) {
    				scroller_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_id && dirty[0] & /*id*/ 1) {
    				updating_id = true;
    				scroller_changes.id = /*id*/ ctx[0]['map'];
    				add_flush_callback(() => updating_id = false);
    			}

    			scroller.$set(scroller_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scroller.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scroller.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scroller, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const threshold = 0.65;

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const colors = {
    		seq5: [
    			'rgb(234, 236, 177)',
    			'rgb(169, 216, 145)',
    			'rgb(0, 167, 186)',
    			'rgb(0, 78, 166)',
    			'rgb(0, 13, 84)'
    		],
    		div10: [
    			'#67001f',
    			'#b2182b',
    			'#d6604d',
    			'#f4a582',
    			'#fddbc7',
    			'#d1e5f0',
    			'#92c5de',
    			'#4393c3',
    			'#2166ac',
    			'#053061'
    		]
    	};

    	const paBounds = {
    		url: './data/geo_counties.json',
    		layer: 'geog',
    		code: 'AREANM'
    	};

    	const stateBounds = {
    		url: './data/geo_states.json',
    		layer: 'geog',
    		code: 'AREANM'
    	};

    	const bounds = {
    		pa: [[-80.519851, 38.788657], [-66.885444, 47.459833]]
    	};

    	// Bindings
    	let map;

    	// Data
    	let data = {};

    	let geojson;
    	let geojson_state;

    	// State
    	let zoom;

    	let center = {};
    	let hovered, selected;

    	// Get geometry for geojson maps
    	getTopo(paBounds.url, paBounds.layer).then(res => {
    		$$invalidate(3, geojson = res);
    		console.log(`geojson`);
    		console.log(geojson);
    	});

    	getTopo(stateBounds.url, stateBounds.layer).then(res => {
    		$$invalidate(4, geojson_state = res);
    		console.log(`geojson_state`);
    		console.log(geojson_state);
    	});

    	// Get data for geojson maps
    	getData('./data/data_county.csv').then(res => {
    		$$invalidate(2, data.pa = res, data);
    	});

    	// Functions for map component
    	function fitBounds(bounds) {
    		if (map) {
    			map.fitBounds(bounds, { animate: true, padding: 30 });
    		}
    	}

    	function fitById(id) {
    		if (geojson && id) {
    			let feature = geojson.features.filter(d => d.properties.AREANM == id)[0];
    			let bbox_tmp = bbox(feature.geometry);
    			fitBounds(bbox_tmp);
    		}
    	}

    	let id = {}; // Object to hold visible section IDs of Scroller components
    	let idPrev = {}; // Object to keep track of previous IDs, to compare for changes

    	onMount(() => {
    		idPrev = { ...id };
    	});

    	function runActions(codes = []) {
    		//// Code to run Scroller actions when new caption IDs come into view
    		codes.forEach(code => {
    			if (id[code] != idPrev[code]) {
    				// if caption id changes then run then run following code to update chart
    				if (actions[code][id[code]]) {
    					actions[code][id[code]]();
    				}

    				idPrev[code] = id[code];
    			}
    		});
    	}

    	// # ============================================================================ #
    	// #### Scroller Action
    	let showSources = true;

    	let visLayers = true;
    	let fill = false;
    	let boundaries = false;
    	let stateBoundaries = false;
    	let highlight = false;
    	let colorKey;

    	let actions = {
    		map: {
    			map01: () => {
    				console.log(`######### map01`);
    				fitBounds(bounds.pa);
    				$$invalidate(10, boundaries = false);
    				$$invalidate(9, fill = false);
    				$$invalidate(12, highlight = false);
    				$$invalidate(11, stateBoundaries = false);
    			},
    			map02: () => {
    				console.log(`######### map02`);
    				fitBounds(bounds.pa);
    				$$invalidate(10, boundaries = true);
    				$$invalidate(9, fill = false);
    				$$invalidate(12, highlight = false);
    				$$invalidate(11, stateBoundaries = false);
    			},
    			map03: () => {
    				console.log(`######### map03`);
    				fitBounds(bounds.pa);
    				$$invalidate(10, boundaries = false);
    				$$invalidate(9, fill = true);
    				$$invalidate(13, colorKey = 'color_age_med');
    				$$invalidate(12, highlight = true);
    				$$invalidate(11, stateBoundaries = false);
    			},
    			map04: () => {
    				console.log(`######### map04`);
    				fitBounds(bounds.pa);
    				$$invalidate(10, boundaries = false);
    				$$invalidate(9, fill = true);
    				$$invalidate(13, colorKey = 'color_salary');
    				$$invalidate(12, highlight = true);
    				$$invalidate(11, stateBoundaries = false);
    			},
    			map05: () => {
    				console.log(`######### map05`);
    				fitById('Philadelphia, PA');
    				$$invalidate(10, boundaries = false);
    				$$invalidate(9, fill = true);
    				$$invalidate(13, colorKey = 'color_salary');
    				$$invalidate(12, highlight = true);
    				$$invalidate(11, stateBoundaries = false);
    			},
    			map06: () => {
    				console.log(`######### map06`);
    				fitBounds(bounds.pa);
    				$$invalidate(10, boundaries = true);
    				$$invalidate(9, fill = false);
    				$$invalidate(12, highlight = false);
    				$$invalidate(11, stateBoundaries = true);
    			}
    		}
    	};

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function maplayer1_hovered_binding(value) {
    		hovered = value;
    		$$invalidate(7, hovered);
    	}

    	function maplayer1_selected_binding(value) {
    		selected = value;
    		$$invalidate(8, selected);
    	}

    	function map_1_map_binding(value) {
    		map = value;
    		$$invalidate(1, map);
    	}

    	function map_1_zoom_binding(value) {
    		zoom = value;
    		$$invalidate(5, zoom);
    	}

    	function map_1_center_binding(value) {
    		center = value;
    		$$invalidate(6, center);
    	}

    	function scroller_id_binding(value) {
    		if ($$self.$$.not_equal(id['map'], value)) {
    			id['map'] = value;
    			$$invalidate(0, id);
    		}
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Scroller,
    		Map: Map$1,
    		MapSource,
    		MapLayer,
    		MapTooltip,
    		getData,
    		getColor,
    		getTopo,
    		bbox,
    		colors,
    		paBounds,
    		stateBounds,
    		bounds,
    		map,
    		data,
    		geojson,
    		geojson_state,
    		zoom,
    		center,
    		hovered,
    		selected,
    		fitBounds,
    		fitById,
    		threshold,
    		id,
    		idPrev,
    		runActions,
    		showSources,
    		visLayers,
    		fill,
    		boundaries,
    		stateBoundaries,
    		highlight,
    		colorKey,
    		actions
    	});

    	$$self.$inject_state = $$props => {
    		if ('map' in $$props) $$invalidate(1, map = $$props.map);
    		if ('data' in $$props) $$invalidate(2, data = $$props.data);
    		if ('geojson' in $$props) $$invalidate(3, geojson = $$props.geojson);
    		if ('geojson_state' in $$props) $$invalidate(4, geojson_state = $$props.geojson_state);
    		if ('zoom' in $$props) $$invalidate(5, zoom = $$props.zoom);
    		if ('center' in $$props) $$invalidate(6, center = $$props.center);
    		if ('hovered' in $$props) $$invalidate(7, hovered = $$props.hovered);
    		if ('selected' in $$props) $$invalidate(8, selected = $$props.selected);
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('idPrev' in $$props) idPrev = $$props.idPrev;
    		if ('showSources' in $$props) showSources = $$props.showSources;
    		if ('visLayers' in $$props) visLayers = $$props.visLayers;
    		if ('fill' in $$props) $$invalidate(9, fill = $$props.fill);
    		if ('boundaries' in $$props) $$invalidate(10, boundaries = $$props.boundaries);
    		if ('stateBoundaries' in $$props) $$invalidate(11, stateBoundaries = $$props.stateBoundaries);
    		if ('highlight' in $$props) $$invalidate(12, highlight = $$props.highlight);
    		if ('colorKey' in $$props) $$invalidate(13, colorKey = $$props.colorKey);
    		if ('actions' in $$props) $$invalidate(30, actions = $$props.actions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*id*/ 1) {
    			 {
    				// Run above code when 'id' object changes
    				if (id) {
    					runActions(Object.keys(actions));
    				}
    			}
    		}
    	};

    	return [
    		id,
    		map,
    		data,
    		geojson,
    		geojson_state,
    		zoom,
    		center,
    		hovered,
    		selected,
    		fill,
    		boundaries,
    		stateBoundaries,
    		highlight,
    		colorKey,
    		paBounds,
    		stateBounds,
    		bounds,
    		maplayer1_hovered_binding,
    		maplayer1_selected_binding,
    		map_1_map_binding,
    		map_1_zoom_binding,
    		map_1_center_binding,
    		scroller_id_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
