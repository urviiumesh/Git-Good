#!/bin/bash
# Shell script to start both the model server and the sequential thinking server

echo -e "\e[33m=======================================================\e[0m"
echo -e "\e[36mStarting Sequential Thinking Server...\e[0m"
echo -e "\e[36mThis server handles step-by-step problem solving.\e[0m"
echo -e "\e[33m=======================================================\e[0m"
npx tsx src/sequentialThinkingServer.ts &

echo "Waiting for Sequential Thinking Server to initialize..."
sleep 3

echo -e "\e[33m=======================================================\e[0m"
echo -e "\e[32mStarting Model Server...\e[0m"
echo -e "\e[32mThis server handles the core language model processing.\e[0m"
echo -e "\e[33m=======================================================\e[0m"
python run.py &

echo "Waiting for Model Server to initialize..."
sleep 3

echo -e "\e[33m=======================================================\e[0m"
echo -e "\e[35mStarting development server...\e[0m"
echo -e "\e[35mThis will start the web interface.\e[0m"
echo -e "\e[33m=======================================================\e[0m"
npm run dev 