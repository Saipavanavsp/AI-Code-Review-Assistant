import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer, SFTConfig
import os
from dotenv import load_dotenv

load_dotenv()

# Suppress Hugging Face symlink warnings on Windows
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# 1. Hardware & Quantization Check
device = "cuda" if torch.cuda.is_available() else "cpu"

if device == "cuda":
    print("GPU detected. Enabling 4-bit quantization.")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
    )
else:
    print("WARNING: No GPU detected. Disabling quantization. Training will be EXTREMELY slow on CPU.")
    bnb_config = None

# 2. Load Base Open Source Coding Model
# Switched to 1.3B for faster initialization and testing on local hardware
model_id = "deepseek-ai/deepseek-coder-1.3b-instruct" 
model = AutoModelForCausalLM.from_pretrained(
    model_id, 
    quantization_config=bnb_config, 
    device_map=device if device == "cuda" else None, 
    token=os.getenv("HF_TOKEN")
)
tokenizer = AutoTokenizer.from_pretrained(model_id, token=os.getenv("HF_TOKEN"))
tokenizer.pad_token = tokenizer.eos_token

# 3. LoRA Configurations (Specifies which layers to update)
peft_config = LoraConfig(
    r=16, 
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"], # Targets target attention layers
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)
# model = get_peft_model(model, peft_config) # SFTTrainer will handle this automatically

# 4. Load your generated data
# Robust path resolution: find dataset.jsonl in the project root
current_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.abspath(os.path.join(current_dir, "../../dataset.jsonl"))

if not os.path.exists(dataset_path):
    raise FileNotFoundError(f"Could not find dataset.jsonl at {dataset_path}")

dataset = load_dataset("json", data_files=dataset_path, split="train")

# 5. Define Training Rules (Using SFTConfig for TRL 1.4.0+)
training_args = SFTConfig(
    output_dir="./results_code_reviewer",
    per_device_train_batch_size=1, 
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    logging_steps=10,
    num_train_epochs=3,
    fp16=(device == "cuda"), # Only use FP16 on GPU
    use_cpu=(device == "cpu"), # Explicitly tell transformers to use CPU
    push_to_hub=True,
    hub_model_id="AshokChakravarthy/deepseek-7b-code-reviewer-lora",
    hub_token=os.getenv("HF_TOKEN"),
    report_to="none",
    max_length=2048, 
)

# 6. SFT Training Sequence
# For conversational format (messages), we don't specify dataset_text_field.
# TRL will automatically use the chat template of the model.
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    peft_config=peft_config,
    processing_class=tokenizer,
    args=training_args,
)

print("Starting training...")
trainer.train()

print("Pushing to Hugging Face Hub...")
trainer.push_to_hub()
print("Process Complete!")
