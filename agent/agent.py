from state import AgentState
import json
from langchain.tools import BaseTool
from langchain_core.messages import FunctionMessage
from langgraph.prebuilt import ToolInvocation, ToolExecutor
from langgraph.graph import StateGraph, END
import os
from langchain.tools import BaseTool
import requests
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Provide the API key directly
openai_api_key = os.getenv("OPENAI_API_KEY")  # Replace with your actual OpenAI API key

# Set custom base URL for OpenAI API
custom_base_url = os.getenv("OPENAI_BASE_URL")  # Replace this with your desired base URL

spoonacular_api_key = os.getenv("SPOONACULAR_API_KEY")

# Set the model with the provided API key and custom base URL
model = ChatOpenAI(model="gpt-4o-mini",temperature=0, openai_api_key=openai_api_key, base_url=custom_base_url)



# Define your FetchRecipeTool similar to other tools
class FetchRecipeTool(BaseTool):
    name: str = "fetch_recipe_tool"  # Add type annotation
    description: str = "Fetch a recipe based on provided ingredients and return in cookbook format."  # Add type annotation

    def _run(self, ingredients: str) -> str:
        api_key = spoonacular_api_key  # Replace with your actual Spoonacular API key
        url = f"https://api.spoonacular.com/recipes/findByIngredients?ingredients={ingredients}&number=1&apiKey={api_key}"
        response = requests.get(url)

        if response.status_code == 200:
            recipe_data = response.json()
            if recipe_data:
                recipe = recipe_data[0]
                recipe_id = recipe.get('id')
                details_url = f"https://api.spoonacular.com/recipes/{recipe_id}/information?apiKey={api_key}"
                details_response = requests.get(details_url)

                if details_response.status_code == 200:
                    details_data = details_response.json()
                    title = details_data.get('title', 'Unknown Title')
                    image = details_data.get('image', 'No image available')
                    ready_in_minutes = details_data.get('readyInMinutes', 'Unknown')
                    servings = details_data.get('servings', 'Unknown')
                    source_url = details_data.get('sourceUrl', 'No source available')

                    # Extract step-by-step instructions in a cookbook format
                    analyzed_instructions = details_data.get('analyzedInstructions', [])
                    steps = []
                    if analyzed_instructions:
                        for instruction in analyzed_instructions:
                            for step in instruction.get('steps', []):
                                steps.append(f"Step {step['number']}: {step['step']}")

                    if not steps:
                        steps.append("No instructions available")

                    # Format the recipe information
                    recipe_info = (
                        f"**Recipe:** {title}\n"
                        f"**Image:** {image}\n"
                        f"**Ready in:** {ready_in_minutes} minutes\n"
                        f"**Servings:** {servings}\n"
                        f"**Source:** {source_url}\n\n"
                        "**Step-by-Step Instructions:**\n"
                        + "\n".join(steps)
                    )
                else:
                    recipe_info = "Error fetching detailed recipe information."
            else:
                recipe_info = "No recipe found for the given ingredients."
        else:
            recipe_info = "Error fetching the recipe."

        return recipe_info

    def _arun(self, ingredients: str) -> str:
        raise NotImplementedError("Async method not implemented.")


# Initialize the tool executor with your custom tool
tools = [FetchRecipeTool()]
tool_executor = ToolExecutor(tools)

# Define function_1 for handling message processing with the agent
def function_1(state):
    messages = state['messages']
    response = model.invoke(messages)
    return {"messages": [response]}

# Define function_2 for invoking the recipe tool
def function_2(state):
    messages = state['messages']
    last_message = messages[-1]  # Get the query we need to send to the tool provided by the agent

    # Parse the tool input from the function call
    parsed_tool_input = json.loads(last_message.additional_kwargs["function_call"]["arguments"])

    # Construct a ToolInvocation from the function_call and pass in the tool name and expected input
    action = ToolInvocation(
        tool=last_message.additional_kwargs["function_call"]["name"],
        tool_input=parsed_tool_input['__arg1'],
    )

    # Invoke the tool executor to get a response
    response = tool_executor.invoke(action)

    # Create a FunctionMessage based on the response
    function_message = FunctionMessage(content=str(response), name=action.tool)

    # Return a list of messages
    return {"messages": [function_message]}

# Define where_to_go for conditional execution
def where_to_go(state):
    messages = state['messages']
    last_message = messages[-1]

    # Check if "function_call" is present in the last message
    if "function_call" in last_message.additional_kwargs:
        return "continue"
    else:
        return "end"

# Set up the workflow using StateGraph
workflow = StateGraph(AgentState)

# Add nodes for agent and tool function execution
workflow.add_node("agent", function_1)
workflow.add_node("tool", function_2)

# Add conditional edges based on where_to_go
workflow.add_conditional_edges(
    "agent",
    where_to_go, {
        "continue": "tool",
        "end": END
    }
)

# Add an edge for calling the agent after the tool
workflow.add_edge('tool', 'agent')

# Set the entry point of the workflow
workflow.set_entry_point("agent")

# Compile the workflow into an app
graph = workflow.compile()