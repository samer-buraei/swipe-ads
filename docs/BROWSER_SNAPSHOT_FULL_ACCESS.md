# How to Get Full `browser_snapshot` Result (Accessibility Tree + Refs)

## What’s going wrong

The **cursor-ide-browser** MCP returns a full result from `browser_snapshot` that includes:

- **Metadata** (viewId, title, url, locked) — **this is what the model currently sees**
- **Accessibility tree** (YAML with role, name, and **ref** for each element, e.g. `e21`, `e22`, …) — **this is not passed to the model**

So you see “Unsupported content type” and only the metadata. The model never gets the refs, so it can’t use `browser_click` or `browser_type` with valid refs.

This is a **Cursor client** behavior: the client receives the full tool result but only forwards one part (the “metadata” content type) to the model. The rest is either dropped or treated as unsupported and not sent.

---

## Is there a “full access” setting?

**No.** There is no Cursor setting (in Settings, `mcp.json`, or elsewhere) that says “pass full browser_snapshot result to the model.” The behavior is built into how Cursor handles MCP tool responses and is not user-configurable today.

---

## What you can do

### 1. Ask Cursor to fix it (recommended)

- **Forum idea (upvote/comment):**  
  [Pass full browser_snapshot result to the model](https://forum.cursor.com/t/pass-full-browser-snapshot-result-to-the-model/152907)  
  This asks Cursor to pass the full response (including the accessibility tree) to the model as text.
- **Check Cursor release notes** after each update to see if they mention “browser snapshot” or “MCP tool result” / “full tool response.”

### 2. Use the snapshot you see in the UI (workaround)

If the **full snapshot (with refs) is visible in the Cursor UI** when the tool runs:

- Manually **copy** the snapshot text (the YAML/tree with refs) from the tool result in the chat.
- **Paste** it into your next message and say: “Use these refs to click/type: …”
- The model can then use those refs for `browser_click` and `browser_type` in follow-up tool calls.

This is tedious but works without any new Cursor feature.

### 3. Run the test plan manually

For the SwipeMarket “FULL FEATURE TEST PLAN” in **AGENTS.md**, run the steps yourself in a normal browser and fill in the FINAL SUMMARY table. No MCP snapshot needed.

### 4. Try another browser MCP (advanced)

Some third-party MCPs (e.g. **Browser-Tools MCP**, **Playwright MCP**) return snapshot/content in a single text response, which Cursor may pass through. That would require:

- Installing and configuring that MCP in Cursor
- Adapting the test plan to that MCP’s tools and response format

---

## Summary

| Question | Answer |
|----------|--------|
| How do I give “full access” to the snapshot? | There is no setting for that; the client currently doesn’t pass the full result to the model. |
| Who has to change something? | **Cursor** (client) needs to pass the full `browser_snapshot` result (including the accessibility tree) as text to the model. |
| What can I do now? | Upvote the forum idea, use Cursor updates, copy/paste snapshot from UI, run tests manually, or use another browser MCP. |
