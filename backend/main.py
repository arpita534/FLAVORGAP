
import os
import sqlite3
from itertools import combinations
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "flavorgap.db")

app = FastAPI(
    title="FLAVORGAP API",
    description="Molecular Flavour Discovery Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Illustrative prototype dataset. Verify compound associations before
# presenting them as scientific findings.
INGREDIENTS = {
    "chocolate": {"category": "Dessert", "description": "Rich, roasted and sweet", "compounds": ["theobromine", "vanillin", "pyrazines", "furans"]},
    "strawberry": {"category": "Fruit", "description": "Sweet, fresh and fruity", "compounds": ["furaneol", "linalool", "ethyl butanoate"]},
    "coffee": {"category": "Beverage", "description": "Roasted, bitter and aromatic", "compounds": ["pyrazines", "furans", "guaiacol", "vanillin"]},
    "cinnamon": {"category": "Spice", "description": "Warm and sweet", "compounds": ["cinnamaldehyde", "eugenol", "coumarin"]},
    "orange": {"category": "Fruit", "description": "Citrusy and refreshing", "compounds": ["limonene", "linalool", "myrcene"]},
    "basil": {"category": "Herb", "description": "Fresh and herbal", "compounds": ["linalool", "eugenol", "estragole"]},
    "tomato": {"category": "Vegetable", "description": "Savoury and juicy", "compounds": ["hexanal", "geranylacetone", "6-methyl-5-hepten-2-one"]},
    "mint": {"category": "Herb", "description": "Cool and refreshing", "compounds": ["menthol", "menthone", "limonene"]},
    "lemon": {"category": "Fruit", "description": "Sharp and citrusy", "compounds": ["limonene", "citral", "beta-pinene"]},
    "vanilla": {"category": "Spice", "description": "Sweet and creamy", "compounds": ["vanillin", "p-hydroxybenzaldehyde", "guaiacol"]},
    "mango": {"category": "Fruit", "description": "Tropical and sweet", "compounds": ["myrcene", "limonene", "linalool"]},
    "pineapple": {"category": "Fruit", "description": "Tropical and tangy", "compounds": ["ethyl butanoate", "limonene", "furaneol"]},
    "apple": {"category": "Fruit", "description": "Crisp and sweet", "compounds": ["hexanal", "ethyl butanoate", "2-methylbutyl acetate"]},
    "banana": {"category": "Fruit", "description": "Creamy and sweet", "compounds": ["isoamyl acetate", "eugenol", "hexanal"]},
    "ginger": {"category": "Spice", "description": "Warm and spicy", "compounds": ["gingerol", "zingerone", "citral"]},
    "cardamom": {"category": "Spice", "description": "Sweet and aromatic", "compounds": ["alpha-terpinyl acetate", "limonene", "linalool"]},
    "clove": {"category": "Spice", "description": "Intense and warm", "compounds": ["eugenol", "beta-caryophyllene", "humulene"]},
    "honey": {"category": "Sweetener", "description": "Floral and sweet", "compounds": ["phenylacetaldehyde", "benzaldehyde", "furfural"]},
    "almond": {"category": "Nuts", "description": "Nutty and delicate", "compounds": ["benzaldehyde", "hexanal", "linalool"]},
    "coconut": {"category": "Fruit", "description": "Creamy and tropical", "compounds": ["delta-octalactone", "gamma-nonalactone", "hexanal"]},
    "peach": {"category": "Fruit", "description": "Soft and floral", "compounds": ["gamma-decalactone", "linalool", "hexanal"]},
    "raspberry": {"category": "Fruit", "description": "Tart and fruity", "compounds": ["raspberry ketone", "linalool", "furaneol"]},
    "blueberry": {"category": "Fruit", "description": "Mild and sweet", "compounds": ["linalool", "hexanal", "geraniol"]},
    "avocado": {"category": "Vegetable", "description": "Creamy and buttery", "compounds": ["hexanal", "2-hexenal", "limonene"]},
    "cheese": {"category": "Dairy", "description": "Creamy and savoury", "compounds": ["diacetyl", "butyric acid", "methional"]},
    "yogurt": {"category": "Dairy", "description": "Tangy and creamy", "compounds": ["acetaldehyde", "diacetyl", "acetoin"]},
    "onion": {"category": "Vegetable", "description": "Pungent and savoury", "compounds": ["propanethial-S-oxide", "methional", "dipropyl disulfide"]},
    "garlic": {"category": "Vegetable", "description": "Pungent and savoury", "compounds": ["allicin", "diallyl disulfide", "methional"]},
    "chili": {"category": "Spice", "description": "Hot and intense", "compounds": ["capsaicin", "limonene", "linalool"]},
    "rosemary": {"category": "Herb", "description": "Woody and herbal", "compounds": ["eucalyptol", "alpha-pinene", "camphor"]},
    "cucumber": {"category": "Vegetable", "description": "Fresh and watery", "compounds": ["2,6-nonadienal", "hexanal", "linalool"]},
    "carrot": {"category": "Vegetable", "description": "Earthy and sweet", "compounds": ["beta-carotene", "terpinolene", "hexanal"]},
}

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS saved (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_type TEXT NOT NULL,
                title TEXT NOT NULL,
                details TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def clean_name(name: str) -> str:
    return name.strip().lower()

def get_ingredient(name: str):
    key = clean_name(name)
    if key not in INGREDIENTS:
        raise HTTPException(404, f"Ingredient '{name}' not found in the demo dataset.")
    return {"name": key, **INGREDIENTS[key]}

def analyse_pair(a: str, b: str):
    ca = set(INGREDIENTS[a]["compounds"])
    cb = set(INGREDIENTS[b]["compounds"])
    shared = sorted(ca & cb)
    union = ca | cb
    affinity = round((len(shared) / len(union)) * 100) if union else 0

    # A transparent illustrative rarity proxy, not a taste prediction.
    novelty = max(10, min(98, 95 - len(shared) * 13 + abs(len(ca) - len(cb)) * 4))
    score = round(affinity * 0.55 + novelty * 0.45)

    return {
        "ingredient": b,
        "affinity": affinity,
        "novelty": novelty,
        "score": score,
        "shared": shared,
        "explanation": (
            f"This sample pairing shares {len(shared)} listed compound(s). "
            f"Its illustrative novelty score is {novelty}/100. "
            "This score describes the demo dataset, not proven taste compatibility."
        ),
    }

class DiscoverRequest(BaseModel):
    ingredient: str

class CompareRequest(BaseModel):
    ingredients: List[str]

class RecipeRequest(BaseModel):
    ingredients: List[str]
    cuisine: str = "Any"
    meal_type: str = "Any"
    cooking_time: int = 30

class SaveRequest(BaseModel):
    item_type: str = "discovery"
    title: str
    details: str

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"name": "FLAVORGAP", "message": "Flavour discovery API is running"}

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "live_apis_configured": False,
        "source": "illustrative_demo_dataset",
        "note": "Local prototype data; not live FlavorDB or RecipeDB output."
    }

