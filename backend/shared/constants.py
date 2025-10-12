"""
Brown Family Constants
Location: backend/shared/constants.py

Use these consistent UUIDs and colors throughout the application.
This ensures all test data, examples, and development uses the same family setup.
"""

from uuid import UUID

# ============================================================================
# TENANT
# ============================================================================

TENANT_BROWN_FAMILY = UUID('00000000-0000-0000-0000-000000000001')

# ============================================================================
# USERS
# ============================================================================

USER_JAMES = UUID('10000000-0000-0000-0000-000000000001')
USER_NICOLA = UUID('10000000-0000-0000-0000-000000000002')
USER_TOMMY = UUID('10000000-0000-0000-0000-000000000003')
USER_HARRY = UUID('10000000-0000-0000-0000-000000000004')
USER_SARAH = UUID('10000000-0000-0000-0000-000000000005')  # Extended family

# Quick lookup dictionary
USERS = {
    'james': USER_JAMES,
    'nicola': USER_NICOLA,
    'tommy': USER_TOMMY,
    'harry': USER_HARRY,
    'sarah': USER_SARAH,
}

# ============================================================================
# COLORS (Hex format for web)
# ============================================================================

# Individual colors
COLOR_JAMES = "#e30613"    # Liverpool home red
COLOR_NICOLA = "#fb7185"   # Pink (coral from Horizon design)
COLOR_TOMMY = "#00B140"    # Liverpool 3rd kit green
COLOR_HARRY = "#1D428A"    # Leeds United blue
COLOR_FAMILY = "#ffffff"   # White for shared family events

# Color lookup dictionary
COLORS = {
    'james': COLOR_JAMES,
    'nicola': COLOR_NICOLA,
    'tommy': COLOR_TOMMY,
    'harry': COLOR_HARRY,
    'family': COLOR_FAMILY,
}

# User to color mapping
USER_COLORS = {
    USER_JAMES: COLOR_JAMES,
    USER_NICOLA: COLOR_NICOLA,
    USER_TOMMY: COLOR_TOMMY,
    USER_HARRY: COLOR_HARRY,
}

# ============================================================================
# LOCATIONS
# ============================================================================

LOCATIONS = {
    # Schools
    'tommy_school': 'Oulton Academy',
    'harry_school': 'Rothwell Primary School',
    
    # Football venues
    'rothwell_juniors': 'Rothwell Juniors Football Club, 4G Astroturf',
    'springwell_south': 'Springwell South, Bellisle Road, LS10 3JA, 4G Astroturf',
    'castleford_academy': 'Castleford Academy, WF10 4JQ, 4G Astroturf',
    
    # Cricket
    'leeds_grammar': 'Leeds Grammar School',
    
    # School pickup locations
    'rothwell_sports_centre': 'Rothwell Sports Centre',
    'oulton_gates': 'Oulton Academy - Main Gates',
    
    # Home
    'home': 'Home',
    'rothwell': 'Rothwell, Leeds',
}

# ============================================================================
# RECURRING ACTIVITIES (for reference)
# ============================================================================

WEEKLY_ACTIVITIES = {
    'tommy': [
        {
            'name': 'GT Sports Football',
            'day': 'Tuesday',
            'time': '19:00-20:00',
            'location': LOCATIONS['springwell_south'],
            'app': '360Player'
        },
        {
            'name': 'GT Sports Football',
            'day': 'Thursday',
            'time': '19:00-20:30',
            'location': LOCATIONS['castleford_academy'],
            'app': '360Player'
        },
        {
            'name': 'Rothwell Juniors U14 Blacks',
            'day': 'Friday',
            'time': '18:30-19:30',
            'location': LOCATIONS['rothwell_juniors'],
            'app': 'Stack Team App'
        },
        {
            'name': 'Macc Academy Cricket',
            'day': 'Sunday',
            'time': '14:00-16:30',
            'location': LOCATIONS['leeds_grammar'],
            'season': 'Until Christmas'
        },
    ],
    'harry': [
        {
            'name': 'Rothwell Juniors U7 Reds',
            'day': 'Monday',
            'time': '17:30-18:30',
            'location': LOCATIONS['rothwell_juniors'],
        },
    ]
}

