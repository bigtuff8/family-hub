"""
Alexa skill intent handlers.
Location: services/alexa-skill/intent_handlers.py
"""

import logging

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_request_type, is_intent_name
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model import Response

import familyhub_client

logger = logging.getLogger(__name__)


class LaunchRequestHandler(AbstractRequestHandler):
    """Handle skill launch."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_request_type("LaunchRequest")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        speech = (
            "Welcome to Family Hub. You can say things like: "
            "add milk to the shopping list, "
            "remove bread from the list, "
            "or what's on the shopping list."
        )
        return (
            handler_input.response_builder
            .speak(speech)
            .ask("What would you like to do?")
            .response
        )


class AddShoppingItemIntentHandler(AbstractRequestHandler):
    """Handle adding items to the shopping list."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_intent_name("AddShoppingItemIntent")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        slots = handler_input.request_envelope.request.intent.slots

        item_name = slots.get("item", {})
        item_value = item_name.value if item_name and item_name.value else None

        if not item_value:
            return (
                handler_input.response_builder
                .speak("I didn't catch what to add. What item would you like to add?")
                .ask("What item should I add to the shopping list?")
                .response
            )

        # Check for quantity slot
        quantity_slot = slots.get("quantity", {})
        quantity = 1
        if quantity_slot and quantity_slot.value:
            try:
                quantity = int(quantity_slot.value)
            except ValueError:
                quantity = 1

        result = familyhub_client.add_item(item_value, quantity)

        if result:
            qty_text = f"{quantity} " if quantity > 1 else ""
            speech = f"I've added {qty_text}{item_value} to the shopping list."
        else:
            speech = f"Sorry, I couldn't add {item_value} to the list. Please try again later."

        return handler_input.response_builder.speak(speech).response


class RemoveShoppingItemIntentHandler(AbstractRequestHandler):
    """Handle removing items from the shopping list."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_intent_name("RemoveShoppingItemIntent")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        slots = handler_input.request_envelope.request.intent.slots

        item_name = slots.get("item", {})
        item_value = item_name.value if item_name and item_name.value else None

        if not item_value:
            return (
                handler_input.response_builder
                .speak("I didn't catch what to remove. What item would you like to remove?")
                .ask("What item should I remove from the shopping list?")
                .response
            )

        result = familyhub_client.remove_item(item_value)

        if result and result.get("deleted", 0) > 0:
            speech = f"I've removed {item_value} from the shopping list."
        elif result and result.get("deleted", 0) == 0:
            speech = f"I couldn't find {item_value} on the shopping list."
        else:
            speech = f"Sorry, I had trouble removing {item_value}. Please try again later."

        return handler_input.response_builder.speak(speech).response


class GetShoppingListIntentHandler(AbstractRequestHandler):
    """Handle reading the shopping list."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_intent_name("GetShoppingListIntent")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        items = familyhub_client.get_items()

        if items is None:
            return (
                handler_input.response_builder
                .speak("Sorry, I couldn't access the shopping list right now.")
                .response
            )

        if len(items) == 0:
            return (
                handler_input.response_builder
                .speak("Your shopping list is empty.")
                .response
            )

        # Read up to 10 items
        item_names = [item["name"] for item in items[:10]]
        remaining = len(items) - 10

        if len(item_names) == 1:
            items_text = item_names[0]
        elif len(item_names) == 2:
            items_text = f"{item_names[0]} and {item_names[1]}"
        else:
            items_text = ", ".join(item_names[:-1]) + f", and {item_names[-1]}"

        speech = f"You have {len(items)} item{'s' if len(items) != 1 else ''} on the shopping list: {items_text}."
        if remaining > 0:
            speech += f" Plus {remaining} more."

        return handler_input.response_builder.speak(speech).response


class HelpIntentHandler(AbstractRequestHandler):
    """Handle help request."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_intent_name("AMAZON.HelpIntent")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        speech = (
            "You can manage your Family Hub shopping list. Try saying: "
            "add milk, remove bread, or what's on the list."
        )
        return (
            handler_input.response_builder
            .speak(speech)
            .ask("What would you like to do?")
            .response
        )


class CancelStopIntentHandler(AbstractRequestHandler):
    """Handle cancel and stop."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return (
            is_intent_name("AMAZON.CancelIntent")(handler_input)
            or is_intent_name("AMAZON.StopIntent")(handler_input)
        )

    def handle(self, handler_input: HandlerInput) -> Response:
        return handler_input.response_builder.speak("Goodbye!").response


class FallbackIntentHandler(AbstractRequestHandler):
    """Handle fallback."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_intent_name("AMAZON.FallbackIntent")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        speech = (
            "I'm not sure about that. You can say things like: "
            "add milk to the list, remove bread, or what's on the shopping list."
        )
        return (
            handler_input.response_builder
            .speak(speech)
            .ask("What would you like to do?")
            .response
        )


class SessionEndedRequestHandler(AbstractRequestHandler):
    """Handle session ended."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_request_type("SessionEndedRequest")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        return handler_input.response_builder.response
