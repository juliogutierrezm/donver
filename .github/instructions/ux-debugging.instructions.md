# Donver — UX Debugging Checklist (Chrome DevTools MCP)

<!-- applyTo: "src/**/*.{ts,tsx}" -->

Use this checklist when investigating visual bugs, broken interactions, failed API calls, or rendering anomalies. Apply it in order — most issues are caught in the first three sections.

---

## 1. Console

- [ ] Open DevTools → **Console** tab.
- [ ] Filter for `error` and `warning` level messages.
- [ ] Check for:
  - React rendering errors or uncaught exceptions.
  - Unhandled promise rejections.
  - Missing environment variables or undefined references.
  - CORS errors (often appear here as network policy messages).
- [ ] Note the exact error message — do not paraphrase it when reporting.

---

## 2. Network

- [ ] Open DevTools → **Network** tab. Reload or reproduce the issue.
- [ ] Filter by **Fetch/XHR**.
- [ ] For each suspicious request, check:
  - **URL** — Is it hitting the correct endpoint?
  - **Method** — GET / POST / PUT / DELETE as expected?
  - **Status code** — 200, 400, 401, 403, 404, 500?
  - **Request headers** — Is `Authorization` present and correct?
  - **Request payload** — Is the body valid JSON with the expected fields?
  - **Response body** — Does it match the expected shape? Is there an error `message` field?
  - **CORS** — Is `Access-Control-Allow-Origin` present in the response headers?

---

## 3. CORS

- [ ] If the browser blocks a request, look for the **CORS error** in Console.
- [ ] Verify that API Gateway returns CORS headers on **both** success and error responses.
- [ ] Check the Lambda handler returns the correct headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`).
- [ ] For preflight (`OPTIONS`) requests, confirm API Gateway handles them correctly.

---

## 4. React state / render

- [ ] Open DevTools → **React** tab (if React DevTools extension is installed).
- [ ] Verify component props and state match expectations.
- [ ] Check for:
  - Components rendering before data is loaded (flash of empty state).
  - Stale TanStack Query cache showing old data after a mutation.
  - `isLoading` never becoming `false` (stuck spinner).
  - Conditional rendering on `undefined` vs `null` vs empty array.

---

## 5. Leaflet / Map debugging

If a map (Leaflet / `react-leaflet`) is not rendering or is blank:

- [ ] Verify that `leaflet/dist/leaflet.css` is imported (missing CSS is the #1 cause of blank maps).
- [ ] Confirm the map container has an **explicit CSS height** (`height: 400px` or equivalent). A container with `height: 0` renders nothing.
- [ ] Check if the map is mounted inside a hidden element (e.g., a tab or modal that starts closed). If so, call `map.invalidateSize()` after the container becomes visible.
- [ ] Open Network tab → filter by `tile` or `openstreetmap` — verify tile images are loading (200 OK).
- [ ] Inspect the actual DOM dimensions of `.leaflet-container` — confirm width and height are non-zero.
- [ ] Check Console for `Map container not found` or `addLayer` errors.

---

## 6. Performance

- [ ] Open DevTools → **Performance** or **Lighthouse** tab.
- [ ] Look for:
  - Duplicate API requests for the same resource (TanStack Query key mismatch).
  - Waterfall delays — sequential requests that could be parallelised.
  - Large uncompressed assets (images > 500 KB, un-split JS bundles).
  - Render-blocking resources.
- [ ] Check for **silent errors** — requests that return 200 but contain error payloads (some APIs wrap errors in 200 responses).

---

## 7. Layout / CSS

- [ ] Use DevTools → **Elements** tab to inspect the problematic element.
- [ ] Check computed styles for unexpected `overflow: hidden`, `display: none`, or `visibility: hidden`.
- [ ] Verify z-index stacking for overlapping elements (e.g., modals, dropdowns, map controls).
- [ ] Check responsive breakpoints — resize the viewport to the reported screen size.
- [ ] Confirm Tailwind classes are being applied (check if the class exists in the generated CSS via the **Sources** or **Coverage** tab).

---

## Reporting a bug

After completing the checklist, summarise:

```
## Bug report

**Symptom**: [What the user sees]
**Console errors**: [Exact messages or "none"]
**Network**: [Failing requests, status codes, payloads]
**Root cause hypothesis**: [Based on above evidence]
**Files to investigate**: [List]
**Proposed fix**: [Minimum change needed]
```

---

## Chrome DevTools MCP usage

When using Chrome DevTools MCP tools in an agent context:

1. **Take a screenshot** first to understand the current visual state.
2. **Check console messages** (`list_console_messages`) for errors.
3. **Check network requests** (`list_network_requests`) for failed API calls.
4. **Inspect elements** (`take_snapshot`) to verify DOM structure.
5. **Avoid clicking or filling forms** unless the task explicitly requires interaction testing.
6. Always **close the page** or **restore state** after debugging — do not leave stale test data.
