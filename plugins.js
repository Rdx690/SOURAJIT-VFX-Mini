const fs = require('fs');
const path = require('path');

const PLUGIN_DIR = path.resolve(process.env.PLUGIN_DIR || 'plugins');
const registry = new Map();

function ensurePluginDir() {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

function validatePlugin(plugin, filename) {
  if (!plugin || typeof plugin !== 'object') {
    throw new Error(filename + ' must export a plugin object.');
  }
  if (typeof plugin.name !== 'string' || !/^[a-z0-9_-]{1,40}$/i.test(plugin.name)) {
    throw new Error(filename + ' has an invalid name.');
  }
  if (typeof plugin.execute !== 'function') {
    throw new Error(filename + ' must export an execute function.');
  }
  return plugin;
}

function loadPlugins() {
  ensurePluginDir();
  registry.clear();

  for (const filename of fs.readdirSync(PLUGIN_DIR).filter((name) => name.endsWith('.js'))) {
    const fullPath = path.join(PLUGIN_DIR, filename);
    try {
      delete require.cache[require.resolve(fullPath)];
      const plugin = validatePlugin(require(fullPath), filename);
      registry.set(plugin.name.toLowerCase(), plugin);
      for (const alias of Array.isArray(plugin.aliases) ? plugin.aliases : []) {
        if (typeof alias === 'string' && /^[a-z0-9_-]{1,40}$/i.test(alias)) {
          registry.set(alias.toLowerCase(), plugin);
        }
      }
      console.log('[Plugins] Loaded:', plugin.name);
    } catch (error) {
      console.error('[Plugins] Skipped ' + filename + ':', error.message);
    }
  }
  return listPlugins();
}

function listPlugins() {
  const unique = new Map();
  for (const plugin of registry.values()) unique.set(plugin.name, plugin);
  return [...unique.values()].map((plugin) => ({
    name: plugin.name,
    aliases: Array.isArray(plugin.aliases) ? plugin.aliases : [],
    description: plugin.description || 'No description provided'
  }));
}

async function executePlugin(context) {
  const plugin = registry.get(String(context.command || '').toLowerCase());
  if (!plugin) return false;
  await plugin.execute(context);
  return true;
}

function getPluginDirectory() {
  return PLUGIN_DIR;
}

loadPlugins();

module.exports = { loadPlugins, listPlugins, executePlugin, getPluginDirectory };