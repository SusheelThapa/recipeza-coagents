"""Demo"""

# from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit import CopilotKitSDK, LangGraphAgent
from agent import graph

app = FastAPI()
sdk = CopilotKitSDK(
    agents=[
        LangGraphAgent(
            name="recipe_agent",
            description="Recipe agent.",
            agent=graph,
        )
    ],
)

add_fastapi_endpoint(app, sdk, "/copilotkit")

def main():
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
