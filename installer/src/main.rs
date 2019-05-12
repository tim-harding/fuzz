extern crate fs_extra;

use fs_extra::dir::{copy, CopyOptions};
use fs_extra::error::ErrorKind;
use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;

// Add IconLocation variable to customize
static SHELL_PROGRAM: &str = "
$s=(New-Object -COM WScript.Shell).CreateShortcut('LNKPATH');
$s.TargetPath='EXEPATH';
$s.Save();";

fn main() {
	let pwd = env::current_dir()
		.expect("Couldn't get current directory");
	let from = Path::join(&pwd, "fuzz-win32-x64");	
	// let from = Path::new(r"D:\19\03\fuzz_electron\fuzz-win32-x64");
	let to = Path::new(r"C:\Program Files\Harding");
	let _ = fs::create_dir(&to);
	match copy(from, &to, &CopyOptions::new()) {
		Ok(_) => create_shortcut(&to),
		Err(e) => match e.kind {
			ErrorKind::AlreadyExists => {
				println!("Fuzz already exists in Program Files");
				create_shortcut(&to);
			},
			_ => println!("{:?}", e),
		}
	}
}

fn create_shortcut(to: &Path) {
	let link = r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Fuzz.lnk";
	let exe = Path::join(&to, Path::new(r"fuzz-win32-x64\fuzz.exe"));
	let command = SHELL_PROGRAM
		.replace("LNKPATH", link)
		.replace("EXEPATH", exe.to_string_lossy().into_owned().as_str());
	println!("{:?}", command);	
	Command::new("powershell")
		.arg(command)
		.spawn()
		.expect("Failed to launch Start Menu item creation");
}
