use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use std::sync::atomic::{AtomicBool, Ordering};

static ECO_MODE: AtomicBool = AtomicBool::new(false);
static MINIMIZE_TO_TRAY: AtomicBool = AtomicBool::new(true);

#[tauri::command]
fn set_eco_mode(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    ECO_MODE.store(enabled, Ordering::Relaxed);
    let _ = app.emit("shadow-eco-mode", serde_json::json!({ "enabled": enabled }));
    let _ = app.emit("shadow-tray-eco-toggle", serde_json::json!({ "ecoMode": enabled }));
    Ok(())
}

#[tauri::command]
fn set_minimize_to_tray(enabled: bool) -> Result<(), String> {
    MINIMIZE_TO_TRAY.store(enabled, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
fn get_eco_mode() -> bool {
    ECO_MODE.load(Ordering::Relaxed)
}

#[tauri::command]
fn show_desktop_notification(app: tauri::AppHandle, title: String, body: String, sound: Option<bool>, _sticky: Option<bool>) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    let mut builder = app.notification().builder().title(&title).body(&body);
    if sound.unwrap_or(true) {
        builder = builder.sound("default");
    }
    let _ = builder.show();
    Ok(())
}

#[tauri::command]
fn show_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
                let _ = app.emit("shadow-eco-mode", serde_json::json!({ "enabled": ECO_MODE.load(Ordering::Relaxed) }));
            }
        }))
        .invoke_handler(tauri::generate_handler![set_eco_mode, get_eco_mode, show_desktop_notification, show_window, set_minimize_to_tray])
        .setup(|app| {
            if cfg!(debug_assertions) {
                let _ = app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                );
            }

            // Create Tray Menu
            let toggle_item = MenuItemBuilder::with_id("toggle_show", "Show / Hide").build(app)?;
            let eco_item = MenuItemBuilder::with_id("toggle_eco", "Eco Mode (Low Resource)").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit Shadow Tracker").build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&toggle_item)
                .item(&eco_item)
                .separator()
                .item(&quit_item)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle_show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) && !window.is_minimized().unwrap_or(false) {
                                let _ = window.hide();
                                let _ = app.emit("shadow-eco-mode", serde_json::json!({ "enabled": true }));
                            } else {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                                let _ = app.emit("shadow-eco-mode", serde_json::json!({ "enabled": ECO_MODE.load(Ordering::Relaxed) }));
                            }
                        }
                    }
                    "toggle_eco" => {
                        let current = ECO_MODE.load(Ordering::Relaxed);
                        let next_val = !current;
                        ECO_MODE.store(next_val, Ordering::Relaxed);
                        let _ = app.emit("shadow-tray-eco-toggle", serde_json::json!({ "ecoMode": next_val }));
                        let _ = app.emit("shadow-eco-mode", serde_json::json!({ "enabled": next_val }));
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            let is_min = window.is_minimized().unwrap_or(false);
                            if is_visible && !is_min {
                                let _ = window.hide();
                                let _ = app.emit("shadow-eco-mode", serde_json::json!({ "enabled": true }));
                            } else {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                                let _ = app.emit("shadow-eco-mode", serde_json::json!({ "enabled": ECO_MODE.load(Ordering::Relaxed) }));
                            }
                        }
                    }
                })
                .build(app)?;

            if let Some(window) = tauri::Manager::get_webview_window(app, "main") {
                let w = window.clone();
                let app_handle = app.handle().clone();

                window.on_window_event(move |event| match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        api.prevent_close();
                        let _ = w.hide();
                        let _ = app_handle.emit("shadow-eco-mode", serde_json::json!({ "enabled": true }));
                    }
                    WindowEvent::Resized(_) => {
                        let is_min = w.is_minimized().unwrap_or(false);
                        if is_min && MINIMIZE_TO_TRAY.load(Ordering::Relaxed) {
                            let _ = w.hide();
                            let _ = app_handle.emit("shadow-eco-mode", serde_json::json!({ "enabled": true }));
                        } else {
                            let _ = app_handle.emit("shadow-eco-mode", serde_json::json!({ "enabled": is_min || ECO_MODE.load(Ordering::Relaxed) }));
                        }
                    }
                    WindowEvent::Focused(focused) => {
                        if *focused {
                            let _ = app_handle.emit("shadow-eco-mode", serde_json::json!({ "enabled": ECO_MODE.load(Ordering::Relaxed) }));
                        }
                    }
                    _ => {}
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


