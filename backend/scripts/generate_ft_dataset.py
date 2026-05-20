import json
import os

def generate_dataset():
    """
    Generates a dummy HF-compatible dataset for fine-tuning.
    Format: {"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
    """
    system_prompt = "You are an expert AI Code Reviewer. Provide a 10-step structured evaluation with visual diffs."
    
    examples = [
        {
            "input": "def add(a, b): return a+b",
            "output": "### Code Review\n- Language: Python\n- Syntax: OK\n- Tip: Add docstrings.\n\n```diff\n- def add(a, b):\n+ def add(a: int, b: int) -> int:\n```"
        },
        {
            "input": "for i in range(len(mylist)): print(mylist[i])",
            "output": "### Code Review\n- Performance: Efficient\n- Tip: Use direct iteration.\n\n```diff\n- for i in range(len(mylist)): print(mylist[i])\n+ for item in mylist: print(item)\n```"
        }
    ]
    
    output_path = "dataset.jsonl"
    
    with open(output_path, "w") as f:
        for ex in examples:
            entry = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": ex["input"]},
                    {"role": "assistant", "content": ex["output"]}
                ]
            }
            f.write(json.dumps(entry) + "\n")
            
    print(f"Dataset generated at {os.path.abspath(output_path)}")

if __name__ == "__main__":
    generate_dataset()
