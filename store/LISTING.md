# Hooked! · Store listing kit

Copy-paste text for App Store Connect and Google Play Console, plus answers for the privacy and age-rating questionnaires.
Images are in `store/apple/` (1290×2796, upload all 6 in order) and `store/google/` (1080×2160 phone shots, `feature-graphic-1024x500.png`, `icon-512.png`).

| | |
|---|---|
| Bundle ID / package | `com.hafermason.hooked` |
| Support URL | https://hooked.hafermason.workers.dev/support |
| Privacy Policy URL | https://hooked.hafermason.workers.dev/privacy |
| Marketing URL (optional) | https://hooked.hafermason.workers.dev |
| Contact email | haferdigitals@gmail.com |
| Price | Free |
| Copyright | 2026 Hafer Digitals |

---

## App Store Connect (iOS)

**Name** (30 max): `Hooked! Ice Fishing`

**Subtitle** (30 max): `Hook fish. Dodge sharks.`

**Category**: Primary **Games**, subcategories **Casual** and **Arcade**. Secondary category: none.

**Promotional text** (170 max, can be changed any time without review):
```
Catch the Rainbow King! A giant glowing boss appears every 30 fish. Can you land him? Challenge a friend with one link and see who's the better angler.
```

**Description** (4000 max):
```
Drop your line through the ice and see how long you can keep the fish coming!

Hooked! is a fast, colorful one-thumb fishing game. Drag to steer your hook, touch a fish to hook it, then pull it up through the ice before something gets it first.

HOOK, PULL, SCORE
• Common fish, sparkly shiny fish and glowing legendary fish, each worth more than the last
• Catch fish in a row to build a combo multiplier up to x10
• Heavy fish fight back, so pull hard!

DODGE THE TROUBLE
• Jellyfish zap your line
• Sharks steal your catch
• Crabs sneak under the ice to snip your line. Tap them to shoo them away!
• Old boots and tires knock fish right off the hook
• Grab a can of worms for an extra life

CATCH THE RAINBOW KING
Every 30 fish, the Rainbow King appears: a giant glowing boss fish worth a huge bonus. Land him and the ocean gets wilder.

CHALLENGE YOUR FRIENDS
Finish a run and send a Challenge link. Your friend sees your score before they play, a BEAT IT marker follows them the whole run, and you'll both know who won.

DAILY CHALLENGE + LEADERBOARDS
A new daily challenge every day doubles your score when you complete it. Climb the daily and all-time leaderboards.

• Free to play
• Quick runs, perfect for a break
• No account or sign-up needed
• Works offline (leaderboards update when you're back online)
```

**Keywords** (100 max, comma-separated, no spaces needed):
```
fishing,fish,ice,arcade,casual,otter,boss,combo,leaderboard,challenge,friends,reel,catch,hook
```

**What's New** (first version):
```
First release! Hook fish, dodge sharks and catch the Rainbow King.
```

**Age rating questionnaire** → result should be **4+**:
- Cartoon or Fantasy Violence: **None**. Fish are caught, not hurt; a shark "chomps" off-screen. If Apple asks, **Infrequent/Mild** is the safe alternative (gives 4+ or 9+).
- Realistic violence, sexual content, nudity, profanity, horror, alcohol/tobacco/drugs, gambling (real or simulated), contests, medical: **None / No**
- Unrestricted web access: **No**
- User-generated content: nicknames on leaderboards only, filtered for offensive words. Answer **No** to chat/UGC sharing features.
- Made for Kids: **No** (don't opt into the Kids category).

**App Privacy ("nutrition label")** → **Data Not Linked to You** only, **no tracking**:
- **Identifiers → User ID**: collected · used for **App Functionality** (leaderboards, anti-cheat) · **not linked to identity** · **not used for tracking**. (Random device-generated ID, stored hashed.)
- **User Content → Other User Content**: the leaderboard **nickname** · App Functionality · not linked · no tracking.
- **Usage Data → Product Interaction**: plays, finishes, shares · **Analytics** · not linked · no tracking.
- **Gameplay Content** (scores, fish caught): App Functionality · not linked · no tracking.
- Everything else (contact info, location, health, financial, contacts, browsing, search, purchases, diagnostics, device ID/IDFA): **Not collected**.
- "Do you or your partners use data for tracking?" **No**. (No ads SDK yet; update this when ads are added.)

**Export compliance**: already answered in the build (`ITSAppUsesNonExemptEncryption = NO`). Uses only standard HTTPS.

**App Review notes** (paste in "Notes"):
```
No login required. Tap PLAY, then drag a finger on the water to move the hook. Touch a fish to hook it and drag up through the ice hole to score. The pause button (top right) has links to the privacy policy and support page. Leaderboard names are nicknames typed at game over and are filtered for offensive words.
```

**Screenshots**: upload `store/apple/1-gameplay.png` … `6-title.png` to the **6.9" iPhone** slot (1290×2796). Apple scales them for smaller iPhones. iPad isn't needed (iPhone-only app).

---

## Google Play Console (Android)

**App name** (30 max): `Hooked! Ice Fishing`

**Short description** (80 max):
```
Hook fish, dodge sharks and catch the Rainbow King in this ice fishing frenzy!
```

**Full description** (4000 max): use the same text as the App Store description above.

**App category**: **Game → Casual** (alternative: Arcade). **Tags**: Casual, Arcade, Fishing, Single player, Offline.

**Graphics**:
- App icon: `store/google/icon-512.png`
- Feature graphic: `store/google/feature-graphic-1024x500.png`
- Phone screenshots: `store/google/1-gameplay.png` … `6-title.png` (1080×2160)

**Content rating (IARC questionnaire)** → expected **Everyone / PEGI 3**:
- Category: **Game**
- Violence: cartoon only, no blood. Answer **No** to realistic/graphic violence. If asked "Does the game contain violence?", mild cartoon peril is acceptable to answer No.
- Sexuality, language, controlled substances, gambling, horror: **No**
- Users can interact or exchange content: **No** (no chat; nicknames only on leaderboards)
- Shares user location: **No** · Digital purchases: **No** (for now)

**Target audience**: **13+** (choose 13–15, 16–17, 18+). Not designed for children. This keeps you out of the stricter Families policy while ads/IAP are added later.

**Ads**: "Does your app contain ads?" **No** (change when ads are added).

**Data safety form**:
- Does your app collect or share user data? **Yes, collects; does not share.**
- Encrypted in transit: **Yes** · Users can request deletion: **Yes** (by email, see privacy policy)
- **Personal info → Other info**: nickname · Collected · App functionality · optional (default name used if blank)
- **App activity → App interactions**: plays/finishes/shares · Collected · Analytics
- **App activity → Other user-generated content**: none
- **App info and performance**: not collected
- **Device or other IDs**: random app-generated player ID · Collected · App functionality (stored hashed, not the Android advertising ID)
- Location, financial, contacts, photos, messages, health, web history: **Not collected**

**Privacy policy**: https://hooked.hafermason.workers.dev/privacy

**Testing before production** (new personal accounts): create a **Closed testing** track, add at least **12 testers** (Google Group or email list), keep it running **14 days**, then apply for production.

---

## Regenerating the images
```
npm run build
node tools/store-shots.mjs      # store/apple + store/google screenshots
node tools/store-graphics.mjs   # Google feature graphic + 512 icon
```
