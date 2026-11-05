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
                        <h1 className='text-4xl mb-4'>Welcome!</h1>
                        <p className='text-md'>
                            This is a demo of a fairly complex application that has recently integrated with Napster. <br/>It was built in a fairly
                            limited amount of time, from the ground up. <br/><br/> As such, it has a few limitations:
                        </p>
                        <br/>

                        <ul className='list-disc pl-8 mb-12'>
                            <li>Mobile views, and smaller desktop views (smaller than 1080p) may be a little cramped.</li>
                            <li>Some sacrifices were made in UI design to allow more time to work with complex data sets.</li>
                            <li>As it is meant to demonstrate my technical ability, the majority of it was hand-written, though some AI assistance was used.</li>
                        </ul>

                        <h1 className='text-4xl mb-4'>So... what is this?</h1>
                        <p className='text-md mb-12'>
                            This is Upkeep - a <a href="https://magic.wizards.com/en/how-to-play" target="_blank" rel="noopener noreferrer"><strong>Magic: The Gathering</strong></a> deck building assistant. <br/><br/>
                            As you can see, it contains a card seach - with sorting and filtering - as well as the ability to import and export MTG Arena valid decklists, to be used with the MTG Arena game client. <br/><br/>
                            On the right is a sample deck list. Hovering over it will show you more details, and you can add or subtract cards up to the limit legally allowed by the game. There's more, but we'll cover that live later. <br/><br/>
                            Last, but certainly not least - There's <strong>Dex</strong>! He's blinking up there in the top right. Clicking on him will start an interactive session, where you will be able to ask questions, get suggestions, and build better decks faster.
                        </p>

                        <h1 className='text-4xl mb-4'>Have fun!</h1>
                    </div>
                }
            </div>
        </div>
    );
}