# Alexa Integration - Design Document

**Feature:** 2.3 Alexa Integration
**Phase:** 2 - Integration & Sync
**Status:** Design Complete
**Created:** December 22, 2025

---

## Overview

Voice control integration with Amazon Alexa for hands-free interaction with Family Hub. Primary focus on shopping list management and calendar queries, with future expansion to broadcast messages and chores.

### Key Requirements
- Add/remove items from shopping list via voice
- Query calendar events ("What's on today?")
- Future: Broadcast messages, chores voice control
- Account linking for multi-tenant support
- Voice profile personalization

---

## Alexa Skill Architecture

### Skill Type
**Custom Skill** - Provides full control over intents, slots, and responses.

### Account Linking
OAuth 2.0 account linking to associate Alexa user with Family Hub tenant.

```
User: "Alexa, open Family Hub"
  → Alexa checks account linking
  → If not linked: "Please link your Family Hub account in the Alexa app"
  → If linked: "Welcome back! What would you like to do?"
```

### Voice Profiles
Use Alexa Voice Profiles to identify which family member is speaking.
- Personalized responses ("Hi James, you have 3 events today")
- User-specific actions (add to "my" tasks)

---

## Backend Architecture

### Directory Structure
```
backend/services/alexa/
├── __init__.py
├── routes.py           # Skill endpoint
├── handlers.py         # Intent handlers
├── account_linking.py  # OAuth for Alexa
├── voice_profiles.py   # Person ID mapping
└── responses.py        # SSML response builders
```

### Skill Endpoint
```python
# backend/services/alexa/routes.py
from flask import Flask, request
from flask_ask_sdk.skill_adapter import SkillAdapter
from ask_sdk_core.skill_builder import SkillBuilder

# Initialize skill
sb = SkillBuilder()

# Register handlers
sb.add_request_handler(LaunchRequestHandler())
sb.add_request_handler(AddShoppingItemIntentHandler())
sb.add_request_handler(RemoveShoppingItemIntentHandler())
sb.add_request_handler(GetShoppingListIntentHandler())
sb.add_request_handler(GetCalendarIntentHandler())
sb.add_request_handler(GetTodayEventsIntentHandler())
sb.add_request_handler(HelpIntentHandler())
sb.add_request_handler(CancelStopIntentHandler())
sb.add_request_handler(FallbackIntentHandler())

# Error handlers
sb.add_exception_handler(CatchAllExceptionHandler())

skill = sb.create()

# FastAPI integration
@router.post("/alexa/skill")
async def alexa_skill_endpoint(request: Request):
    """Main Alexa skill endpoint."""
    body = await request.json()

    # Verify request signature (security)
    if not verify_alexa_request(request):
        raise HTTPException(status_code=403, detail="Invalid request signature")

    # Process request
    response = skill.invoke(body, None)
    return JSONResponse(content=response)
```

### Account Linking OAuth
```python
# backend/services/alexa/account_linking.py
from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.get("/alexa/auth")
async def alexa_auth_start(
    client_id: str,
    redirect_uri: str,
    state: str,
    response_type: str = "code"
):
    """
    OAuth authorization endpoint for Alexa account linking.
    Shows login page, then redirects back to Alexa with auth code.
    """
    # Store state for CSRF protection
    # Show login form or redirect if already logged in
    return templates.TemplateResponse(
        "alexa_login.html",
        {"redirect_uri": redirect_uri, "state": state}
    )

@router.post("/alexa/auth/login")
async def alexa_auth_login(
    email: str = Form(...),
    password: str = Form(...),
    redirect_uri: str = Form(...),
    state: str = Form(...)
):
    """Process login and redirect to Alexa with auth code."""
    # Verify credentials
    user = await authenticate_user(email, password)
    if not user:
        return {"error": "Invalid credentials"}

    # Generate auth code
    auth_code = generate_auth_code(user.id, user.tenant_id)

    # Redirect to Alexa
    return RedirectResponse(
        f"{redirect_uri}?code={auth_code}&state={state}"
    )

@router.post("/alexa/token")
async def alexa_token_exchange(
    grant_type: str = Form(...),
    code: str = Form(None),
    refresh_token: str = Form(None),
    client_id: str = Form(...),
    client_secret: str = Form(...)
):
    """
    Token endpoint for Alexa account linking.
    Exchanges auth code for access token.
    """
    if grant_type == "authorization_code":
        # Exchange code for tokens
        user_id, tenant_id = verify_auth_code(code)
        access_token = create_access_token(user_id, tenant_id)
        refresh_token = create_refresh_token(user_id, tenant_id)

        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": refresh_token
        }

    elif grant_type == "refresh_token":
        # Refresh access token
        user_id, tenant_id = verify_refresh_token(refresh_token)
        new_access_token = create_access_token(user_id, tenant_id)

        return {
            "access_token": new_access_token,
            "token_type": "Bearer",
            "expires_in": 3600
        }
```

