// Components
import Card from './Card';

export default function Browser({ query, cards, addCard, deck, removeCard }) {
    return (
        <div className="h-[85vh] w-[80%] pl-6 flex flex-col gap-4 overflow-y-scroll scrollbar scrollbar-track-[var(--app-panel)] scrollbar-thumb-[var(--app-accent)] pr-2">
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
                    <div>
                        <h1 className='text-4xl mb-4'>Welcome!</h1>
                        <p className='text-md'>I'll add more details here soon.</p>
                    </div>
                }
            </div>
        </div>
    );
}