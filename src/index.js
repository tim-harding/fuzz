const Settings = require('./settings');
const UISwitcher = require('./ui_switcher');
const SearchUI = require('./search_ui');
const SettingsUI = require('./settings_ui');

const settings = new Settings();
const switcher = new UISwitcher();
new SearchUI(settings, switcher);
new SettingsUI(settings, switcher);