#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::process::Command;
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
struct Habit {
    id: String,
    name: String,
    duration: i32,
    priority: String,
    start: String,
    end: String,
}

#[tauri::command]
async fn list_events(time_min: String, time_max: String) -> Result<String, String> {
    let out = Command::new("gws")
        .args([
            "calendar",
            "events",
            "list",
            "--timeMin",
            &time_min,
            "--timeMax",
            &time_max,
            "--output",
            "json",
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(String::from_utf8_lossy(&out.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

#[tauri::command]
async fn add_event(title: String, desc: String, start: String, end: String) -> Result<(), String> {
    Command::new("gws")
        .args([
            "calendar",
            "events",
            "insert",
            "--summary",
            &title,
            "--description",
            &desc,
            "--start",
            &start,
            "--end",
            &end,
        ])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn update_event(id: String, start: String, end: String) -> Result<(), String> {
    Command::new("gws")
        .args([
            "calendar", "events", "update", &id, "--start", &start, "--end", &end,
        ])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn delete_event(id: String) -> Result<(), String> {
    Command::new("gws")
        .args(["calendar", "events", "delete", &id])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn db_conn() -> Result<Connection, String> {
    let conn = Connection::open("autoscheduler.sqlite").map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            duration INTEGER NOT NULL,
            priority TEXT NOT NULL,
            start TEXT NOT NULL,
            end TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM habits", [], |row| row.get(0))
        .unwrap_or(0);
    if count == 0 {
        let _ = conn.execute(
            "INSERT INTO habits (id, name, duration, priority, start, end) VALUES
            ('1', 'Lunch', 45, 'critical', '11:30', '13:30'),
            ('2', 'Deep Work', 120, 'high', '09:00', '17:00')",
            [],
        );
    }
    Ok(conn)
}

#[tauri::command]
fn get_habits() -> Result<String, String> {
    let conn = db_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name, duration, priority, start, end FROM habits")
        .map_err(|e| e.to_string())?;
    let habits: Vec<Habit> = stmt
        .query_map([], |row| {
            Ok(Habit {
                id: row.get(0)?,
                name: row.get(1)?,
                duration: row.get(2)?,
                priority: row.get(3)?,
                start: row.get(4)?,
                end: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    serde_json::to_string(&habits).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_habit(
    name: String,
    duration: i32,
    priority: String,
    start: String,
    end: String,
) -> Result<String, String> {
    let conn = db_conn()?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO habits (id, name, duration, priority, start, end) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, name, duration, priority, start, end],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
fn update_habit(
    id: String,
    name: String,
    duration: i32,
    priority: String,
    start: String,
    end: String,
) -> Result<(), String> {
    let conn = db_conn()?;
    conn.execute(
        "UPDATE habits SET name=?1, duration=?2, priority=?3, start=?4, end=?5 WHERE id=?6",
        params![name, duration, priority, start, end, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_habit(id: String) -> Result<(), String> {
    let conn = db_conn()?;
    conn.execute("DELETE FROM habits WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_events,
            add_event,
            update_event,
            delete_event,
            get_habits,
            add_habit,
            update_habit,
            delete_habit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
