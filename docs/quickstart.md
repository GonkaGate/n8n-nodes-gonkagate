# Quickstart

This is the fastest path to your first GonkaGate request in self-hosted `n8n`.

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

### 1. Install The Package

Follow the self-hosted install path in [Installation Guide](./install.md).

If you already have the package installed, skip to step 2.

### 2. Import The Example Workflow

Import this workflow into `n8n`:

- [GonkaGate First Request Workflow](../examples/quickstart/gonkagate-first-request.workflow.json)

This example already includes:

- `Manual Trigger`
- `GonkaGate`
- `Chat Completion`
- a starter user message

What you still need to do after import:

- select or create a `GonkaGate API` credential
- choose a model from the live list
- or switch to `ID` mode and enter a model manually

### 3. Create The Credential

In the imported `GonkaGate` node:

1. Open credentials.
2. Create `GonkaGate API`.
3. Paste your API key.
4. Save the credential.

You do not need to type the base URL manually in the common case.

### 4. Choose A Model

Recommended order:

1. Try the live model list first.
2. If the list is empty or unavailable, switch the model field to `ID`.
3. Enter a known-good model ID manually.

### 5. Run The Workflow

Click `Execute workflow`, then run the `Manual Trigger`.

If everything is configured correctly, the `GonkaGate` node should return one
final JSON response from `POST /v1/chat/completions`.

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
2. Add `GonkaGate`.
3. Set `Operation` to `Chat Completion`.
4. Select or create `GonkaGate API`.
5. Pick a model from the list, or enter one via `ID`.
6. Leave the starter messages as-is and run the node.

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
