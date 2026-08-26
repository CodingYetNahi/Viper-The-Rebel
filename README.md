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

## Firebase Console setup for Google Sign-In

The Firebase Web API key in `firebase-applet-config.json` is a browser identifier, not a server secret, and is required in the production bundle. Configure its restrictions rather than removing it. An administrator with Firebase/Google Cloud Console access must verify:

- **Authentication → Sign-in method:** enable the Google provider.
- **Authentication → Settings → Authorized domains:** add `codingyetnahi.github.io`.
- **Google Cloud Console → APIs & Services → Credentials:** allow the GitHub Pages referrer for the browser API key and permit every Firebase API used by the app.

These settings cannot be changed from this repository. Authentication errors do not prevent local guest gameplay or local high-score storage.
