"""
Alexa Skill Lambda entry point.
Location: services/alexa-skill/lambda_function.py

AWS Lambda handler for the Family Hub Alexa skill.
Invocation: "Alexa, tell Family Hub add milk to the shopping list"
"""

import logging

from ask_sdk_core.skill_builder import SkillBuilder

from intent_handlers import (
    LaunchRequestHandler,
    AddShoppingItemIntentHandler,
    RemoveShoppingItemIntentHandler,
    GetShoppingListIntentHandler,
    HelpIntentHandler,
    CancelStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sb = SkillBuilder()

sb.add_request_handler(LaunchRequestHandler())
sb.add_request_handler(AddShoppingItemIntentHandler())
sb.add_request_handler(RemoveShoppingItemIntentHandler())
sb.add_request_handler(GetShoppingListIntentHandler())
sb.add_request_handler(HelpIntentHandler())
sb.add_request_handler(CancelStopIntentHandler())
sb.add_request_handler(FallbackIntentHandler())
sb.add_request_handler(SessionEndedRequestHandler())

handler = sb.lambda_handler()
