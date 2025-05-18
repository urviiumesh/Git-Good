# AgenTick Feature Documentation

The AgenTick feature integrates the original agent implementations from the GitGoodBackend repository with the Mistral and CodeLlama models to provide specialized responses.

## Overview

AgenTick is a feature that:

1. Uses the original agent implementations from GitGoodBackend:
   - Software Engineer Agent
   - Marketing Agent
   - CPO (Chief Product Officer) Agent
   - Accounts Agent
   - Intern Agent

2. Detects the most appropriate agent role based on:
   - User's explicitly set department (if available)
   - Message content and context

3. Utilizes the models from the models folder for language generation:
   - Mistral model for general text responses
   - CodeLlama model for code-specific questions

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Node.js and npm/yarn
- The GitGoodBackend repository with its agent implementations
- The Mistral and CodeLlama models (in the models folder)

### Backend Setup

1. The AgenTick server has been enhanced to:
   - Import and initialize all agent implementations from GitGoodBackend
   - Automatically start the model server when needed
   - Route requests to the appropriate agent based on the detected role

2. To start the backend server:

   **On Linux/macOS:**
   ```bash
   chmod +x start-AgenTick-server.sh
   ./start-AgenTick-server.sh
   ```

   **On Windows:**
   ```powershell
   .\start-AgenTick-server.ps1
   ```

   This will:
   1. Create a Python virtual environment
   2. Install required dependencies
   3. Start the AgenTick server, which will automatically:
      - Import all agent implementations from GitGoodBackend
      - Start the model server when needed

### Frontend Setup

1. Install the required npm packages:

   ```bash
   npm install uuid axios
   # or with yarn
   yarn add uuid axios
   ```

2. Start the development server:

   ```bash
   npm run dev
   # or with yarn
   yarn dev
   ```

## Usage

1. Open the chat interface
2. Click the AI Options button (sparkles icon)
3. Enable the "AgenTick" option
4. Start chatting with the agent

If prompted, set your department for more personalized responses. If you don't provide a department, the system will automatically detect the most appropriate agent based on your message content.

## Agent Roles and Implementation Details

The system uses the actual agent implementations from GitGoodBackend:

- **Software Engineer Agent**: 
  - Implementation: `agent_software/agent_software.py`
  - Interface: `agent_software/interactive_software.py`
  - Specializes in: Programming, code debugging, algorithms, and system design

- **Marketing Agent**: 
  - Implementation: `agent_marketing/agent_marketing.py`
  - Interface: `agent_marketing/interactive_marketing.py`
  - Specializes in: Marketing strategy, brand management, and user acquisition

- **CPO Agent**: 
  - Implementation: `agent_cpo/cpo_agent.py`
  - Interface: `agent_cpo/interactive_cpo.py`
  - Specializes in: Product strategy, roadmaps, and executive decisions

- **Accounts Agent**: 
  - Implementation: `agent_accounts/agent_accounts.py`
  - Interface: `agent_accounts/interactive_accounts.py`
  - Specializes in: Financial analysis, budgeting, and accounting principles

- **Intern Agent**: 
  - Implementation: `agent_intern/agent_intern.py`
  - Interface: `agent_intern/interactive_intern.py`
  - Specializes in: Onboarding, training, and skill development

## Technical Integration

The integration combines the best of both worlds:

1. **Agent Logic**: Uses the specialized domain knowledge and structured responses from the GitGoodBackend agents
2. **Language Models**: Leverages the Mistral and CodeLlama models for high-quality language generation
3. **Role Detection**: Automatically determines which agent should handle each request based on content

## Troubleshooting

If you encounter issues:

1. Check if the agents initialized correctly (look for "Successfully imported and initialized all agents" message)
2. Make sure the GitGoodBackend folder is properly set up and contains all agent implementations
3. Verify the model files exist in the models directory
4. Check the console for error messages from specific agents

## Additional Resources

- [GitGoodBackend Repository](https://github.com/urviiumesh/gitgoodbackend)
- [Mistral AI](https://mistral.ai/)
- [LLama.cpp](https://github.com/ggerganov/llama.cpp) 