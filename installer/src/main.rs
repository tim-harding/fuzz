extern crate fs_extra;

use fs_extra::dir::{copy, CopyOptions};
use fs_extra::error::ErrorKind;
use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;
use std::io::{stdin, stdout, Write};

// Add IconLocation variable to customize
static SHELL_PROGRAM: &str = "
$s=(New-Object -COM WScript.Shell).CreateShortcut('LNKPATH');
$s.TargetPath='EXEPATH';
$s.Save();";

fn main() {
	install();
	println!("Press enter to close");
	let mut buffer = String::new();
	let _ = stdout().flush();
	stdin().read_line(&mut buffer).expect("");
}

fn install() {
	println!("Installing Fuzz...");
	let pwd = env::current_dir()
		.expect("Couldn't get current directory");
	let from = Path::join(&pwd, "fuzz-win32-x64");	
	let to = Path::new(r"C:\Program Files\Harding");
	let _ = fs::create_dir(&to);
	match copy(from, &to, &CopyOptions::new()) {
		Ok(_) => {
			println!("Copied to program files");
			create_shortcut(&to);
		},
		Err(e) => match e.kind {
			ErrorKind::AlreadyExists => {
				println!("Fuzz already exists in Program Files, continuing");
				create_shortcut(&to);
			},
			_ => eprintln!("Failed to copy Fuzz: {:?}", e),
		}
	}
}

fn create_shortcut(to: &Path) {
	let link = r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Fuzz.lnk";
	let exe = Path::join(&to, Path::new(r"fuzz-win32-x64\fuzz.exe"));
	let command = SHELL_PROGRAM
		.replace("LNKPATH", link)
		.replace("EXEPATH", exe.to_string_lossy().into_owned().as_str());
	let status = Command::new("powershell")
		.arg(command)
		.status()
		.expect("Failed to launch Start Menu item creation");
	let output = if status.success() {
		"Created Start Menu item"
	} else {
		"Failed to create Start Menu item"
	};
	println!("{}", output);
}