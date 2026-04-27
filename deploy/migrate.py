#!/usr/bin/env python3
"""
Render PostgreSQL → VPS SQLite データ移行スクリプト
使い方: python3 migrate.py "postgresql://..."
"""
import sys
import json
import sqlite3
import psycopg2

if len(sys.argv) < 2:
    print("使い方: python3 migrate.py \"postgresql://user:pass@host/db\"")
    sys.exit(1)

PG_URL = sys.argv[1]
SQLITE_PATH = "/data/tmcms.db"

print(f"PostgreSQL に接続中...")
pg = psycopg2.connect(PG_URL, sslmode="require")
pg_cur = pg.cursor()

print(f"SQLite に接続中: {SQLITE_PATH}")
sq = sqlite3.connect(SQLITE_PATH)
sq.row_factory = sqlite3.Row
sq_cur = sq.cursor()

def pg_fetch(table, columns="*"):
    pg_cur.execute(f"SELECT {columns} FROM {table}")
    return pg_cur.fetchall()

def sq_exec(sql, params=()):
    try:
        sq_cur.execute(sql, params)
    except sqlite3.IntegrityError:
        pass  # 重複はスキップ

print("\n--- 移行開始 ---")

# users
print("users を移行中...")
rows = pg_fetch("users", "id, name, email, hashed_password, role, created_at")
for r in rows:
    sq_exec(
        "INSERT OR REPLACE INTO users (id, name, email, hashed_password, role, created_at) VALUES (?,?,?,?,?,?)",
        (r[0], r[1], r[2], r[3], r[4], str(r[5]))
    )
print(f"  → {len(rows)} 件")

# tags
print("tags を移行中...")
rows = pg_fetch("tags", "id, name, created_by, created_at")
for r in rows:
    sq_exec(
        "INSERT OR REPLACE INTO tags (id, name, created_by, created_at) VALUES (?,?,?,?)",
        (r[0], r[1], r[2], str(r[3]))
    )
print(f"  → {len(rows)} 件")

# learning_topics
print("learning_topics を移行中...")
rows = pg_fetch("learning_topics", "id, name, \"order\", created_at")
for r in rows:
    sq_exec(
        "INSERT OR REPLACE INTO learning_topics (id, name, \"order\", created_at) VALUES (?,?,?,?)",
        (r[0], r[1], r[2], str(r[3]))
    )
print(f"  → {len(rows)} 件")

# custom_evaluation_axes
print("custom_evaluation_axes を移行中...")
try:
    rows = pg_fetch("custom_evaluation_axes", "id, name, \"order\", created_at")
    for r in rows:
        sq_exec(
            "INSERT OR REPLACE INTO custom_evaluation_axes (id, name, \"order\", created_at) VALUES (?,?,?,?)",
            (r[0], r[1], r[2], str(r[3]))
        )
    print(f"  → {len(rows)} 件")
except Exception as e:
    print(f"  → スキップ ({e})")

# materials
print("materials を移行中...")
rows = pg_fetch("materials", "id, name, url, provider, provider_category, duration, cost, level, language, delivery_methods, description, created_by, created_at")
for r in rows:
    delivery = r[9]
    if isinstance(delivery, str):
        pass  # すでに文字列
    elif delivery is not None:
        delivery = json.dumps(delivery, ensure_ascii=False)
    sq_exec(
        "INSERT OR REPLACE INTO materials (id, name, url, provider, provider_category, duration, cost, level, language, delivery_methods, description, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], delivery, r[10], r[11], str(r[12]))
    )
print(f"  → {len(rows)} 件")

# material_tags
print("material_tags を移行中...")
rows = pg_fetch("material_tags", "material_id, tag_id")
for r in rows:
    sq_exec("INSERT OR REPLACE INTO material_tags (material_id, tag_id) VALUES (?,?)", (r[0], r[1]))
print(f"  → {len(rows)} 件")

# material_learning_topics
print("material_learning_topics を移行中...")
try:
    rows = pg_fetch("material_learning_topics", "material_id, topic_id")
    for r in rows:
        sq_exec("INSERT OR REPLACE INTO material_learning_topics (material_id, topic_id) VALUES (?,?)", (r[0], r[1]))
    print(f"  → {len(rows)} 件")
except Exception as e:
    print(f"  → スキップ ({e})")

# evaluations
print("evaluations を移行中...")
rows = pg_fetch("evaluations", "id, material_id, user_id, overall_score, quality, clarity, cost_effectiveness, custom_scores, created_at, updated_at")
for r in rows:
    custom = r[7]
    if custom is not None and not isinstance(custom, str):
        custom = json.dumps(custom, ensure_ascii=False)
    sq_exec(
        "INSERT OR REPLACE INTO evaluations (id, material_id, user_id, overall_score, quality, clarity, cost_effectiveness, custom_scores, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (r[0], r[1], r[2], r[3], r[4], r[5], r[6], custom, str(r[8]), str(r[9]))
    )
print(f"  → {len(rows)} 件")

# memos
print("memos を移行中...")
rows = pg_fetch("memos", "id, material_id, user_id, content, created_at, updated_at")
for r in rows:
    sq_exec(
        "INSERT OR REPLACE INTO memos (id, material_id, user_id, content, created_at, updated_at) VALUES (?,?,?,?,?,?)",
        (r[0], r[1], r[2], r[3], str(r[4]), str(r[5]))
    )
print(f"  → {len(rows)} 件")

sq.commit()
pg.close()
sq.close()

print("\n--- 移行完了！ ---")
