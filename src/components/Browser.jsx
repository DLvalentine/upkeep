// Components
import Card from './Card';

export default function Browser({ query, cards, addCard, deck, removeCard }) {
    return (
        <div className="h-[85vh] flex-[4] min-w-0 pl-6 flex flex-col gap-4 overflow-y-scroll scrollbar scrollbar-track-[var(--app-panel)] scrollbar-thumb-[var(--app-accent)] pr-2">
            <div className="grid grid-cols-5 content-start gap-6">
                {cards?.map((card) => {
                    const uri = card?.item?.image_uris?.normal;

                    return uri ? (
                        <Card
                            key={card.item.id}
                            uri={uri}
                            data={card.item}
                            deck={deck}
                            addCard={addCard}
                            removeCard={removeCard}
                        />
                    ) : null;
                })}

                {query && cards && !cards.length &&
                    <div className="col-span-5 flex flex-col items-center justify-center h-full gap-2">
                        <img
                            src={`${import.meta.env.BASE_URL}lost.jpg`}
                            className="max-w-full h-2/3 object-contain rounded-md"
                        />
                        <h2 className="text-xl font-semibold">
                            You look a little lost...
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            We couldn't find anything matching "<code>{query}</code>"  - try adjusting your search.
                        </p>
                    </div>
                }

                {!query &&
                    <div className='w-200'>
                        <h1 className='text-4xl mb-4'>Welcome to Upkeep!</h1>
                        <p className='text-md mb-8'>
                            A <a href="https://magic.wizards.com/en/how-to-play" target="_blank" rel="noopener noreferrer"><strong>Magic: The Gathering</strong></a> deck
                            building assistant, and an example of an application that recently integrated with Napster to make it more intelligent and more capable. Built from the ground up in two days.
                        </p>

                        <h1 className='text-4xl mb-4'>What can it do?</h1>
                        <p className='text-md mb-12'>
                            Upkeep has a full card search with sorting and filtering, plus import and export of MTG Arena-valid decklists
                            you can take straight into the game client. <br /><br />
                            On the right is a sample deck list. Hover over it for more details, and add or subtract cards up to the limit
                            the game legally allows. There's more, but we'll cover that live. <br /><br />
                            But wait - then there's <strong>Dex</strong>! The start of the show! He's blinking up there in the top right. Click him to start an
                            interactive session where you can ask questions, get suggestions, and build better decks, faster.
                        </p>

                        <h1 className='text-4xl mb-4'>About this build</h1>
                        <ul className='list-disc pl-8 mb-12'>
                            <li className='mb-2'>
                                <strong>Built to test depth.</strong> I wanted to find out was how much
                                complexity Napster's API and agents could handle: card search and filtering across a large data set (including the internet),
                                rules-aware thinking, and agent-driven deck suggestions. The two days went
                                into that, and the interface is deliberately simple so the substance stays in focus.
                            </li>
                            <li className='mb-2'><strong>Designed for desktop displays</strong> (1080p and up), so everything you need stays in view at once.</li>
                            <li className='mb-2'><strong>Written by hand</strong> to show my technical ability, with some AI assistance.</li>
                        </ul>
                    </div>
                }
            </div>
        </div>
    );
}