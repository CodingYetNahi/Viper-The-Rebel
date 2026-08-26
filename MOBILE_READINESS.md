# Mobile Packaging Readiness Audit

The web game builds successfully, but **native Android and iOS packaging is not complete**. A Vite build alone does not establish store or device readiness. This pull request intentionally adds no Capacitor or native projects.

## Outstanding work (not completed)

- [ ] Add Capacitor dependencies and configuration.
- [ ] Configure package/bundle ID `in.game.vipertherebel`.
- [ ] Make the Vite base environment-aware: `/Viper-The-Rebel/` for GitHub Pages and relative/native-compatible assets for Capacitor.
- [ ] Create the Android project and verify it in Android Studio.
- [ ] Create the iOS project and verify it in Xcode.
- [ ] Configure landscape orientation and full-screen presentation.
- [ ] Audit native safe-area handling.
- [ ] Implement Android back-button behaviour.
- [ ] Connect native pause/resume lifecycle events to the game engine.
- [ ] Produce and verify app icon and splash assets.
- [ ] Register the Android Firebase app and supply `google-services.json` securely.
- [ ] Register the iOS Firebase app and supply `GoogleService-Info.plist` securely.
- [ ] Implement native-compatible Google authentication.
- [ ] Add Sign in with Apple on iOS if Google login remains available.
- [ ] Configure Firebase App Check for Android and iOS.
- [ ] Publish a privacy policy and implement account/data deletion.
- [ ] Complete the Google Play Data Safety declaration.
- [ ] Complete the Apple App Privacy declaration.
- [ ] Run physical-device performance, thermal, touch, audio, interruption, and lifecycle testing.
- [ ] Produce and validate a signed Android App Bundle and iOS archive.

Native Firebase configuration files and signing credentials must not be committed. GitHub Pages must continue using its existing repository base until an environment-aware configuration is deliberately implemented and tested.
