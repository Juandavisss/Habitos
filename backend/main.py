from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    return conn

# ── Obtener personaje ──
@app.get("/personaje")
def get_personaje():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM personaje WHERE id = 1")
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
    keys = ["id","nombre","nivel","hp","hp_max","xp","xp_siguiente",
            "stamina","stamina_max","fuerza","oro","racha","kills","boss_streak"]
    return dict(zip(keys, row))

# ── Actualizar personaje ──
@app.put("/personaje")
def update_personaje(data: dict):
    conn = get_db()
    cur = conn.cursor()
    campos = ", ".join([f"{k} = %s" for k in data.keys()])
    valores = list(data.values()) + [1]
    cur.execute(f"UPDATE personaje SET {campos} WHERE id = %s", valores)
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

# ── Obtener misiones del día ──
@app.get("/misiones")
def get_misiones():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM misiones WHERE fecha = CURRENT_DATE")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    keys = ["id","nombre","icono","xp_reward","oro_reward","hp_penalty","stamina_bonus","completada","fecha"]
    return [dict(zip(keys, row)) for row in rows]

# ── Completar o fallar misión ──
@app.put("/misiones/{mision_id}")
def update_mision(mision_id: int, data: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE misiones SET completada = %s WHERE id = %s", (data["completada"], mision_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

# ── Obtener inventario ──
@app.get("/inventario")
def get_inventario():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM inventario")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    keys = ["id","emoji","nombre","fecha_obtenido"]
    return [dict(zip(keys, row)) for row in rows]

# ── Añadir item al inventario ──
@app.post("/inventario")
def add_inventario(data: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO inventario (emoji, nombre) VALUES (%s, %s)", (data["emoji"], data["nombre"]))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

# ── Crear misión nueva ──
@app.post("/misiones")
def create_mision(data: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO misiones (nombre, icono, xp_reward, oro_reward, hp_penalty, stamina_bonus)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        data["nombre"],
        data["icono"],
        data["xp_reward"],
        data["oro_reward"],
        data["hp_penalty"],
        data["stamina_bonus"]
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}