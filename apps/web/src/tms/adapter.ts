import {createMemoryAdapter, type StorageAdapter} from '@intl-tms/core';
import {config} from './config';

// The memory adapter shares nothing between instances, so keep one per
// process: pages and the route handler are bundled separately, and dev
// reloads re-evaluate modules.
const store = globalThis as {tmsAdapter?: StorageAdapter<typeof config>};

export const adapter = (store.tmsAdapter ??= createMemoryAdapter<typeof config>());
