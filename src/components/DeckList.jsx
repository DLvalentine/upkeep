// Components
import ManaCost from './ManaCost';

function DeckItem({card}) {
    return(
        <p>
            {card.quantity} {card.name} <ManaCost manaCost={card.mana_cost} size={24} />
        </p>
    );
}

export default function DeckList({ deck }) {
    const cards = Object.values(deck.cards).sort((a, b) => {
        const aCmc = Number(a.cmc);
        const bCmc = Number(b.cmc);
        const aHasCmc = Number.isFinite(aCmc) && aCmc > 0;
        const bHasCmc = Number.isFinite(bCmc) && bCmc > 0;

        if (aHasCmc !== bHasCmc) {
            return aHasCmc ? -1 : 1;
        }

        if (aHasCmc && aCmc !== bCmc) {
            return aCmc - bCmc;
        }

        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex flex-col gap-2">
            {cards.map((card) => {
                return (
                    <DeckItem key={card.id} card={card}/>
                )
            })}
        </div>
    );
}