@app.get("/api/ingredients")
def ingredients(q: str = ""):
    names = sorted(INGREDIENTS.keys())
    if q:
        names = [n for n in names if q.lower() in n]
    return {
        "count": len(names),
        "ingredients": [{"name": n, **INGREDIENTS[n]} for n in names],
        "source": "illustrative_demo_dataset"
    }

@app.get("/api/ingredients/{name}")
def ingredient_detail(name: str):
    return get_ingredient(name)

@app.get("/api/molecular/{ingredient}")
def molecular(ingredient: str):
    item = get_ingredient(ingredient)
    return {
        **item,
        "compound_count": len(item["compounds"]),
        "source": "illustrative_demo_dataset",
        "note": "Compound associations are illustrative and require scientific verification."
    }

@app.get("/api/discover")
def discover(ingredient: str, sort: str = "balanced", limit: int = 12):
    key = clean_name(ingredient)
    if key not in INGREDIENTS:
        raise HTTPException(404, "Ingredient not found. Try another ingredient.")

    results = [analyse_pair(key, other) for other in INGREDIENTS if other != key]

    if sort == "affinity":
        results.sort(key=lambda x: x["affinity"], reverse=True)
    elif sort == "novelty":
        results.sort(key=lambda x: x["novelty"], reverse=True)
    else:
        results.sort(key=lambda x: x["score"], reverse=True)

    return {
        "query": key,
        "profile": INGREDIENTS[key]["compounds"],
        "results": results[:max(1, min(limit, 30))],
        "source": "illustrative_demo_dataset",
        "note": "Affinity and novelty are calculated from the local sample dataset."
    }

@app.post("/api/discover")
def discover_post(request: DiscoverRequest):
    return discover(request.ingredient)

