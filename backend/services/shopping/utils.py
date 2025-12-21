"""
Shopping list utilities
Location: backend/services/shopping/utils.py
"""

# Default categories with icons, colors, and keywords for auto-categorization
DEFAULT_CATEGORIES = [
    {
        "name": "Produce",
        "icon": "🥬",
        "color": "#22c55e",
        "keywords": [
            "apple", "banana", "orange", "lemon", "lime", "grape", "strawberry", "blueberry",
            "raspberry", "mango", "pear", "peach", "plum", "cherry", "melon", "watermelon",
            "pineapple", "kiwi", "avocado", "tomato", "potato", "onion", "garlic", "carrot",
            "broccoli", "cauliflower", "cabbage", "lettuce", "spinach", "kale", "cucumber",
            "pepper", "courgette", "zucchini", "aubergine", "eggplant", "mushroom", "celery",
            "leek", "spring onion", "sweetcorn", "corn", "peas", "beans", "asparagus",
            "beetroot", "parsnip", "swede", "turnip", "radish", "ginger", "chilli",
            "herbs", "basil", "parsley", "coriander", "mint", "rosemary", "thyme", "sage",
        ],
    },
    {
        "name": "Dairy",
        "icon": "🥛",
        "color": "#60a5fa",
        "keywords": [
            "milk", "cheese", "yogurt", "yoghurt", "butter", "cream", "creme fraiche",
            "sour cream", "cottage cheese", "cream cheese", "mozzarella", "cheddar",
            "parmesan", "brie", "camembert", "feta", "halloumi", "gouda", "edam",
            "double cream", "single cream", "clotted cream", "custard", "fromage frais",
        ],
    },
    {
        "name": "Meat",
        "icon": "🥩",
        "color": "#ef4444",
        "keywords": [
            "chicken", "beef", "pork", "lamb", "mince", "steak", "sausage", "bacon",
            "ham", "turkey", "duck", "goose", "venison", "rabbit", "gammon",
            "pork chop", "lamb chop", "chicken breast", "chicken thigh", "chicken wing",
            "beef joint", "pork joint", "lamb joint", "roast", "burger", "meatball",
        ],
    },
    {
        "name": "Fish",
        "icon": "🐟",
        "color": "#0ea5e9",
        "keywords": [
            "salmon", "cod", "haddock", "tuna", "mackerel", "sardine", "trout",
            "sea bass", "plaice", "sole", "prawns", "shrimp", "crab", "lobster",
            "mussels", "clams", "oysters", "squid", "calamari", "fish fingers",
            "fish cake", "smoked salmon", "smoked haddock", "kippers",
        ],
    },
    {
        "name": "Bakery",
        "icon": "🍞",
        "color": "#f59e0b",
        "keywords": [
            "bread", "rolls", "baguette", "ciabatta", "sourdough", "pitta", "naan",
            "wrap", "tortilla", "croissant", "pain au chocolat", "brioche", "bagel",
            "muffin", "scone", "crumpet", "pancake", "waffle", "cake", "brownie",
            "cookie", "biscuit", "pastry", "pie", "tart", "doughnut", "donut",
        ],
    },
    {
        "name": "Frozen",
        "icon": "🧊",
        "color": "#06b6d4",
        "keywords": [
            "frozen", "ice cream", "ice lolly", "frozen pizza", "frozen chips",
            "frozen peas", "frozen vegetables", "frozen fruit", "frozen fish",
            "frozen chicken", "frozen meal", "ready meal", "sorbet", "gelato",
        ],
    },
    {
        "name": "Drinks",
        "icon": "🥤",
        "color": "#8b5cf6",
        "keywords": [
            "water", "juice", "orange juice", "apple juice", "squash", "cordial",
            "cola", "coke", "pepsi", "lemonade", "sprite", "fanta", "energy drink",
            "tea", "coffee", "hot chocolate", "beer", "wine", "cider", "spirits",
            "gin", "vodka", "whisky", "rum", "prosecco", "champagne", "smoothie",
        ],
    },
    {
        "name": "Pantry",
        "icon": "🥫",
        "color": "#78716c",
        "keywords": [
            "pasta", "spaghetti", "penne", "rice", "noodles", "couscous", "quinoa",
            "flour", "sugar", "salt", "pepper", "oil", "olive oil", "vegetable oil",
            "vinegar", "soy sauce", "worcestershire", "ketchup", "mayonnaise", "mustard",
            "honey", "jam", "marmalade", "peanut butter", "nutella", "marmite",
            "cereal", "porridge", "oats", "cornflakes", "bran flakes", "muesli",
            "baked beans", "tinned tomatoes", "chopped tomatoes", "tomato puree",
            "coconut milk", "stock", "gravy", "soup", "crisps", "nuts", "dried fruit",
        ],
    },
    {
        "name": "Eggs",
        "icon": "🥚",
        "color": "#fef3c7",
        "keywords": ["eggs", "egg", "free range eggs", "organic eggs"],
    },
    {
        "name": "Household",
        "icon": "🧹",
        "color": "#a78bfa",
        "keywords": [
            "toilet paper", "kitchen roll", "tissues", "bin bags", "cling film",
            "foil", "baking paper", "washing up liquid", "dishwasher tablets",
            "laundry detergent", "fabric softener", "bleach", "surface cleaner",
            "floor cleaner", "sponge", "cloth", "mop", "brush", "soap", "hand wash",
            "shampoo", "conditioner", "shower gel", "toothpaste", "deodorant",
        ],
    },
    {
        "name": "Baby",
        "icon": "👶",
        "color": "#fda4af",
        "keywords": ["nappies", "diapers", "baby wipes", "baby food", "formula", "baby milk"],
    },
    {
        "name": "Pet",
        "icon": "🐾",
        "color": "#ca8a04",
        "keywords": ["dog food", "cat food", "pet food", "cat litter", "dog treats", "cat treats"],
    },
    {
        "name": "Other",
        "icon": "📦",
        "color": "#6b7280",
        "keywords": [],
    },
]