### Intent Handlers
```python
# backend/services/alexa/handlers.py
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_model import Response

class LaunchRequestHandler(AbstractRequestHandler):
    """Handle skill launch."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_request_type("LaunchRequest")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        # Get user from account linking
        access_token = handler_input.request_envelope.context.system.user.access_token
        if not access_token:
            return handler_input.response_builder.speak(
                "Please link your Family Hub account in the Alexa app to get started."
            ).set_card(
                LinkAccountCard()
            ).response

        user = get_user_from_token(access_token)

        # Check for person ID (voice profile)
        person_id = get_person_id(handler_input)
        if person_id:
            family_member = get_family_member_by_voice_profile(user.tenant_id, person_id)
            greeting = f"Hi {family_member.name}!"
        else:
            greeting = "Welcome to Family Hub!"

        return handler_input.response_builder.speak(
            f"{greeting} You can add items to your shopping list, "
            "check your calendar, or ask what's on today. What would you like to do?"
        ).ask(
            "What would you like to do?"
        ).response


class AddShoppingItemIntentHandler(AbstractRequestHandler):
    """Handle adding items to shopping list."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_intent_name("AddShoppingItemIntent")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        # Get user context
        access_token = handler_input.request_envelope.context.system.user.access_token
        user = get_user_from_token(access_token)

        # Get slots
        slots = handler_input.request_envelope.request.intent.slots
        item_name = slots["item"].value
        quantity = slots.get("quantity", {}).value

        # Add to shopping list
        try:
            shopping_list = get_default_shopping_list(user.tenant_id)
            add_shopping_item(
                list_id=shopping_list.id,
                name=item_name,
                quantity=int(quantity) if quantity else 1,
                added_by=user.id
            )

            if quantity:
                speech = f"I've added {quantity} {item_name} to your shopping list."
            else:
                speech = f"I've added {item_name} to your shopping list."

            return handler_input.response_builder.speak(speech).response

        except Exception as e:
            return handler_input.response_builder.speak(
                "Sorry, I couldn't add that item. Please try again."
            ).response


class GetShoppingListIntentHandler(AbstractRequestHandler):
    """Read back the shopping list."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_intent_name("GetShoppingListIntent")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        access_token = handler_input.request_envelope.context.system.user.access_token
        user = get_user_from_token(access_token)

        # Get unchecked items
        shopping_list = get_default_shopping_list(user.tenant_id)
        items = get_unchecked_items(shopping_list.id)

        if not items:
            return handler_input.response_builder.speak(
                "Your shopping list is empty."
            ).response

        # Build response
        item_count = len(items)
        if item_count == 1:
            speech = f"You have 1 item on your list: {items[0].name}."
        elif item_count <= 5:
            item_names = ", ".join([i.name for i in items[:-1]])
            speech = f"You have {item_count} items: {item_names}, and {items[-1].name}."
        else:
            top_items = ", ".join([i.name for i in items[:5]])
            speech = f"You have {item_count} items. The first 5 are: {top_items}."

        return handler_input.response_builder.speak(speech).response


class GetTodayEventsIntentHandler(AbstractRequestHandler):
    """Get today's calendar events."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_intent_name("GetTodayEventsIntent")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        access_token = handler_input.request_envelope.context.system.user.access_token
        user = get_user_from_token(access_token)

        # Get today's events
        events = get_events_for_date(user.tenant_id, date.today())

        if not events:
            return handler_input.response_builder.speak(
                "You don't have any events scheduled for today."
            ).response

        # Build response with SSML for better pronunciation
        event_count = len(events)
        speech = f"<speak>You have {event_count} event{'s' if event_count > 1 else ''} today. "

        for event in events[:5]:  # Limit to 5 for brevity
            time_str = event.start_time.strftime("%I:%M %p").lstrip("0")
            speech += f"<s>At {time_str}, {event.title}.</s> "

        if event_count > 5:
            speech += f"<s>Plus {event_count - 5} more events.</s>"

        speech += "</speak>"

        return handler_input.response_builder.speak(speech).response


class RemoveShoppingItemIntentHandler(AbstractRequestHandler):
    """Remove item from shopping list."""

    def can_handle(self, handler_input: HandlerInput) -> bool:
        return is_intent_name("RemoveShoppingItemIntent")(handler_input)

    def handle(self, handler_input: HandlerInput) -> Response:
        access_token = handler_input.request_envelope.context.system.user.access_token
        user = get_user_from_token(access_token)

        slots = handler_input.request_envelope.request.intent.slots
        item_name = slots["item"].value

        # Find and remove item
        shopping_list = get_default_shopping_list(user.tenant_id)
        item = find_item_by_name(shopping_list.id, item_name)

        if item:
            delete_shopping_item(item.id)
            return handler_input.response_builder.speak(
                f"I've removed {item_name} from your shopping list."
            ).response
        else:
            return handler_input.response_builder.speak(
                f"I couldn't find {item_name} on your shopping list."
            ).response
```

