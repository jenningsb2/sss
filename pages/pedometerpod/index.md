[← Home](/)

# PedometerPod

> Count steps with your AirPods, from the Mac menu&nbsp;bar.

<img src="/assets/pedometerpod/pedometerpod-icon-light.png" alt="The PedometerPod app icon" class="app-icon">

<div class="screenshots">
  <img src="/assets/pedometerpod/pedometerpod-dashboard.png" alt="PedometerPod dashboard showing daily goal progress and weekly steps">
  <img src="/assets/pedometerpod/pedometerpod-history.png" alt="PedometerPod history of walking sessions synced to Health">
  <img src="/assets/pedometerpod/pedometerpod-share.png" alt="PedometerPod shareable step card">
  <img src="/assets/pedometerpod/pedometerpod-goal.png" alt="PedometerPod daily step goal editor">
</div>

I walk on a treadmill at my Mac a lot. It's a great way to get steps, except nothing counted them.

When I sit down at my Mac, everything comes out of my pockets and goes on the desk. I hate walking with a phone on me. A watch on my wrist hardly moves when I'm on a walking desk. Fitness trackers have a weak spot here: most of them just don't count this kind of walking. I kept seeing people try to work around it in ridiculous ways: ankle straps for an Apple Watch, or keeping a phone in their pocket all day just so the steps&nbsp;count. What I always had on was AirPods.

AirPods don't count steps. But they do measure motion. So I wrote an app that turns that motion into a step count.

You start a session from a menu bar app on the Mac. It watches your AirPods and counts steps as you walk. When you stop, the session syncs to your iPhone over iCloud, and the iPhone writes it to Apple Health as an indoor walk.

Mac for recording. iPhone for Health. That split is forced by the platforms, so the app just accepts&nbsp;it.

Built with SwiftUI, SwiftData, CoreMotion, CloudKit, and&nbsp;HealthKit.

Sessions live on your devices and in your private iCloud. No account of mine, no server of mine.

*Life is too short for bad software.* Especially for something as simple as taking a walk at your&nbsp;desk.
