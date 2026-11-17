"""
The smallest possible example of having a conversation with an LLM in Python.
Start here if you want to understand how Pip works. The real game code (services/llm_service.py)
uses exactly the same idea, plus some extra safety.

Run it (from the backend folder, with the Ollama app open):
    ollama pull qwen2.5:3b
    uv run python tools/chat_with_pip.py

Then type as if you were the child. Type "bye" to stop.
"""

from ollama import chat

MODEL = "qwen2.5:3b"

# 1) The SYSTEM message: tells the model who it is and how to behave. The child never sees this.
messages = [
    {
        "role": "system",
        "content": (
            "You are Pip, a friendly waiter at a restaurant in a game for children aged 6 to 10. "
            "The child is your helper. Speak in short, simple, warm sentences. Never say 'wrong'."
        ),
    }
]

print("Pip is ready! Type something (or 'bye' to stop).\n")

while True:
    # 2) A USER message: what the child says.
    text = input("You: ")
    if text.strip().lower() == "bye":
        break
    messages.append({"role": "user", "content": text})

    # 3) Send the WHOLE conversation so far to the model. It has no memory of its own:
    #    the list of messages IS its memory.
    response = chat(model=MODEL, messages=messages, options={"temperature": 0.7})
    answer = response.message.content

    # 4) Store the model's answer as an ASSISTANT message, so it remembers it next turn.
    messages.append({"role": "assistant", "content": answer})
    print("Pip:", answer, "\n")

# 5) Look at what was actually sent to the model: just a list of messages with roles.
print("\n--- The conversation as the model sees it ---")
for m in messages:
    print(f"[{m['role']}] {m['content']}")
