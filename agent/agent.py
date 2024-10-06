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
from langgraph.checkpoint.memory import MemorySaver

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY") 

custom_base_url = os.getenv("OPENAI_BASE_URL")  

spoonacular_api_key = os.getenv("SPOONACULAR_API_KEY")

model = ChatOpenAI(model="gpt-4o-mini",temperature=0, openai_api_key=openai_api_key, base_url=custom_base_url)


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


tools = [FetchRecipeTool()]
tool_executor = ToolExecutor(tools)

def function_1(state):
    messages = state['messages']
    response = model.invoke(messages)
    print(response)
    return {"messages": [response]}

def function_2(state):
    messages = state['messages']
    print(messages)
    last_message = messages[-1]  


    parsed_tool_input = json.loads(last_message.additional_kwargs["function_call"]["arguments"])

    action = ToolInvocation(
        tool=last_message.additional_kwargs["function_call"]["name"],
        tool_input=parsed_tool_input['__arg1'],
    )
    print(response)
    response = tool_executor.invoke(action)

    function_message = FunctionMessage(content=str(response), name=action.tool)

    return {"messages": [function_message]}

def where_to_go(state):
    messages = state['messages']
    last_message = messages[-1]
    print("Last message",last_message)
    if "function_call" in last_message.additional_kwargs:
        return "continue"
    else:
        return "end"

workflow = StateGraph(AgentState)


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

workflow.add_edge('tool', 'agent')

workflow.set_entry_point("agent")

memory = MemorySaver()

graph = workflow.compile(checkpointer=memory)