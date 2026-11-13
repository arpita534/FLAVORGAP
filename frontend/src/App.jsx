
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

const NAV = [
  ["Home", "⌂"], ["Discover", "✦"], ["Molecular Lab", "⚛"],
  ["Recipe Lab", "♨"], ["Compare", "⇄"], ["Flavour Network", "◎"],
  ["My Discoveries", "♡"], ["Insights", "▥"], ["About", "ⓘ"]
];

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Something went wrong.");
  return data;
}

function App() {
  const [page, setPage] = useState("Home");
  const [ingredient, setIngredient] = useState("chocolate");
  const [results, setResults] = useState([]);
  const [profile, setProfile] = useState([]);
  const [molecular, setMolecular] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sort, setSort] = useState("balanced");
  const [ingredients, setIngredients] = useState([]);
  const [compareNames, setCompareNames] = useState(["chocolate", "strawberry"]);
  const [comparison, setComparison] = useState(null);
  const [recipeNames, setRecipeNames] = useState(["chocolate", "banana"]);
  const [recipe, setRecipe] = useState(null);
  const [saved, setSaved] = useState([]);
  const [stats, setStats] = useState(null);
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    loadBasics();
  }, []);

  async function loadBasics() {
    try {
      const [ingredientData, statData, savedData] = await Promise.all([
        api("/api/ingredients"),
        api("/api/stats"),
        api("/api/saved")
      ]);
      setIngredients(ingredientData.ingredients);
      setStats(statData);
      setSaved(savedData.items);
    } catch (e) {
      setError("Backend is not connected. Start the FastAPI server first.");
    }
  }

  async function discover(name = ingredient, chosenSort = sort) {
    if (!name.trim()) return setError("Enter an ingredient first.");
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const data = await api(
        `/api/discover?ingredient=${encodeURIComponent(name)}&sort=${chosenSort}`
      );
      setIngredient(data.query);
      setProfile(data.profile);
      setResults(data.results);
    } catch (e) {
      setResults([]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMolecular(name = ingredient) {
    if (!name.trim()) return setError("Enter an ingredient first.");
    setLoading(true);
    setError("");
    try {
      setMolecular(await api(`/api/molecular/${encodeURIComponent(name)}`));
    } catch (e) {
      setMolecular(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runCompare() {
    setLoading(true);
    setError("");
    try {
      setComparison(await api("/api/compare", {
        method: "POST",
        body: JSON.stringify({ ingredients: compareNames })
      }));
    } catch (e) {
      setComparison(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateRecipe() {
    setLoading(true);
    setError("");
    try {
      setRecipe(await api("/api/recipe/generate", {
        method: "POST",
        body: JSON.stringify({
          ingredients: recipeNames,
          cuisine: "Fusion",
          meal_type: "Any",
          cooking_time: 30
        })
      }));
    } catch (e) {
      setRecipe(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSaved() {
    try {
      const data = await api("/api/saved");
      setSaved(data.items);
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveItem(type, title, details) {
    try {
      await api("/api/saved", {
        method: "POST",
        body: JSON.stringify({ item_type: type, title, details })
      });
      setNotice("Saved to My Discoveries!");
      loadSaved();
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeSaved(id) {
    try {
      await api(`/api/saved/${id}`, { method: "DELETE" });
      setSaved((items) => items.filter((item) => item.id !== id));
      setNotice("Item removed.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadGraph() {
    setLoading(true);
    try {
      setGraph(await api("/api/graph"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function navigate(name) {
    setPage(name);
    setError("");
    setNotice("");
    if (name === "My Discoveries") loadSaved();
    if (name === "Insights") loadBasics();
    if (name === "Flavour Network") loadGraph();
  }

  function toggleName(list, setter, name) {
    setter((old) => old.includes(name)
      ? old.filter((x) => x !== name)
      : [...old, name]);
  }

  const featured = [
    ["🥭", "Mango", "🌿", "Basil", "Tropical meets herbal"],
    ["🍓", "Strawberry", "🍫", "Chocolate", "A familiar sweet pairing"],
    ["☕", "Coffee", "🟤", "Cinnamon", "Warm and roasted notes"]
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("Home")}>
          <span className="brand-mark">F</span>
          <span>FLAVOR<span className="brand-purple">GAP</span>
            <small>THE FLAVOUR DISCOVERY LAB</small>
          </span>
        </button>

        <div className="side-label">WORKSPACE</div>
        <nav>
          {NAV.map(([name, icon]) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "selected" : ""}`}
              onClick={() => navigate(name)}
            >
              <span className="nav-icon">{icon}</span>{name}
              {page === name && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <span>Local demo environment</span>
          <small>FLAVORGAP · v2.0</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="breadcrumb">FLAVORGAP /</span>
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="live-pill"><i /> DEMO MODE</span>
            <div className="avatar">FG</div>
          </div>
        </header>

        <div className="page-content">
          {error && <div className="alert error-alert">⚠ {error}</div>}
          {notice && <div className="alert success-alert">✓ {notice}</div>}
          {loading && <div className="loading-line"><span /> Analysing flavour data...</div>}

          {page === "Home" && (
            <>
              <section className="hero-panel">
                <div className="hero-copy">
                  <span className="eyebrow"><i /> THE SCIENCE OF TASTE</span>
                  <h1>Discover the science<br />behind every <em>flavour.</em></h1>
                  <p>Explore molecular connections, uncover unexpected ingredient pairings, and create extraordinary food experiences.</p>
                  <div className="hero-search">
                    <span>⌕</span>
                    <input value={ingredient} onChange={(e) => setIngredient(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (navigate("Discover"), discover())} placeholder="Search an ingredient..." />
                    <button onClick={() => { navigate("Discover"); discover(); }}>Discover <b>↗</b></button>
                  </div>
                  <div className="hero-meta"><span>✦ Molecular insights</span><span>✦ Smart pairings</span><span>✦ Recipe exploration</span></div>
                </div>
                <div className="hero-visual">
                  <div className="visual-orbit orbit-a" />
                  <div className="visual-orbit orbit-b" />
                  <div className="visual-core">🍓</div>
                  <span className="float-food food-a">🍫</span>
                  <span className="float-food food-b">🍊</span>
                  <span className="float-food food-c">🌿</span>
                  <span className="float-food food-d">🫐</span>
                  <div className="visual-caption">MOLECULAR FLAVOUR EXPLORER</div>
                </div>
              </section>

              <section className="stat-grid">
                <Stat label="INGREDIENTS" value={stats?.ingredients ?? "—"} icon="✳" />
                <Stat label="FLAVOUR COMPOUNDS" value={stats?.compounds ?? "—"} icon="⚛" />
                <Stat label="POSSIBLE PAIRINGS" value={stats?.possible_pairs ?? "—"} icon="⌘" />
                <Stat label="SAVED DISCOVERIES" value={stats?.saved_items ?? "—"} icon="♡" />
              </section>

              <SectionTitle eyebrow="START EXPLORING" title="Discover something unexpected" action="Open Discovery" onAction={() => navigate("Discover")} />
              <div className="feature-grid">
                {featured.map((f) => (
                  <button className="feature-card" key={f[1]} onClick={() => { setIngredient(f[1].toLowerCase()); navigate("Discover"); discover(f[1].toLowerCase()); }}>
                    <div className="feature-food">{f[0]} <span>+</span> {f[2]}</div>
                    <h3>{f[1]} + {f[3]}</h3>
                    <p>{f[4]}</p>
                    <span className="card-link">Explore pairing ↗</span>
                  </button>
                ))}
              </div>

              <section className="bottom-banner">
                <div><span className="eyebrow">YOUR NEXT EXPERIMENT STARTS HERE</span><h2>Think beyond the recipe.</h2><p>Let molecular relationships inspire your next culinary idea.</p></div>
                <button onClick={() => navigate("Molecular Lab")}>Enter Molecular Lab ↗</button>
              </section>
            </>
          )}

          {page === "Discover" && (
            <>
              <PageHeading eyebrow="INTELLIGENT PAIRING ENGINE" title="Discover new flavour connections" description="Search an ingredient to explore its sample molecular relationships and potential pairings." />
              <div className="control-panel">
                <div className="field-grow"><label>CHOOSE AN INGREDIENT</label><input list="ingredient-list" value={ingredient} onChange={(e) => setIngredient(e.target.value)} onKeyDown={(e) => e.key === "Enter" && discover()} placeholder="e.g. chocolate" /><datalist id="ingredient-list">{ingredients.map((x) => <option key={x.name} value={x.name} />)}</datalist></div>
                <div><label>RANK RESULTS BY</label><select value={sort} onChange={(e) => { setSort(e.target.value); if (results.length) discover(ingredient, e.target.value); }}><option value="balanced">Balanced score</option><option value="affinity">Molecular affinity</option><option value="novelty">Novelty score</option></select></div>
                <button className="primary-btn" onClick={() => discover()}>Analyse ingredient ↗</button>
              </div>
              {profile.length > 0 && <div className="profile-strip"><strong>{ingredient}</strong><span>DEMO COMPOUNDS</span>{profile.map((c) => <span className="tag" key={c}>{c}</span>)}</div>}
              <SectionTitle eyebrow="RANKED RECOMMENDATIONS" title={`${results.length} pairings found`} />
              <div className="result-grid">
                {results.map((r, i) => <ResultCard key={r.ingredient} item={r} base={ingredient} rank={i + 1} onSave={() => saveItem("discovery", `${ingredient} + ${r.ingredient}`, JSON.stringify(r))} />)}
              </div>
              {!results.length && !loading && <EmptyState title="Ready to discover?" text="Enter an ingredient above and run the discovery engine." />}
            </>
          )}

          {page === "Molecular Lab" && (
            <>
              <PageHeading eyebrow="MOLECULAR INTELLIGENCE" title="Inside the flavour molecule" description="Explore the compound profile of an ingredient and understand its sample flavour connections." />
              <div className="control-panel">
                <div className="field-grow"><label>INGREDIENT</label><input list="ingredient-list" value={ingredient} onChange={(e) => setIngredient(e.target.value)} placeholder="Enter ingredient" /></div>
                <button className="primary-btn" onClick={() => loadMolecular()}>Analyse profile ↗</button>
              </div>
              {molecular && <><div className="molecule-summary"><div className="molecule-symbol">⚛</div><div><span className="eyebrow">{molecular.category}</span><h2>{molecular.name}</h2><p>{molecular.description}</p></div><div className="molecule-count"><strong>{molecular.compound_count}</strong><span>LISTED COMPOUNDS</span></div></div><SectionTitle eyebrow="COMPOUND PROFILE" title="Flavour building blocks" /><div className="compound-grid">{molecular.compounds.map((c, i) => <div className="compound-card" key={c}><span>0{i + 1}</span><strong>{c}</strong><small>Sample dataset compound</small></div>)}</div><div className="notice-panel">ⓘ Compound associations shown here are illustrative demo data and should be verified against scientific sources.</div></>}
              {!molecular && !loading && <EmptyState title="Explore a molecular profile" text="Search chocolate, basil, tomato, coffee or any ingredient in the dataset." />}
            </>
          )}

          {page === "Recipe Lab" && (
            <>
              <PageHeading eyebrow="CREATIVE KITCHEN" title="Build a flavour-inspired recipe" description="Select ingredients and generate a structured recipe concept from the local prototype engine." />
              <div className="recipe-layout">
                <div className="panel">
                  <h3>01 / Select your ingredients</h3>
                  <p className="muted">Choose at least two ingredients.</p>
                  <div className="ingredient-picker">{ingredients.map((x) => <button key={x.name} className={recipeNames.includes(x.name) ? "ingredient-choice chosen" : "ingredient-choice"} onClick={() => toggleName(recipeNames, setRecipeNames, x.name)}>{recipeNames.includes(x.name) ? "✓ " : "+ "}{x.name}</button>)}</div>
                  <label>SELECTED ({recipeNames.length})</label>
                  <div className="selected-tags">{recipeNames.map((n) => <span key={n}>{n}<button onClick={() => toggleName(recipeNames, setRecipeNames, n)}>×</button></span>)}</div>
                  <button className="primary-btn full-btn" onClick={generateRecipe}>Generate recipe concept ↗</button>
                </div>
                <div className="panel recipe-output">
                  <span className="eyebrow">02 / YOUR CREATION</span>
                  {recipe ? <><h2>{recipe.title}</h2><p>{recipe.flavour_profile}</p><div className="recipe-meta"><span>◷ {recipe.cooking_time} min</span><span>✦ {recipe.cuisine}</span></div><h3>Preparation steps</h3><ol>{recipe.steps.map((s, i) => <li key={i}>{s}</li>)}</ol><div className="notice-panel">{recipe.note}</div><button className="primary-btn" onClick={() => saveItem("recipe", recipe.title, JSON.stringify(recipe))}>♡ Save recipe</button></> : <EmptyState title="Your recipe will appear here" text="Choose ingredients and generate a recipe concept." /> }
                </div>
              </div>
            </>
          )}

          {page === "Compare" && (
            <>
              <PageHeading eyebrow="SIDE-BY-SIDE ANALYSIS" title="Compare ingredients" description="Compare compound sets, common flavour molecules and pairwise sample affinity." />
              <div className="panel">
                <h3>Select ingredients</h3>
                <div className="ingredient-picker">{ingredients.map((x) => <button key={x.name} className={compareNames.includes(x.name) ? "ingredient-choice chosen" : "ingredient-choice"} onClick={() => toggleName(compareNames, setCompareNames, x.name)}>{compareNames.includes(x.name) ? "✓ " : "+ "}{x.name}</button>)}</div>
                <div className="selected-tags">{compareNames.map((n) => <span key={n}>{n}<button onClick={() => toggleName(compareNames, setCompareNames, n)}>×</button></span>)}</div>
                <button className="primary-btn" onClick={runCompare}>Compare selected ↗</button>
              </div>
              {comparison && <><div className="comparison-summary"><span className="eyebrow">COMMON COMPOUNDS</span><h2>{comparison.common_compounds.length}</h2><div className="tag-row">{comparison.common_compounds.map((c) => <span className="tag" key={c}>{c}</span>)}</div></div><SectionTitle eyebrow="PAIRWISE RESULTS" title="Molecular similarity" /><div className="result-grid">{comparison.pairs.map((p) => <div className="result-card" key={p.first + p.second}><span className="eyebrow">{p.first} × {p.second}</span><h3>{p.affinity}% affinity</h3><ScoreBar value={p.affinity} /><p>Shared: {p.shared.join(", ") || "No shared compounds"}</p></div>)}</div><SectionTitle eyebrow="UNIQUE COMPOUNDS" title="What makes each ingredient distinct" />{Object.entries(comparison.unique_compounds).map(([n, list]) => <div className="profile-strip" key={n}><strong>{n}</strong><span>{list.join(", ") || "No unique compounds in this comparison"}</span></div>)}</>}
              {!comparison && !loading && <EmptyState title="Select ingredients to compare" text="Choose two or more ingredients and compare their sample compound profiles." />}
            </>
          )}

          {page === "Flavour Network" && (
            <>
              <PageHeading eyebrow="INGREDIENT RELATIONSHIP MAP" title="Explore the flavour network" description="A dataset-derived network of ingredients connected by shared listed compounds." />
              {graph && <><div className="network-stats"><strong>{graph.nodes.length} <small>INGREDIENT NODES</small></strong><strong>{graph.edges.length} <small>SHARED-COMPOUND LINKS</small></strong></div><div className="network-list">{graph.edges.slice(0, 60).map((e, i) => <div className="network-edge" key={i}><span>{e.source}</span><b>↔</b><span>{e.target}</span><small>{e.shared.join(", ")}</small></div>)}</div><div className="notice-panel">Showing connections with at least one shared listed compound. This is a dataset relationship map, not proof of sensory compatibility.</div></>}
              {!graph && !loading && <button className="primary-btn" onClick={loadGraph}>Load flavour network ↗</button>}
            </>
          )}

          {page === "My Discoveries" && (
            <>
              <PageHeading eyebrow="YOUR PERSONAL COLLECTION" title="My discoveries" description="Your saved pairings and recipe concepts, stored in the local SQLite database." />
              <div className="saved-list">{saved.map((item) => <div className="saved-card" key={item.id}><div><span className="eyebrow">{item.item_type} · {item.created_at}</span><h3>{item.title}</h3><p>{item.details.slice(0, 180)}</p></div><button className="delete-btn" onClick={() => removeSaved(item.id)}>Delete ×</button></div>)}</div>
              {!saved.length && <EmptyState title="Nothing saved yet" text="Save a discovery or recipe to see it here." />}
            </>
          )}

          {page === "Insights" && (
            <>
              <PageHeading eyebrow="PLATFORM OVERVIEW" title="Discovery insights" description="A live summary of the local ingredient dataset and your saved work." />
              <div className="stat-grid">
                <Stat label="INGREDIENTS" value={stats?.ingredients ?? "—"} icon="✳" />
                <Stat label="COMPOUNDS" value={stats?.compounds ?? "—"} icon="⚛" />
                <Stat label="POSSIBLE PAIRS" value={stats?.possible_pairs ?? "—"} icon="⌘" />
                <Stat label="SAVED ITEMS" value={stats?.saved_items ?? "—"} icon="♡" />
              </div>
              <div className="panel"><span className="eyebrow">DATASET COVERAGE</span><h2>Ingredient categories</h2><div className="category-bars">{Object.entries(ingredients.reduce((acc, x) => ({ ...acc, [x.category]: (acc[x.category] || 0) + 1 }), {})).map(([cat, count]) => <div key={cat}><span>{cat}</span><div className="bar-track"><i style={{ width: `${count / Math.max(1, ingredients.length) * 100}%` }} /></div><b>{count}</b></div>)}</div></div>
              <div className="notice-panel">All statistics are calculated from the local illustrative dataset and saved records.</div>
            </>
          )}

          {page === "About" && (
            <>
              <PageHeading eyebrow="ABOUT THE PROJECT" title="Where food meets science." description="FLAVORGAP explores ingredient relationships through molecular flavour data and transparent recommendation logic." />
              <div className="about-grid">
                <div className="panel"><span className="eyebrow">THE PROBLEM</span><h2>Beyond familiar combinations</h2><p>Food pairing often relies on familiar recipes and trial-and-error. Exploring molecular relationships can offer another way to generate ideas.</p></div>
                <div className="panel"><span className="eyebrow">OUR APPROACH</span><h2>Discover through data</h2><p>FLAVORGAP compares ingredient compound sets, calculates sample similarity, and ranks possible pairings with an illustrative novelty heuristic.</p></div>
                <div className="panel"><span className="eyebrow">TECHNOLOGY</span><h2>Built for exploration</h2><p>React, FastAPI, Python, SQLite, set-based similarity and graph relationships power this local prototype.</p></div>
                <div className="panel"><span className="eyebrow">TRANSPARENCY</span><h2>Honest by design</h2><p>The included dataset is illustrative. Scores do not prove taste compatibility, safety, or scientific novelty. External data integrations require verified sources and credentials.</p></div>
              </div>
            </>
          )}
        </div>
        <footer className="footer"><span>FLAVOR<span className="brand-purple">GAP</span></span><span>Discover. Pair. Innovate.</span><span>Prototype · Illustrative dataset</span></footer>
      </main>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>;
}

function SectionTitle({ eyebrow, title, action, onAction }) {
  return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action && <button onClick={onAction}>{action} ↗</button>}</div>;
}

function PageHeading({ eyebrow, title, description }) {
  return <div className="page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>;
}

function ScoreBar({ value }) {
  return <div className="score-bar"><div style={{ width: `${value}%` }} /></div>;
}

function ResultCard({ item, base, rank, onSave }) {
  return <article className="result-card">
    <div className="result-top"><span className="rank">#{String(rank).padStart(2, "0")}</span><span className="eyebrow">PAIRING DISCOVERY</span></div>
    <h3>{base} <span>+</span> {item.ingredient}</h3>
    <p>{item.explanation}</p>
    <div className="score-row"><div><small>AFFINITY</small><strong>{item.affinity}%</strong><ScoreBar value={item.affinity} /></div><div><small>NOVELTY</small><strong>{item.novelty}%</strong><ScoreBar value={item.novelty} /></div></div>
    <div className="shared-compounds"><small>SHARED COMPOUNDS</small><div>{item.shared.length ? item.shared.map((c) => <span className="tag" key={c}>{c}</span>) : <span className="muted">No shared compounds in sample</span>}</div></div>
    <button className="save-btn" onClick={onSave}>♡ Save discovery</button>
  </article>;
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><div>⚗</div><h3>{title}</h3><p>{text}</p></div>;
}

export default App;
