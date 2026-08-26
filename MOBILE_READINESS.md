# Mobile Packaging Readiness Audit

The web game builds successfully, but **native Android and iOS packaging is not complete**. A Vite build alone does not establish store or device readiness. This pull request intentionally adds no Capacitor or native projects.

The intended package ID is `in.game.vipertherebel`. Gameplay is landscape/full-screen and now supports two persistent touch schemes: a fixed virtual **Joystick** and drag-based **Touch Steering**. There is no Dash control. Browser visibility changes pause the run and native app backgrounding must provide the same explicit-resume behaviour.

## Outstanding work (not completed)

- [ ] Add Capacitor dependencies and configuration.
- [ ] Configure package/bundle ID `in.game.vipertherebel` in both native projects.
- [ ] Make the Vite base environment-aware: `/Viper-The-Rebel/` for GitHub Pages and relative/native-compatible assets for Capacitor.
- [ ] Create the Android project and verify it in Android Studio.
- [ ] Create the iOS project and verify it in Xcode.
- [ ] Enforce landscape orientation and full-screen presentation.
- [ ] Audit native safe-area handling.
- [ ] Implement Android back-button behaviour.
- [ ] Connect native backgrounding to pause; returning must require an explicit Resume.
- [ ] Produce and verify app icon and splash assets.
- [ ] Register the Android Firebase app and supply `google-services.json` securely.
- [ ] Register the iOS Firebase app and supply `GoogleService-Info.plist` securely.
- [ ] Implement Firebase native-compatible Google authentication.
- [ ] Add Sign in with Apple on iOS if Google login remains available.
- [ ] Configure Firebase App Check for Android and iOS.
- [ ] Publish a privacy policy and implement account/data deletion.
- [ ] Complete the Google Play Data Safety declaration.
- [ ] Complete the Apple App Privacy declaration.
- [ ] Test both Joystick and Touch Steering on physical phones/tablets, especially multi-touch, interrupted gestures, safe areas, scrolling/zoom prevention, performance, thermal, audio, and lifecycle behaviour.
- [ ] Produce and validate a signed Android App Bundle and iOS archive.

Native Firebase configuration files and signing credentials must not be committed. GitHub Pages must continue using its existing repository base until an environment-aware configuration is deliberately implemented and tested.
