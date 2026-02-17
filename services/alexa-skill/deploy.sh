#!/bin/bash
# Deploy script for Family Hub Alexa Skill Lambda
# Location: services/alexa-skill/deploy.sh
#
# Usage:
#   ./deploy.sh                    # Package only
#   ./deploy.sh --upload           # Package and upload to AWS Lambda
#
# Prerequisites:
#   - pip (Python package manager)
#   - zip
#   - aws-cli (only for --upload)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
PACKAGE_FILE="$SCRIPT_DIR/lambda-package.zip"
FUNCTION_NAME="family-hub-alexa-skill"
REGION="eu-west-2"

echo "=== Family Hub Alexa Skill - Lambda Packager ==="

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Install dependencies
echo "Installing dependencies..."
pip install -r "$SCRIPT_DIR/requirements.txt" -t "$BUILD_DIR" --quiet

# Copy source files
echo "Copying source files..."
cp "$SCRIPT_DIR/lambda_function.py" "$BUILD_DIR/"
cp "$SCRIPT_DIR/intent_handlers.py" "$BUILD_DIR/"
cp "$SCRIPT_DIR/familyhub_client.py" "$BUILD_DIR/"

# Create zip package
echo "Creating deployment package..."
cd "$BUILD_DIR"
zip -r "$PACKAGE_FILE" . -q
cd "$SCRIPT_DIR"

# Clean up build directory
rm -rf "$BUILD_DIR"

PACKAGE_SIZE=$(du -h "$PACKAGE_FILE" | cut -f1)
echo "Package created: $PACKAGE_FILE ($PACKAGE_SIZE)"

# Upload if requested
if [ "$1" = "--upload" ]; then
    echo "Uploading to AWS Lambda ($FUNCTION_NAME in $REGION)..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://$PACKAGE_FILE" \
        --region "$REGION"
    echo "Upload complete!"
fi

echo "Done."