# Legacy: Category keywords dict for backward compatibility
CATEGORY_KEYWORDS = {
    "Produce": [
        "apple", "banana", "orange", "lemon", "lime", "grape", "strawberry", "blueberry",
        "raspberry", "mango", "pear", "peach", "plum", "cherry", "melon", "watermelon",
        "pineapple", "kiwi", "avocado", "tomato", "potato", "onion", "garlic", "carrot",
        "broccoli", "cauliflower", "cabbage", "lettuce", "spinach", "kale", "cucumber",
        "pepper", "courgette", "zucchini", "aubergine", "eggplant", "mushroom", "celery",
        "leek", "spring onion", "sweetcorn", "corn", "peas", "beans", "asparagus",
        "beetroot", "parsnip", "swede", "turnip", "radish", "ginger", "chilli",
        "herbs", "basil", "parsley", "coriander", "mint", "rosemary", "thyme", "sage",
    ],
    "Dairy": [
        "milk", "cheese", "yogurt", "yoghurt", "butter", "cream", "creme fraiche",
        "sour cream", "cottage cheese", "cream cheese", "mozzarella", "cheddar",
        "parmesan", "brie", "camembert", "feta", "halloumi", "gouda", "edam",
        "double cream", "single cream", "clotted cream", "custard", "fromage frais",
    ],
    "Meat": [
        "chicken", "beef", "pork", "lamb", "mince", "steak", "sausage", "bacon",
        "ham", "turkey", "duck", "goose", "venison", "rabbit", "gammon",
        "pork chop", "lamb chop", "chicken breast", "chicken thigh", "chicken wing",
        "beef joint", "pork joint", "lamb joint", "roast", "burger", "meatball",
    ],
    "Fish": [
        "salmon", "cod", "haddock", "tuna", "mackerel", "sardine", "trout",
        "sea bass", "plaice", "sole", "prawns", "shrimp", "crab", "lobster",
        "mussels", "clams", "oysters", "squid", "calamari", "fish fingers",
        "fish cake", "smoked salmon", "smoked haddock", "kippers",
    ],
    "Bakery": [
        "bread", "rolls", "baguette", "ciabatta", "sourdough", "pitta", "naan",
        "wrap", "tortilla", "croissant", "pain au chocolat", "brioche", "bagel",
        "muffin", "scone", "crumpet", "pancake", "waffle", "cake", "brownie",
        "cookie", "biscuit", "pastry", "pie", "tart", "doughnut", "donut",
    ],
    "Frozen": [
        "frozen", "ice cream", "ice lolly", "frozen pizza", "frozen chips",
        "frozen peas", "frozen vegetables", "frozen fruit", "frozen fish",
        "frozen chicken", "frozen meal", "ready meal", "sorbet", "gelato",
    ],
    "Drinks": [
        "water", "juice", "orange juice", "apple juice", "squash", "cordial",
        "cola", "coke", "pepsi", "lemonade", "sprite", "fanta", "energy drink",
        "tea", "coffee", "hot chocolate", "beer", "wine", "cider", "spirits",
        "gin", "vodka", "whisky", "rum", "prosecco", "champagne", "smoothie",
    ],
    "Pantry": [
        "pasta", "spaghetti", "penne", "rice", "noodles", "couscous", "quinoa",
        "flour", "sugar", "salt", "pepper", "oil", "olive oil", "vegetable oil",
        "vinegar", "soy sauce", "worcestershire", "ketchup", "mayonnaise", "mustard",
        "honey", "jam", "marmalade", "peanut butter", "nutella", "marmite",
        "cereal", "porridge", "oats", "cornflakes", "bran flakes", "muesli",
        "baked beans", "tinned tomatoes", "chopped tomatoes", "tomato puree",
        "coconut milk", "stock", "gravy", "soup", "crisps", "nuts", "dried fruit",
    ],
    "Eggs": [
        "eggs", "egg", "free range eggs", "organic eggs",
    ],
    "Household": [
        "toilet paper", "kitchen roll", "tissues", "bin bags", "cling film",
        "foil", "baking paper", "washing up liquid", "dishwasher tablets",
        "laundry detergent", "fabric softener", "bleach", "surface cleaner",
        "floor cleaner", "sponge", "cloth", "mop", "brush", "soap", "hand wash",
        "shampoo", "conditioner", "shower gel", "toothpaste", "deodorant",
    ],
    "Baby": [
        "nappies", "diapers", "baby wipes", "baby food", "formula", "baby milk",
    ],
    "Pet": [
        "dog food", "cat food", "pet food", "cat litter", "dog treats", "cat treats",
    ],
}


def normalize_item_name(name: str) -> str:
    """Normalize item name for duplicate detection."""
    return name.lower().strip()


def categorize_item(name: str) -> str:
    """Auto-categorize an item based on its name."""
    name_lower = name.lower()

    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in name_lower:
                return category

    return "Other"


# Common units for shopping items
COMMON_UNITS = [
    "kg", "g", "lb", "oz",  # Weight
    "l", "ml", "pint", "pt",  # Volume
    "pack", "packet", "bag", "box", "tin", "can", "jar", "bottle", "carton",  # Containers
    "bunch", "head", "clove", "slice", "piece",  # Produce
    "dozen", "half dozen",  # Eggs
    "roll", "sheet",  # Household
    "loaf",  # Bakery
]


def get_all_categories() -> list[str]:
    """Get all available category names."""
    return [cat["name"] for cat in DEFAULT_CATEGORIES]


def get_default_categories() -> list[dict]:
    """Get all default categories with full details."""
    return DEFAULT_CATEGORIES


def get_all_units() -> list[str]:
    """Get all common units."""
    return COMMON_UNITS
