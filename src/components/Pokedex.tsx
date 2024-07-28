import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import './Pokedex.css';

interface Pokemon {
    name: string;
    url: string;
}

interface PokemonDetails {
    name: string;
    image: string;
    description: string;
}

const cleanText = (text: string): string => {
    return text.replace(/[\n\f]/g, ' ').replace(/\s+/g, ' ').trim();
};

const fetchPokemon = async (page: number): Promise<PokemonDetails[]> => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${page * 10}&limit=10`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const data = await response.json();
        console.log('Fetched Pokémon data:', data);

        return await Promise.all(
            data.results.map(async (pokemon: Pokemon) => {
                try {
                    const res = await fetch(pokemon.url);
                    if (!res.ok) throw new Error(`Network response was not ok: ${res.statusText}`);
                    const details = await res.json();
                    const speciesRes = await fetch(details.species.url);
                    if (!speciesRes.ok) throw new Error(`Network response was not ok: ${speciesRes.statusText}`);
                    const species = await speciesRes.json();
                    const descriptionEntry = species.flavor_text_entries.find((entry: any) => entry.language.name === 'en');
                    return {
                        name: pokemon.name,
                        image: details.sprites.front_default,
                        description: descriptionEntry ? cleanText(descriptionEntry.flavor_text) : 'No description available'
                    };
                } catch (error) {
                    console.error(`Failed to fetch details for ${pokemon.name}:`, error);
                    return { name: pokemon.name, image: '', description: 'No description available' };
                }
            })
        );
    } catch (error) {
        console.error('Failed to fetch Pokémon list:', error);
        return [];
    }
};

const fetchAllPokemon = async (): Promise<PokemonDetails[]> => {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const data = await response.json();
        console.log('Fetched all Pokémon data:', data);

        return await Promise.all(
            data.results.map(async (pokemon: Pokemon) => {
                try {
                    const res = await fetch(pokemon.url);
                    if (!res.ok) throw new Error(`Network response was not ok: ${res.statusText}`);
                    const details = await res.json();
                    const speciesRes = await fetch(details.species.url);
                    if (!speciesRes.ok) throw new Error(`Network response was not ok: ${speciesRes.statusText}`);
                    const species = await speciesRes.json();
                    const descriptionEntry = species.flavor_text_entries.find((entry: any) => entry.language.name === 'en');
                    return {
                        name: pokemon.name,
                        image: details.sprites.front_default,
                        description: descriptionEntry ? cleanText(descriptionEntry.flavor_text) : 'No description available'
                    };
                } catch (error) {
                    console.error(`Failed to fetch details for ${pokemon.name}:`, error);
                    return { name: pokemon.name, image: '', description: 'No description available' };
                }
            })
        );
    } catch (error) {
        console.error('Failed to fetch all Pokémon:', error);
        return [];
    }
};

export default function Pokedex() {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [allPokemon, setAllPokemon] = useState<PokemonDetails[]>([]);
    const [, setIsSearching] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetails | null>(null);

    const { data, isLoading, error } = useQuery<PokemonDetails[], Error>({
        queryKey: ['pokemon', page],
        queryFn: () => fetchPokemon(page),
    });

    const debouncedSearch = useCallback(debounce(() => {
        setIsSearching(true);
        fetchAllPokemon().then(setAllPokemon).finally(() => setIsSearching(false));
    }, 1000), []);

    useEffect(() => {
        if (search) {
            debouncedSearch();
        }
    }, [search, debouncedSearch]);

    const filteredPokemon = allPokemon.filter(pokemon =>
        pokemon.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="pokedex-page">
            <div className="pokedex-container">
                <h1>Pokédex</h1>
                <h2>
                    by Javier Gomariz
                    <a href="https://github.com/javier-gomariz-prats/Pokedex" target="_blank" rel="noopener noreferrer" className="github-link">
                        <i className="fab fa-github"></i>
                    </a>
                </h2>

                <input
                    type="text"
                    placeholder="Search Pokémon"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="search-bar"
                />
                <div className="pokemon-list-container">
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : error ? (
                        <div>Error: {error.message}</div>
                    ) : (
                        <ul className="pokemon-list">
                            {(search ? filteredPokemon : data)?.map((pokemon, index) => (
                                <li key={index} className="pokemon-card" onClick={() => setSelectedPokemon(pokemon)}>
                                    <img src={pokemon.image} alt={pokemon.name} />
                                    <p>{pokemon.name}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="pagination">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0}>
                        Back
                    </button>
                    <button onClick={() => setPage(page + 1)}>
                        Forward
                    </button>
                </div>
                {selectedPokemon && (
                    <div className="modal">
                        <div className="modal-content">
                            <span className="close" onClick={() => setSelectedPokemon(null)}>&times;</span>
                            <img src={selectedPokemon.image} alt={selectedPokemon.name} />
                            <p>{selectedPokemon.name}</p>
                            <p>{selectedPokemon.description}</p> {/* Display description */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return function (...args: any[]) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
