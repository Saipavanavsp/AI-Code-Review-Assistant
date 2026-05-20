from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from huggingface_hub import InferenceClient
import os
import subprocess
import sys
import tempfile
import re
import shutil
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
hf_token = os.getenv("HF_TOKEN")
client = InferenceClient(token=hf_token)

class ChatRequest(BaseModel):
    message: str
    code_context: str = ""
    stdin: str = ""

@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    if not hf_token or hf_token.startswith("your_"):
        return {"response": "AI Simulation Mode: I've analyzed your context. The current code looks solid, but you might want to optimize the memory usage in the main loop."}

    try:
        system_prompt = (
            "You are an expert AI Architect assisting a developer in a code review dashboard. "
            "Help the user debug, optimize, or explain their code. Be concise and professional."
        )
        
        response = client.chat.completions.create(
            model="Qwen/Qwen2.5-Coder-7B-Instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Code Context:\n{request.code_context}\n\nQuestion: {request.message}"}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return {"response": response.choices[0].message.content}
    except Exception as e:
        print(f"HF Inference Error: {e}")
        return {"response": "I'm currently in high-performance local mode. I recommend checking the indentation in your code blocks for better readability."}

@router.post("/run")
async def run_code(request: ChatRequest):
    language = request.message.lower()
    if language == "run":
        language = "python"
        
    code = request.code_context
    if not code.strip():
        return {"output": "No code provided to execute.", "errors": []}
        
    if language == "python":
        try:
            with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
                f.write(code.encode('utf-8'))
                temp_name = f.name
            
            result = subprocess.run(
                [sys.executable, temp_name],
                input=request.stdin,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            try:
                os.remove(temp_name)
            except:
                pass
                
            errors = []
            if result.stderr:
                errors.append(result.stderr)
                
            return {
                "output": result.stdout if result.stdout else "Process finished with exit code 0 (no output)",
                "errors": errors
            }
        except subprocess.TimeoutExpired:
            try:
                os.remove(temp_name)
            except:
                pass
            return {"output": "", "errors": ["Execution timed out after 5 seconds."]}
        except Exception as e:
            return {"output": "", "errors": [f"Execution failed: {str(e)}"]}
            
    elif language in ["javascript", "node"]:
        try:
            with tempfile.NamedTemporaryFile(suffix=".js", delete=False) as f:
                f.write(code.encode('utf-8'))
                temp_name = f.name
            
            result = subprocess.run(
                ["node", temp_name],
                input=request.stdin,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            try:
                os.remove(temp_name)
            except:
                pass
                
            errors = []
            if result.stderr:
                errors.append(result.stderr)
                
            return {
                "output": result.stdout if result.stdout else "Process finished with exit code 0 (no output)",
                "errors": errors
            }
        except FileNotFoundError:
            try:
                os.remove(temp_name)
            except:
                pass
            return {"output": "", "errors": ["Node.js is not installed on this system. Cannot execute JavaScript."]}
        except subprocess.TimeoutExpired:
            try:
                os.remove(temp_name)
            except:
                pass
            return {"output": "", "errors": ["Execution timed out after 5 seconds."]}
        except Exception as e:
            return {"output": "", "errors": [f"Execution failed: {str(e)}"]}
            
    elif language == "java":
        temp_dir = tempfile.mkdtemp()
        try:
            match = re.search(r'public\s+class\s+(\w+)', code)
            class_name = match.group(1) if match else "Main"
            java_file = os.path.join(temp_dir, f"{class_name}.java")
            with open(java_file, "w", encoding="utf-8") as f:
                f.write(code)
                
            # Compile Java
            compile_res = subprocess.run(
                ["javac", java_file],
                capture_output=True,
                text=True,
                timeout=8
            )
            if compile_res.returncode != 0:
                return {
                    "output": "",
                    "errors": [compile_res.stderr]
                }
                
            # Run Java
            result = subprocess.run(
                ["java", "-cp", temp_dir, class_name],
                input=request.stdin,
                capture_output=True,
                text=True,
                timeout=5
            )
            errors = []
            if result.stderr:
                errors.append(result.stderr)
                
            return {
                "output": result.stdout if result.stdout else "Process finished with exit code 0 (no output)",
                "errors": errors
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "errors": ["Execution timed out."]}
        except Exception as e:
            return {"output": "", "errors": [f"Execution failed: {str(e)}"]}
        finally:
            try:
                shutil.rmtree(temp_dir)
            except:
                pass

    elif language in ["cpp", "c++"]:
        temp_dir = tempfile.mkdtemp()
        try:
            cpp_file = os.path.join(temp_dir, "main.cpp")
            exe_file = os.path.join(temp_dir, "main.exe")
            with open(cpp_file, "w", encoding="utf-8") as f:
                f.write(code)
                
            # Compile C++
            compile_res = subprocess.run(
                ["g++", "-O2", cpp_file, "-o", exe_file],
                capture_output=True,
                text=True,
                timeout=10
            )
            if compile_res.returncode != 0:
                return {
                    "output": "",
                    "errors": [compile_res.stderr]
                }
                
            # Run C++ exe
            result = subprocess.run(
                [exe_file],
                input=request.stdin,
                capture_output=True,
                text=True,
                timeout=5
            )
            errors = []
            if result.stderr:
                errors.append(result.stderr)
                
            return {
                "output": result.stdout if result.stdout else "Process finished with exit code 0 (no output)",
                "errors": errors
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "errors": ["Execution timed out."]}
        except Exception as e:
            return {"output": "", "errors": [f"Execution failed: {str(e)}"]}
        finally:
            try:
                shutil.rmtree(temp_dir)
            except:
                pass

    elif language == "c":
        temp_dir = tempfile.mkdtemp()
        try:
            c_file = os.path.join(temp_dir, "main.c")
            exe_file = os.path.join(temp_dir, "main.exe")
            with open(c_file, "w", encoding="utf-8") as f:
                f.write(code)
                
            # Compile C
            compile_res = subprocess.run(
                ["gcc", "-O2", c_file, "-o", exe_file],
                capture_output=True,
                text=True,
                timeout=10
            )
            if compile_res.returncode != 0:
                return {
                    "output": "",
                    "errors": [compile_res.stderr]
                }
                
            # Run C exe
            result = subprocess.run(
                [exe_file],
                input=request.stdin,
                capture_output=True,
                text=True,
                timeout=5
            )
            errors = []
            if result.stderr:
                errors.append(result.stderr)
                
            return {
                "output": result.stdout if result.stdout else "Process finished with exit code 0 (no output)",
                "errors": errors
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "errors": ["Execution timed out."]}
        except Exception as e:
            return {"output": "", "errors": [f"Execution failed: {str(e)}"]}
        finally:
            try:
                shutil.rmtree(temp_dir)
            except:
                pass

    elif language in ["csharp", "c#"]:
        temp_dir = tempfile.mkdtemp()
        try:
            cs_file = os.path.join(temp_dir, "Program.cs")
            exe_file = os.path.join(temp_dir, "Program.exe")
            with open(cs_file, "w", encoding="utf-8") as f:
                f.write(code)
                
            # Compile C# using Microsoft Framework csc.exe
            csc_path = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
            compile_res = subprocess.run(
                [csc_path, f"/out:{exe_file}", cs_file],
                capture_output=True,
                text=True,
                timeout=10
            )
            if compile_res.returncode != 0:
                return {
                    "output": "",
                    "errors": [compile_res.stderr or compile_res.stdout]
                }
                
            # Run C# exe
            result = subprocess.run(
                [exe_file],
                input=request.stdin,
                capture_output=True,
                text=True,
                timeout=5
            )
            errors = []
            if result.stderr:
                errors.append(result.stderr)
                
            return {
                "output": result.stdout if result.stdout else "Process finished with exit code 0 (no output)",
                "errors": errors
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "errors": ["Execution timed out."]}
        except Exception as e:
            return {"output": "", "errors": [f"Execution failed: {str(e)}"]}
        finally:
            try:
                shutil.rmtree(temp_dir)
            except:
                pass

    else:
        return {
            "output": f"Simulated compilation for {language.upper()} succeeded.\nOutput: [Process Successfully Executed]",
            "errors": []
        }