@app.post("/api/compare")
def compare(request: CompareRequest):
    names = list(dict.fromkeys(clean_name(x) for x in request.ingredients))
    if len(names) < 2:
        raise HTTPException(400, "Please provide at least two ingredients.")
    if len(names) > 5:
        raise HTTPException(400, "Compare up to five ingredients.")
    for name in names:
        get_ingredient(name)

    compound_sets = {n: set(INGREDIENTS[n]["compounds"]) for n in names}
    common = sorted(set.intersection(*compound_sets.values()))
    unique = {
        n: sorted(compound_sets[n] - set.union(*(compound_sets[x] for x in names if x != n)))
        for n in names
    }
    pair_results = [
        {"first": a, "second": b, **analyse_pair(a, b)}
        for a, b in combinations(names, 2)
    ]
    return {
        "ingredients": names,
        "common_compounds": common,
        "unique_compounds": unique,
        "pairs": pair_results,
        "source": "illustrative_demo_dataset"
    }

@app.post("/api/recipe/generate")
def generate_recipe(request: RecipeRequest):
    names = list(dict.fromkeys(clean_name(x) for x in request.ingredients))
    if len(names) < 2:
        raise HTTPException(400, "Select at least two ingredients.")
    for name in names:
        get_ingredient(name)

    title = f"{names[0].title()} & {names[1].title()} Discovery Bowl"
    if request.meal_type.lower() == "dessert":
        title = f"{names[0].title()} Fusion Dessert"
    elif request.meal_type.lower() == "drink":
        title = f"{names[0].title()} Fusion Cooler"

    steps = [
        f"Prepare and measure: {', '.join(names)}.",
        "Wash, peel or chop ingredients as appropriate for the recipe.",
        "Combine small portions first and adjust the balance to taste.",
        "Prepare using a suitable cooking or serving method for your selected ingredients.",
        "Taste, garnish and serve. Check food safety and ingredient suitability."
    ]
    return {
        "title": title,
        "ingredients": names,
        "cuisine": request.cuisine,
        "meal_type": request.meal_type,
        "cooking_time": request.cooking_time,
        "steps": steps,
        "flavour_profile": ", ".join(INGREDIENTS[n]["description"] for n in names),
        "note": "Prototype-generated concept. This is not a professionally tested recipe.",
        "source": "local_rule_based_generator"
    }

@app.get("/api/graph")
def graph():
    nodes = [
        {"id": name, "label": name.title(), "type": "ingredient", "category": item["category"]}
        for name, item in INGREDIENTS.items()
    ]
    edges = []
    names = list(INGREDIENTS.keys())
    for a, b in combinations(names, 2):
        shared = set(INGREDIENTS[a]["compounds"]) & set(INGREDIENTS[b]["compounds"])
        if shared:
            edges.append({"source": a, "target": b, "weight": len(shared), "shared": sorted(shared)})
    return {"nodes": nodes, "edges": edges, "source": "illustrative_demo_dataset"}

@app.get("/api/stats")
def stats():
    compound_set = {c for item in INGREDIENTS.values() for c in item["compounds"]}
    pair_count = len(INGREDIENTS) * (len(INGREDIENTS) - 1) // 2
    with db() as conn:
        saved_count = conn.execute("SELECT COUNT(*) FROM saved").fetchone()[0]
    return {
        "ingredients": len(INGREDIENTS),
        "compounds": len(compound_set),
        "possible_pairs": pair_count,
        "saved_items": saved_count,
        "source": "illustrative_demo_dataset"
    }

@app.get("/api/saved")
def get_saved():
    with db() as conn:
        rows = conn.execute("SELECT * FROM saved ORDER BY created_at DESC").fetchall()
    return {"items": [dict(row) for row in rows]}

@app.post("/api/saved")
def save_item(request: SaveRequest):
    with db() as conn:
        cursor = conn.execute(
            "INSERT INTO saved (item_type, title, details) VALUES (?, ?, ?)",
            (request.item_type, request.title, request.details)
        )
        item_id = cursor.lastrowid
    return {"success": True, "id": item_id, "message": "Saved successfully"}

@app.delete("/api/saved/{item_id}")
def delete_saved(item_id: int):
    with db() as conn:
        cursor = conn.execute("DELETE FROM saved WHERE id = ?", (item_id,))
        if cursor.rowcount == 0:
            raise HTTPException(404, "Saved item not found.")
    return {"success": True, "message": "Deleted successfully"}

@app.get("/api/recipes")
def get_recipes():
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM saved WHERE item_type = 'recipe' ORDER BY created_at DESC"
        ).fetchall()
    return {"items": [dict(row) for row in rows]}

@app.post("/api/recipes")
def save_recipe(request: SaveRequest):
    request.item_type = "recipe"
    return save_item(request)

@app.delete("/api/recipes/{item_id}")
def delete_recipe(item_id: int):
    return delete_saved(item_id)