### Voice Profiles
```python
# backend/services/alexa/voice_profiles.py
from uuid import UUID

# Database table for mapping Alexa Person IDs to family members
"""
CREATE TABLE alexa_voice_profiles (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    alexa_person_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, alexa_person_id)
);
"""

def get_person_id(handler_input) -> str:
    """Extract Person ID from request if voice profiles enabled."""
    try:
        person = handler_input.request_envelope.context.system.person
        if person:
            return person.person_id
    except:
        pass
    return None

async def get_family_member_by_voice_profile(
    tenant_id: UUID,
    person_id: str
) -> User:
    """Look up family member by Alexa Person ID."""
    profile = await db.execute(
        select(AlexaVoiceProfile).where(
            AlexaVoiceProfile.tenant_id == tenant_id,
            AlexaVoiceProfile.alexa_person_id == person_id
        )
    )
    if profile:
        return await get_user(profile.user_id)
    return None

async def link_voice_profile(
    tenant_id: UUID,
    user_id: UUID,
    person_id: str
):
    """Link Alexa voice profile to family member."""
    profile = AlexaVoiceProfile(
        tenant_id=tenant_id,
        user_id=user_id,
        alexa_person_id=person_id
    )
    db.add(profile)
    await db.commit()
```

---

## Alexa Skill Definition

### Interaction Model (JSON)
```json
{
  "interactionModel": {
    "languageModel": {
      "invocationName": "family hub",
      "intents": [
        {
          "name": "AddShoppingItemIntent",
          "slots": [
            {"name": "item", "type": "AMAZON.Food"},
            {"name": "quantity", "type": "AMAZON.NUMBER"}
          ],
          "samples": [
            "add {item} to the shopping list",
            "add {item}",
            "put {item} on the list",
            "add {quantity} {item}",
            "we need {item}",
            "we need {quantity} {item}"
          ]
        },
        {
          "name": "RemoveShoppingItemIntent",
          "slots": [
            {"name": "item", "type": "AMAZON.Food"}
          ],
          "samples": [
            "remove {item} from the shopping list",
            "remove {item}",
            "delete {item}",
            "cross off {item}",
            "take {item} off the list"
          ]
        },
        {
          "name": "GetShoppingListIntent",
          "slots": [],
          "samples": [
            "what's on the shopping list",
            "read the shopping list",
            "what do we need",
            "shopping list",
            "what do I need to buy"
          ]
        },
        {
          "name": "GetTodayEventsIntent",
          "slots": [],
          "samples": [
            "what's on today",
            "what's happening today",
            "what events do I have today",
            "today's schedule",
            "what's on the calendar today"
          ]
        },
        {
          "name": "GetCalendarIntent",
          "slots": [
            {"name": "date", "type": "AMAZON.DATE"}
          ],
          "samples": [
            "what's on {date}",
            "what's happening on {date}",
            "calendar for {date}",
            "what events are on {date}"
          ]
        },
        {
          "name": "AMAZON.HelpIntent",
          "samples": []
        },
        {
          "name": "AMAZON.CancelIntent",
          "samples": []
        },
        {
          "name": "AMAZON.StopIntent",
          "samples": []
        },
        {
          "name": "AMAZON.FallbackIntent",
          "samples": []
        }
      ]
    }
  }
}
```

### Skill Manifest
```json
{
  "manifest": {
    "publishingInformation": {
      "locales": {
        "en-GB": {
          "summary": "Manage your family's shopping list and calendar",
          "description": "Family Hub lets you add items to your shopping list and check your calendar using voice commands.",
          "keywords": ["family", "shopping", "calendar", "organization"],
          "examplePhrases": [
            "Alexa, ask Family Hub to add milk",
            "Alexa, ask Family Hub what's on today",
            "Alexa, open Family Hub"
          ],
          "name": "Family Hub"
        }
      }
    },
    "apis": {
      "custom": {
        "endpoint": {
          "uri": "https://familyhub.example.com/api/alexa/skill"
        }
      }
    },
    "permissions": [
      {
        "name": "alexa::person_id:read"
      }
    ],
    "accountLinking": {
      "accessTokenScheme": "HTTP_BASIC",
      "accessTokenUrl": "https://familyhub.example.com/api/alexa/token",
      "authorizationUrl": "https://familyhub.example.com/api/alexa/auth",
      "clientId": "alexa-family-hub",
      "domains": [],
      "scopes": ["family_hub_access"],
      "type": "AUTH_CODE"
    }
  }
}
```

