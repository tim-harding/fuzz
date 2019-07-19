const packager = require("electron-packager")

function main() {
    bundleElectronApp()
}

async function bundleElectronApp() {
    const options = {
        dir: __dirname,
        arch: "x64",
        icon: "icon/icon",
        name: "Fuzz",
        overwrite: true,
        platform: ["win32", "darwin"],
    }
    const appPaths = await packager(options)
    console.log(`Electron app bundles created:`)
    for (const path of appPaths) {
        console.log(path)
    }
}

main()