# ============================================================================
# SCHOOL TIMES
# ============================================================================

SCHOOL_TIMES = {
    'tommy': {
        'drop_off': '08:10-08:30',
        'pick_up': '14:55',  # Mon, Wed (no after school)
        'pick_up_after_school': '15:40',  # Tue, Thu, Fri
        'school': LOCATIONS['tommy_school']
    },
    'harry': {
        'drop_off': '08:30-08:55',
        'pick_up': '15:15',
        'school': LOCATIONS['harry_school']
    }
}

# ============================================================================
# WORK SCHEDULES
# ============================================================================

WORK_SCHEDULES = {
    'james': {
        'days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'hours': '08:30-17:00',
        'flexible_wfh': True
    },
    'nicola': {
        'days': ['Monday', 'Tuesday', 'Thursday'],
        'hours': '09:00-17:30'
    }
}

# ============================================================================
# FAMILY INFO
# ============================================================================

FAMILY_INFO = {
    'name': 'Brown Family',
    'location': 'Rothwell, Leeds',
    'timezone': 'Europe/London',
    'members': {
        'james': {
            'full_name': 'James Brown',
            'email': 'bigtuff8@yahoo.com',
            'dob': '1982-03-10',
            'role': 'admin',
            'favorite_team': 'Liverpool FC',
        },
        'nicola': {
            'full_name': 'Nicola Brown',
            'email': 'nicolabrown80@icloud.com',
            'dob': '1980-10-25',
            'role': 'admin',
        },
        'tommy': {
            'full_name': 'Tommy Brown',
            'email': 'thomas.j.brown11@icloud.com',
            'dob': '2012-05-04',
            'role': 'child',
            'age': 13,
            'interests': ['football', 'cricket'],
        },
        'harry': {
            'full_name': 'Harry Brown',
            'email': 'harry.m.brown@icloud.com',
            'dob': '2018-10-23',
            'role': 'child',
            'age': 6,
            'interests': ['football', 'swimming'],
        },
        'sarah': {
            'full_name': 'Sarah Roberts-Brown',
            'email': 'sarah.roberts.brown@example.com',
            'role': 'guest',
            'relation': 'James\'s sister',
        }
    }
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_user_color(user_id: UUID) -> str:
    """Get color for a user, or default to family color"""
    return USER_COLORS.get(user_id, COLOR_FAMILY)

def get_user_name(user_id: UUID) -> str:
    """Get name for a user ID"""
    lookup = {
        USER_JAMES: 'James',
        USER_NICOLA: 'Nicola',
        USER_TOMMY: 'Tommy',
        USER_HARRY: 'Harry',
        USER_SARAH: 'Sarah',
    }
    return lookup.get(user_id, 'Unknown')

# ============================================================================
# EXPORT ALL
# ============================================================================

__all__ = [
    # Tenant
    'TENANT_BROWN_FAMILY',
    
    # Users
    'USER_JAMES',
    'USER_NICOLA',
    'USER_TOMMY',
    'USER_HARRY',
    'USER_SARAH',
    'USERS',
    
    # Colors
    'COLOR_JAMES',
    'COLOR_NICOLA',
    'COLOR_TOMMY',
    'COLOR_HARRY',
    'COLOR_FAMILY',
    'COLORS',
    'USER_COLORS',
    
    # Data
    'LOCATIONS',
    'WEEKLY_ACTIVITIES',
    'SCHOOL_TIMES',
    'WORK_SCHEDULES',
    'FAMILY_INFO',
    
    # Helpers
    'get_user_color',
    'get_user_name',
]