---

## Database Models

### AlexaVoiceProfile Table
```sql
CREATE TABLE alexa_voice_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alexa_person_id VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),  -- "James's voice"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, alexa_person_id)
);

CREATE INDEX idx_alexa_profiles_tenant ON alexa_voice_profiles(tenant_id);
```

### AlexaAccountLink Table
```sql
CREATE TABLE alexa_account_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    alexa_user_id VARCHAR(255) NOT NULL,  -- Alexa's user identifier
    access_token_hash VARCHAR(255),       -- For validation
    refresh_token_encrypted TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(alexa_user_id)
);
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/alexa/skill` | Main Alexa skill endpoint |
| GET | `/alexa/auth` | OAuth authorization page |
| POST | `/alexa/auth/login` | Process OAuth login |
| POST | `/alexa/token` | OAuth token exchange |
| GET | `/alexa/voice-profiles` | List linked voice profiles |
| POST | `/alexa/voice-profiles/link` | Link voice to family member |
| DELETE | `/alexa/voice-profiles/{id}` | Unlink voice profile |

---

## Frontend Components

### Settings Integration
```
frontend/src/features/settings/
├── AlexaIntegration.tsx      # Alexa settings panel
├── VoiceProfileManager.tsx   # Manage voice profiles
└── AlexaSetupGuide.tsx       # Step-by-step setup instructions
```

### UI Flow
```
Settings → Integrations → Alexa

┌─────────────────────────────────────────────────┐
│  Alexa Integration                              │
│                                                 │
│  Status: ● Connected                            │
│  Linked Account: james@brown.family             │
│                                                 │
│  Voice Profiles                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 👤 James      ✓ Recognized              │   │
│  │ 👤 Nicola     ✓ Recognized              │   │
│  │ 👤 Tommy      ○ Not set up              │   │
│  │ 👤 Harry      ○ Not set up              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Set Up Voice Profiles] [Disconnect Alexa]    │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Try saying:                                    │
│  • "Alexa, ask Family Hub to add milk"         │
│  • "Alexa, ask Family Hub what's on today"     │
│  • "Alexa, tell Family Hub we need bread"      │
└─────────────────────────────────────────────────┘
```

---

## Future Enhancements

### Phase 3+: Broadcast Messages
```python
class BroadcastMessageIntentHandler(AbstractRequestHandler):
    """Send announcement to all Echo devices."""

    # "Alexa, tell Family Hub to announce dinner is ready"
    # Uses Alexa Notifications API to send to all household devices
```

### Phase 3+: Chores Voice Control
```python
class CompleteChoreIntentHandler(AbstractRequestHandler):
    """Mark chore as complete."""

    # "Alexa, tell Family Hub I finished emptying the dishwasher"
    # Uses voice profile to credit the correct family member
```

### Phase 3+: Meal Planning
```python
class GetDinnerPlanIntentHandler(AbstractRequestHandler):
    """What's for dinner tonight?"""

    # "Alexa, ask Family Hub what's for dinner"
    # Reads from meal planning feature
```

---

## Implementation Phases

### Phase 2.3a: Core Skill Setup
1. Amazon Developer account setup
2. Skill creation in Alexa Developer Console
3. Endpoint setup (HTTPS required)
4. Account linking OAuth implementation
5. Basic launch request handler

### Phase 2.3b: Shopping List Intents
1. AddShoppingItemIntent
2. RemoveShoppingItemIntent
3. GetShoppingListIntent
4. Testing with real device

### Phase 2.3c: Calendar Intents
1. GetTodayEventsIntent
2. GetCalendarIntent (specific date)
3. SSML responses for better speech

### Phase 2.3d: Voice Profiles
1. Enable personalization in skill
2. Voice profile linking UI
3. Personalized responses

---

## Security Considerations

1. **Request Verification:** Verify Alexa request signatures
2. **HTTPS Required:** Alexa only calls HTTPS endpoints
3. **Token Security:** Short-lived access tokens, encrypted refresh tokens
4. **Account Linking:** Proper OAuth flow with PKCE
5. **Rate Limiting:** Protect against abuse

---

## Testing

### Alexa Simulator
- Test in Alexa Developer Console
- Test account linking flow
- Test all intents

### Device Testing
- Test on real Echo device
- Test voice recognition accuracy
- Test multi-user scenarios

### Utterance Testing
- Verify slot recognition
- Test edge cases ("add 2 dozen eggs")

---

**Document Version:** 1.0
**Last Updated:** December 22, 2025
**Owner:** James Brown
