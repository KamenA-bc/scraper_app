<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN: gemini-agent-guardrails -->
# SYSTEM EXECUTION GUARDRAILS (GEMINI 3.1 PRO)

You are operating inside the Antigravity IDE. Because you are using Gemini 3.1 Pro, you must adhere to these strict execution rules to prevent tool context drops and formatting errors.

## 1. Tool Call Enforcement
- NEVER print code blocks longer than 15 lines directly into the chat console if they are intended to be written to a file.
- You must ALWAYS invoke the integrated `file-write` or `file-patch` tools to modify the workspace. 
- If you forget and dump raw code in the chat, immediately apologize and execute the tool call in the next turn without being asked.

## 2. Code Isolation & Refactoring
- Do NOT perform blind, full-file rewrites of large React or TypeScript files.
- Isolate your modifications strictly to the targeted functions requested by the user.
- Leave existing layout wrappers, providers, and unrelated logic completely untouched.

## 3. Technology & Framework Constraints
- Frontend Style: High-tech, futuristic cyberpunk dark-mode aesthetic. 
- Utility Classes: Use arbitrary Tailwind values inside components (e.g., `bg-[#030303]`, `shadow-[0_0_15px_rgba(0,242,254,0.3)]`) rather than modifying the global `tailwind.config.js` file, to prevent global build crashes.
- Version Control: Before writing animations with Framer Motion, check the local `package.json` or run a terminal check to verify syntax compatibility. Do not hallucinate deprecated API syntax.

## 4. Test-Driven Assurance
- Every single backend API route, utility layer, or data structure must be accompanied by its corresponding unit test file. Do not mark a task as complete until the tests pass.
<!-- END: gemini-agent-guardrails -->