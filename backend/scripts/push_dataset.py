from huggingface_hub import HfApi
import os
from dotenv import load_dotenv

# Resolve the absolute path to the .env file in the backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, "../.env")
success = load_dotenv(dotenv_path=env_path, override=True)
print(f"Debug: load_dotenv status: {success}")

# Manual parsing to be safe
def get_token_manually(path):
    if not os.path.exists(path): return None
    with open(path, 'r') as f:
        for line in f:
            clean_line = line.strip()
            if clean_line.startswith("HF_TOKEN="):
                print(f"Debug: Found line matching HF_TOKEN: {clean_line[:20]}...")
                val = clean_line.split("=")[1].strip().strip('"').strip("'")
                return val
    return None

def push_to_hub():
    token = get_token_manually(env_path)
    print(f"Debug: Manual token extraction found: {'[SET]' if token else '[NOT SET]'}")
    if token:
        print(f"Debug: Token starts with: {token[:10]}...")
    
    if not token or token == "your_hugging_face_write_token_here":
        print(f"Error: HF_TOKEN not found or is still the placeholder. (Path checked: {env_path})")
        # Let's print the first few chars of the file to see what we are reading
        try:
            with open(env_path, 'r') as f:
                print(f"Debug: First 50 chars of file: {f.read(50)}...")
        except: pass
        return

    api = HfApi()
    
    # Define the dataset repository ID
    repo_id = "AshokChakravarthy/ai-code-review-dataset"
    
    # Path to the dataset file
    file_path = os.path.join(os.path.dirname(__file__), "../dataset.jsonl")
    
    if not os.path.exists(file_path):
        print(f"Error: Dataset file not found at {file_path}")
        return

    print(f"Pushing {file_path} to {repo_id}...")
    
    try:
        # Create the repo if it doesn't exist
        api.create_repo(repo_id=repo_id, repo_type="dataset", exist_ok=True, token=token)
        
        # Upload the file
        api.upload_file(
            path_or_fileobj=file_path,
            path_in_repo="dataset.jsonl",
            repo_id=repo_id,
            repo_type="dataset",
            token=token
        )
        print(f"Successfully pushed dataset to https://huggingface.co/datasets/{repo_id}")
    except Exception as e:
        print(f"Failed to push dataset: {e}")

if __name__ == "__main__":
    push_to_hub()
