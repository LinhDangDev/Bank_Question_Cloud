#!/bin/bash

# Make script executable
# chmod +x run-tests.sh

echo "Question Bank API Test Runner"
echo "==========================="
echo ""

function open_url() {
    # Try to detect the OS and use the appropriate command
    case "$(uname -s)" in
        Darwin)
            # macOS
            open "$1"
            ;;
        Linux)
            # Linux
            if command -v xdg-open &> /dev/null; then
                xdg-open "$1"
            elif command -v gnome-open &> /dev/null; then
                gnome-open "$1"
            else
                echo "Could not open URL: $1"
                echo "Please open it manually in your browser."
            fi
            ;;
        *)
            # Other OS
            echo "Could not open URL: $1"
            echo "Please open it manually in your browser."
            ;;
    esac
}

while true; do
    echo "Choose a test method:"
    echo "1. Run Node.js test script"
    echo "2. Run Python test script"
    echo "3. Open Swagger UI in browser"
    echo "4. Exit"
    echo ""

    read -p "Enter your choice (1-4): " choice

    case $choice in
        1)
            echo ""
            echo "Running Node.js test script..."
            node test-api.js
            echo ""
            read -p "Press Enter to continue..."
            ;;
        2)
            echo ""
            echo "Running Python test script..."
            python3 test-api.py
            echo ""
            read -p "Press Enter to continue..."
            ;;
        3)
            echo ""
            echo "Opening Swagger UI in browser..."
            open_url "http://localhost:3000/api"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        4)
            echo ""
            echo "Thank you for using the Question Bank API Test Runner!"
            echo ""
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac

    echo ""
done
