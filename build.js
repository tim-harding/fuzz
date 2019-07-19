const packager = require("electron-packager")
const installerDmg = require("electron-installer-dmg")
const { MSICreator } = require("electron-wix-msi")
const path = require("path")
const fs = require("fs")
const os = require("os")

const BUILD_DIR = path.join(__dirname, "build")
const PACKAGES_DIR = path.join(BUILD_DIR, "packages")
const INSTALLERS_DIR = path.join(BUILD_DIR, "installers")

async function main() {
    createDirectories()
    const [ packagePath ] = await package()
    switch (os.platform()) {
        case "win32":
            await packageWindows(packagePath)
            break
        case "darwin":
            packageMacos(packagePath)
            break
        default:
            console.log(`No installer creation set up for ${os.platform()}`)
            break
    }
}

async function package() {
    const options = {
        dir: __dirname,
        out: PACKAGES_DIR,
        arch: ["x64"],
        icon: "logo/logo",
        name: "Fuzz",
        overwrite: true,
    }
    try {
        const appPaths = await packager(options)
        return appPaths
    } catch (e) {
        console.log("Couldn't package application:")
        console.log(e)
        throw e
    }
}

function packageMacos(packagePath) {
    console.log("Creating DMG installer.")
    const options = {
        appPath: path.join(packagePath, "Fuzz.app"),
        name: "Fuzz",
        out: INSTALLERS_DIR,
    }
    installerDmg(options, error => {
        if (error) {
            console.log("DMG installer creation failed:")
            console.log(error)
        } else {
            console.log("Installer created.")
        }
    })
}

async function packageWindows(packagePath) {
    console.log("Creating MSI installer.")
    const options = {
        appDirectory: packagePath,
        outputDirectory: INSTALLERS_DIR,
        exe: "Fuzz.exe",
        description: "Simple search in predefined locations.",
        version: "1.0.0",
        name: "Fuzz",
        manufacturer: "Tim Harding",
    }
    const creator = new MSICreator(options)
    try {
        await creator.create()
        await creator.compile()
    } catch (e) {
        console.log("MSI creating failed:")
        console.log(e)
    }
}

function createDirectories() {
    createDirectory(BUILD_DIR)
    createDirectory(PACKAGES_DIR)
    createDirectory(INSTALLERS_DIR)
}

function createDirectory(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path)
    }
}

main()