use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SaveData { high_score: u64, #[serde(default)] top_scores: Vec<u64>, settings: Settings }
#[derive(Debug, Serialize, Deserialize, Clone)]
struct Settings { muted: bool }
impl Default for SaveData { fn default() -> Self { Self { high_score: 0, top_scores: Vec::new(), settings: Settings { muted: false } } } }

#[tauri::command]
fn load_save(app: tauri::AppHandle) -> SaveData {
  let Ok(dir) = app.path().app_data_dir() else { return SaveData::default() };
  fs::read_to_string(dir.join("save.json")).ok().and_then(|text| serde_json::from_str(&text).ok()).unwrap_or_default()
}
#[tauri::command]
fn save_game(app: tauri::AppHandle, data: SaveData) -> Result<(), String> {
  let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
  fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
  fs::write(dir.join("save.json"), serde_json::to_vec_pretty(&data).map_err(|e| e.to_string())?).map_err(|e| e.to_string())
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() { tauri::Builder::default().invoke_handler(tauri::generate_handler![load_save, save_game]).run(tauri::generate_context!()).expect("error while running app"); }
