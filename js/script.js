// Pokémon repository:
const pokemonRepository = (function () {
  const pokemonList = []; // Empty array
  const apiUrl = "https://pokeapi.co/api/v2/pokemon/?limit=350";

  function add(pokemon) {
    pokemonList.push(pokemon);
  }

  function getAll() {
    return pokemonList;
  }

  function loadList() {
    return fetch(apiUrl)
      .then((response) => response.json())
      .then((json) => {
        json.results.forEach((item) => {
          const pokemon = {
            name: item.name,
            detailsUrl: item.url,
          };
          add(pokemon);
        });
      })
      .catch((error) => console.error(error));
  }

  function loadDetails(pokemon) {
    return fetch(pokemon.detailsUrl)
      .then((response) => response.json())
      .then((details) => {
        pokemon.height = details.height;
        pokemon.types = details.types.map((typeInfo) => typeInfo.type.name);
      })
      .catch((error) => console.error(error));
  }

  return {
    add: add,
    getAll: getAll,
    loadList: loadList,
    loadDetails: loadDetails,
  };
})();

// Functions for listing items:
function addListItem(pokemon) {
  const pokemonList = document.querySelector(".pokemon-list");
  const listItem = document.createElement("li");
  const button = document.createElement("button");
  button.innerText = pokemon.name;
  button.classList.add("pokemon-button");
  button.addEventListener("click", () => {
    showDetails(pokemon);
  });
  listItem.appendChild(button);
  pokemonList.appendChild(listItem);
}

// To show Pokémon details:
function showDetails(pokemon) {
  pokemonRepository.loadDetails(pokemon).then(() => {
    console.log(`Name: ${pokemon.name}`);
    console.log(`Height: ${pokemon.height}`);
    console.log(`Types: ${pokemon.types.join(", ")}`);
  });
}

// To load and display the Pokémon list
pokemonRepository.loadList().then(() => {
  pokemonRepository.getAll().forEach((pokemon) => {
    addListItem(pokemon);
  });
});


