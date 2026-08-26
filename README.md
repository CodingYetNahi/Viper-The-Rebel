# Viper: The Rebel

**Strike Fast. Defy the Swarm.**

An accessible cyber-survival arcade game built with React, TypeScript, and HTML5 Canvas. Choose Rookie, Rebel, or Elite difficulty and survive in Endless Rebellion, Rebel Run, or Viper Siege.

Planned mobile identifiers: `in.game.vipertherebel` for Android and iOS. The current web build retains its established GitHub Pages base path.

## Development

```bash
npm install
npm test
npm run lint
npm run build
```

Local records use `viper_*` keys. On first run, the migration helper copies (without deleting) legacy score/settings values into the new namespace and marks migration complete. Historical legacy strings exist only in that compatibility module and its test. Existing Firestore `users` and `leaderboard` collections remain unchanged for cloud compatibility.
