import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import Pokedex from "./components/Pokedex.tsx";

const queryClient = new QueryClient();

function App(){
    return (
        <QueryClientProvider client={queryClient}>
        <Pokedex/>
        </QueryClientProvider>

    )
}

export default App