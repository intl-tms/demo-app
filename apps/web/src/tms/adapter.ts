import {MongoClient, type Db} from 'mongodb';
import {
  isEmptyPatch,
  writePatch,
  type StorageAdapter,
  type Usage
} from '@intl-tms/core';
import {bundledValues} from './bundled';
import type {config} from './config';

type Config = typeof config;
type Locale = Config['locales'][number];

// One document per (key, locale): the row's columns sit next to them.
type TranslationDoc = {key: string; locale: Locale; value: string};
// One document per (key, url).
type UsageDoc = {key: string; url: string; title?: string; count: number; lastSeen: Date};

// Keep one connection per process: pages and the route handler are bundled
// separately, and dev reloads re-evaluate modules.
const store = globalThis as {tmsDb?: Promise<Db>};

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  const client = await new MongoClient(uri).connect();
  const db = client.db(process.env.MONGODB_DB ?? 'intl-tms');
  await Promise.all([
    db.collection('translations').createIndex({key: 1, locale: 1}, {unique: true}),
    db.collection('translations').createIndex({locale: 1}),
    db.collection('usage').createIndex({key: 1, url: 1}, {unique: true})
  ]);
  return db;
}

function db() {
  if (!store.tmsDb) {
    store.tmsDb = connect();
    // A failed connection is retried on the next call instead of being kept.
    store.tmsDb.catch(() => (store.tmsDb = undefined));
  }
  return store.tmsDb;
}

const translations = async () => (await db()).collection<TranslationDoc>('translations');
const usage = async () => (await db()).collection<UsageDoc>('usage');

export const adapter: StorageAdapter<Config> = {
  async getValues(key) {
    const docs = await (await translations())
      .find({key}, {projection: {_id: 0, key: 0}})
      .toArray();
    // A locale with no stored row answers with its bundled message, so the
    // panel edits the real pattern instead of the formatted text on the page.
    const bundled = Object.entries(bundledValues(key)).map(([locale, value]) => [locale, {value}]);
    return Object.fromEntries([...bundled, ...docs.map(({locale, ...row}) => [locale, row])]);
  },

  async saveValue(key, write) {
    const patch = writePatch(write);
    if (isEmptyPatch(patch)) return;
    await (await translations()).updateOne(
      {key, locale: write.locale},
      // A new row starts with an empty value; Mongo rejects a path that is in
      // both operators.
      {$set: patch, ...('value' in patch ? {} : {$setOnInsert: {value: ''}})},
      {upsert: true}
    );
  },

  async getUsage(key) {
    const docs = await (await usage())
      .find({key}, {projection: {_id: 0}})
      .sort({lastSeen: -1})
      .toArray();
    return docs.map(
      ({lastSeen, ...doc}): Usage => ({...doc, source: 'runtime', lastSeen: lastSeen.toISOString()})
    );
  },

  async reportUsage(report) {
    if (report.keys.length === 0) return;
    const lastSeen = new Date();
    await (await usage()).bulkWrite(
      report.keys.map(({key, count}) => ({
        updateOne: {
          filter: {key, url: report.url},
          // A report without a title keeps the stored one.
          update: {
            $set: {count, lastSeen, ...(report.title === undefined ? {} : {title: report.title})}
          },
          upsert: true
        }
      }))
    );
  }
};

/** Every stored value of one locale, by key: the overlay for a whole Catalog in one query. */
export async function getLocaleValues(locale: string) {
  const docs = await (await translations())
    .find({locale: locale as Locale}, {projection: {_id: 0, key: 1, value: 1}})
    .toArray();
  return new Map(docs.map((doc) => [doc.key, doc.value]));
}
