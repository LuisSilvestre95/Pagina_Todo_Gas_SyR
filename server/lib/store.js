'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ESTADOS = ['nueva', 'contactada', 'cotizada', 'ganada', 'descartada'];

/**
 * Almacén de solicitudes en un archivo JSON. Las escrituras se serializan en
 * una cola y se hacen de forma atómica (archivo temporal + rename) para no
 * corromper datos si el proceso se detiene a mitad de escritura.
 */
function createStore(dataDir) {
  const file = path.join(dataDir, 'solicitudes.json');
  let queue = Promise.resolve();

  async function readAll() {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  async function writeAll(items) {
    await fs.mkdir(dataDir, { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(items, null, 2));
    await fs.rename(tmp, file);
  }

  function serial(fn) {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  }

  return {
    list: () => readAll(),

    add: (data) =>
      serial(async () => {
        const items = await readAll();
        const item = {
          id: crypto.randomUUID(),
          radicado: `TGS-${new Date().getFullYear()}-${String(items.length + 1).padStart(4, '0')}`,
          creada: new Date().toISOString(),
          estado: 'nueva',
          ...data,
        };
        items.unshift(item);
        await writeAll(items);
        return item;
      }),

    setEstado: (id, estado) =>
      serial(async () => {
        if (!ESTADOS.includes(estado)) return null;
        const items = await readAll();
        const item = items.find((i) => i.id === id);
        if (!item) return null;
        item.estado = estado;
        item.actualizada = new Date().toISOString();
        await writeAll(items);
        return item;
      }),
  };
}

module.exports = { createStore, ESTADOS };
