# Upkeep
Upkeep is a Magic: The Gathering card browser and deck building interface. It allows players to import and export deck ideas, look up cards, and add cards to a deck.

It is also a demonstration of how much power can be added to an application by adding Napster's Omniagents to your application. Magic: The Gathering is a complex game with tons of rules, and writing an application like
this requires a lot of time, effort, and domain knowledge. Professional products like this exist, and they are complex.

So, I've included Dex, a friendly agent to help review your deck, make suggestions, clarify questions about rules, and pull up interesting cards for you to look at. 
He has access to the internet, the full MTG rules, and the ability to read your deck data, make suggestions, and even view your screen to assist you as you work.

# Requirements

This project utilizes [Scryfall's Bulk Data](https://scryfall.com/docs/api/bulk-data) to function. I ship a copy of it with the repo, but it may be stale. Run `update_card_data.py` to update it locally.

In order to use Dex, you must have a Napster API key set up. Locations other than local dev or the domain in which this project is deployed will fail to properly initialize Dex.
For this deployment, since I am statically hosting the site on GitHub, I chose to use [Cloudflare Workers](https://www.cloudflare.com/products/workers) and [wrangler](https://www.npmjs.com/package/wrangler) to manage my API key secret. The secret
is stored in Cloudflare, and my worker hits it from approved domains and utilizes it to generate the token needed to make Dex work. No secrets leaking here!

# Getting Started

For local development:

1. Clone this repo
2. `cd` into the directory where it exists
3. Run `npm instasll`
4. Run `npm run dev`
5. Go to `http://localhost:5173/upkeep/` in your browser!

# Deployment

Deployment right now requires permissions to deploy to the GitHub Pages space where I have deployed it. Simply run `npm run deploy`

# Capabilities

Dex can:

- Search the internet
- Search through the entire 300 page MTG ruleset
- Call `review_deck` when you directly or indirectly ask for a deck review
- Call `return_card_name` when he suggests a card, you ask for a card randomly, you ask for a card by name, or you are searching for a card to replace another.

I've also tried my best to tune his prompts so that he reads full card text and provides sane, fun, and sound advice.

Since MTG is still so complex, I want to spend more time tuning and getting Dex to be even better than your local forum, but this is a huge, incredible proof-of-concept in how a Napster integration can supercharge your applicaton idea. To get this level
of knowledge and interaction without conversational AI would be crazy, or would just really just not even allow for the application - you'd just be searching the net yourself for hours.

Enjoy!
