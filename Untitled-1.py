import json
import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError

REGION = os.getenv("AWS_REGION", "us-east-1")
MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-v2")
PROMPT = "\n\nHuman: Hello, how are you?\n\nAssistant:"


def main() -> None:
    client = boto3.client("bedrock-runtime", region_name=REGION)

    body = json.dumps(
        {
            "prompt": PROMPT,
            "max_tokens_to_sample": 300,
        }
    )

    response = client.invoke_model(
        modelId=MODEL_ID,
        body=body,
        accept="application/json",
        contentType="application/json",
    )

    result = json.loads(response["body"].read())
    print(result["completion"].strip())


if __name__ == "__main__":
    try:
        main()
    except (BotoCoreError, ClientError) as error:
        raise SystemExit(f"Bedrock request failed: {error}")