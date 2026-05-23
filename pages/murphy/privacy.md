# Murphy — Privacy Policy

*Last updated: May 23, 2026*

Murphy is a workout timer for the Murph Hero WOD, built for iPhone and Apple Watch. This policy describes what data the app handles and where it lives.

## Short version

Murphy does not have a server. The developer does not collect, receive, store, sell, or share any of your personal data. Everything the app records stays on your device or in your own private iCloud.

## What Murphy stores

The app stores the following on your device using SwiftData:

- Workout history (date, duration, per-section splits, variation chosen)
- Personal records
- Settings and preferences (e.g. weighted vest weight)

This data is automatically synced across your own iPhone, iPad, Mac, and Apple Watch through your **private** CloudKit database. Apple manages this sync; the developer has no access to your private CloudKit container.

## Apple system data Murphy reads

With your permission, Murphy uses the following Apple frameworks:

- **HealthKit** — to record workouts (including heart rate and active calories) so they appear in the Activity and Fitness apps and contribute to your Activity Rings.
- **CoreLocation** — only while you are actively running during the `Run 1` and `Run 2` sections of a workout, to calculate your distance. Location data is used in the moment to compute mileage and is stored alongside the workout via HealthKit. Murphy does not transmit location data anywhere.
- **StoreKit 2** — used solely to process optional tips through the in-app tip jar. Apple handles the transaction; the developer receives only the standard, anonymous payout information Apple provides to all developers.

You can revoke any of these permissions at any time in **Settings → Privacy & Security** on iOS, or in the Watch app on Apple Watch.

## What Murphy does not do

- No analytics SDKs, crash reporters, or tracking libraries.
- No advertising, ad identifiers, or third-party trackers.
- No accounts, sign-ups, email collection, or contact-list access.
- No data sold or shared with third parties.

## Children

Murphy is not directed at children under 13 and does not knowingly collect any data from anyone.

## Changes to this policy

If this policy ever changes, the updated version will be posted at this URL with a new "Last updated" date.

## Contact

Questions about this policy or about Murphy in general:

- jenningsebailey at gmail
