#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use serde::{Serialize, Deserialize};
use rusqlite::Connection;

#[tauri::command]
async fn gws_list_events(time_min: String, time_max: String) -> Result<String, String> {
    let output = Command::new("gws")
        .args(["calendar", "events", "list", "--timeMin", &time_min, "--timeMax", &time_max, "--output", "json"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(format!("Command failed: {}", String::from_utf8_lossy(&output.stderr)))
    }
}

#[tauri::command]
async fn gws_insert_event(title: String, description: String, start: String, end: String) -> Result<(), String> {
    Command::new("gws")
        .args(["calendar", "events", "insert", "--summary", &title, "--description", &description, "--start", &start, "--end", &end])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn gws_update_event(event_id: String, start: String, end: String) -> Result<(), String> {
    Command::new("gws")
        .args(["calendar", "events", "update", &event_id, "--start", &start, "--end", &end])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
struct Habit {
    id: String,
    name: String,
    duration: i32,
    priority: String,
    #[serde(rename = "timeStart")]
    time_start: String,
    #[serde(rename = "timeEnd")]
    time_end: String,
}

#[tauri::command]
fn db_get_habits() -> Result<String, String> {
    let conn = Connection::open("autoscheduler.sqlite").map_err(|e| e.to_string())?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            duration INTEGER NOT NULL,
            priority TEXT NOT NULL,
            timeStart TEXT NOT NULL,
            timeEnd TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    let count: i32 = conn.query_row("SELECT COUNT(*) FROM habits", [], |row| row.get(0)).unwrap_or(0);
    if count == 0 {
        conn.execute(
            "INSERT INTO habits (id, name, duration, priority, timeStart, timeEnd) VALUES 
            ('1', 'Lunch', 45, 'critical', '11:30', '13:30'),
            ('2', 'Deep Work', 120, 'high', '09:00', '17:00')",
            [],
        ).map_err(|e| e.to_string())?;
    }

    let mut stmt = conn.prepare("SELECT id, name, duration, priority, timeStart, timeEnd FROM habits").map_err(|e| e.to_string())?;
    let habit_iter = stmt.query_map([], |row| {
        Ok(Habit {
            id: row.get(0)?,
            name: row.get(1)?,
            duration: row.get(2)?,
            priority: row.get(3)?,
            time_start: row.get(4)?,
            time_end: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let habits: Vec<Habit> = habit_iter.filter_map(Result::ok).collect();
    serde_json::to_string(&habits).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![gws_list_events, gws_insert_event, gws_update_event, db_get_habits])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
