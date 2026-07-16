# Meridian Persistence Addendum

Read `dev/foundation/core/standards/persistence_standard.md`, `dev/foundation/platforms/web-react/standards/browser_persistence_standard.md`, and `dev/foundation/core/agent_rules/save_migrations.md` first.

## Save envelope

Meridian's whole-save envelope is owned by `game/infrastructure/persistence/save-migrations.ts`:

```ts
type SaveEnvelope = {
  version: number;
  savedAt: number;
  state: GameState;
};
```

`version` is the save-payload schema version, while the IndexedDB database layout has a separate version. `createSaveEnvelope()` stamps `savedAt` and `state.lastSavedAt` at the checkpoint. The repository adapter is the only layer that knows the database, object store, transaction, and save key.
