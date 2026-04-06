# Quickstart

This is the fastest path to your first GonkaGate request after the package is
already installed in self-hosted `n8n`.

Before you start, install the package using one of the supported paths in the
[Installation Guide](./install.md).

Recommended first path:

- install the package
- create `GonkaGate API`
- use the root node `GonkaGate`
- run `Chat Completion`

Do not start with `GonkaGate Chat Model` unless you already know you need an
AI Agent or another `n8n` AI workflow shape.

## Which Node Should You Use?

| If you want to...                           | Start with...                | Why                                                  |
| ------------------------------------------- | ---------------------------- | ---------------------------------------------------- |
| Get your first response as fast as possible | `GonkaGate`                  | Smallest setup surface, direct request/response path |
| Inspect which models are currently exposed  | `GonkaGate` -> `List Models` | Fastest way to verify auth and model discovery       |
| Use AI Agent / AI chain style workflows     | `GonkaGate Chat Model`       | This is the additive `AiLanguageModel` surface       |
| Debug auth or connectivity first            | `GonkaGate`                  | Easier to isolate than a larger AI workflow          |

## Fastest Path To First Request

### 1. Open The n8n UI

Open `http://localhost:5678` in your browser.

If your `n8n` instance runs on another host or domain, open that URL instead.

### 2. Create A Blank Workflow

Click `Start from scratch`.

### 3. Add `Manual Trigger`

Add a `Manual Trigger` node first.

### 4. Add The GonkaGate Node

1. Click `+` to add the next node.
2. In the current `n8n` UI, the picker may open on `AI Nodes`.
3. Type `gonka` or `GonkaGate` into the search box.
4. Look at `Results in other categories` if the picker header still says
   `AI Nodes`.
5. Choose `GonkaGate` for the first check.

Do not start with `GonkaGate Chat Model` for your first validation run.
Use `GonkaGate` first, then move to the chat-model node later if needed.
If search also shows `GonkaGate Tool`, skip it for the first check too.

### 5. Test `List Models` First

In the `GonkaGate` node:

1. Set `Operation` to `List Models`.
2. Open credentials.
3. Create `GonkaGate API`.
4. Paste your API key.
5. Save the credential.
6. Run the node with `Execute step` or `Execute workflow`.

You do not need to type the base URL manually in the common case.

If everything is wired correctly, you should get a JSON response from
`GET /v1/models`.
That is the fastest way to confirm the installed GonkaGate package is loaded
and can authenticate successfully.

### 6. Test `Chat Completion`

After `List Models` works:

1. Change `Operation` to `Chat Completion`.
2. Try the live model list first.
3. If the list is empty or unavailable, switch the model field to `ID`.
4. Enter a known-good model ID manually if needed.
5. Leave one simple user message such as `Hello from n8n`.
6. Run the node again.

If everything is configured correctly, the `GonkaGate` node should return one
final JSON response from `POST /v1/chat/completions`.

### 7. Optional: Import The Example Workflow

If you prefer to skip the manual setup after the first check, import this
workflow into `n8n`:

- [GonkaGate First Request Workflow](../examples/quickstart/gonkagate-first-request.workflow.json)

This example already includes:

- `Manual Trigger`
- `GonkaGate`
- `Chat Completion`
- a starter user message

## Expected Successful Result

The exact payload depends on GonkaGate and the selected model, but the response
should look roughly like this:

```json
{
	"id": "chatcmpl_...",
	"object": "chat.completion",
	"model": "your-model-id",
	"choices": [
		{
			"index": 0,
			"message": {
				"role": "assistant",
				"content": "Hello from GonkaGate"
			}
		}
	],
	"usage": {
		"prompt_tokens": 12,
		"completion_tokens": 18,
		"total_tokens": 30
	}
}
```

Treat this as an example shape, not a hardcoded contract sample.

## If You Prefer To Build The Workflow Manually

Create this minimal flow:

1. Add `Manual Trigger`.
2. Click `+`.
3. If the node picker opens in `AI Nodes`, search for `gonka`.
4. Choose `GonkaGate` from `Results in other categories`.
5. Ignore `GonkaGate Tool` and `GonkaGate Chat Model` for the first check.
6. Set `Operation` to `Chat Completion`.
7. Select or create `GonkaGate API`.
8. Pick a model from the list, or enter one via `ID`.
9. Leave the starter messages as-is and run the node.

## What To Do Next

Once the root node works, your next most useful steps are:

1. Use `GonkaGate` -> `List Models` to inspect the current model catalog.
2. Move to `GonkaGate Chat Model` if you want `AI Agent` or other
   `AiLanguageModel` workflows.
3. Only test streaming after the basic non-streaming request path is working.

## Troubleshooting In Under Two Minutes

### No models appear in the live list

- This can happen because `/v1/models` may return an empty set.
- Switch the model field to `ID` mode and enter a manual model ID.

### The credential fails immediately

- Recreate the credential if it was created before the official hidden base URL
  default was added.
- The current expected hidden base URL is `https://api.gonkagate.com/v1`.

### The package installed but the node does not show up

- Restart `n8n`.
- If you use queue mode or workers, make sure the same package version is
  installed on every runtime process.

### You are trying to start with `GonkaGate Chat Model`

- If you only want the first successful request, go back to the root
  `GonkaGate` node first.
- `GonkaGate Chat Model` is best used after you have already proven the
  credential and model path with the root node.

### You expected visible chunk-by-chunk streaming in the root node

- The root node is intentionally non-streaming.
- Use `GonkaGate Chat Model` in a streaming-capable AI workflow shape if you
  need visible live streaming.
